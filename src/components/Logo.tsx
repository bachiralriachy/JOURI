import React from 'react';
import logoImg from '../assets/images/watermarked_img_10811691523014342063.jpg';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBrandText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showBrandText = false,
}) => {
  // Dimension presets for the circular emblem badge
  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-10 h-10 sm:w-12 sm:h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Official circular emblem badge with nude/cream background and rose illustration */}
      <div
        className={`relative shrink-0 rounded-full overflow-hidden bg-[#FAF3EC] border border-[#E8DFD5] shadow-xs transition-transform duration-300 hover:scale-[1.03] ${sizeClasses}`}
      >
        <img
          src={logoImg}
          alt="Jouri Boutique Logo"
          className="w-full h-full object-cover rounded-full"
          referrerPolicy="no-referrer"
          loading="eager"
          width={48}
          height={48}
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== '/watermarked_img_10811691523014342063.jpg' && target.src !== '/logo.jpg') {
              target.src = '/watermarked_img_10811691523014342063.jpg';
            }
          }}
        />
      </div>

      {showBrandText && (
        <span className="font-serif text-[14px] sm:text-base lg:text-lg font-medium tracking-[0.14em] sm:tracking-[0.18em] uppercase text-[#1A1A1A] transition-colors whitespace-nowrap">
          JOURI BOUTIQUE
        </span>
      )}
    </div>
  );
};
