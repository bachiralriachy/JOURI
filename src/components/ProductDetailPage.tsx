import React, { useState } from 'react';
import { ChevronLeft, MessageCircle, Ruler, Scissors, Share2 } from 'lucide-react';
import { Product, SiteSettings } from '../types';
import { formatUSD, formatLBP, buildWhatsAppOrderLink, handleImageFallback } from '../services/storage';

interface ProductDetailPageProps {
  product: Product;
  settings: SiteSettings;
  onBack: () => void;
  onSelectCategory: (cat: string) => void;
  relatedProducts: Product[];
  onSelectProduct: (p: Product) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  settings,
  onBack,
  relatedProducts,
  onSelectProduct,
}) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'Standard');

  const formattedUSD = formatUSD(product.priceUSD);
  const formattedLBP = formatLBP(product.priceUSD, settings.usdToLbpRate);

  const handleWhatsAppOrder = () => {
    const link = buildWhatsAppOrderLink(
      settings.whatsappNumber,
      product.title,
      product.priceUSD,
      settings.usdToLbpRate,
      selectedSize
    );
    window.open(link, '_blank');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: `Look at this piece from Jouri Boutique: ${product.title}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('Product link copied!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-stone-500 hover:text-[#24201D] mb-6 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Collection</span>
      </button>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
        {/* Left: Big Static Images */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#F2ECE4]">
            <img
              src={product.images[selectedImage] || product.images[0]}
              alt={product.title}
              referrerPolicy="no-referrer"
              onError={(e) => handleImageFallback(e)}
              className="w-full h-full object-cover object-center"
            />
            <button
              onClick={handleShare}
              className="absolute top-4 right-4 p-2.5 bg-white/90 hover:bg-white text-stone-700 rounded-full shadow-sm cursor-pointer"
              title="Share piece"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Thumbnails if multiple */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-24 rounded-lg overflow-hidden border-2 cursor-pointer shrink-0 transition-all ${
                    selectedImage === idx ? 'border-[#24201D]' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.title} view ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    onError={(e) => handleImageFallback(e)}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
          <div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#8C7E72] font-semibold block mb-1">
              {product.category}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#24201D] font-normal leading-tight mb-2">
              {product.title}
            </h1>
            {product.subtitle && (
              <p className="text-xs sm:text-sm text-stone-500 font-light leading-relaxed">
                {product.subtitle}
              </p>
            )}
          </div>

          {/* Dual Price Card */}
          <div className="p-4 bg-white border border-[#E8DFD5] rounded-xl space-y-1">
            <div className="text-2xl font-bold text-[#24201D] tabular-nums">
              {formattedUSD} USD
            </div>
            <p className="text-xs text-[#8C7E72] font-medium tabular-nums">
              ≈ {formattedLBP} (Rate: $1 = {settings.usdToLbpRate.toLocaleString()} LBP)
            </p>
          </div>

          {/* Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="uppercase tracking-wider font-semibold text-stone-700">
                  Select Size
                </span>
                <span className="text-stone-500 text-[11px]">Free in-store alterations</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`py-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      selectedSize === s
                        ? 'bg-[#24201D] text-white border-[#24201D]'
                        : 'bg-white text-stone-700 border-[#E2D8CC] hover:border-stone-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Primary Action Button: Direct WhatsApp Order */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleWhatsAppOrder}
              className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold uppercase tracking-[0.16em] rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Direct WhatsApp Order</span>
            </button>
          </div>

          {/* Service Guarantee Strip */}
          <div className="p-4 bg-[#F8F5F0] border border-[#E8DFD5] rounded-xl space-y-2 text-xs text-stone-600">
            <div className="flex items-center gap-2 font-semibold text-[#24201D]">
              <Scissors className="w-4 h-4 text-[#B89772]" />
              <span>Free In-Store Hem Alteration & Fitting</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Delivery available all over Lebanon. Cash on Delivery in USD ($) or LBP (L.L.). Visit our Broumana atelier for customized adjustments.
            </p>
          </div>
        </div>
      </div>

      {/* Related Pieces */}
      {relatedProducts.length > 0 && (
        <div className="mt-20 pt-10 border-t border-[#E8DFD5]">
          <h3 className="font-serif text-2xl text-[#24201D] mb-6">
            More From Jouri Boutique
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedProducts.slice(0, 4).map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProduct(p)}
                className="cursor-pointer group space-y-2"
              >
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-[#F2ECE4]">
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => handleImageFallback(e)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div>
                  <h4 className="font-serif text-xs sm:text-sm text-[#24201D] truncate">
                    {p.title}
                  </h4>
                  <p className="text-xs font-semibold text-[#24201D]">
                    {formatUSD(p.priceUSD)} USD
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
