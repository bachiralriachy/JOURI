import React from 'react';
import { Product, SiteSettings, AdminRole } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS, DEFAULT_FALLBACK_IMAGE } from '../data/mockData';

const STORAGE_KEYS = {
  SETTINGS: 'jouri_settings_v5',
  PRODUCTS: 'jouri_products_v5',
  ADMIN_ROLE: 'jouri_admin_role_v5',
  LAST_SYNC: 'jouri_last_sync_v5',
};

// In-memory cache for instant synchronous render
let cachedSettings: SiteSettings = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS) || localStorage.getItem('jouri_settings_v4');
    if (raw) {
      return { ...INITIAL_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Could not read cached settings:', e);
  }
  return INITIAL_SETTINGS;
})();

let cachedProducts: Product[] = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS) || localStorage.getItem('jouri_products_v4');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read cached products:', e);
  }
  return INITIAL_PRODUCTS;
})();

type SyncListener = (data: { products: Product[]; settings: SiteSettings }) => void;
const listeners = new Set<SyncListener>();
let sseSource: EventSource | null = null;
let pollInterval: NodeJS.Timeout | null = null;
let isSyncInitialized = false;

function notifyListeners() {
  const payload = { products: cachedProducts, settings: cachedSettings };
  for (const listener of listeners) {
    try {
      listener(payload);
    } catch (err) {
      console.error('Error invoking sync listener:', err);
    }
  }
}

function updateLocalCache(products?: Product[], settings?: SiteSettings) {
  let changed = false;

  if (settings) {
    cachedSettings = { ...INITIAL_SETTINGS, ...settings };
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cachedSettings));
    } catch {}
    changed = true;
  }

  if (products && Array.isArray(products)) {
    // Sanitize any broken local image paths
    cachedProducts = products.map((p) => {
      const hasBroken = !p.images || p.images.length === 0 || p.images.some((img) => !img || img.startsWith('/src/assets') || img.startsWith('./src/assets'));
      if (hasBroken) {
        const fallback = INITIAL_PRODUCTS.find((initP) => initP.id === p.id)?.images || [DEFAULT_FALLBACK_IMAGE];
        return { ...p, images: fallback };
      }
      return p;
    });
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(cachedProducts));
    } catch {}
    changed = true;
  }

  if (changed) {
    notifyListeners();
  }
}

// Fetch latest global state from backend
async function fetchGlobalState(): Promise<void> {
  try {
    const res = await fetch('/api/state', {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.products && data.settings) {
        updateLocalCache(data.products, data.settings);
      }
    }
  } catch (err) {
    // Server might be starting or offline, fallback to local cache
  }
}

// Setup real-time SSE stream with automatic reconnection and fallback polling
function setupRealtimeConnection() {
  if (typeof window === 'undefined' || isSyncInitialized) return;
  isSyncInitialized = true;

  // Initial fetch
  fetchGlobalState();

  // 1. Server-Sent Events (SSE) for instant cross-device broadcast
  try {
    if (window.EventSource) {
      sseSource = new EventSource('/api/stream');

      sseSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && (payload.products || payload.settings)) {
            updateLocalCache(payload.products, payload.settings);
          }
        } catch (e) {
          console.error('Failed to parse SSE payload:', e);
        }
      };

      sseSource.onerror = () => {
        // SSE will attempt auto-reconnect, but fallback polling handles gaps
      };
    }
  } catch (err) {
    console.warn('SSE connection unavailable, using polling sync:', err);
  }

  // 2. Periodic background poll (every 4 seconds) to ensure 100% sync reliability
  pollInterval = setInterval(() => {
    fetchGlobalState();
  }, 4000);
}

// Exported Storage Service
export const StorageService = {
  // Initialize real-time synchronization across devices
  init(): void {
    setupRealtimeConnection();
  },

  // Subscribe to real-time changes
  subscribe(listener: SyncListener): () => void {
    listeners.add(listener);
    setupRealtimeConnection();
    // Call immediately with current state
    listener({ products: cachedProducts, settings: cachedSettings });
    return () => {
      listeners.delete(listener);
    };
  },

  // Site Settings
  getSettings(): SiteSettings {
    return cachedSettings;
  },

  async saveSettings(settings: SiteSettings): Promise<SiteSettings> {
    // 1. Optimistic local update
    updateLocalCache(undefined, settings);

    // 2. Persist to global backend
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const updated = await res.json();
        updateLocalCache(undefined, updated);
        return updated;
      }
    } catch (err) {
      console.warn('Failed to save settings to server, saved locally:', err);
    }
    return settings;
  },

  // Role-Based PIN Verification
  verifyAdminPin(pin: string): AdminRole | null {
    const current = this.getSettings();
    const cleanPin = pin.trim();
    if (cleanPin === (current.adminPin || '2026').trim()) {
      return 'super_admin';
    }
    if (cleanPin === (current.staffPin || '5555').trim()) {
      return 'staff';
    }
    return null;
  },

  async verifyAdminPinRemote(pin: string): Promise<AdminRole | null> {
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
    return this.verifyAdminPin(pin);
  },

  getAdminRole(): AdminRole | null {
    try {
      const role = sessionStorage.getItem(STORAGE_KEYS.ADMIN_ROLE);
      if (role === 'super_admin' || role === 'staff') {
        return role;
      }
    } catch {}
    return null;
  },

  setAdminRole(role: AdminRole | null): void {
    try {
      if (role) {
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_ROLE, role);
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.ADMIN_ROLE);
      }
    } catch {}
  },

  isAdminAuthenticated(): boolean {
    return this.getAdminRole() !== null;
  },

  // Products CRUD
  getProducts(): Product[] {
    return cachedProducts;
  },

  async fetchFreshProducts(): Promise<Product[]> {
    await fetchGlobalState();
    return cachedProducts;
  },

  async addProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const tempId = `prod-${Date.now()}`;
    const optimistic: Product = {
      ...product,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    updateLocalCache([optimistic, ...cachedProducts], undefined);

    // Save to server
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (res.ok) {
        const serverProduct = await res.json();
        // Replace optimistic product with server product
        const filtered = cachedProducts.filter((p) => p.id !== tempId);
        updateLocalCache([serverProduct, ...filtered], undefined);
        return serverProduct;
      }
    } catch (err) {
      console.warn('Failed to add product to server, retained locally:', err);
    }
    return optimistic;
  },

  async updateProduct(product: Product): Promise<Product> {
    // Optimistic update
    const updatedList = cachedProducts.map((p) => (p.id === product.id ? product : p));
    updateLocalCache(updatedList, undefined);

    // Save to server
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(product.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (res.ok) {
        const serverProduct = await res.json();
        const syncedList = cachedProducts.map((p) => (p.id === product.id ? serverProduct : p));
        updateLocalCache(syncedList, undefined);
        return serverProduct;
      }
    } catch (err) {
      console.warn('Failed to update product on server, retained locally:', err);
    }
    return product;
  },

  async deleteProduct(productId: string): Promise<void> {
    // Optimistic update
    const updatedList = cachedProducts.filter((p) => p.id !== productId);
    updateLocalCache(updatedList, undefined);

    // Delete on server
    try {
      await fetch(`/api/products/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Failed to delete product from server:', err);
    }
  },

  resetAll(): void {
    updateLocalCache(INITIAL_PRODUCTS, INITIAL_SETTINGS);
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
