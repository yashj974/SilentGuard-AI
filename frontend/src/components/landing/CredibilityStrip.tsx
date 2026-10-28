import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export const CredibilityStrip: React.FC = () => {
  const ecosystem = [
    { name: 'GitHub', desc: 'Pull Request Gates' },
    { name: 'GitLab', desc: 'Merge Request Checks' },
    { name: 'Bitbucket', desc: 'Pipeline Validation' },
    { name: 'Claude Code', desc: 'Agentic Review' },
    { name: 'GitHub Copilot', desc: 'Synthesis Scorer' },
    { name: 'Cursor', desc: 'Inline Diagnostics' },
  ];

  return (
    <section className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 py-12">
      <div className="rounded-2xl border border-white/[0.08] bg-[#0e1013] overflow-hidden shadow-xl text-left">
        {/* Top Integration Ecosystem Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-b border-white/[0.08] divide-x divide-y sm:divide-y-0 divide-white/[0.08]">
          {ecosystem.map((item) => (
            <div key={item.name} className="p-4 sm:p-5 flex flex-col justify-center">
              <div className="font-bold text-white text-sm flex items-center justify-between">
                <span>{item.name}</span>
                <ArrowUpRight className="h-3 w-3 text-slate-500" />
              </div>
              <span className="text-[11px] font-mono text-slate-400 mt-1">{item.desc}</span>
            </div>
          ))}
        </div>

        {/* Bottom Split Card matching CodeRabbit reference */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
          {/* Left Stats & Guarantees */}
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="flex flex-wrap items-baseline gap-6 sm:gap-10">
              <div>
                <span className="text-3xl sm:text-4xl font-extrabold text-white">100%</span>
                <span className="block text-xs text-slate-400 mt-1 font-medium">Deterministic AST Analysis</span>
              </div>
              <div className="h-8 w-px bg-white/[0.08] hidden sm:block" />
              <div>
                <span className="text-3xl sm:text-4xl font-extrabold text-white">0</span>
                <span className="block text-xs text-slate-400 mt-1 font-medium">Configuration Overhead</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pt-2">
              <span className="h-2 w-2 rounded-full bg-[#FF5722]" />
              <span>Native verification layer for Copilot, Claude & Cursor pipelines</span>
            </div>
          </div>

          {/* Right Engineering Architecture Perspective */}
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-4 bg-white/[0.01]">
            <div className="text-2xl text-[#FF5722] font-serif select-none leading-none">“</div>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal italic">
              SilentGuard AI is the only automated layer that prevents silent architecture drift when developers merge AI-generated pull requests at 10x velocity.
            </p>
            <div className="text-xs text-slate-400 font-medium">
              <span className="text-white font-semibold">Staff Security Architect</span>, Cloud Platform Infrastructure
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CredibilityStrip;
