import React from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  exchangeRate: number;
  whatsappNumber?: string;
  onSelectProduct: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  activeCategory,
  onSelectCategory,
  exchangeRate,
  whatsappNumber,
  onSelectProduct,
}) => {
  const categories = ['All Collections', 'Handmade', 'Dresses', 'Sets & Suits', 'Abayas', 'Accessories'];

  const filteredProducts = products.filter((p) => {
    if (activeCategory === 'All Collections' || activeCategory === 'all') return true;
    return p.category.toLowerCase() === activeCategory.toLowerCase();
  });

  return (
    <section id="collection-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Editorial Category Segment (Minimal Zara/Chanel style tabs) */}
      <div className="flex items-center justify-start sm:justify-center gap-6 sm:gap-8 overflow-x-auto pb-4 mb-8 border-b border-[#E8DFD5] no-scrollbar">
        {categories.map((cat) => {
          const isActive =
            (activeCategory === 'all' && cat === 'All Collections') ||
            activeCategory.toLowerCase() === cat.toLowerCase();

          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat === 'All Collections' ? 'all' : cat)}
              className={`text-xs uppercase tracking-[0.16em] whitespace-nowrap pb-2 font-medium transition-all cursor-pointer border-b-2 -mb-[18px] ${
                isActive
                  ? 'border-[#24201D] text-[#24201D]'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 2-Column Mobile Grid / 4-Column Desktop Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3.5 gap-y-8 sm:gap-x-6 sm:gap-y-10">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              exchangeRate={exchangeRate}
              whatsappNumber={whatsappNumber}
              onSelectProduct={onSelectProduct}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-xs text-stone-400">
          No pieces available in this category.
        </div>
      )}
    </section>
  );
};
