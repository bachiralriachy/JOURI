import { Product, Category, SiteSettings } from '../types';

export const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80';

export const FASHION_PRESETS = [
  {
    name: 'Pleated Silk Dress',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    category: 'Dresses',
  },
  {
    name: 'Mocha Abaya',
    url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    category: 'Abayas',
  },
  {
    name: 'Tailored Linen Suit',
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
    category: 'Sets & Suits',
  },
  {
    name: 'Chiffon & Pearl Scarf',
    url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=800&q=80',
    category: 'Accessories',
  },
  {
    name: 'Evening Satin Gown',
    url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
    category: 'Dresses',
  },
  {
    name: 'Handmade Occasion Set',
    url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80',
    category: 'Handmade',
  },
];

export const INITIAL_SETTINGS: SiteSettings = {
  adminPin: '2026',
  staffPin: '5555',
  whatsappNumber: '96181151937',
  instagramUrl: 'https://www.instagram.com/jouriboutiquee/',
  tiktokUrl: 'https://www.tiktok.com/@jouriboutique',
  facebookUrl: '',
  usdToLbpRate: 89500,
  addressText: 'Broumana, Mar Chaaya, Next to coop',
  googleMapsUrl: 'https://maps.app.goo.gl/ASXXjPzwhJYC3oL77',
};

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-all', name: 'All Collections', slug: 'all' },
  { id: 'cat-handmade', name: 'Handmade', slug: 'handmade' },
  { id: 'cat-dresses', name: 'Dresses', slug: 'dresses' },
  { id: 'cat-sets', name: 'Sets & Suits', slug: 'sets' },
  { id: 'cat-abayas', name: 'Abayas', slug: 'abayas' },
  { id: 'cat-accessories', name: 'Accessories', slug: 'accessories' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    title: 'Ivory Sunburst Pleated Gown',
    subtitle: 'Flowing accordion pleats in liquid silk crepe',
    priceUSD: 145,
    category: 'Dresses',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    inStock: true,
    createdAt: '2026-10-15T10:00:00Z',
  },
  {
    id: 'prod-002',
    title: 'Handmade Embroidered Mocha Abaya',
    subtitle: 'Flax linen blend with delicate tonal needlework',
    priceUSD: 110,
    category: 'Handmade',
    images: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
    ],
    sizes: ['S (52)', 'M (54)', 'L (56)', 'XL (58)'],
    inStock: true,
    createdAt: '2026-10-16T11:00:00Z',
  },
  {
    id: 'prod-003',
    title: 'Tailored Sand Linen Two-Piece Set',
    subtitle: 'Relaxed unconstructed blazer and front-pleated wide trousers',
    priceUSD: 125,
    category: 'Sets & Suits',
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=800&q=80',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    inStock: true,
    createdAt: '2026-10-14T09:30:00Z',
  },
  {
    id: 'prod-004',
    title: 'Blush Chiffon Wrap & Pearl Set',
    subtitle: 'Featherlight silk wrap with genuine baroque freshwater pearls',
    priceUSD: 45,
    category: 'Handmade',
    images: [
      'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
    ],
    sizes: ['Standard One Size'],
    inStock: true,
    createdAt: '2026-10-17T08:00:00Z',
  },
];
