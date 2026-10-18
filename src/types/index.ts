export interface Product {
  id: string;
  title: string;
  subtitle?: string;
  priceUSD: number;
  category: string;
  images: string[];
  sizes: string[];
  inStock: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export type AdminRole = 'super_admin' | 'staff';

export interface SiteSettings {
  adminPin: string; // Master PIN (Super Admin) - default '2026'
  staffPin?: string; // Staff PIN (Limited Admin) - default '5555'
  whatsappNumber?: string; // e.g. '96181151937' (Clearable)
  instagramUrl?: string; // (Clearable)
  tiktokUrl?: string; // (Clearable)
  facebookUrl?: string; // (Clearable)
  usdToLbpRate: number; // e.g. 89500
  addressText: string;
  googleMapsUrl: string;
}

export interface CartItem {
  id: string;
  product: Product;
  selectedSize: string;
  quantity: number;
}
