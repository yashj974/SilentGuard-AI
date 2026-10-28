import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ArchitectureSection: React.FC = () => {
  return (
    <section id="how-it-works" className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 py-20 text-left border-t border-white/[0.06]">
      <div className="max-w-3xl mb-14 scroll-reveal">
        <div className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase mb-3">
          GRAPH-BASED DEPENDENCY INTELLIGENCE
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
          Understand your architecture & change fragility.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
          AI coding assistants often synthesize code that works in isolation but introduces circular references, leaky abstractions, and excessive service coupling across trust boundaries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left Column: Sticky Visual Architectural Graph Representation */}
        <div className="lg:col-span-7 lg:sticky lg:top-28 rounded-2xl border border-white/[0.08] bg-[#0e1013] p-6 sm:p-8 shadow-2xl space-y-6 scroll-reveal-left">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-white/[0.08] font-mono">
            <span className="text-white font-semibold">Cross-Service Coupling Topology</span>
            <span className="text-amber-400">Blast Radius: 4 Services</span>
          </div>

          {/* Interactive Topology Graph Visual */}
          <div className="relative h-64 rounded-xl bg-[#08090b] border border-white/[0.06] p-4 flex items-center justify-around overflow-hidden">
            {/* Service A */}
            <div className="relative z-10 rounded-xl bg-[#14161b] border border-emerald-500/30 p-3.5 text-center w-28 sm:w-32 shadow-lg">
              <span className="text-[10px] font-mono text-emerald-400 uppercase block">Service</span>
              <span className="font-bold text-white text-xs block mt-0.5">auth-gateway</span>
              <span className="text-[9px] text-slate-400 font-mono">Coupling: 0.12</span>
            </div>

            {/* Connecting Line with Drift Marker */}
            <div className="flex-1 flex flex-col items-center justify-center px-2">
              <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500/40 via-amber-500 to-red-500/50 relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF5722] text-white px-1.5 py-0.2 rounded text-[9px] font-mono">
                  Cycle Detected
                </span>
              </div>
            </div>

            {/* Service B (Fragile) */}
            <div className="relative z-10 rounded-xl bg-[#14161b] border border-red-500/40 p-3.5 text-center w-28 sm:w-32 shadow-lg">
              <span className="text-[10px] font-mono text-red-400 uppercase block">Fragile Node</span>
              <span className="font-bold text-white text-xs block mt-0.5">billing-worker</span>
              <span className="text-[9px] text-red-300 font-mono">Coupling: 0.89</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="rounded-lg bg-[#14161b] border border-white/[0.06] p-3">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Change Fragility Index</span>
              <span className="text-xl font-bold text-white mt-1 block">8.4 / 10</span>
              <span className="text-[11px] text-red-400">High architectural debt risk</span>
            </div>
            <div className="rounded-lg bg-[#14161b] border border-white/[0.06] p-3">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Automated Rescore</span>
              <span className="text-xl font-bold text-white mt-1 block">18 Passed</span>
              <span className="text-[11px] text-emerald-400">Zero breaking API signatures</span>
            </div>
          </div>
        </div>

        {/* Right Column: Key Principles */}
        <div className="lg:col-span-5 space-y-6 scroll-reveal-right">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Detect hidden circular loops</h3>
            <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">
              Catches unintentional dependency inversions and circular imports introduced across services by rapid LLM completions.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Protect trust boundary perimeters</h3>
            <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">
              Flags raw prompt concatenations, SSRF-prone webhooks, and unvalidated tenant contexts before they merge.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Calculate sprint debt velocity</h3>
            <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">
              Provides engineering managers with quantitative burndown metrics on technical debt introduced vs. paid down per sprint.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF5722] hover:text-[#ff7a50] transition-colors"
            >
              <span>Explore change impact engine in workspace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
