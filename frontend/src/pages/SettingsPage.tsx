import React from 'react';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/common/StateView';
import { useTheme } from '../theme/useTheme';
import type { AccentColor } from '../theme/ThemeContext';
import { useWorkspace } from '../context/useWorkspace';
import { Sun, Moon, Laptop, Check, Server, Layers } from 'lucide-react';
import { RepositoryIntegrationsPanel } from '../components/integrations/RepositoryIntegrationsPanel';

export const SettingsPage: React.FC = () => {
  const { themeMode, accentColor, setThemeMode, setAccentColor } = useTheme();
  const { uiState, setUiState, backendStatus } = useWorkspace();

  if (uiState === 'loading') return <LoadingSkeleton />;
  if (uiState === 'empty') return <EmptyState onAction={() => setUiState('demo')} />;
  if (uiState === 'error') return <ErrorState onRetry={() => setUiState('demo')} />;

  const accents: { id: AccentColor; name: string; hex: string }[] = [
    { id: 'orange', name: 'Signal Orange (Default)', hex: '#FF5722' },
    { id: 'emerald', name: 'Emerald Green', hex: '#10b981' },
    { id: 'amber', name: 'Amber Gold', hex: '#f59e0b' },
    { id: 'cyan', name: 'Electric Cyan', hex: '#06b6d4' },
    { id: 'indigo', name: 'Indigo Slate', hex: '#6366f1' },
  ];

  return (
    <div className="space-y-5">
      {/* Theme & Appearance Bento Card */}
      <div className="bento-card animate-bento-in p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-white">
              Settings, Theme &amp; Engine Diagnostics
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              Configure workspace appearance, test UI state views, and inspect backend endpoint status.
            </p>
          </div>
          <Badge variant="demo" size="sm" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Theme Mode */}
          <div className="bento-inner-card p-5">
            <label className="text-xs font-semibold text-zinc-300 block mb-3">
              Color Theme Mode
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setThemeMode('light')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all ${
                  themeMode === 'light'
                    ? 'border-[#FF5722] bg-[#FF5722]/15 text-white font-semibold'
                    : 'border-white/[0.08] bg-black/40 text-zinc-400 hover:text-white'
                }`}
              >
                <Sun className="h-4 w-4 text-amber-400" />
                Light
              </button>

              <button
                onClick={() => setThemeMode('dark')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all ${
                  themeMode === 'dark'
                    ? 'border-[#FF5722] bg-[#FF5722]/15 text-white font-semibold'
                    : 'border-white/[0.08] bg-black/40 text-zinc-400 hover:text-white'
                }`}
              >
                <Moon className="h-4 w-4 text-[#FF5722]" />
                Dark
              </button>

              <button
                onClick={() => setThemeMode('system')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all ${
                  themeMode === 'system'
                    ? 'border-[#FF5722] bg-[#FF5722]/15 text-white font-semibold'
                    : 'border-white/[0.08] bg-black/40 text-zinc-400 hover:text-white'
                }`}
              >
                <Laptop className="h-4 w-4 text-zinc-300" />
                System
              </button>
            </div>
          </div>

          {/* Accent Color Selection */}
          <div className="bento-inner-card p-5">
            <label className="text-xs font-semibold text-zinc-300 block mb-3">
              Brand Accent Palette
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              {accents.map((accent) => (
                <button
                  key={accent.id}
                  onClick={() => setAccentColor(accent.id)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-2.5 text-xs transition-all ${
                    accentColor === accent.id
                      ? 'border-[#FF5722] bg-white/[0.08] font-semibold text-white'
                      : 'border-white/[0.07] bg-black/40 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span
                    className="h-5 w-5 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: accent.hex }}
                  >
                    {accentColor === accent.id && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="text-[11px] text-center">{accent.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* UI State Testing Controls & Backend Integration Status */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="bento-card animate-bento-in p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Layers className="h-4 w-4 text-[#FF5722]" />
            <span>Workspace State Simulator</span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Test how all workspace routes handle Demo Data, Loading skeletons, Empty states, and Error states.
          </p>
          <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
            {(['demo', 'loading', 'empty', 'error'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setUiState(s)}
                className={`rounded-xl py-2.5 font-mono uppercase transition-all ${
                  uiState === s
                    ? 'bg-[#FF5722] text-white font-bold'
                    : 'bg-white/[0.05] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.1]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="bento-card animate-bento-in p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Server className="h-4 w-4 text-[#FF5722]" />
              <span>Backend Endpoint Inventory (FastAPI)</span>
            </div>
            <span className="font-mono text-xs text-zinc-400">
              Status: <strong className="text-white">{backendStatus}</strong>
            </span>
          </div>
          <div className="mt-3 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between rounded-xl bg-black/40 border border-white/[0.06] px-3 py-2">
              <span className="text-emerald-400">GET /api/health</span>
              <span className="text-zinc-400">Implemented in backend/app/main.py</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-black/40 border border-white/[0.06] px-3 py-2">
              <span className="text-emerald-400">GET|POST /api/auth/google/*</span>
              <span className="text-zinc-400">Official Google OAuth 2.0 + PKCE</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-black/40 border border-white/[0.06] px-3 py-2">
              <span className="text-emerald-400">GET|POST /api/integrations/*</span>
              <span className="text-zinc-400">GitHub, GitLab &amp; Bitbucket OAuth + API Verify</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-black/40 border border-white/[0.06] px-3 py-2">
              <span className="text-emerald-400">POST /api/repositories/scan</span>
              <span className="text-zinc-400">Requires live verified provider access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Source Control Provider Connections */}
      <RepositoryIntegrationsPanel redirectPath="/settings" />
    </div>
  );
};
