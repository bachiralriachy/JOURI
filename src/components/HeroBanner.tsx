import React from 'react';
import { ArrowDown, MessageCircle } from 'lucide-react';
import { SiteSettings } from '../types';

interface HeroBannerProps {
  settings: SiteSettings;
  onExplore: () => void;
  onWhatsApp: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  settings,
  onExplore,
  onWhatsApp,
}) => {
  return (
    <section className="relative w-full bg-[#FAF7F2] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Editorial Text Left */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left order-2 lg:order-1">
            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.25em] text-[#8C7E72] font-semibold block">
                Broumana · Lebanon
              </span>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#24201D] font-light leading-[1.1] tracking-tight">
                Modern Elegance, Handmade Grace
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed max-w-md mx-auto lg:mx-0">
              Curated occasion wear, bespoke sewing, and handcrafted limited edition collections tailored in our Mar Chaaya atelier.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={onExplore}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#24201D] hover:bg-[#3D3732] text-white text-xs font-semibold uppercase tracking-[0.16em] rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Shop Collection
              </button>

              <button
                onClick={onWhatsApp}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-semibold uppercase tracking-[0.16em] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Order</span>
              </button>
            </div>
          </div>

          {/* Large High-Res Static Visual (Zara Style Clean Hero Photo) */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full rounded-2xl overflow-hidden shadow-sm bg-[#F2ECE4]">
              <img
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=80"
                alt="Jouri Boutique Collection"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80') {
                    target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80';
                  }
                }}
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
