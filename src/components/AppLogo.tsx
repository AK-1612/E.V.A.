import React from 'react';
import logoImg from '../assets/images/eva_upgrade_mechamorph_logo_1789644202364.jpg';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  className = '',
  showBorder = true,
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-8 h-8 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl',
    xl: 'w-20 h-20 rounded-3xl',
  };

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden flex-shrink-0 bg-[#07090E] ${
        showBorder ? 'border border-[#38BDF8]/40 shadow-[0_0_12px_rgba(56,189,248,0.25)]' : ''
      } ${sizeClasses[size]} ${className}`}
    >
      <img
        src={logoImg}
        alt="E.V.A. Logo"
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback to vector SVG if image fails to load
          e.currentTarget.src = '/icon.svg';
        }}
      />
    </div>
  );
};
