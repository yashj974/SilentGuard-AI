import React, { useEffect, useRef, useState } from 'react';
import { CodeMatrixBackground } from '../components/landing/CodeMatrixBackground';
import { Navbar } from '../components/landing/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { FastCodeChaosSection } from '../components/landing/FastCodeChaosSection';
import { CredibilityStrip } from '../components/landing/CredibilityStrip';
import { ContextEngineSection } from '../components/landing/ContextEngineSection';
import { DiffExplainabilitySection } from '../components/landing/DiffExplainabilitySection';
import { ReviewFindingSection } from '../components/landing/ReviewFindingSection';
import { TriageKanbanSection } from '../components/landing/TriageKanbanSection';
import { SecurityPostureSection } from '../components/landing/SecurityPostureSection';
import { ArchitectureSection } from '../components/landing/ArchitectureSection';
import { DocumentationSection } from '../components/landing/DocumentationSection';
import { FinalCTASection } from '../components/landing/FinalCTASection';
import { Footer } from '../components/landing/Footer';
import { SentinelWidget } from '../components/sentinel/SentinelWidget';

export const LandingPage: React.FC = () => {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [scrollPercent, setScrollPercent] = useState<number>(0);

  useEffect(() => {
    // 1. Scroll-triggered reveals across all directional & scale reveal classes
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed', 'opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
    );

    const revealSelectors =
      '.scroll-reveal, .scroll-reveal-scale, .scroll-reveal-left, .scroll-reveal-right';
    const revealElements = document.querySelectorAll(revealSelectors);
    revealElements.forEach((el) => observer.observe(el));

    // 2. Global RAF scroll listener for parallax depth (--scroll-y) & top reading progress bar
    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        const scrollY = window.scrollY || window.pageYOffset;
        if (pageRef.current) {
          pageRef.current.style.setProperty('--scroll-y', `${scrollY.toFixed(1)}`);
        }
        const docHeight = Math.max(
          1,
          document.documentElement.scrollHeight - window.innerHeight
        );
        setScrollPercent(Math.min(100, Math.max(0, (scrollY / docHeight) * 100)));
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={pageRef}
      className="relative min-h-screen bg-[#0c0d0e] text-slate-100 selection:bg-[#FF5722] selection:text-white overflow-x-clip font-sans"
    >
      {/* Top Scroll-Driven Progress Indicator Bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-transparent pointer-events-none">
        <div
          className="h-full bg-[#FF5722] shadow-[0_0_10px_rgba(255,87,34,0.85)] transition-[width] duration-75 ease-out"
          style={{ width: `${scrollPercent.toFixed(1)}%` }}
        />
      </div>

      {/* Matte Charcoal Ambient Background with Multi-Layer Parallax */}
      <CodeMatrixBackground />

      {/* Slim Header Navigation */}
      <Navbar />

      {/* Main Long-Form Story Sections with Sticky Scroll-Driven Previews */}
      <main className="relative z-10 flex flex-col">
        {/* Section A: Hero & Sticky Scroll-Synchronized Product Preview (01 Review | 02 Prioritize | 03 Understand | 04 Secure) */}
        <HeroSection />

        {/* Section B: The Agentic Bottleneck — Fast code. Faster chaos. */}
        <FastCodeChaosSection />

        {/* Section C: Integration & Credibility Strip */}
        <CredibilityStrip />

        {/* Section D: Sticky Context Engineering Engine (Codegraph, Adaptive, Business, Review, Ensemble) */}
        <ContextEngineSection />

        {/* Section E: Code explainability for massive diffs (Sticky Change Stack) */}
        <div id="features">
          <DiffExplainabilitySection />
        </div>

        {/* Section F: Fast Code, Fewer Hidden Risks — Sticky AI Code Review Loop */}
        <ReviewFindingSection />

        {/* Section G: Prioritize Your PR Flood — Sticky Kanban Triage Board */}
        <TriageKanbanSection />

        {/* Section H: AI threats need AI tools — Sticky Security Posture & Vulnerability Trend */}
        <SecurityPostureSection />

        {/* Section I: Architecture & Change Fragility — Sticky Topology Graph */}
        <ArchitectureSection />

        {/* Section J: Developer Resources & CLI Documentation */}
        <div id="resources">
          <DocumentationSection />
        </div>

        {/* Section K: Final Call to Action */}
        <FinalCTASection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating AI Assistant — Sentinel */}
      <SentinelWidget />
    </div>
  );
};

export default LandingPage;
