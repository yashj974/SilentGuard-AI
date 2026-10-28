import React, { useState, useEffect, useRef } from 'react';
import { Kanban, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TriageKanbanSection: React.FC = () => {
  const [activePriority, setActivePriority] = useState<number>(0);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const isManualLockRef = useRef<boolean>(false);
  const lockTimeoutRef = useRef<number | null>(null);

  const selectPriority = (idx: number) => {
    isManualLockRef.current = true;
    if (lockTimeoutRef.current) window.clearTimeout(lockTimeoutRef.current);
    lockTimeoutRef.current = window.setTimeout(() => {
      isManualLockRef.current = false;
    }, 2000);
    setActivePriority(idx);
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
          const idx = Math.min(3, Math.floor(progress * 4));
          setActivePriority((prev) => (prev !== idx ? idx : prev));
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
      {/* Section Header matching CodeRabbit Screenshot 5 */}
      <div className="max-w-3xl mb-14 scroll-reveal">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
          Prioritize your PR flood.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
          With more PRs than ever ballooning your engineering queue, SilentGuard Triage scores, ranks, and routes them to ship value faster.
        </p>
      </div>

      {/* Two-Column Split Layout with Sticky Left Kanban Triage Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left Column: Sticky Kanban Triage Board */}
        <div className="lg:col-span-7 lg:sticky lg:top-28 rounded-2xl border border-white/[0.08] bg-[#0e1013] p-5 sm:p-6 shadow-2xl space-y-4 scroll-reveal-left">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Kanban className="h-4 w-4 text-[#FF5722]" />
              <span className="font-semibold text-white">Pull Request Triage Queue</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">19 Active PRs · Auto-Routed</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Column P0 Urgent */}
            <div
              onClick={() => selectPriority(0)}
              onMouseEnter={() => selectPriority(0)}
              className={`rounded-xl bg-[#121418] border p-3 space-y-3 transition-all duration-300 cursor-pointer ${
                activePriority === 0 || activePriority === 3
                  ? 'border-red-500/60 shadow-[0_0_24px_rgba(239,68,68,0.14)] -translate-y-0.5'
                  : 'border-red-500/25 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-red-400 pb-1.5 border-b border-white/[0.06]">
                <span>P0 Urgent</span>
                <span className="rounded bg-red-500/20 px-1.5 py-0.2 font-mono text-[10px]">2</span>
              </div>
              <div className="rounded-lg bg-[#181b22] p-2.5 space-y-2 text-xs">
                <span className="font-mono text-[10px] text-slate-400">#842 · identity-platform</span>
                <p className="font-semibold text-white leading-snug">rotate exposed production signing key</p>
                <div className="flex flex-wrap gap-1 text-[9px] font-mono">
                  <span className="rounded bg-red-500/20 text-red-300 px-1.5 py-0.5">High risk</span>
                  <span className="rounded bg-orange-500/20 text-orange-300 px-1.5 py-0.5">High blast radius</span>
                </div>
              </div>
            </div>

            {/* Column P1 High Priority */}
            <div
              onClick={() => selectPriority(1)}
              onMouseEnter={() => selectPriority(1)}
              className={`rounded-xl bg-[#121418] border p-3 space-y-3 transition-all duration-300 cursor-pointer ${
                activePriority === 1 || activePriority === 3
                  ? 'border-amber-500/60 shadow-[0_0_24px_rgba(245,158,11,0.14)] -translate-y-0.5'
                  : 'border-amber-500/25 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-amber-400 pb-1.5 border-b border-white/[0.06]">
                <span>P1 High Priority</span>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.2 font-mono text-[10px]">5</span>
              </div>
              <div className="rounded-lg bg-[#181b22] p-2.5 space-y-2 text-xs">
                <span className="font-mono text-[10px] text-slate-400">#838 · managed-events</span>
                <p className="font-semibold text-white leading-snug">historical event bus stream buffer</p>
                <div className="flex flex-wrap gap-1 text-[9px] font-mono">
                  <span className="rounded bg-amber-500/20 text-amber-300 px-1.5 py-0.5">Medium risk</span>
                  <span className="rounded bg-slate-800 text-slate-300 px-1.5 py-0.5">Needs review</span>
                </div>
              </div>
            </div>

            {/* Column P2 Routine / Safe */}
            <div
              onClick={() => selectPriority(2)}
              onMouseEnter={() => selectPriority(2)}
              className={`rounded-xl bg-[#121418] border p-3 space-y-3 transition-all duration-300 cursor-pointer ${
                activePriority === 2 || activePriority === 3
                  ? 'border-emerald-500/60 shadow-[0_0_24px_rgba(16,185,129,0.14)] -translate-y-0.5'
                  : 'border-emerald-500/25 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 pb-1.5 border-b border-white/[0.06]">
                <span>P2 Routine</span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 font-mono text-[10px]">9</span>
              </div>
              <div className="rounded-lg bg-[#181b22] p-2.5 space-y-2 text-xs">
                <span className="font-mono text-[10px] text-slate-400">#812 · client-ui</span>
                <p className="font-semibold text-white leading-snug">refactor token validation hook</p>
                <div className="flex flex-wrap gap-1 text-[9px] font-mono">
                  <span className="rounded bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5">Safe to merge</span>
                  <span className="rounded bg-slate-800 text-slate-300 px-1.5 py-0.5">0 blockers</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-[#0a0b0d] border border-white/[0.06] p-3 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">
              {activePriority === 0 && 'Escalated: Signing key exposure routed to Security Lead'}
              {activePriority === 1 && 'Ranked: Medium blast radius assigned to Event Bus owner'}
              {activePriority === 2 && 'Auto-assigned: @sarah-chen (98% domain context match)'}
              {activePriority === 3 && 'Queue Health: 91% of routine PRs merged in <18 minutes'}
            </span>
            <span className="text-[#FF5722]">Live Sync</span>
          </div>
        </div>

        {/* Right Column: 4 Synchronized Feature Points */}
        <div className="lg:col-span-5 space-y-4 scroll-reveal-right">
          {[
            {
              id: 0,
              title: 'Prioritize value',
              desc: 'Ship changes with high business impact and zero security debt first, keeping team velocity unblocked.',
            },
            {
              id: 1,
              title: 'Rank risk',
              desc: 'Fast-track safe, routine PRs and review high-risk changes (unvalidated inputs, dependency drift) carefully.',
            },
            {
              id: 2,
              title: 'Choose the right reviewer',
              desc: 'Auto-assign the domain engineer with the highest contextual knowledge of the touched services.',
            },
            {
              id: 3,
              title: 'Understand your queue',
              desc: 'A real-time Kanban board for PRs that helps engineering leads understand queue health at a glance.',
            },
          ].map((item) => (
            <div
              key={item.id}
              onMouseEnter={() => selectPriority(item.id)}
              onClick={() => selectPriority(item.id)}
              className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                activePriority === item.id
                  ? 'bg-white/[0.03] border-[#FF5722]/40 shadow-lg'
                  : 'bg-transparent border-white/[0.05] hover:border-white/15'
              }`}
            >
              <h3 className="text-lg font-bold text-white tracking-tight">{item.title}</h3>
              <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}

          <div className="pt-2 pl-1">
            <Link
              to="/workspace"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF5722] hover:text-[#ff7a50] transition-colors"
            >
              <span>View live triage queue in workspace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TriageKanbanSection;
