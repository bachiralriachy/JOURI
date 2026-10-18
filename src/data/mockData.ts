import { Product, Category, SiteSettings } from '../types';

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
      '/src/assets/images/product_silk_pleated_dress_1792241564244.jpg',
      '/src/assets/images/hero_boutique_collection_1792241563828.jpg',
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
      '/src/assets/images/product_embroidered_abaya_1792241565441.jpg',
      '/src/assets/images/hero_boutique_collection_1792241563828.jpg',
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
      '/src/assets/images/product_tailored_linen_set_1792241565514.jpg',
      '/src/assets/images/product_embroidered_abaya_1792241565441.jpg',
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
      '/src/assets/images/product_pearl_silk_scarf_1792241566086.jpg',
      '/src/assets/images/product_silk_pleated_dress_1792241564244.jpg',
    ],
    sizes: ['Standard One Size'],
    inStock: true,
    createdAt: '2026-10-17T08:00:00Z',
  },
];
