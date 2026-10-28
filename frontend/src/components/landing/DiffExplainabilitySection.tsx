import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Layers, FileCode, CheckCircle2, GitPullRequest, ShieldAlert, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DiffExplainabilitySection: React.FC = () => {
  const [activeStack, setActiveStack] = useState(1);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const isManualLockRef = useRef<boolean>(false);
  const lockTimeoutRef = useRef<number | null>(null);

  const selectStack = (id: number) => {
    isManualLockRef.current = true;
    if (lockTimeoutRef.current) window.clearTimeout(lockTimeoutRef.current);
    lockTimeoutRef.current = window.setTimeout(() => {
      isManualLockRef.current = false;
    }, 2000);
    setActiveStack(id);
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
          setActiveStack((prev) => (prev !== idx ? idx : prev));
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const stacks = [
    {
      id: 0,
      title: '01 Setup organization workspace schemas',
      files: '4 files',
      risks: '0 risks',
      reviews: '2 reviews',
      status: 'Clean',
      filePath: 'src/db/schema/workspaceInvitations.ts',
      blastRadius: 'Blast radius: 1 schema migration',
      summary: 'Semantic diff parsed: foreign key cascade verified',
      locSimplified: '412 LOC structured',
    },
    {
      id: 1,
      title: '02 Add the invitation API and emails',
      files: '3 files',
      risks: '1 risk',
      reviews: '1 review',
      status: 'Flagged',
      filePath: 'src/services/tenantInvitation.ts',
      blastRadius: 'Blast radius: 3 downstream modules',
      summary: 'Semantic diff parsed: authorization gate restored',
      locSimplified: '1,024 LOC simplified',
    },
    {
      id: 2,
      title: '03 Update tenant middleware & policies',
      files: '2 files',
      risks: '0 risks',
      reviews: '1 review',
      status: 'Clean',
      filePath: 'src/middleware/tenantBoundary.ts',
      blastRadius: 'Blast radius: 5 route handlers',
      summary: 'Semantic diff parsed: zero cross-tenant leakage',
      locSimplified: '318 LOC verified',
    },
  ];

  const currentStack = stacks[activeStack] || stacks[1];

  return (
    <section
      ref={sectionRef}
      className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 py-20 text-left border-t border-white/[0.06]"
    >
      {/* Section Header */}
      <div className="max-w-3xl mb-14 scroll-reveal">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
          Code explainability for massive diffs.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
          Git platforms make massive diffs confusing. SilentGuard Change Stack helps you understand a thousand-line diff in minutes.
        </p>
      </div>

      {/* Two-Column Split Layout with Sticky Left Product Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left Column: Sticky Layered Diff & Change Stack Card */}
        <div className="lg:col-span-7 lg:sticky lg:top-28 scroll-reveal-left">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0e1013] p-4 sm:p-6 shadow-2xl space-y-4 overflow-hidden relative">
            {/* PR Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.08] text-xs">
              <div className="flex items-center gap-2">
                <GitPullRequest className="h-4 w-4 text-[#FF5722]" />
                <span className="font-semibold text-white">PR #1204</span>
                <span className="text-slate-400">· Add tenant workspace invitations</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-emerald-500/15 text-emerald-400 px-2 py-0.5 text-[11px] font-medium font-mono">
                  +1,248 / -312 lines
                </span>
              </div>
            </div>

            {/* Change Stack Navigation Pill Selector */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3 w-3 text-[#FF5722]" />
                  <span>Change Stack Breakdown</span>
                </span>
                <span className="text-[10px] text-[#FF5722]">Layer {activeStack + 1} of 3</span>
              </div>

              <div className="space-y-1.5">
                {stacks.map((stack) => (
                  <button
                    key={stack.id}
                    onClick={() => selectStack(stack.id)}
                    onMouseEnter={() => selectStack(stack.id)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all duration-300 flex items-center justify-between text-xs cursor-pointer ${
                      activeStack === stack.id
                        ? 'bg-[#181b22] border-[#FF5722]/50 text-white shadow-md translate-x-1'
                        : 'bg-[#121418] border-white/[0.04] text-slate-400 hover:text-slate-200 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          stack.risks === '0 risks' ? 'bg-emerald-400' : 'bg-[#FF5722]'
                        }`}
                      />
                      <span className="font-medium text-slate-200">{stack.title}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      <span className="text-slate-500">{stack.files}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded ${
                          stack.risks === '0 risks'
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {stack.risks}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Code Diff Snapshot Viewer (Synchronized with Active Stack) */}
            <div className="rounded-xl bg-[#0a0b0d] border border-white/[0.06] p-3.5 font-mono text-xs overflow-hidden transition-all duration-300">
              <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 mb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <FileCode className="h-3.5 w-3.5 text-[#FF5722]" />
                  <span>{currentStack.filePath}</span>
                </div>
                <span className="text-[10px] text-slate-500">{currentStack.blastRadius}</span>
              </div>

              <div className="space-y-1 text-[11px] leading-relaxed">
                <div className="text-slate-500">42  export async function inviteWorkspaceMember(input: InvitePayload) &#123;</div>
                <div className="text-slate-500">43    const tenant = await findTenant(input.orgId);</div>
                <div className="bg-red-500/10 text-red-300 px-2 py-0.5 rounded -mx-1 flex items-center justify-between">
                  <span>-   if (!tenant) throw new Error(&quot;Organization not found&quot;);</span>
                  <span className="text-[9px] uppercase tracking-wider text-red-400 font-sans font-semibold">Unchecked Role</span>
                </div>
                <div className="bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded -mx-1">
                  <span>+   if (!tenant || !canManageInvitations(input.actorId, tenant.id)) &#123;</span>
                </div>
                <div className="bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded -mx-1">
                  <span>+     throw new ForbiddenError(&quot;Insufficient tenant permissions&quot;);</span>
                </div>
                <div className="bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded -mx-1">
                  <span>+   &#125;</span>
                </div>
                <div className="text-slate-500">48    return await queueInvitationDispatch(tenant.id, input.email);</div>
              </div>
            </div>

            {/* Bottom floating Context Badge */}
            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{currentStack.summary}</span>
              </div>
              <span className="text-slate-500 font-mono">{currentStack.locSimplified}</span>
            </div>
          </div>
        </div>

        {/* Right Column: 3 Synchronized Feature Bullets */}
        <div className="lg:col-span-5 space-y-6 scroll-reveal-right">
          <div
            onMouseEnter={() => selectStack(0)}
            onClick={() => selectStack(0)}
            className={`p-5 rounded-xl border transition-all duration-300 cursor-pointer ${
              activeStack === 0
                ? 'bg-white/[0.03] border-[#FF5722]/40 shadow-lg'
                : 'bg-transparent border-white/[0.05] hover:border-white/15'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Cpu className="h-4 w-4 text-[#FF5722]" />
              <h3 className="text-lg font-bold text-white tracking-tight">PR interface for agentic code</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              When AI coding assistants generate 1,000+ line PRs in seconds, traditional file-by-file review breaks down. Change Stack groups related commits into coherent architectural narratives.
            </p>
          </div>

          <div
            onMouseEnter={() => selectStack(1)}
            onClick={() => selectStack(1)}
            className={`p-5 rounded-xl border transition-all duration-300 cursor-pointer ${
              activeStack === 1
                ? 'bg-white/[0.03] border-[#FF5722]/40 shadow-lg'
                : 'bg-transparent border-white/[0.05] hover:border-white/15'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldAlert className="h-4 w-4 text-[#FF5722]" />
              <h3 className="text-lg font-bold text-white tracking-tight">Approve with context, not guesswork</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Understand the developer’s high-level intent, see affected API contracts, and inspect downstream blast radiuses before signing off on massive merges.
            </p>
          </div>

          <div
            onMouseEnter={() => selectStack(2)}
            onClick={() => selectStack(2)}
            className={`p-5 rounded-xl border transition-all duration-300 cursor-pointer ${
              activeStack === 2
                ? 'bg-white/[0.03] border-[#FF5722]/40 shadow-lg'
                : 'bg-transparent border-white/[0.05] hover:border-white/15'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Layers className="h-4 w-4 text-[#FF5722]" />
              <h3 className="text-lg font-bold text-white tracking-tight">Close the explainability gap</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-3">
              Give your team the tools they need to safely adopt coding agents without losing human oversight:
            </p>
            <ul className="space-y-2 text-xs text-slate-300 pl-1 font-mono">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF5722]" />
                <span>Semantic diffs focused on architectural intent</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF5722]" />
                <span>Blast radius context across microservices</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF5722]" />
                <span>Automated PR change sequence diagram</span>
              </li>
            </ul>
          </div>

          <div className="pt-2 pl-1">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF5722] hover:text-[#ff7a50] transition-colors"
            >
              <span>Explore Change Stack in live workspace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiffExplainabilitySection;
