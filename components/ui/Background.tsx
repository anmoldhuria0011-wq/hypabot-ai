'use client';

import React from 'react';

export function Background() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
      {/* Base matte black */}
      <div className="absolute inset-0 bg-[#050505]" />

      {/* Faint blue ambient — top center */}
      <div
        className="absolute"
        style={{
          top: '-10%',
          left: '30%',
          width: '40%',
          height: '50%',
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.04) 0%, transparent 70%)',
        }}
      />

      {/* Very subtle grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 30%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 30%, black 30%, transparent 100%)',
        }}
      />

      {/* Depth vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 120% 100% at 50% 50%, transparent 40%, rgba(5,5,5,0.7) 100%)',
        }}
      />
    </div>
  );
}
