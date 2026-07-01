'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useScrollY } from '@/hooks/useScrollProgress';
import { Button } from '@/components/ui/Button';

const navLinks = [
  { label: 'Solutions', href: '#ai-employees' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
];

export function Navigation() {
  const scrollY = useScrollY();
  const isScrolled = scrollY > 20;

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: isScrolled ? 'rgba(5, 5, 5, 0.85)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(16px)' : 'none',
        borderBottom: isScrolled ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
        transition: 'background 0.5s ease, backdrop-filter 0.5s ease, border-color 0.5s ease',
      }}
    >
      <nav className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16" aria-label="Main navigation">
        {/* Logo — HYPA BOT */}
        <a href="/" className="flex items-center gap-2.5 group">
          {/* Logo mark: concentric rings with energy dot */}
          <div className="relative w-8 h-8 flex-shrink-0">
            {/* Outer faint ring */}
            <div
              className="absolute inset-0 rounded-full border border-[rgba(59,130,246,0.25)] group-hover:border-[rgba(59,130,246,0.5)] transition-all duration-400"
              style={{ transition: 'border-color 0.4s ease' }}
            />
            {/* Mid ring */}
            <div className="absolute inset-[4px] rounded-full border border-[rgba(59,130,246,0.45)]" />
            {/* Inner filled ring */}
            <div className="absolute inset-[8px] rounded-full bg-[rgba(59,130,246,0.15)]" />
            {/* Core dot */}
            <div className="absolute inset-[11px] rounded-full bg-[#3b82f6] shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
            {/* Ambient glow on hover */}
            <div
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-400"
              style={{
                background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
                transition: 'opacity 0.4s ease',
              }}
            />
          </div>

          {/* Wordmark */}
          <div className="flex items-baseline gap-0">
            <span
              className="text-[15px] tracking-[0.08em] text-[#f0f0f0]"
              style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.06em' }}
            >
              HYPA
            </span>
            <span
              className="text-[15px] tracking-[0.08em] text-[#3b82f6]"
              style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.06em' }}
            >
              &nbsp;BOT
            </span>
          </div>
        </a>

        {/* Center Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-4 py-2 text-[13px] font-medium tracking-wide text-[#9ca3af] hover:text-[#f0f0f0] transition-colors duration-200 rounded-lg hover:bg-white/[0.03]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <a href="#book-call">
            <Button variant="primary" size="sm">
              Book a Call
            </Button>
          </a>
        </div>
      </nav>
    </motion.header>
  );
}
