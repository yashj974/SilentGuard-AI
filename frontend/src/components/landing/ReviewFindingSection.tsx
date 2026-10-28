import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ReviewFindingSection: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<number>(0);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const isManualLockRef = useRef<boolean>(false);
  const lockTimeoutRef = useRef<number | null>(null);

  const selectFeature = (idx: number) => {
    isManualLockRef.current = true;
    if (lockTimeoutRef.current) window.clearTimeout(lockTimeoutRef.current);
    lockTimeoutRef.current = window.setTimeout(() => {
      isManualLockRef.current = false;
    }, 2000);
    setActiveFeature(idx);
  };

  useEffect(() => {
    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        const el = sectionRef.current;
        if (!el || isManualLockRef.current) return;

        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.65 && rect.bottom > window.innerHeight * 0.35) {
          const progress = Math.min(
            1,
            Math.max(0, (window.innerHeight * 0.55 - rect.top) / Math.max(1, rect.height * 0.75))
          );
          const idx = Math.min(2, Math.floor(progress * 3));
          setActiveFeature((prev) => (prev !== idx ? idx : prev));
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 py-20 text-left border-t border-white/[0.06]"
    >
      {/* Section Header */}
      <div className="max-w-3xl mb-14 scroll-reveal">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
          Industry-leading AI code risk analysis.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
          We pioneered automated silent debt detection and have deep architectural context. Our automated evaluations are the central validation layer for AI-generated code.
        </p>
      </div>

      {/* Two-Column Split Layout with Sticky Left Product Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left Column: Sticky Dark Interactive Review Finding Card */}
        <div className="lg:col-span-7 lg:sticky lg:top-28 rounded-2xl border border-white/[0.08] bg-[#0e1013] p-5 sm:p-7 shadow-2xl space-y-4 scroll-reveal-left">
          {/* Card Top Title Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-white/[0.08] font-mono">
            <span className="text-white font-semibold">acme/platform #482</span>
            <span className="text-[#FF5722]">Step {activeFeature + 1} of 3 · Live Review Loop</span>
          </div>

          {/* Bot Review Item with Orange Icon */}
          <div
            className={`rounded-xl bg-[#14171d] border p-4 space-y-2.5 text-xs transition-all duration-300 ${
              activeFeature === 0
                ? 'border-[#FF5722]/60 shadow-[0_0_24px_rgba(255,87,34,0.12)] scale-[1.01]'
                : 'border-[#FF5722]/25'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-[#FF5722] flex items-center justify-center text-white font-bold text-xs">
                  SG
                </div>
                <span className="font-bold text-white">silentguard-bot</span>
                <span className="rounded bg-white/10 px-1.5 py-0.2 text-[10px] font-mono text-slate-300">bot</span>
                <span className="text-slate-500 text-[11px]">reviewed 2m ago</span>
              </div>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">
                Cross-Package Context
              </span>
            </div>

            <div className="text-amber-200 font-medium leading-relaxed">
              ⚠️ Invalidate the cache after the mutation. The record updates, but the stale project key remains in Redis.
            </div>

            {/* Code Diff Snapshot */}
            <div className="rounded-lg bg-[#0a0b0d] border border-white/[0.06] p-3 font-mono text-[11px] leading-relaxed select-text space-y-1">
              <div className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded -mx-1">
                - await db.project.update(input)
              </div>
              <div className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded -mx-1">
                + await updateProjectAndInvalidate(input)
              </div>
            </div>
          </div>

          {/* AI Agent Loop Reply */}
          <div
            className={`rounded-xl bg-[#111317] border p-4 text-xs space-y-2 transition-all duration-300 ${
              activeFeature === 1
                ? 'border-blue-500/50 shadow-[0_0_24px_rgba(59,130,246,0.14)] scale-[1.01]'
                : 'border-white/[0.06]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-blue-600 flex items-center justify-center text-white">
                  <Sparkles className="h-3 w-3" />
                </div>
                <span className="font-semibold text-white">codex</span>
                <span className="rounded bg-white/10 px-1.5 py-0.2 text-[10px] font-mono text-slate-300">coding agent</span>
                <span className="text-slate-500 text-[11px]">replied 1m ago</span>
              </div>
              <span className="text-[10px] font-mono text-blue-400">Auto-remediated</span>
            </div>
            <p className="text-slate-300 text-[12px] leading-relaxed">
              Fixed in <span className="font-mono text-white">9f2c4a1</span> — invalidation now runs after the transaction, with a sandboxed regression test for the stale-cache path.
            </p>
          </div>

          {/* Continuous Debt Gate Status Bar */}
          <div
            className={`rounded-xl bg-[#0b0d10] border p-3.5 flex items-center justify-between text-xs transition-all duration-300 ${
              activeFeature === 2
                ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.12)] scale-[1.01]'
                : 'border-white/[0.06]'
            }`}
          >
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              <span>Quality Gate Rescored: Sprint Debt Budget Preserved</span>
            </div>
            <span className="font-mono text-[11px] text-white bg-emerald-500/15 px-2 py-0.5 rounded">
              Risk Score: 0.08 (Safe)
            </span>
          </div>
        </div>

        {/* Right Column: Three Synchronized Feature Bullets */}
        <div className="lg:col-span-5 space-y-5 scroll-reveal-right">
          <div
            onMouseEnter={() => selectFeature(0)}
            onClick={() => selectFeature(0)}
            className={`p-5 rounded-xl border transition-all duration-300 cursor-pointer ${
              activeFeature === 0
                ? 'bg-white/[0.03] border-[#FF5722]/40 shadow-lg'
                : 'bg-transparent border-white/[0.05] hover:border-white/15'
            }`}
          >
            <h3 className="text-lg font-bold text-white tracking-tight">Dozens more points of context</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              We bring in more architectural context than traditional linters, evaluating cross-package dependencies, blast radiuses, and hidden runtime side effects.
            </p>
          </div>

          <div
            onMouseEnter={() => selectFeature(1)}
            onClick={() => selectFeature(1)}
            className={`p-5 rounded-xl border transition-all duration-300 cursor-pointer ${
              activeFeature === 1
                ? 'bg-white/[0.03] border-[#FF5722]/40 shadow-lg'
                : 'bg-transparent border-white/[0.05] hover:border-white/15'
            }`}
          >
            <h3 className="text-lg font-bold text-white tracking-tight">Agent loops with reviews</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Loops directly with your coding agents (Copilot, Claude Code, Cursor) to resolve findings automatically before human reviewers spend precious time.
            </p>
          </div>

          <div
            onMouseEnter={() => selectFeature(2)}
            onClick={() => selectFeature(2)}
            className={`p-5 rounded-xl border transition-all duration-300 cursor-pointer ${
              activeFeature === 2
                ? 'bg-white/[0.03] border-[#FF5722]/40 shadow-lg'
                : 'bg-transparent border-white/[0.05] hover:border-white/15'
            }`}
          >
            <h3 className="text-lg font-bold text-white tracking-tight">Continuous debt budgeting</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Auto-scores PR risk velocity and enforces calibrated quality gate thresholds so teams ship fast without sacrificing architectural integrity.
            </p>
          </div>

          <div className="pt-2 pl-1">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF5722] hover:text-[#ff7a50] transition-colors"
            >
              <span>Explore real code review findings in workspace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewFindingSection;
