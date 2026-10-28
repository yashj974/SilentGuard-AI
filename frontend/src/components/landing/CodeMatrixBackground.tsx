import React from 'react';

export const CodeMatrixBackground: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0c0d0e]">
      {/* 
        CodeRabbit Matte Charcoal Base with Parallax Depth:
        Subtle multi-layered grid that shifts gently with scroll depth (--scroll-y).
      */}
      <div
        className="absolute inset-[-15%] opacity-[0.04] transition-transform duration-150 ease-out"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.7) 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          transform: 'translate3d(0, calc(var(--scroll-y, 0) * -0.06px), 0)',
        }}
      />

      {/* Secondary Deeper Technical Grid Layer (Slower Parallax) */}
      <div
        className="absolute inset-[-15%] opacity-[0.02] transition-transform duration-150 ease-out"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.35) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.35) 1px, transparent 1px)`,
          backgroundSize: '112px 112px',
          transform: 'translate3d(0, calc(var(--scroll-y, 0) * -0.025px), 0)',
        }}
      />

      {/* Restrained Ambient Orange Horizon Glow that drifts with scroll */}
      <div
        className="absolute left-1/2 -top-48 h-[520px] w-[960px] -translate-x-1/2 rounded-full bg-[#FF5722]/[0.035] blur-[130px] transition-transform duration-300 ease-out"
        style={{
          transform: 'translate3d(0, calc(var(--scroll-y, 0) * 0.08px), 0)',
        }}
      />
    </div>
  );
};

export default CodeMatrixBackground;
