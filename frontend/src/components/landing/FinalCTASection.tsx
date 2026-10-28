import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const FinalCTASection: React.FC = () => {
  return (
    <section className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 py-24 text-center border-t border-white/[0.06]">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-xs font-mono font-bold tracking-wider text-[#FF5722] uppercase">
          READY FOR AI-ASSISTED ENGINEERING AT SCALE
        </div>

        <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.08]">
          Ship faster. Ship with zero silent debt.
        </h2>

        <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
          Install the SilentGuard AI GitHub app in under two minutes. Start seeing silent debt, fragile changes, and trust boundary findings today.
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-white hover:bg-slate-100 px-7 py-3.5 text-sm font-semibold text-black transition-all shadow-md active:scale-[0.98]"
          >
            <span>Get a free trial</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            to="/book-demo"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 px-7 py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98]"
          >
            <span>Book a Demo</span>
          </Link>
        </div>

        <div className="pt-4 text-xs font-mono text-slate-400">
          Zero setup overhead · Works with GitHub, GitLab & Bitbucket · Open source friendly
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
