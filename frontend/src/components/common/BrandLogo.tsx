import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  wordmarkClassName?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showWordmark = true,
  wordmarkClassName = '',
}) => {
  const iconDimensions =
    size === 'sm'
      ? 'h-6 w-6'
      : size === 'lg'
      ? 'h-9 w-9'
      : 'h-7 w-7';

  const textDimensions =
    size === 'sm'
      ? 'text-sm'
      : size === 'lg'
      ? 'text-xl'
      : 'text-base';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* 
        CodeRabbit-Inspired Vibrant Orange Brand Mark for SilentGuard AI:
        A sharp, solid electric-orange shield mark with a precision white cipher core.
        Matches CodeRabbit's iconic orange icon + clean white wordmark design language.
      */}
      <div className={`relative flex items-center justify-center rounded-lg bg-[#FF5722] text-white shadow-sm shrink-0 ${iconDimensions} transition-transform group-hover:scale-105`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-[65%] w-[65%] text-white"
          aria-hidden="true"
        >
          {/* Dual Precision Protective Geometry */}
          <path
            d="M12 2L4 5.5V11C4 16.5 7.4 21.6 12 23C16.6 21.6 20 16.5 20 11V5.5L12 2Z"
            fill="currentColor"
            fillOpacity="0.2"
          />
          <path
            d="M12 4L5.5 7V11C5.5 15.5 8.3 19.8 12 21C15.7 19.8 18.5 15.5 18.5 11V7L12 4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="11.5" r="2.2" fill="currentColor" />
          <path
            d="M12 7.5V9M12 14V15.5M8 11.5H9.5M14.5 11.5H16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showWordmark && (
        <div className={`flex items-baseline gap-1 font-bold tracking-tight text-white ${textDimensions} ${wordmarkClassName}`}>
          <span className="font-extrabold tracking-tight">SilentGuard</span>
          <span className="text-[#FF5722] font-semibold text-xs ml-0.5">AI</span>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
