import React from 'react';
import logoImg from '../assets/images/watermarked_img_10811691523014342063.jpg';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
}) => {
  // Dimension presets for the official circular emblem badge
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-[50px] h-[50px] sm:w-[54px] sm:h-[54px]',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Official circular emblem badge with nude/cream background and rose illustration */}
      <div
        className={`relative shrink-0 rounded-full overflow-hidden bg-[#FAF3EC] border border-[#E8DFD5] shadow-xs transition-transform duration-300 hover:scale-[1.03] ${sizeClasses}`}
      >
        <img
          src={logoImg}
          alt="Jouri Boutique official logo"
          className="w-full h-full object-cover rounded-full"
          referrerPolicy="no-referrer"
          loading="eager"
          width={54}
          height={54}
          onError={(e) => {
            // Fallback to public path if bundler asset path has issues
            const target = e.currentTarget;
            if (target.src !== '/watermarked_img_10811691523014342063.jpg') {
              target.src = '/watermarked_img_10811691523014342063.jpg';
            }
          }}
        />
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <span className="font-serif font-bold text-lg sm:text-xl tracking-[0.14em] text-[#1F1A17] uppercase leading-tight">
            Jouri
          </span>
          <span className="text-[9.5px] tracking-[0.28em] text-[#7A6F65] uppercase font-medium leading-none">
            Boutique
          </span>
        </div>
      )}
    </div>
  );
};
