import React from 'react';
import { GitPullRequest, GitFork, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FastCodeChaosSection: React.FC = () => {
  return (
    <section className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 py-24 text-left overflow-hidden border-t border-white/[0.06]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* ========================================================================= */}
        {/* LEFT: CONVERGING PR FIBER-OPTIC LASER STREAM ANIMATION                     */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 relative min-h-[340px] sm:min-h-[400px] flex items-center justify-center rounded-2xl bg-[#090a0d] border border-white/[0.06] p-4 sm:p-6 overflow-hidden shadow-2xl scroll-reveal-scale">
          {/* Subtle Technical Grid Overlay */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)`,
              backgroundSize: '32px 32px',
            }}
          />

          {/* Left Distributed PR Nodes in a Matrix */}
          <div className="absolute left-4 sm:left-8 inset-y-0 flex flex-col justify-around py-6 z-10">
            {[
              { id: '#1204', label: 'auth-jwt-refresh', color: 'border-emerald-500/40 text-emerald-400' },
              { id: '#1198', label: 'redis-cluster-cache', color: 'border-amber-500/40 text-amber-400' },
              { id: '#1182', label: 'stripe-webhook-guard', color: 'border-rose-500/40 text-rose-400' },
              { id: '#1174', label: 'prompt-sanitizer', color: 'border-[#FF5722]/50 text-[#FF5722]' },
              { id: '#1160', label: 'tenant-rate-limiter', color: 'border-emerald-500/40 text-emerald-400' },
            ].map((node) => (
              <div
                key={node.id}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#12141a]/90 backdrop-blur-md border ${node.color} text-[10px] font-mono shadow-md select-none`}
              >
                <GitPullRequest className="h-3 w-3" />
                <span className="font-bold text-white">{node.id}</span>
                <span className="text-slate-500 hidden sm:inline">{node.label}</span>
              </div>
            ))}
          </div>

          {/* SVG Animated Converging Stream Lines */}
          <svg
            className="w-full h-full absolute inset-0 pointer-events-none"
            viewBox="0 0 600 360"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="streamGreen" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
                <stop offset="70%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
              </linearGradient>

              <linearGradient id="streamRed" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.1" />
                <stop offset="70%" stopColor="#f43f5e" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="1" />
              </linearGradient>

              <linearGradient id="streamOrange" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FF5722" stopOpacity="0.1" />
                <stop offset="70%" stopColor="#FF5722" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#FF5722" stopOpacity="1" />
              </linearGradient>

              <linearGradient id="streamAmber" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1" />
                <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
              </linearGradient>

              <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Top Converging Traces with Continuous Flow Motion */}
            <path
              d="M 160 50 C 300 50, 360 180, 440 180"
              fill="none"
              stroke="url(#streamGreen)"
              strokeWidth="2"
              className="animate-laser-flow"
            />
            <path
              d="M 180 110 C 290 110, 360 178, 440 180"
              fill="none"
              stroke="url(#streamAmber)"
              strokeWidth="2.5"
              className="animate-laser-flow-fast"
            />

            {/* Center High-Energy Red & Orange Streams */}
            <path
              d="M 190 175 C 280 175, 360 180, 440 180"
              fill="none"
              stroke="url(#streamRed)"
              strokeWidth="3"
              filter="url(#laserGlow)"
              className="animate-laser-flow-fast"
            />
            <path
              d="M 180 245 C 290 245, 360 182, 440 180"
              fill="none"
              stroke="url(#streamOrange)"
              strokeWidth="2.5"
              filter="url(#laserGlow)"
              className="animate-laser-flow"
            />

            {/* Bottom Converging Trace */}
            <path
              d="M 160 310 C 300 310, 360 180, 440 180"
              fill="none"
              stroke="url(#streamGreen)"
              strokeWidth="2"
              className="animate-laser-flow-slow"
            />

            {/* Central Convergence Node (The Focus Core with Pulsing Shockwave) */}
            <circle cx="440" cy="180" r="16" fill="none" stroke="#FF5722" strokeWidth="1" strokeOpacity="0.4" className="animate-ping" />
            <circle cx="440" cy="180" r="10" fill="none" stroke="#FF5722" strokeWidth="1.5" strokeOpacity="0.8" className="animate-pulse" />
            <circle cx="440" cy="180" r="6" fill="#FF5722" filter="url(#laserGlow)" className="animate-core-pulse" />

            {/* Horizontal Unified Laser Beam continuing to the right */}
            <line
              x1="440"
              y1="180"
              x2="600"
              y2="180"
              stroke="#FF5722"
              strokeWidth="4"
              filter="url(#laserGlow)"
              className="animate-horizontal-beam"
            />
            <line
              x1="440"
              y1="178"
              x2="600"
              y2="178"
              stroke="#10b981"
              strokeWidth="2"
              strokeOpacity="0.9"
              className="animate-horizontal-beam"
            />
            <line
              x1="440"
              y1="182"
              x2="600"
              y2="182"
              stroke="#f43f5e"
              strokeWidth="2"
              strokeOpacity="0.9"
              className="animate-horizontal-beam"
            />
          </svg>

          {/* Right Status Indicator */}
          <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] font-mono text-slate-400">
            <GitFork className="h-3 w-3 text-[#FF5722]" />
            <span>Agentic PR Influx: 24/hr</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT: HEADLINE & EDITORIAL EXPLANATION                                  */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-6 scroll-reveal-right">
          <div className="space-y-3">
            <div className="text-xs font-mono font-bold tracking-wider text-[#FF5722] uppercase">
              THE AGENTIC BOTTLENECK
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-[1.1]">
              Fast code. Faster chaos.
            </h2>
          </div>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Coding agents are flooding pipelines with massive PRs faster than teams can validate, prioritize, understand, or secure them.
          </p>

          <div className="pt-2">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF5722] hover:text-[#ff7a50] transition-colors"
            >
              <span>See how SilentGuard AI restores order</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FastCodeChaosSection;