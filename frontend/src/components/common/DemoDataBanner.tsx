import React from 'react';
import { Database, Layers } from 'lucide-react';
import { Badge } from './Badge';

interface DemoDataBannerProps {
  onToggleState?: (state: 'demo' | 'loading' | 'empty' | 'error') => void;
  currentState?: 'demo' | 'loading' | 'empty' | 'error';
}

export const DemoDataBanner: React.FC<DemoDataBannerProps> = ({
  onToggleState,
  currentState = 'demo',
}) => {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <Badge variant="demo" size="sm" />
        <span className="hidden md:inline-block h-3 w-px bg-[var(--border-subtle)]" />
        <p className="truncate text-[11px] text-[var(--text-secondary)]">
          <Database className="mr-1.5 inline h-3 w-3 text-[var(--accent-main)]" />
          Sample telemetry active for <span className="font-mono text-[var(--text-primary)]">core-platform</span> — connect FastAPI scanner for live repository AST results.
        </p>
      </div>

      {onToggleState && (
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] mr-1">
            <Layers className="h-3 w-3" /> State:
          </span>
          {(
            [
              { id: 'demo', label: 'Demo Data' },
              { id: 'loading', label: 'Loading' },
              { id: 'empty', label: 'Empty' },
              { id: 'error', label: 'Error' },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              onClick={() => onToggleState(s.id)}
              className={`rounded-md px-2 py-0.5 font-mono text-[11px] transition-all ${
                currentState === s.id
                  ? 'bg-[var(--accent-main)] text-white font-semibold shadow-xs'
                  : 'bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
