import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  GitPullRequest,
  FileCode2,
  Layers,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  // Tab index: 0 = Review, 1 = Prioritize, 2 = Understand, 3 = Secure
  const [activeTab, setActiveTab] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const timerRef = useRef<number | null>(null);
  const scrollTrackRef = useRef<HTMLDivElement | null>(null);
  const isManualLockRef = useRef<boolean>(false);
  const lockTimeoutRef = useRef<number | null>(null);

  const handleManualSelect = (index: number) => {
    isManualLockRef.current = true;
    if (lockTimeoutRef.current) window.clearTimeout(lockTimeoutRef.current);
    lockTimeoutRef.current = window.setTimeout(() => {
      isManualLockRef.current = false;
    }, 2200);
    setActiveTab(index);
  };

  const tabs = [
    {
      id: 0,
      number: '01',
      shortTitle: 'Review',
      fullTitle: 'Review every PR automatically',
    },
    {
      id: 1,
      number: '02',
      shortTitle: 'Prioritize',
      fullTitle: 'Prioritize across all PRs',
    },
    {
      id: 2,
      number: '03',
      shortTitle: 'Understand',
      fullTitle: "Understand each PR's impact",
    },
    {
      id: 3,
      number: '04',
      shortTitle: 'Secure',
      fullTitle: 'Secure your codebase continually',
    },
  ];

  // Auto-advance carousel every 5 seconds continuously (resets when user hovers or clicks a tab)
  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 4);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTab]);

  // Synchronized scroll-driven progression + 3D parallax tilt for sticky hero preview
  useEffect(() => {
    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        const track = scrollTrackRef.current;
        if (!track) return;

        const rect = track.getBoundingClientRect();
        const scrollableDistance = Math.max(1, rect.height - window.innerHeight * 0.75);
        const scrolled = -rect.top + window.innerHeight * 0.18;
        const progress = Math.min(1, Math.max(0, scrolled / scrollableDistance));
        setScrollProgress(progress);

        // Drive synchronized product-preview step when scrolling through sticky track
        if (!isManualLockRef.current && rect.top < window.innerHeight * 0.25 && rect.bottom > window.innerHeight * 0.45) {
          const targetStep = Math.min(3, Math.floor(progress * 4));
          setActiveTab((prev) => (prev !== targetStep ? targetStep : prev));
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const tiltDeg = Math.max(0, (1 - Math.min(1, scrollProgress * 2.2)) * 4);
  const parallaxOffset = (scrollProgress - 0.5) * -18;

  return (
    <section className="relative z-10 w-full pt-28 sm:pt-36 pb-20 px-4 sm:px-8 max-w-7xl mx-auto text-left">
      {/* ========================================================================= */}
      {/* 1. TOP HERO HEADER: Left Headline + Right Supporting Paragraph & CTAs     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end mb-12 sm:mb-16">
        {/* Left Column: Eyebrow + Large Editorial Headline */}
        <div className="lg:col-span-7 space-y-4 scroll-reveal is-revealed">
          <div className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
            AI CODE RISK INTELLIGENCE
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-[4.25rem] font-bold tracking-tight text-white leading-[1.06]">
            The future isn&apos;t just writing code. It&apos;s understanding its risk.
          </h1>
        </div>

        {/* Right Column: Supporting Paragraph + Action Buttons */}
        <div className="lg:col-span-5 space-y-6 lg:pb-2 scroll-reveal is-revealed reveal-delay-100">
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            AI-driven code now outpaces human review capacity. SilentGuard AI is the automated intelligence layer that uncovers hidden security debt, fragile changes, and architectural risks before merge.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-white hover:bg-slate-100 px-6 py-3 text-sm font-semibold text-black transition-all shadow-sm active:scale-[0.98]"
            >
              <span>Get a free trial</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/book-demo"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all active:scale-[0.98]"
            >
              <span>Book a Demo</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STICKY SCROLL-SYNCHRONIZED PRODUCT PREVIEW TRACK                          */}
      {/* ========================================================================= */}
      <div ref={scrollTrackRef} className="relative lg:min-h-[155vh]">
        <div
          className="lg:sticky lg:top-20 transition-transform duration-300 ease-out"
          style={{
            transform: `perspective(1600px) rotateX(${tiltDeg.toFixed(2)}deg)`,
            transformOrigin: 'center top',
          }}
        >
          {/* ===================================================================== */}
          {/* 2. TABBED STEPPER: 01 Review | 02 Prioritize | 03 Understand | 04 Secure */}
          {/* ===================================================================== */}
          <div className="rounded-t-2xl border-t border-x border-white/[0.08] bg-[#0c0d10] overflow-hidden">
            <div className="grid grid-cols-4 border-b border-white/[0.08]">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleManualSelect(tab.id)}
                    onMouseEnter={() => handleManualSelect(tab.id)}
                    className={`relative py-3.5 sm:py-4 px-2 sm:px-6 text-left transition-all duration-300 cursor-pointer border-r border-white/[0.08] last:border-r-0 select-none ${
                      isActive
                        ? 'bg-white/[0.03] text-white'
                        : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.01]'
                    }`}
                  >
                    {/* Active Orange Underline Bar with Motion Progress */}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.1] overflow-hidden">
                        <div className="h-full bg-[#FF5722] shadow-[0_0_12px_rgba(255,87,34,0.9)] animate-tab-timer" />
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      <span className={`font-mono text-xs ${isActive ? 'text-[#FF5722] font-bold' : 'text-slate-500'}`}>
                        {tab.number}
                      </span>
                      <span className="font-bold text-white tracking-tight truncate">
                        {tab.shortTitle}
                      </span>
                      {/* Expanded full title visible on md screens when active */}
                      {isActive && (
                        <span className="text-slate-400 font-normal hidden lg:inline truncate">
                          {tab.fullTitle.replace(`${tab.shortTitle} `, '')}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* 3. FLOATING HORIZONTAL ACCORDION SLIDER (CodeRabbit 3D Floating Effect) */}
          {/* ===================================================================== */}
          <div className="relative rounded-b-2xl border border-white/[0.08] bg-[#08090b] shadow-2xl overflow-hidden transition-all select-none">
            {/* Horizontal Accordion Track with Smooth Flex Transitions */}
            <div className="flex flex-row min-h-[520px] lg:min-h-[500px] w-full relative overflow-hidden">
              {/* ================================================================= */}
              {/* CARD 01: REVIEW EVERY PR AUTOMATICALLY                            */}
              {/* ================================================================= */}
              <div
                onClick={() => handleManualSelect(0)}
                onMouseEnter={() => handleManualSelect(0)}
                className={`relative border-r border-white/[0.08] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-start overflow-hidden ${
                  activeTab === 0
                    ? 'flex-[10] opacity-100 z-20 bg-[#0c0e12] shadow-[0_20px_50px_rgba(0,0,0,0.9)]'
                    : 'flex-[1] min-w-[48px] sm:min-w-[64px] opacity-30 hover:opacity-75 bg-[#090a0d] cursor-pointer'
                }`}
              >
            {/* Card Content Inner */}
            <div className={`p-4 sm:p-7 w-full min-w-[620px] transition-opacity duration-500 ${activeTab === 0 ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              {/* Floating Orange Shield Badge over Card 01 */}
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#FF5722] flex-shrink-0 flex items-center justify-center text-white font-black text-sm shadow-[0_4px_16px_rgba(255,87,34,0.4)]">
                  SG
                </div>

                <div className="flex-1 space-y-3">
                  {/* Bot Comment Header */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-white">silentguard-bot</span>
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">bot</span>
                    <span className="text-slate-500 text-[11px]">commented 2 minutes ago</span>
                  </div>

                  {/* Review Change Stack Button Pill */}
                  <div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1d24] border border-white/10 hover:border-[#FF5722]/50 text-xs text-white font-medium transition cursor-pointer"
                    >
                      <span className="h-2 w-2 rounded-full bg-[#FF5722]" />
                      <span>Review Change Stack</span>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                    </button>
                  </div>

                  {/* Warning Header */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Potential issue</span>
                      <span className="text-slate-500">|</span>
                      <span className="flex items-center gap-1 text-rose-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Major
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white">
                      Reject expired refresh tokens before issuing a session.
                    </p>
                    <p className="text-xs text-slate-400">
                      Check the token expiry before creating a new authenticated session to prevent replay attacks.
                    </p>
                  </div>

                  {/* High Contrast Code Diff Viewer */}
                  <div className="rounded-xl bg-[#07080a] border border-white/[0.08] p-3 sm:p-4 font-mono text-xs space-y-1.5 overflow-x-auto">
                    <div className="text-slate-500 text-[11px]">
                      @@ -42,2 +42,3 @@ export async function createSession(payload)
                    </div>
                    <div className="bg-red-500/10 text-red-300 px-2 py-1 rounded -mx-1 flex items-center justify-between">
                      <span>- return issueSession(payload.userId);</span>
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-300 px-2 py-1 rounded -mx-1">
                      + if (payload.expiresAt &lt;= Date.now()) return null;
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-300 px-2 py-1 rounded -mx-1">
                      + return issueSession(payload.userId);
                    </div>
                  </div>

                  {/* Committable Suggestion Trigger */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <div className="flex items-center gap-1.5 hover:text-white cursor-pointer transition">
                      <ChevronRight className="h-3.5 w-3.5 text-[#FF5722]" />
                      <span className="font-semibold text-slate-300">Committable suggestion verified in sandbox</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Zero blast radius
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inactive Column Peeking Label (Vertical text when collapsed) */}
            {activeTab !== 0 && (
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center pointer-events-none">
                <span className="rotate-90 text-[11px] font-mono uppercase tracking-widest text-slate-400 whitespace-nowrap">
                  01 Review
                </span>
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* CARD 02: PRIORITIZE ACROSS ALL PRS                                    */}
          {/* ===================================================================== */}
          <div
            onClick={() => handleManualSelect(1)}
            onMouseEnter={() => handleManualSelect(1)}
            className={`relative border-r border-white/[0.08] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-start overflow-hidden ${
              activeTab === 1
                ? 'flex-[10] opacity-100 z-20 bg-[#0c0e12] shadow-[0_20px_50px_rgba(0,0,0,0.9)]'
                : 'flex-[1] min-w-[48px] sm:min-w-[64px] opacity-30 hover:opacity-75 bg-[#090a0d] cursor-pointer'
            }`}
          >
            {/* Card Content Inner */}
            <div className={`p-4 sm:p-7 w-full min-w-[620px] transition-opacity duration-500 ${activeTab === 1 ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              {/* Triage Matrix Header matching Screenshot 2 */}
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-white/[0.08] text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">Now</span>
                    <span className="rounded bg-white/10 px-2 py-0.2 font-mono text-slate-300 text-[11px]">14</span>
                    <span className="text-slate-500 text-[10px]">‹</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Within each engineer&apos;s daily capacity</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">Next</span>
                    <span className="rounded bg-white/10 px-2 py-0.2 font-mono text-slate-300 text-[11px]">66</span>
                    <span className="text-slate-500 text-[10px]">‹</span>
                  </div>
                  <span className="text-[11px] text-slate-500">All remaining asynchronous reviews</span>
                </div>
              </div>

              {/* Triage Cards 2x2 Grid */}
              <div className="grid grid-cols-2 gap-3.5 pt-3">
                {/* P0 Urgent Card */}
                <div className="rounded-xl bg-[#12141a] border border-red-500/30 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-red-400 font-semibold text-[11px]">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span>P0</span>
                  </div>
                  <p className="font-bold text-white leading-snug">
                    Skip bot-authored comment review tasks
                  </p>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    Review this early because it can resolve assumptions that may affect nearby PRs and reduce rework.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono">
                    <span className="rounded bg-white/5 text-slate-300 px-2 py-0.5">Low security risk</span>
                    <span className="rounded bg-white/5 text-slate-300 px-2 py-0.5">Maintenance</span>
                    <span className="rounded bg-white/5 text-slate-300 px-2 py-0.5">Deep review</span>
                  </div>
                </div>

                {/* P1 High Priority Card */}
                <div className="rounded-xl bg-[#12141a] border border-amber-500/30 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-[11px]">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <span>P1</span>
                  </div>
                  <p className="font-bold text-white leading-snug">
                    fix(dashboard): scope PR details authors by org
                  </p>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    Keep this visible for async review because it is useful work without an immediate interruption signal.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono">
                    <span className="rounded bg-white/5 text-slate-300 px-2 py-0.5">Low security risk</span>
                    <span className="rounded bg-white/5 text-slate-300 px-2 py-0.5">Bug fix</span>
                    <span className="rounded bg-white/5 text-slate-300 px-2 py-0.5">Standard review</span>
                  </div>
                </div>

                {/* P1 Feature Card */}
                <div className="rounded-xl bg-[#12141a] border border-white/[0.06] p-3.5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-[11px]">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <span>P1</span>
                  </div>
                  <p className="font-bold text-white leading-snug truncate">
                    feat(agents): extend per-run prompt_cache_key
                  </p>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    Review early to calibrate agent memory limits across parallel evaluation pipelines.
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500 font-mono">
                    <span>#842 · @copilot-runner</span>
                  </div>
                </div>

                {/* P2 Routine Card */}
                <div className="rounded-xl bg-[#12141a] border border-white/[0.06] p-3.5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>P2</span>
                  </div>
                  <p className="font-bold text-white leading-snug truncate">
                    [codex] Lean path instruction metrics insert
                  </p>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    Hold this behind refresh work because draft conflict resolution is handled automatically.
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500 font-mono">
                    <span>#812 · @ezrapike</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inactive Column Peeking Label */}
            {activeTab !== 1 && (
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center pointer-events-none">
                <span className="rotate-90 text-[11px] font-mono uppercase tracking-widest text-slate-400 whitespace-nowrap">
                  02 Prioritize
                </span>
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* CARD 03: UNDERSTAND EACH PR'S IMPACT (CHANGE STACK)                   */}
          {/* ===================================================================== */}
          <div
            onClick={() => handleManualSelect(2)}
            onMouseEnter={() => handleManualSelect(2)}
            className={`relative border-r border-white/[0.08] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-start overflow-hidden ${
              activeTab === 2
                ? 'flex-[10] opacity-100 z-20 bg-[#0c0e12] shadow-[0_20px_50px_rgba(0,0,0,0.9)]'
                : 'flex-[1] min-w-[48px] sm:min-w-[64px] opacity-30 hover:opacity-75 bg-[#090a0d] cursor-pointer'
            }`}
          >
            {/* Card Content Inner */}
            <div className={`p-4 sm:p-7 w-full min-w-[620px] transition-opacity duration-500 ${activeTab === 2 ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              {/* PR Header Bar */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08] text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-mono text-emerald-400 font-semibold">
                    <GitPullRequest className="h-3 w-3" />
                    Open
                  </span>
                  <span className="font-bold text-white text-sm">
                    Add teammate invitations with roles
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400 font-mono text-xs">acme/web-app #482 · 9 files</span>
                </div>
              </div>

              {/* Two Column Layout matching Screenshot 3 */}
              <div className="grid grid-cols-12 gap-4">
                {/* Left Side: Layers & Change Stack Navigator (4 cols) */}
                <div className="col-span-4 rounded-xl bg-[#12141a] border border-white/[0.06] p-3 space-y-3">
                  <div className="flex rounded-lg bg-[#0a0b0e] p-1 text-xs font-semibold">
                    <button type="button" className="flex-1 py-1 rounded bg-white/[0.1] text-white">
                      Layers
                    </button>
                    <button type="button" className="flex-1 py-1 rounded text-slate-400 hover:text-white">
                      Files
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-1.5 rounded bg-white/[0.05] text-white font-medium">
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-3 w-3 text-[#FF5722]" /> Overview
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">Open</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded text-slate-400">
                      <span>Security blast radius</span>
                      <span className="text-[10px] font-mono text-slate-500">2 Svcs</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded text-slate-400">
                      <span>Architecture impact</span>
                      <span className="text-[10px] font-mono text-slate-500">Low</span>
                    </div>
                  </div>

                  {/* Active Stack Item */}
                  <div className="rounded-lg bg-[#181b22] border border-[#FF5722]/40 p-2.5 text-xs space-y-1">
                    <div className="font-bold text-white">1 Add the invitation data model</div>
                    <div className="text-[10px] font-mono text-slate-400">2 files touched · 0 risks</div>
                  </div>
                </div>

                {/* Right Side: Diff & Context Insights (8 cols) */}
                <div className="col-span-8 rounded-xl bg-[#090b0e] border border-white/[0.06] p-3.5 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/[0.06] text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <FileCode2 className="h-3.5 w-3.5 text-[#FF5722]" />
                      <span>src/server/auth/permissions.ts</span>
                    </div>
                    <span className="text-slate-500 text-[10px]">20 unmodified lines</span>
                  </div>

                  <div className="space-y-1 text-[11px] leading-relaxed">
                    <div className="text-slate-500">21 return member.role === &quot;ADMIN&quot;</div>
                    <div className="text-slate-500">22 &#125;</div>
                    <div className="text-slate-500">23</div>
                    <div className="bg-red-500/10 text-red-300 px-2 py-0.5 rounded -mx-1">
                      24 - export function canRemoveMember(role) &#123;
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded -mx-1">
                      25 + export function canRemoveMember(member) &#123;
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded -mx-1">
                      26 +   return member.role === &quot;ADMIN&quot;
                    </div>
                    <div className="text-slate-500">27 &#125;</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inactive Column Peeking Label */}
            {activeTab !== 2 && (
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center pointer-events-none">
                <span className="rotate-90 text-[11px] font-mono uppercase tracking-widest text-slate-400 whitespace-nowrap">
                  03 Understand
                </span>
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* CARD 04: SECURE YOUR CODEBASE CONTINUALLY                             */}
          {/* ===================================================================== */}
          <div
            onClick={() => handleManualSelect(3)}
            onMouseEnter={() => handleManualSelect(3)}
            className={`relative transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-start overflow-hidden ${
              activeTab === 3
                ? 'flex-[10] opacity-100 z-20 bg-[#0c0e12] shadow-[0_20px_50px_rgba(0,0,0,0.9)]'
                : 'flex-[1] min-w-[48px] sm:min-w-[64px] opacity-30 hover:opacity-75 bg-[#090a0d] cursor-pointer'
            }`}
          >
            {/* Card Content Inner */}
            <div className={`p-4 sm:p-7 w-full min-w-[620px] transition-opacity duration-500 ${activeTab === 3 ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              {/* Header matching Screenshot 4 */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    REAL-TIME CODEBASE HEALTH
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">Mostly healthy</div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Scanning every PR
                  </span>
                  <span className="text-slate-600">·</span>
                  <span>Last scan now</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-white font-semibold">0 critical</span>
                </div>
              </div>

              {/* Codebase Health Bar */}
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex mb-5">
                <div className="h-full bg-emerald-400 w-[78%]" />
                <div className="h-full bg-amber-400 w-[17%]" />
                <div className="h-full bg-rose-500 w-[5%]" />
              </div>

              {/* Health Matrix Grid with Overlaid Cards */}
              <div className="relative rounded-xl bg-[#090b0e] border border-white/[0.06] p-4 min-h-[220px]">
                {/* 16x6 Status Dot Matrix Background */}
                <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-2 opacity-50">
                  {Array.from({ length: 96 }).map((_, i) => {
                    const isRed = i === 18 || i === 44;
                    const isAmber = i === 9 || i === 31 || i === 72 || i === 83;
                    return (
                      <div
                        key={i}
                        className={`h-2.5 w-2.5 rounded-full ${
                          isRed
                            ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]'
                            : isAmber
                            ? 'bg-amber-400'
                            : 'bg-emerald-500/60'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Floating Dependency Vulnerability Card with Parallax Depth (Screenshot 4) */}
                <div
                  className="absolute left-6 top-8 rounded-xl bg-[#141720]/95 backdrop-blur-md border border-white/10 p-3.5 shadow-2xl space-y-2 text-xs max-w-xs parallax-layer"
                  style={{ transform: `translate3d(0, ${(parallaxOffset * 0.65).toFixed(1)}px, 0)` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      <span>Dependency vulnerability</span>
                    </div>
                    <span className="rounded bg-amber-500/20 text-amber-300 px-1.5 py-0.2 text-[10px] font-mono">
                      High
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-slate-300">
                    axios · GHSA-4w2v-q235-vp99
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.06] text-[10px]">
                    <span className="text-slate-400">Detected on PR #482</span>
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold hover:bg-emerald-500/30 transition cursor-pointer"
                    >
                      Fix ready
                    </button>
                  </div>
                </div>

                {/* Floating Severity Distribution Card with Donut Chart & Parallax Depth (Screenshot 4) */}
                <div
                  className="absolute right-6 bottom-4 rounded-xl bg-[#141720]/95 backdrop-blur-md border border-white/10 p-3.5 shadow-2xl flex items-center gap-3 text-xs parallax-layer"
                  style={{ transform: `translate3d(0, ${(parallaxOffset * -0.55).toFixed(1)}px, 0)` }}
                >
                  <div className="relative flex items-center justify-center">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="38" stroke="#1f232b" strokeWidth="12" fill="transparent" />
                      {/* Orange arc */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="#FF5722"
                        strokeWidth="12"
                        strokeDasharray="238.7"
                        strokeDashoffset="70"
                        fill="transparent"
                      />
                      {/* Green arc */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="#10b981"
                        strokeWidth="12"
                        strokeDasharray="238.7"
                        strokeDashoffset="180"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-[10px] font-bold text-white font-mono block leading-none">1,999</span>
                      <span className="text-[7px] text-slate-400 font-mono">findings</span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="font-semibold text-white text-[11px]">Severity distribution</div>
                    <div className="text-[10px] text-slate-400">AI Deep Scan &amp; Dependencies</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inactive Column Peeking Label */}
            {activeTab !== 3 && (
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center pointer-events-none">
                <span className="rotate-90 text-[11px] font-mono uppercase tracking-widest text-slate-400 whitespace-nowrap">
                  04 Secure
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;