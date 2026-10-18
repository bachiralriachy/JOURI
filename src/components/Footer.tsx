import React from 'react';
import { Instagram, MessageCircle, MapPin, ExternalLink, Lock } from 'lucide-react';
import { SiteSettings } from '../types';
import { Logo } from './Logo';

interface FooterProps {
  settings: SiteSettings;
  onOpenAdmin: () => void;
  onNavigateHome: () => void;
  onNavigateLocation: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onOpenAdmin,
  onNavigateHome,
  onNavigateLocation,
}) => {
  return (
    <footer className="border-t border-[#E8DFD5] bg-[#FAF7F2] text-[#24201D] py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          {/* Logo & Tagline */}
          <div className="space-y-2">
            <button onClick={onNavigateHome} className="cursor-pointer">
              <Logo size="md" />
            </button>
            <p className="text-xs text-stone-500 font-light max-w-sm">
              {settings.addressText}, Lebanon. Handmade occasion wear, bespoke tailoring & nationwide delivery.
            </p>
          </div>

          {/* Social Icons (Dynamic: ONLY active configured links appear) */}
          <div className="flex items-center gap-3">
            {/* Instagram */}
            {Boolean(settings.instagramUrl?.trim()) && (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white border border-[#E2D8CC] text-[#24201D] hover:bg-[#24201D] hover:text-white rounded-full transition-colors shadow-xs"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            )}

            {/* WhatsApp */}
            {Boolean(settings.whatsappNumber?.trim()) && (
              <a
                href={`https://wa.me/${settings.whatsappNumber?.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white border border-[#E2D8CC] text-[#24201D] hover:bg-[#25D366] hover:text-white rounded-full transition-colors shadow-xs"
                title="WhatsApp Contact"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            )}

            {/* TikTok */}
            {Boolean(settings.tiktokUrl?.trim()) && (
              <a
                href={settings.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white border border-[#E2D8CC] text-[#24201D] hover:bg-[#24201D] hover:text-white rounded-full transition-colors shadow-xs font-bold text-xs"
                title="TikTok"
              >
                TK
              </a>
            )}

            {/* Facebook */}
            {Boolean(settings.facebookUrl?.trim()) && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white border border-[#E2D8CC] text-[#24201D] hover:bg-[#1877F2] hover:text-white rounded-full transition-colors shadow-xs font-bold text-xs"
                title="Facebook"
              >
                FB
              </a>
            )}

            {/* Google Maps Location */}
            {Boolean(settings.googleMapsUrl?.trim()) && (
              <a
                href={settings.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white border border-[#E2D8CC] text-[#24201D] hover:bg-[#24201D] hover:text-white rounded-full transition-colors shadow-xs"
                title="Google Maps Location"
              >
                <MapPin className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Bottom Bar: Copyright & Discrete Staff Login Trigger */}
        <div className="pt-6 border-t border-[#E8DFD5] flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
          <p>© {new Date().getFullYear()} Jouri Boutique. Broumana, Lebanon.</p>

          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateLocation}
              className="hover:text-stone-700 transition-colors cursor-pointer text-[11px]"
            >
              Google Maps Location
            </button>

            <span aria-hidden="true">·</span>

            {/* Discrete Staff Login Trigger */}
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1 text-stone-400 hover:text-stone-700 transition-colors text-[11px] cursor-pointer"
              title="Staff Login"
            >
              <Lock className="w-3 h-3 text-stone-400" />
              <span>Staff Login</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
