'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface SceneIntroProps {
  headline: string;
  body: string;
  // active is kept for pinned sections that need manual control
  // If omitted, component uses its own inView detection
  active?: boolean;
  centered?: boolean;
  className?: string;
  scene?: string; // unused, kept for compatibility
}

export function SceneIntro({
  headline,
  body,
  active,
  centered = true,
  className = '',
}: SceneIntroProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Self-detecting inView — once:true so it stays visible after scroll
  const selfInView = useInView(ref, { once: true, margin: '-5% 0px' });
  // If parent passes active, use it; otherwise use self-detection
  const isVisible = active !== undefined ? active : selfInView;

  const align = centered ? 'items-center text-center' : 'items-start text-left';
  const maxW = centered ? 'max-w-2xl mx-auto' : 'max-w-xl';

  return (
    <div ref={ref} className={`flex flex-col ${align} gap-4 ${className}`}>
      {/* Headline */}
      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className={`text-[1.75rem] sm:text-[2.1rem] lg:text-[2.4rem] font-bold text-[#f0f0f0] leading-[1.12] ${maxW}`}
        style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.025em' }}
      >
        {headline}
      </motion.h2>

      {/* Body */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.15 }}
        className={`text-[0.9rem] text-[#6b7280] leading-[1.75] ${maxW}`}
      >
        {body}
      </motion.p>
    </div>
  );
}
