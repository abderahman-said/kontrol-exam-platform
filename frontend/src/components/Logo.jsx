import React from 'react';

export default function Logo({ size = 'md', variant = 'light', showText = true, className = '' }) {
  // أبعاد اللوجو المتجاوبة
  const sizeMap = {
    xs: 'h-7',
    sm: 'h-10',
    md: 'h-14',
    lg: 'h-20',
    xl: 'h-28'
  };

  const isDark = variant === 'dark';

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <div
        className={`transition-all duration-200 hover:scale-[1.02] flex items-center ${
          isDark
            ? 'bg-white/95 px-2.5 py-1 rounded-2xl shadow-sm border border-white/40'
            : ''
        }`}
      >
        <img
          src="/logo.png"
          alt="كَنترول | KONTROL"
          className={`${sizeMap[size] || sizeMap.md} w-auto object-contain block drop-shadow-2xs`}
          loading="eager"
        />
      </div>
    </div>
  );
}
