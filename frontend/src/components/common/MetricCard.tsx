import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  trend?: 'improving' | 'stable' | 'degrading';
  changeDelta?: string | number;
  issuesCount?: number;
  icon?: React.ReactNode;
  categoryColor?: string;
  statusLabel?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  grade,
  trend = 'improving',
  changeDelta,
  issuesCount,
  icon,
  statusLabel,
  onClick,
}) => {
  const isPositive = trend === 'improving';
  const isNeutral = trend === 'stable';

  const getGradeClasses = (g: string) => {
    switch (g) {
      case 'A':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'B':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25';
      case 'C':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'D':
      case 'F':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-white/10 text-zinc-300 border-white/20';
    }
  };

  const formattedDelta =
    typeof changeDelta === 'number'
      ? changeDelta > 0
        ? `+${changeDelta} pts`
        : `${changeDelta} pts`
      : changeDelta;

  return (
    <div
      onClick={onClick}
      className={`bento-card bento-card-interactive animate-bento-in flex flex-col justify-between p-5 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Top Row: Frosted Circular Icon Orb + Clean Label + Optional Grade Pill */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && (
            <div className="bento-icon-orb flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-100">
              {icon}
            </div>
          )}
          <span className="text-xs font-medium text-zinc-300 truncate" title={title}>
            {title}
          </span>
        </div>

        {grade && (
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${getGradeClasses(
              grade
            )}`}
          >
            Grade {grade}
          </span>
        )}
      </div>

      {/* Middle Row: Large Crisp White Value */}
      <div className="my-3.5 flex items-baseline gap-1.5">
        <span className="text-2xl lg:text-3xl font-semibold tracking-tight text-white">
          {value}
        </span>
        {typeof value === 'number' && (
          <span className="font-mono text-xs text-zinc-500">/100</span>
        )}
      </div>

      {/* Bottom Row: Trend Indicator + Delta + Issues / Note */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          ) : isNeutral ? (
            <Minus className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-[#FF5722] shrink-0" />
          )}
          <span
            className={`font-semibold shrink-0 ${
              isPositive
                ? 'text-emerald-400'
                : isNeutral
                ? 'text-zinc-300'
                : 'text-[#FF5722]'
            }`}
          >
            {formattedDelta || (isPositive ? '+4.0%' : isNeutral ? 'Stable' : '-4.0%')}
          </span>
          <span className="text-zinc-400 truncate">
            {subtitle ||
              (issuesCount !== undefined ? `${issuesCount} findings` : statusLabel)}
          </span>
        </div>
      </div>
    </div>
  );
};
