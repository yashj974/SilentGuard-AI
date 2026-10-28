import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

type EngineTab = 'codegraph' | 'adaptive' | 'business' | 'review' | 'ensemble';

const TAB_ORDER: EngineTab[] = ['ensemble', 'codegraph', 'adaptive', 'business', 'review'];

export const ContextEngineSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<EngineTab>('ensemble');
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const isManualLockRef = useRef<boolean>(false);
  const lockTimeoutRef = useRef<number | null>(null);

  const selectTab = (tab: EngineTab) => {
    isManualLockRef.current = true;
    if (lockTimeoutRef.current) window.clearTimeout(lockTimeoutRef.current);
    lockTimeoutRef.current = window.setTimeout(() => {
      isManualLockRef.current = false;
    }, 2200);
    setActiveTab(tab);
  };

  useEffect(() => {
    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        const track = trackRef.current;
        if (!track) return;

        const rect = track.getBoundingClientRect();
        const scrollable = Math.max(1, rect.height - window.innerHeight * 0.7);
        const current = -rect.top + window.innerHeight * 0.2;
        const progress = Math.min(1, Math.max(0, current / scrollable));
        setScrollProgress(progress);

        if (
          !isManualLockRef.current &&
          rect.top < window.innerHeight * 0.25 &&
          rect.bottom > window.innerHeight * 0.45
        ) {
          const idx = Math.min(TAB_ORDER.length - 1, Math.floor(progress * TAB_ORDER.length));
          const nextTab = TAB_ORDER[idx];
          setActiveTab((prev) => (prev !== nextTab ? nextTab : prev));
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

  const menuItems: { id: EngineTab; title: string; subtitle?: string }[] = [
    {
      id: 'codegraph',
      title: 'Codegraph',
      subtitle: 'Deterministic AST dependency mapping across all microservices.',
    },
    {
      id: 'adaptive',
      title: 'Adaptive systems',
      subtitle: 'Evolves with team PR patterns, .cursorrules, and repo guidelines.',
    },
    {
      id: 'business',
      title: 'Business context',
      subtitle: 'Links Jira, Linear tickets, and PRDs to verify feature intent.',
    },
    {
      id: 'review',
      title: 'Review generation',
      subtitle: 'Multi-pass synthesis producing high-signal, zero-noise findings.',
    },
    {
      id: 'ensemble',
      title: 'Ensemble of models & tools',
      subtitle: 'Brings together multiple specialized models, static analyzers, and test harnesses.',
    },
  ];

  const previewData: Record<
    EngineTab,
    {
      file: string;
      badge: string;
      severity: string;
      effort: string;
      headline: string;
      detail: string;
      activeModel: string;
      activeTool: string;
    }
  > = {
    ensemble: {
      file: 'streamController.ts',
      badge: '+8 | 135-142',
      severity: 'Critical',
      effort: 'Heavy lift',
      headline: 'stop() does not actually execute the abort stream request.',
      detail:
        'The method initializes payload arguments but drops execution before dispatching to the transport client, leaving background workers running unbounded.',
      activeModel: 'Claude Sonnet 5 · effort: high',
      activeTool: 'SAST & AST Linters',
    },
    codegraph: {
      file: 'src/services/authGateway.ts',
      badge: '+14 | 82-96',
      severity: 'High',
      effort: '3 downstream svcs',
      headline: 'Signature change breaks billing-worker token consumer.',
      detail:
        'Codegraph traced 48,912 AST nodes and detected that removing `tenantScope` from `SessionClaims` breaks downstream consumer in `billing-worker/verify.ts`.',
      activeModel: 'GPT-5.1 · effort: medium',
      activeTool: 'AST Dependency Graph (48.9k nodes)',
    },
    adaptive: {
      file: 'src/cache/projectStore.ts',
      badge: '+6 | 44-50',
      severity: 'Medium',
      effort: '.cursorrules rule',
      headline: 'Missing explicit Redis TTL violates team caching guideline.',
      detail:
        'Adapted from `.cursorrules` and 14 prior team reviews: all tenant cache mutations must bind a deterministic TTL (`EX 3600`) within the pipeline.',
      activeModel: 'Claude Opus 5 · effort: medium',
      activeTool: 'Team Memory Vector Store',
    },
    business: {
      file: 'src/invites/quotaGuard.ts',
      badge: '+11 | 19-30',
      severity: 'Major',
      effort: 'Spec LIN-482',
      headline: 'Invite limit check omits seat cap specified in Linear ticket LIN-482.',
      detail:
        'Linked specification LIN-482 ("Workspace Invite Quota") requires enforcing a maximum of 10 pending invites for Starter tier organizations.',
      activeModel: 'Gemini 3.5 Flash · thinking: high',
      activeTool: 'Jira & Linear Spec Validator',
    },
    review: {
      file: 'src/db/transactionRunner.ts',
      badge: '+5 | 112-117',
      severity: 'Critical',
      effort: '0.02% noise ratio',
      headline: 'Unawaited rollback leaves connection pool locked on timeout.',
      detail:
        'Distilled from 64 candidate signals down to 1 actionable defect verified in sandboxed test execution with a 1-click committable patch.',
      activeModel: 'Grok 4.5 · reasoning',
      activeTool: 'Sandbox Verification Harness',
    },
  };

  const currentPreview = previewData[activeTab];
  const parallaxY = (scrollProgress - 0.5) * -16;

  return (
    <section className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 py-20 text-left border-t border-white/[0.06]">
      {/* Section Header */}
      <div className="max-w-3xl mb-12 scroll-reveal">
        <div className="text-xs font-mono font-bold tracking-wider text-[#FF5722] uppercase mb-3">
          CONTEXT ENGINEERING ARCHITECTURE
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
          Beyond single-prompt LLM wrappers.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
          SilentGuard AI orchestrates a multi-layered reasoning pipeline combining deterministic code graphs, adaptive team memory, and specialized reasoning models.
        </p>
      </div>

      {/* Sticky Scroll-Driven Track */}
      <div ref={trackRef} className="relative lg:min-h-[155vh]">
        <div className="lg:sticky lg:top-24">
          {/* Main Console Box (Matching CodeRabbit Screenshot 2) */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#090b0e] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[540px] scroll-reveal-scale">
            {/* ===================================================================== */}
            {/* LEFT COLUMN: VERTICAL TABS SELECTOR WITH SCROLL PROGRESS              */}
            {/* ===================================================================== */}
            <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-white/[0.08] p-5 sm:p-6 flex flex-col justify-between bg-[#08090c]">
              <div className="space-y-3">
                {menuItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => selectTab(item.id)}
                      onMouseEnter={() => selectTab(item.id)}
                      className={`w-full text-left pl-4 pr-3 py-3 rounded-r-lg border-l-2 transition-all duration-300 cursor-pointer ${
                        isActive
                          ? 'border-[#FF5722] bg-white/[0.04] text-white shadow-sm'
                          : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.01]'
                      }`}
                    >
                      <div className="font-bold text-sm tracking-tight text-white">
                        {item.title}
                      </div>
                      {isActive && item.subtitle && (
                        <p className="mt-1.5 text-xs text-slate-400 font-normal leading-relaxed animate-in fade-in duration-200">
                          {item.subtitle}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-6 border-t border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>SilentGuard Context Engine v4.2</span>
                  <span className="text-[#FF5722]">{Math.round(scrollProgress * 100)}%</span>
                </div>
                <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FF5722] transition-all duration-150"
                    style={{ width: `${Math.max(12, Math.round(scrollProgress * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* ===================================================================== */}
            {/* CENTER & RIGHT: SYNCHRONIZED NEURAL ORB & CODE REVIEW FINDING         */}
            {/* ===================================================================== */}
            <div className="lg:col-span-9 p-6 sm:p-8 flex flex-col justify-center relative overflow-hidden bg-[#0c0e12]">
              {/* Subtle Ambient Radial Lighting */}
              <div
                className="absolute top-1/2 left-1/3 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF5722]/5 rounded-full blur-3xl pointer-events-none parallax-layer"
                style={{ transform: `translate3d(0, ${parallaxY.toFixed(1)}px, 0)` }}
              />

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
                {/* Semi-Circular Radial Sphere + Lists (6 cols) */}
                <div className="md:col-span-6 relative flex items-center min-h-[360px] overflow-visible">
                  {/* SVG Semi-Circular Neural Lens */}
                  <div
                    className="relative w-44 sm:w-56 h-72 sm:h-80 flex-shrink-0 parallax-layer"
                    style={{ transform: `translate3d(0, ${(parallaxY * 0.5).toFixed(1)}px, 0)` }}
                  >
                    <svg className="w-full h-full" viewBox="0 0 200 320" fill="none">
                      <defs>
                        <radialGradient id="orbGlow" cx="0%" cy="50%" r="80%">
                          <stop offset="0%" stopColor="#1e293b" stopOpacity="0.8" />
                          <stop offset="60%" stopColor="#0f172a" stopOpacity="0.6" />
                          <stop offset="100%" stopColor="#08090c" stopOpacity="0.2" />
                        </radialGradient>

                        <filter id="orbOrangeGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {/* Semicircle Backdrop */}
                      <path
                        d="M 20 20 A 140 140 0 0 1 20 300 Z"
                        fill="url(#orbGlow)"
                        stroke="#ffffff"
                        strokeOpacity="0.05"
                      />

                      {/* Inner Mesh Nodes with Synaptic Blinking Motion */}
                      <circle cx="40" cy="80" r="3" fill="#64748b" className="animate-syn-node-1" />
                      <circle cx="80" cy="110" r="3.5" fill="#94a3b8" className="animate-syn-node-2" />
                      <circle cx="50" cy="160" r="4.5" fill="#38bdf8" className="animate-syn-node-3" />
                      <circle cx="100" cy="170" r="3" fill="#64748b" className="animate-syn-node-1" />
                      <circle cx="70" cy="220" r="3.5" fill="#34d399" className="animate-syn-node-2" />
                      <circle cx="30" cy="240" r="3" fill="#64748b" className="animate-syn-node-3" />

                      {/* Mesh Lines */}
                      <line x1="40" y1="80" x2="80" y2="110" stroke="#ffffff" strokeOpacity="0.1" />
                      <line x1="80" y1="110" x2="50" y2="160" stroke="#ffffff" strokeOpacity="0.15" />
                      <line x1="50" y1="160" x2="100" y2="170" stroke="#ffffff" strokeOpacity="0.15" />
                      <line x1="100" y1="170" x2="70" y2="220" stroke="#ffffff" strokeOpacity="0.15" />
                      <line x1="70" y1="220" x2="30" y2="240" stroke="#ffffff" strokeOpacity="0.1" />
                      <line x1="50" y1="160" x2="70" y2="220" stroke="#38bdf8" strokeOpacity="0.4" />

                      {/* Outer Green Dashed Ring with Active Orbital Flow */}
                      <path
                        d="M 20 10 A 150 150 0 0 1 20 310"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="2"
                        className="animate-laser-flow"
                      />

                      {/* Middle Blue Dashed Ring with Fast Counter Flow */}
                      <path
                        d="M 20 18 A 142 142 0 0 1 20 302"
                        fill="none"
                        stroke="#60a5fa"
                        strokeWidth="2"
                        className="animate-laser-flow-fast"
                      />

                      {/* Inner Glowing Electric Orange Ring with Pulsing Glow */}
                      <path
                        d="M 20 28 A 132 132 0 0 1 20 292"
                        fill="none"
                        stroke="#FF5722"
                        strokeWidth="3"
                        filter="url(#orbOrangeGlow)"
                        className="animate-laser-pulse"
                      />

                      {/* Orange Connector Arrow pointing right to review with Laser Flow */}
                      <line
                        x1="152"
                        y1="160"
                        x2="200"
                        y2="160"
                        stroke="#FF5722"
                        strokeWidth="3"
                        filter="url(#orbOrangeGlow)"
                        className="animate-horizontal-beam"
                      />
                      <polygon points="194,155 200,160 194,165" fill="#FF5722" className="animate-pulse" />
                    </svg>
                  </div>

                  {/* Models & Knowledge Base Lists */}
                  <div className="space-y-4 pl-2 font-mono text-xs select-none">
                    {/* Blue Reasoning Models Group */}
                    <div className="space-y-1.5 text-blue-400">
                      {[
                        'GPT-5.1 · effort: medium',
                        'Claude Opus 5 · effort: medium',
                        'Claude Sonnet 5 · effort: high',
                        'Gemini 3.5 Flash · thinking: high',
                        'Grok 4.5 · reasoning',
                      ].map((model) => {
                        const isHighlighted = currentPreview.activeModel === model;
                        return (
                          <div
                            key={model}
                            className={`flex items-center gap-1.5 text-[11px] transition-colors duration-300 ${
                              isHighlighted ? 'font-semibold text-white' : 'text-blue-400/80 hover:text-blue-300'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                                isHighlighted ? 'bg-[#FF5722] shadow-[0_0_8px_#FF5722]' : 'bg-blue-400'
                              }`}
                            />
                            <span>{model}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Green Deterministic Tools Group */}
                    <div className="space-y-1 text-emerald-400/90 pt-2 border-t border-white/[0.06] text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <span>• Knowledge Base</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <span>• CVEs/sec disclosures</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <span>• Validators</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold pt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{currentPreview.activeTool}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Code Snippet & Synchronized Bot Finding Card (6 cols) */}
                <div
                  className="md:col-span-6 space-y-4 parallax-layer"
                  style={{ transform: `translate3d(0, ${(parallaxY * -0.45).toFixed(1)}px, 0)` }}
                >
                  {/* Code Block with Active Line Highlight */}
                  <div className="rounded-xl bg-[#07080a] border border-white/[0.08] p-4 font-mono text-xs space-y-1 text-slate-400 shadow-xl overflow-x-auto transition-all duration-300">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06] text-[11px] text-slate-500">
                      <span className="text-slate-300">{currentPreview.file}</span>
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">
                        {currentPreview.badge}
                      </span>
                    </div>

                    <div>135 <span className="text-purple-400">stop</span>(): <span className="text-blue-400">void</span> &#123;</div>
                    <div>136   <span className="text-purple-400">if</span> (!<span className="text-slate-200">this.clientState.runId</span>) <span className="text-purple-400">return</span></div>
                    <div>137   <span className="text-slate-200">this.openStream</span>(&#123;</div>
                    <div>138     abort: <span className="text-orange-400">true</span>,</div>
                    <div>139     runId: <span className="text-slate-200">this.clientState.runId</span>,</div>
                    <div>140   &#125;)</div>
                    <div className="bg-red-500/10 text-red-300 px-2 py-0.5 rounded -mx-1 flex items-center justify-between">
                      <div>
                        141   <span className="text-slate-200">this.setState</span>(&#123; status: <span className="text-emerald-300">&apos;aborted&apos;</span> &#125;)
                      </div>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                    </div>
                    <div>142 &#125;</div>
                  </div>

                  {/* Bot Finding Card (Synchronized with Active Tab) */}
                  <div
                    key={activeTab}
                    className="rounded-xl bg-[#14161d] border border-white/10 p-4 space-y-2.5 text-xs shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    {/* Bot Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-[#FF5722] flex items-center justify-center text-white font-bold text-xs">
                          SG
                        </div>
                        <span className="font-bold text-white">silentguard-bot</span>
                        <span className="rounded bg-white/10 px-1.5 py-0.2 text-[10px] font-mono text-slate-300">Bot</span>
                        <span className="text-slate-500 text-[11px]">just now · verified</span>
                        <ChevronDown className="h-3 w-3 text-slate-500" />
                      </div>
                    </div>

                    {/* Warning Pill Badges */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium">
                      <span className="flex items-center gap-1 text-amber-300">
                        <span>⚠️ Potential issue</span>
                      </span>
                      <span className="text-slate-600">|</span>
                      <span className="flex items-center gap-1 text-rose-400">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        <span>{currentPreview.severity}</span>
                      </span>
                      <span className="text-slate-600">|</span>
                      <span className="text-slate-300 font-mono">🏋️ {currentPreview.effort}</span>
                    </div>

                    {/* Statement */}
                    <p className="font-bold text-white text-sm leading-snug">
                      {currentPreview.headline}
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {currentPreview.detail}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Link */}
          <div className="mt-8 flex justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF5722] hover:text-[#ff7a50] transition-colors"
            >
              <span>Explore the complete SilentGuard architecture in documentation</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContextEngineSection;
