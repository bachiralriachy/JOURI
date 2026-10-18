import React from 'react';
import { MessageCircle } from 'lucide-react';
import { SiteSettings } from '../types';
import { Logo } from './Logo';

interface NavbarProps {
  settings: SiteSettings;
  onNavigateCategory: (cat: string) => void;
  onNavigateHome: () => void;
  onNavigateLocation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onNavigateCategory,
  onNavigateHome,
  onNavigateLocation,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8DFD5] shadow-xs">
      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo & Brand Name Text ("JOURI BOUTIQUE") */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 sm:gap-3 text-left cursor-pointer focus:outline-none group min-w-0"
          aria-label="Jouri Boutique Home"
        >
          <Logo size="md" showBrandText />
        </button>

        {/* Minimal Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-[0.18em] font-medium text-[#4A433D]">
          <button
            onClick={onNavigateHome}
            className="hover:text-[#24201D] transition-colors cursor-pointer"
          >
            Collections
          </button>
          <button
            onClick={() => onNavigateCategory('Handmade')}
            className="hover:text-[#24201D] transition-colors cursor-pointer text-[#8C7E72]"
          >
            Handmade
          </button>
          <button
            onClick={() => onNavigateCategory('Dresses')}
            className="hover:text-[#24201D] transition-colors cursor-pointer"
          >
            Dresses
          </button>
          <button
            onClick={onNavigateLocation}
            className="hover:text-[#24201D] transition-colors cursor-pointer"
          >
            Atelier & Location
          </button>
        </nav>

        {/* Actions Right - Customer Focused WhatsApp Concierge (Dynamic) */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {Boolean(settings.whatsappNumber?.trim()) && (
            <a
              href={`https://wa.me/${settings.whatsappNumber?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello Jouri Boutique, I would like to inquire about your collection.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba5a] text-white text-[11px] font-semibold uppercase tracking-wider rounded-lg transition-colors shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
};
