import { Product, Category, SiteSettings, AdminRole } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_SETTINGS } from '../data/mockData';

const STORAGE_KEYS = {
  SETTINGS: 'jouri_settings_v3',
  PRODUCTS: 'jouri_products_v3',
  ADMIN_ROLE: 'jouri_admin_role_v3',
};

export const StorageService = {
  // Site Settings
  getSettings(): SiteSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
        return INITIAL_SETTINGS;
      }
      const parsed = JSON.parse(data);
      return {
        ...INITIAL_SETTINGS,
        ...parsed,
        adminPin: parsed.adminPin !== undefined ? parsed.adminPin : (INITIAL_SETTINGS.adminPin || '2026'),
        staffPin: parsed.staffPin !== undefined ? parsed.staffPin : (INITIAL_SETTINGS.staffPin || '5555'),
        whatsappNumber: parsed.whatsappNumber !== undefined ? parsed.whatsappNumber : INITIAL_SETTINGS.whatsappNumber,
        instagramUrl: parsed.instagramUrl !== undefined ? parsed.instagramUrl : INITIAL_SETTINGS.instagramUrl,
        tiktokUrl: parsed.tiktokUrl !== undefined ? parsed.tiktokUrl : '',
        facebookUrl: parsed.facebookUrl !== undefined ? parsed.facebookUrl : '',
      };
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  saveSettings(settings: SiteSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
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

  getAdminRole(): AdminRole | null {
    const role = sessionStorage.getItem(STORAGE_KEYS.ADMIN_ROLE);
    if (role === 'super_admin' || role === 'staff') {
      return role;
    }
    return null;
  },

  setAdminRole(role: AdminRole | null): void {
    if (role) {
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_ROLE, role);
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_ROLE);
    }
  },

  isAdminAuthenticated(): boolean {
    return this.getAdminRole() !== null;
  },

  // Products CRUD
  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
        return INITIAL_PRODUCTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_PRODUCTS;
    }
  },

  saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  addProduct(product: Omit<Product, 'id' | 'createdAt'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    products.unshift(newProduct);
    this.saveProducts(products);
    return newProduct;
  },

  updateProduct(product: Product): void {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === product.id);
    if (index !== -1) {
      products[index] = product;
      this.saveProducts(products);
    }
  },

  deleteProduct(productId: string): void {
    const products = this.getProducts().filter((p) => p.id !== productId);
    this.saveProducts(products);
  },

  resetAll(): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
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
