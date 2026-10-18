import React from 'react';
import { Product, SiteSettings, AdminRole } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS, DEFAULT_FALLBACK_IMAGE } from '../data/mockData';
import { CloudStorageService } from './firebase';

const SESSION_KEYS = {
  ADMIN_ROLE: 'jouri_admin_session_role',
};

// Internal in-memory state mirrors the live Cloud Firestore database
let inMemorySettings: SiteSettings = INITIAL_SETTINGS;
let inMemoryProducts: Product[] = INITIAL_PRODUCTS;

type SyncListener = (data: { products: Product[]; settings: SiteSettings }) => void;
const listeners = new Set<SyncListener>();
let isInitialized = false;

function notifyListeners() {
  const payload = { products: inMemoryProducts, settings: inMemorySettings };
  for (const listener of listeners) {
    try {
      listener(payload);
    } catch (err) {
      console.error('Error invoking storage listener:', err);
    }
  }
}

// Initialize Firestore listeners
function setupCloudPersistence() {
  if (isInitialized) return;
  isInitialized = true;

  // Subscribe directly to real-time Google Cloud Firestore
  CloudStorageService.subscribe((cloudData) => {
    if (cloudData.settings) {
      inMemorySettings = { ...INITIAL_SETTINGS, ...cloudData.settings };
    }
    if (cloudData.products && Array.isArray(cloudData.products) && cloudData.products.length > 0) {
      // Ensure image fallbacks
      inMemoryProducts = cloudData.products.map((p) => {
        const hasBroken =
          !p.images ||
          p.images.length === 0 ||
          p.images.some(
            (img) => !img || img.startsWith('/src/assets') || img.startsWith('./src/assets')
          );
        if (hasBroken) {
          const fallback =
            INITIAL_PRODUCTS.find((initP) => initP.id === p.id)?.images || [
              DEFAULT_FALLBACK_IMAGE,
            ];
          return { ...p, images: fallback };
        }
        return p;
      });
    }
    notifyListeners();
  });

  // Also check local express backend if in development environment
  if (typeof window !== 'undefined') {
    fetch('/api/state')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.settings && data.products) {
          // If Firestore is still initializing, seed/update in-memory
          if (inMemoryProducts.length === 0) {
            inMemoryProducts = data.products;
            inMemorySettings = data.settings;
            notifyListeners();
          }
        }
      })
      .catch(() => {
        // Express backend not present (e.g. running statically on Vercel)
      });
  }
}

// Exported Storage Service connected directly to Cloud Firestore
export const StorageService = {
  // Initialize real-time synchronization across devices
  init(): void {
    setupCloudPersistence();
  },

  // Subscribe to real-time changes directly from Cloud Firestore
  subscribe(listener: SyncListener): () => void {
    setupCloudPersistence();
    listeners.add(listener);
    // Emit immediate current state
    listener({ products: inMemoryProducts, settings: inMemorySettings });
    return () => {
      listeners.delete(listener);
    };
  },

  // Site Settings (Always live from Cloud Firestore)
  getSettings(): SiteSettings {
    const cloud = CloudStorageService.getSettings();
    if (cloud && cloud.adminPin) {
      inMemorySettings = cloud;
    }
    return inMemorySettings;
  },

  // Save Settings directly to Cloud Firestore with global sync across all devices
  async saveSettings(settings: SiteSettings): Promise<SiteSettings> {
    inMemorySettings = { ...inMemorySettings, ...settings };
    notifyListeners();

    // 1. Persist directly to Google Cloud Firestore (Primary global cloud database)
    try {
      await CloudStorageService.saveSettings(inMemorySettings);
    } catch (err) {
      console.error('Failed to save settings to Firestore:', err);
    }

    // 2. Also inform local dev server if running
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
    } catch {
      // Server may not be present on serverless/Vercel
    }

    return inMemorySettings;
  },

  // Role-Based PIN Verification against Cloud Firestore credentials
  verifyAdminPin(pin: string): AdminRole | null {
    const cleanPin = pin.trim();
    const cloud = CloudStorageService.getSettings();
    const current = cloud && cloud.adminPin ? cloud : inMemorySettings;

    if (cleanPin === (current.adminPin || '2026').trim()) {
      return 'super_admin';
    }
    if (cleanPin === (current.staffPin || '5555').trim()) {
      return 'staff';
    }
    return null;
  },

  async verifyAdminPinRemote(pin: string): Promise<AdminRole | null> {
    // 1. Direct Cloud Firestore verification
    const firestoreRole = this.verifyAdminPin(pin);
    if (firestoreRole) {
      return firestoreRole;
    }

    // 2. Fallback to API route if available
    try {
      const res = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.role as AdminRole;
      }
    } catch {}

    return null;
  },

  // Dedicated Super Admin Password Management with Global Cloud Sync
  async changeAdminPassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const cleanCurrent = currentPassword.trim();
    const cleanNew = newPassword.trim();

    if (!cleanCurrent) {
      return { success: false, error: 'Please enter your current password.' };
    }
    if (!cleanNew || cleanNew.length < 4) {
      return { success: false, error: 'New password must be at least 4 characters long.' };
    }
    if (cleanNew === cleanCurrent) {
      return { success: false, error: 'New password cannot be the same as your current password.' };
    }

    // Verify current password against live cloud database
    const currentSettings = this.getSettings();
    if (cleanCurrent !== (currentSettings.adminPin || '2026').trim()) {
      return {
        success: false,
        error: 'Current password is incorrect. Please check your credentials.',
      };
    }

    const updatedSettings: SiteSettings = {
      ...currentSettings,
      adminPin: cleanNew,
    };

    // 1. Save directly to Cloud Firestore (Global persistent sync across all phones & devices)
    try {
      await CloudStorageService.saveSettings(updatedSettings);
      inMemorySettings = updatedSettings;
      notifyListeners();
    } catch (err) {
      console.error('Firestore password update error:', err);
      return {
        success: false,
        error: 'Failed to persist password to cloud database: ' + (err instanceof Error ? err.message : String(err)),
      };
    }

    // 2. Also notify local server if available
    try {
      await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: cleanCurrent,
          newPassword: cleanNew,
        }),
      });
    } catch {}

    return {
      success: true,
      message: 'Admin password successfully changed and synced globally to Cloud Firestore!',
    };
  },

  // Admin Session State (Scoped strictly to current browser tab/session)
  getAdminRole(): AdminRole | null {
    try {
      const role = sessionStorage.getItem(SESSION_KEYS.ADMIN_ROLE);
      if (role === 'super_admin' || role === 'staff') {
        return role;
      }
    } catch {}
    return null;
  },

  setAdminRole(role: AdminRole | null): void {
    try {
      if (role) {
        sessionStorage.setItem(SESSION_KEYS.ADMIN_ROLE, role);
      } else {
        sessionStorage.removeItem(SESSION_KEYS.ADMIN_ROLE);
      }
    } catch {}
  },

  isAdminAuthenticated(): boolean {
    return this.getAdminRole() !== null;
  },

  // Products CRUD (Directly synced to Cloud Firestore)
  getProducts(): Product[] {
    const cloudProducts = CloudStorageService.getProducts();
    if (cloudProducts && cloudProducts.length > 0) {
      inMemoryProducts = cloudProducts;
    }
    return inMemoryProducts;
  },

  async fetchFreshProducts(): Promise<Product[]> {
    return this.getProducts();
  },

  async addProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    // 1. Persist directly to Google Cloud Firestore
    try {
      await CloudStorageService.saveProduct(newProduct);
    } catch (err) {
      console.error('Failed to save product to Firestore:', err);
    }

    // 2. Also save to dev server if available
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
    } catch {}

    return newProduct;
  },

  async updateProduct(product: Product): Promise<Product> {
    // 1. Persist directly to Google Cloud Firestore
    try {
      await CloudStorageService.saveProduct(product);
    } catch (err) {
      console.error('Failed to update product in Firestore:', err);
    }

    // 2. Also update in dev server if available
    try {
      await fetch(`/api/products/${encodeURIComponent(product.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
    } catch {}

    return product;
  },

  async deleteProduct(productId: string): Promise<void> {
    // 1. Delete directly from Google Cloud Firestore
    try {
      await CloudStorageService.deleteProduct(productId);
    } catch (err) {
      console.error('Failed to delete product from Firestore:', err);
    }

    // 2. Also delete from dev server if available
    try {
      await fetch(`/api/products/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
      });
    } catch {}
  },

  resetAll(): void {
    // Reset to defaults
    this.saveSettings(INITIAL_SETTINGS);
  },
};

// Dual-Currency formatting
export function formatUSD(amount: number): string {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatLBP(amountInUSD: number, rate: number = 89500): string {
  const lbp = Math.round(amountInUSD * rate);
  return `${lbp.toLocaleString()} L.L.`;
}

// Clean WhatsApp direct link builder
export function buildWhatsAppOrderLink(
  whatsappNumber: string | undefined,
  productTitle: string,
  priceUSD: number,
  rate: number,
  selectedSize?: string
): string {
  const cleanNumber = (whatsappNumber || '').replace(/[^0-9]/g, '') || '96181151937';
  const usd = formatUSD(priceUSD);
  const lbp = formatLBP(priceUSD, rate);

  const text = `Hello Jouri Boutique,\n\nI would like to order this piece:\n✨ *${productTitle}*\n💵 *Price:* ${usd} (${lbp})\n📏 *Size:* ${selectedSize || 'Standard'}\n\nPlease let me know availability and delivery details in Lebanon. Thank you!`;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
}

// Global Image Fallback Handler for onError events
export function handleImageFallback(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback = DEFAULT_FALLBACK_IMAGE
) {
  const img = e.currentTarget;
  if (img.src !== fallback) {
    img.src = fallback;
  }
}
