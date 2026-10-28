import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Cpu,
  Layers,
  Wrench,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

export const ProductPreviewSection: React.FC = () => {
  return (
    <section id="product-preview" className="relative z-10 mx-auto max-w-7xl px-6 py-20 sm:px-8">
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Unified Code Risk Intelligence Dashboard
        </h2>
        <p className="mt-2 text-sm text-slate-400 max-w-2xl mx-auto">
          Continuous AST evaluation, AI generation provenance, and change fragility metrics aggregated into an actionable executive view.
        </p>
      </div>

      {/* Frame Container with glow */}
      <div className="relative mx-auto max-w-5xl">
        {/* Violet glow behind preview */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-600/30 via-purple-600/20 to-indigo-600/30 blur-xl opacity-75" />

        {/* Floating Badge 1 (Left Top) */}
        <div className="hidden lg:flex absolute -left-6 top-16 z-20 items-center gap-2.5 rounded-xl border border-purple-500/30 bg-[#0d1224]/90 p-3 shadow-xl shadow-black/60 backdrop-blur-md animate-float-slow">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="text-left text-xs">
            <span className="font-semibold text-white block">AI Anti-Pattern Detected</span>
            <span className="text-[10px] text-slate-400">SSRF via hallucinated webhook param</span>
          </div>
        </div>

        {/* Floating Badge 2 (Right Bottom) */}
        <div className="hidden lg:flex absolute -right-6 bottom-20 z-20 items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-[#0d1224]/90 p-3 shadow-xl shadow-black/60 backdrop-blur-md animate-float-reverse">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="text-left text-xs">
            <span className="font-semibold text-emerald-400 block">Verified Fix Ready</span>
            <span className="text-[10px] text-slate-300">18/18 tests passed in sandbox</span>
          </div>
        </div>

        {/* Dashboard Window Frame */}
        <div className="relative overflow-hidden rounded-xl border border-purple-900/40 bg-[#0b0f19] shadow-2xl">
          {/* Window Header Bar */}
          <div className="flex items-center justify-between border-b border-purple-900/30 bg-[#070b16] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500/60" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
              <span className="ml-2 font-mono text-xs text-slate-400">
                silentguard.ai/workspace/core-platform
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-400 border border-amber-500/20">
                DEMO PREVIEW
              </span>
              <Link
                to="/workspace"
                className="hidden sm:inline-flex items-center gap-1 rounded bg-purple-600/30 px-2 py-0.5 text-[11px] font-medium text-purple-200 hover:bg-purple-600/50 transition-colors"
              >
                <span>Interactive View</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Window Interior Content */}
          <div className="p-4 sm:p-6 space-y-6">
            {/* Top Score Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
              {/* Debt Gauge Card */}
              <div className="rounded-lg border border-purple-900/30 bg-[#111827] p-4 sm:col-span-1 flex flex-col items-center justify-center text-center">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Silent Debt Score
                </div>
                <div className="mt-2 text-3xl font-extrabold text-white">78</div>
                <div className="mt-1 inline-flex items-center rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400">
                  Grade B (Warning)
                </div>
                <div className="mt-2 text-[10px] text-slate-400">Near budget breach</div>
              </div>

              {/* 4 Pillars Mini Cards */}
              <div className="grid grid-cols-2 gap-3 sm:col-span-4 sm:grid-cols-4">
                <div className="rounded-lg border border-purple-900/30 bg-[#111827] p-3 text-left">
                  <div className="flex items-center justify-between text-red-400">
                    <ShieldAlert className="h-4 w-4" />
                    <span className="text-[10px] font-mono font-bold">Grade C</span>
                  </div>
                  <div className="mt-2 text-lg font-bold text-white">64/100</div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-0.5 text-red-400">
                    <TrendingDown className="h-3 w-3" /> -6 pts (Security)
                  </div>
                </div>

                <div className="rounded-lg border border-purple-900/30 bg-[#111827] p-3 text-left">
                  <div className="flex items-center justify-between text-blue-400">
                    <Cpu className="h-4 w-4" />
                    <span className="text-[10px] font-mono font-bold">Grade B</span>
                  </div>
                  <div className="mt-2 text-lg font-bold text-white">82/100</div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-0.5 text-emerald-400">
                    <TrendingUp className="h-3 w-3" /> +4 pts (Reliability)
                  </div>
                </div>

                <div className="rounded-lg border border-purple-900/30 bg-[#111827] p-3 text-left">
                  <div className="flex items-center justify-between text-teal-400">
                    <Wrench className="h-4 w-4" />
                    <span className="text-[10px] font-mono font-bold">Grade B</span>
                  </div>
                  <div className="mt-2 text-lg font-bold text-white">75/100</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    22 exception blocks
                  </div>
                </div>

                <div className="rounded-lg border border-purple-900/30 bg-[#111827] p-3 text-left">
                  <div className="flex items-center justify-between text-purple-400">
                    <Layers className="h-4 w-4" />
                    <span className="text-[10px] font-mono font-bold">Grade D</span>
                  </div>
                  <div className="mt-2 text-lg font-bold text-white">59/100</div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-0.5 text-red-400">
                    <TrendingDown className="h-3 w-3" /> -8 pts (Arch)
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Trend & Findings Row */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Mini Trend Visualizer */}
              <div className="rounded-lg border border-purple-900/30 bg-[#111827] p-4 text-left">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-3">
                  <span>Risk Velocity (Last 6 Sprints)</span>
                  <span className="text-[10px] text-purple-400 font-mono">AST Delta</span>
                </div>
                {/* SVG Area simulation */}
                <div className="h-28 w-full flex items-end">
                  <svg className="h-full w-full overflow-visible" viewBox="0 0 300 80">
                    <defs>
                      <linearGradient id="prevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 50 Q 50 40, 100 48 T 200 35 T 300 25 L 300 80 L 0 80 Z"
                      fill="url(#prevGrad)"
                    />
                    <path
                      d="M 0 50 Q 50 40, 100 48 T 200 35 T 300 25"
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="2.5"
                    />
                    <circle cx="300" cy="25" r="4" fill="#a855f7" />
                  </svg>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>Sprint 19</span>
                  <span>Sprint 21</span>
                  <span>Sprint 24 (Current)</span>
                </div>
              </div>

              {/* Sample Priority Findings */}
              <div className="rounded-lg border border-purple-900/30 bg-[#111827] p-4 text-left space-y-2.5">
                <div className="text-xs text-slate-300 font-semibold mb-2">
                  Top AI Debt Findings
                </div>
                <div className="flex items-center justify-between rounded bg-[#1a2236] p-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                      CRITICAL
                    </span>
                    <span className="font-medium text-white truncate max-w-[160px] sm:max-w-[220px]">
                      AI SSRF in Webhook Target
                    </span>
                  </div>
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
                    Fix Ready
                  </span>
                </div>

                <div className="flex items-center justify-between rounded bg-[#1a2236] p-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-bold text-orange-400">
                      HIGH
                    </span>
                    <span className="font-medium text-white truncate max-w-[160px] sm:max-w-[220px]">
                      Unbounded Vector Memory Buffer
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-purple-400">
                    91% AI Gen
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
