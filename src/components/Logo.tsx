/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  customLogoUrl?: string;
  customCompanyName?: string;
  customSubtitle?: string;
}

export default function Logo({ 
  className = '', 
  showText = true, 
  size = 'md',
  customLogoUrl,
  customCompanyName,
  customSubtitle
}: LogoProps) {
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [customLogoUrl]);

  const dimensions = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-28 h-28',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`} id="riyadah-logo-container">
      {customLogoUrl && !imageError ? (
        <img
          src={customLogoUrl}
          alt={customCompanyName || "شعار الشركة"}
          onError={() => setImageError(true)}
          className={`${dimensions[size]} object-contain rounded-xl filter drop-shadow-sm`}
        />
      ) : (
        /* SVG recreation of the Al-Riyadah gradient circular logo */
        <svg
          id="riyadah-svg"
          className={`${dimensions[size]} filter drop-shadow-sm`}
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
        <defs>
          <linearGradient id="gradientCircle" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" /> {/* Deep Blue */}
            <stop offset="50%" stopColor="#0D9488" /> {/* Teal */}
            <stop offset="100%" stopColor="#84CC16" /> {/* Vibrant Lime Green */}
          </linearGradient>
          <linearGradient id="calligraphyGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
        </defs>

        {/* Outer stylized glow circle ring */}
        <circle cx="100" cy="100" r="92" stroke="url(#gradientCircle)" strokeWidth="6" fill="white" />
        <circle cx="100" cy="100" r="82" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="4 4" />

        {/* The computer screen element at the top center with connection nodes */}
        <g id="screen-node" transform="translate(65, 30)">
          {/* Laptop/Screen */}
          <rect x="10" y="5" width="50" height="32" rx="4" fill="none" stroke="#0D9488" strokeWidth="3" />
          <line x1="15" y1="37" x2="55" y2="37" stroke="#0D9488" strokeWidth="4" strokeLinecap="round" />
          <line x1="35" y1="37" x2="35" y2="45" stroke="#0D9488" strokeWidth="3" />
          <line x1="25" y1="45" x2="45" y2="45" stroke="#0D9488" strokeWidth="3" strokeLinecap="round" />
          
          {/* Digital dots/nodes pouring into the screen */}
          <circle cx="0" cy="5" r="2.5" fill="#1E3A8A" />
          <circle cx="-5" cy="12" r="3" fill="#0D9488" />
          <circle cx="5" cy="18" r="2" fill="#84CC16" />
          <line x1="-5" y1="12" x2="10" y2="15" stroke="#0D9488" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="0" y1="5" x2="12" y2="10" stroke="#1E3A8A" strokeWidth="1" strokeDasharray="2 2" />
        </g>

        {/* Artistic Calligraphic design for "الريادة" inside */}
        <g id="arabic-calligraphy" transform="translate(45, 80)">
          {/* Stylized curve for the Letter 'Alif' & 'Lam' */}
          <path
            d="M 100 20 C 120 40, 115 80, 85 90 C 65 96, 40 90, 45 70 C 48 60, 60 62, 55 52 C 50 42, 35 48, 30 35 C 25 20, 40 10, 55 15"
            stroke="url(#calligraphyGradient)"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Elegant swoop for 'Yaa' & 'Daal' */}
          <path
            d="M 15 55 C 20 80, 50 85, 75 70 C 90 60, 105 30, 95 10 C 90 0, 75 10, 80 25 C 85 40, 65 55, 45 55 C 30 55, 12 40, 15 25"
            stroke="#0D9488"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Diacritical dots (نقط الياء والتاء المربوطة) */}
          <circle cx="65" cy="78" r="4.5" fill="#84CC16" />
          <circle cx="75" cy="74" r="4.5" fill="#84CC16" />
          
          <circle cx="28" cy="10" r="4" fill="#1E3A8A" />
          <circle cx="38" cy="12" r="4" fill="#1E3A8A" />
        </g>

        {/* Decorative dynamic swirl */}
        <path
          d="M 15 130 C 30 175, 85 185, 135 175 C 175 165, 185 125, 175 90"
          stroke="#84CC16"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Swirl connection points */}
        <circle cx="15" cy="130" r="5" fill="#84CC16" />
        <circle cx="28" cy="145" r="4" fill="#0D9488" />
      </svg>
      )}

      {showText && (
        <div className="mt-2 text-center" id="riyadah-logo-text">
          <h1 className="text-sm font-black text-slate-800 font-sans tracking-wide leading-tight max-w-xs">
            {customSubtitle || 'المنصة الرقمية الموحدة لإدارة العمليات والموارد'}
          </h1>
          <p className="text-[10px] text-teal-700 font-bold mt-1">
            {customCompanyName || 'مركز سند الريادة للخدمات'}
          </p>
        </div>
      )}
    </div>
  );
}
