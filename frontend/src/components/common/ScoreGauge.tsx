import React from 'react';

interface ScoreGaugeProps {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  size?: number;
  label?: string;
  isHealthy?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  grade,
  size = 76,
  label = 'Silent Debt Score',
}) => {
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * Math.min(Math.max(score, 0), 100)) / 100;

  const getColor = (s: number) => {
    if (s >= 85) return '#10b981'; // Emerald
    if (s >= 70) return '#FF5722'; // Signal Orange (Homepage primary)
    if (s >= 55) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const color = getColor(score);

  return (
    <div className="flex items-center gap-3.5">
      <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="rotate-[135deg] transform"
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--border-strong)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            fill="none"
            className="opacity-35"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            style={{
              transition: 'stroke-dashoffset 0.8s ease-in-out',
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-xl font-black tracking-tight text-[var(--text-primary)] leading-none">
            {score}
          </span>
          <span className="mt-0.5 font-mono text-[9px] uppercase text-[var(--text-muted)]">
            /100
          </span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] truncate">
          {label}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className="inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold"
            style={{
              backgroundColor: `${color}18`,
              borderColor: `${color}40`,
              color,
            }}
          >
            Grade {grade}
          </span>
          <span className="font-mono text-[10px] text-[var(--text-muted)]">
            {score >= 80 ? 'Gate Passed' : score >= 65 ? 'Gate Warning' : 'Gate Failed'}
          </span>
        </div>
        <p className="mt-1.5 text-[11px] text-[var(--text-muted)] truncate">
          Composite AST &amp; LLM risk index
        </p>
      </div>
    </div>
  );
};
