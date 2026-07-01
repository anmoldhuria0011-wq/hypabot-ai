'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AICore } from '@/components/ui/AICore';

// Shared ref — written by HeroTransitionOverlay, read by AICore canvas loop
// Exported so the overlay can import it
export const heroScrollIntensity = { current: 0 };

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.11,
      delayChildren: 0.35,
    },
  },
};

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-8 lg:gap-4 items-center min-h-[calc(100vh-4rem)]">

          {/* ── LEFT: Content ── */}
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="flex flex-col justify-center order-2 lg:order-1 lg:pr-8"
          >
            {/* Eyebrow badge */}
            <motion.div variants={fadeUp} className="mb-8">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(59,130,246,0.25)] bg-[rgba(59,130,246,0.05)] text-[11px] font-medium tracking-[0.14em] uppercase text-[#93c5fd]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
                AI Workforce Platform
              </span>
            </motion.div>

            {/* ── Headline ── */}
            <motion.h1
              variants={fadeUp}
              className="mb-8"
              style={{ fontFamily: 'Syne, sans-serif', lineHeight: 1.12 }}
            >
              {/* Line 1 */}
              <span
                className="block text-[1.75rem] sm:text-[2.1rem] lg:text-[2.35rem] xl:text-[2.6rem] text-[#9ca3af]"
                style={{ fontWeight: 400, letterSpacing: '0.005em' }}
              >
                Your Business Deserves
              </span>
              {/* Line 2 — the centrepiece */}
              <span
                className="block text-[3rem] sm:text-[3.6rem] lg:text-[4.1rem] xl:text-[4.8rem] leading-[1.0] my-1"
                style={{
                  background: 'linear-gradient(135deg, #e0eeff 0%, #93c5fd 35%, #60a5fa 60%, #bfdbfe 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 600,
                  letterSpacing: '-0.035em',
                }}
              >
                AI Employees
              </span>
              {/* Line 3 */}
              <span
                className="block text-[1.75rem] sm:text-[2.1rem] lg:text-[2.35rem] xl:text-[2.6rem] text-[#9ca3af]"
                style={{ fontWeight: 400, letterSpacing: '0.005em' }}
              >
                That Never Sleep.
              </span>
            </motion.h1>

            {/* Body */}
            <motion.p
              variants={fadeUp}
              className="text-[0.975rem] leading-[1.8] text-[#6b7280] max-w-[420px] mb-10 font-normal"
            >
              We build intelligent AI employees that answer customers, qualify leads,
              automate operations, and work around the clock—so your business keeps
              growing even when your team is offline.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
              <a href="#book-call">
                <Button variant="primary" size="lg" className="group">
                  Book Strategy Call
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Button>
              </a>
              <a href="#demo">
                <Button variant="secondary" size="lg" className="group">
                  <Play className="w-3.5 h-3.5 fill-current opacity-70" />
                  See AI Employees in Action
                </Button>
              </a>
            </motion.div>

            {/* Social proof */}
            <motion.div
              variants={fadeUp}
              className="mt-10 flex items-center gap-5"
            >
              <div className="flex -space-x-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border border-[rgba(255,255,255,0.08)] bg-gradient-to-br from-[#1e3a5f] to-[#0f1f3d] flex items-center justify-center text-[9px] font-medium text-[#93c5fd]"
                  >
                    {['JM', 'AR', 'KL', 'SP'][i]}
                  </div>
                ))}
              </div>
              <p className="text-[12px] text-[#4b5563]">
                <span className="text-[#6b7280] font-medium">200+ businesses</span>
                {' '}already running AI employees
              </p>
            </motion.div>
          </motion.div>

          {/* ── RIGHT: AI Core — dominant, overflowing ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="relative flex items-center justify-center order-1 lg:order-2"
          >
            {/* Background bloom that bleeds into the page */}
            <div
              className="absolute pointer-events-none"
              style={{
                inset: '-30%',
                background: 'radial-gradient(ellipse 55% 55% at 50% 50%, rgba(59,130,246,0.07) 0%, rgba(37,99,235,0.03) 50%, transparent 75%)',
              }}
            />

            {/* Canvas container — oversized for impact */}
            <div
              className="relative w-full"
              style={{
                aspectRatio: '1',
                maxWidth: '680px',
                maxHeight: '680px',
              }}
            >
              <AICore className="w-full h-full" scrollIntensity={heroScrollIntensity} />
            </div>
          </motion.div>

        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.8, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[9px] tracking-[0.2em] uppercase text-[#374151]">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-[#374151] to-transparent" />
      </motion.div>
    </section>
  );
}
