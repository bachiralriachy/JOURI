import React from 'react';
import { MapPin, Navigation, MessageCircle, ExternalLink, Instagram } from 'lucide-react';
import { SiteSettings } from '../types';

interface LocationSectionProps {
  settings: SiteSettings;
}

export const LocationSection: React.FC<LocationSectionProps> = ({ settings }) => {
  return (
    <section id="location-section" className="border-t border-[#E8DFD5] bg-[#FAF7F2] py-16 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        {/* Title */}
        <div className="space-y-2">
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#8C7E72] font-semibold block">
            Visit Our Atelier
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#24201D] font-light">
            Broumana, Lebanon
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-light max-w-md mx-auto">
            {settings.addressText}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={settings.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-7 py-3.5 bg-[#24201D] hover:bg-[#3D3732] text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Navigation className="w-4 h-4 text-[#B89772]" />
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
          </a>

          <a
            href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent('Hello Jouri Boutique, I would like to visit the shop in Broumana.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-7 py-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>

        {/* Hours & Alterations info */}
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-stone-600 max-w-2xl mx-auto border-t border-[#E8DFD5]">
          <div>
            <p className="font-semibold text-[#24201D] uppercase tracking-wider text-[11px]">Boutique Hours</p>
            <p className="mt-1">Mon – Sat: 10:00 AM – 7:30 PM</p>
          </div>
          <div>
            <p className="font-semibold text-[#24201D] uppercase tracking-wider text-[11px]">Alterations</p>
            <p className="mt-1">Complimentary in-house fitting</p>
          </div>
          <div>
            <p className="font-semibold text-[#24201D] uppercase tracking-wider text-[11px]">Lebanon Delivery</p>
            <p className="mt-1">Cash on Delivery across all areas</p>
          </div>
        </div>
      </div>
    </section>
  );
};
