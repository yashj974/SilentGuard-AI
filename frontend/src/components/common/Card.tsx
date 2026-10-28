import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  headerBorder?: boolean;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  badge,
  action,
  headerBorder = false,
  noPadding = false,
}) => {
  return (
    <div className={`bento-card animate-bento-in ${className}`}>
      {(title || subtitle || action || badge) && (
        <div
          className={`flex flex-wrap items-start justify-between gap-3 px-6 pt-5 pb-2 ${
            headerBorder ? 'border-b border-white/[0.06] pb-4' : ''
          }`}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              {title && (
                <h3 className="text-[15px] font-semibold tracking-tight text-white">
                  {title}
                </h3>
              )}
              {badge}
            </div>
            {subtitle && (
              <p className="mt-1 text-xs text-zinc-400">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'px-6 pb-6 pt-3'}>{children}</div>
    </div>
  );
};
