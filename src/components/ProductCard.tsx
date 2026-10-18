import React from 'react';
import { MessageCircle, ArrowUpRight } from 'lucide-react';
import { Product } from '../types';
import { formatUSD, formatLBP, buildWhatsAppOrderLink } from '../services/storage';

interface ProductCardProps {
  product: Product;
  exchangeRate: number;
  whatsappNumber?: string;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  exchangeRate,
  whatsappNumber,
  onSelectProduct,
}) => {
  const formattedUSD = formatUSD(product.priceUSD);
  const formattedLBP = formatLBP(product.priceUSD, exchangeRate);

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = buildWhatsAppOrderLink(
      whatsappNumber,
      product.title,
      product.priceUSD,
      exchangeRate,
      product.sizes[0]
    );
    window.open(link, '_blank');
  };

  return (
    <div
      onClick={() => onSelectProduct(product)}
      className="group cursor-pointer flex flex-col justify-between"
    >
      {/* High-Res Static Image (Zara/Chanel Full Bleed Style) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F2ECE4] rounded-md">
        <img
          src={product.images[0]}
          alt={product.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />

        {/* Subtle quick WhatsApp pill button on bottom of photo */}
        <button
          onClick={handleWhatsAppClick}
          className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 p-2.5 sm:px-3 sm:py-2 bg-white/95 hover:bg-white text-[#24201D] hover:text-[#25D366] rounded-full sm:rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
          title="Order directly on WhatsApp"
        >
          <MessageCircle className="w-4 h-4 text-[#25D366]" />
          <span className="hidden sm:inline text-[11px] font-semibold uppercase tracking-wider">
            WhatsApp
          </span>
        </button>
      </div>

      {/* Clean Minimal Typography Below */}
      <div className="pt-3 pb-1 space-y-1">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-serif text-sm sm:text-base text-[#24201D] font-normal tracking-wide group-hover:text-[#8C7E72] transition-colors line-clamp-1">
            {product.title}
          </h3>
          <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>

        {/* Dual Pricing */}
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2">
          <span className="text-xs sm:text-sm font-semibold text-[#24201D] tabular-nums">
            {formattedUSD} USD
          </span>
          <span className="text-[10.5px] sm:text-xs text-[#8C7E72] tabular-nums">
            {formattedLBP}
          </span>
        </div>
      </div>
    </div>
  );
};
