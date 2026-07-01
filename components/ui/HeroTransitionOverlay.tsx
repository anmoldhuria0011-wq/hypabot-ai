'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { heroScrollIntensity } from '@/sections/HeroSection';

interface LeakParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface EnergyStream {
  // A particle travelling along a curved path from orb outward
  angle: number;
  radius: number;
  speed: number;
  life: number;
  maxLife: number;
  size: number;
  trail: Array<{ x: number; y: number }>;
}

// Module-level scroll progress (written by ScrollTrigger callback, read by rAF loop)
let _scrollProgress = 0;

export function HeroTransitionOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const leakParticlesRef = useRef<LeakParticle[]>([]);
  const energyStreamsRef = useRef<EnergyStream[]>([]);
  const lastLeakRef = useRef<number>(0);
  const lastStreamRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = Date.now();
    const elapsed = (now - startTimeRef.current) / 1000;
    const sp = _scrollProgress;

    heroScrollIntensity.current = sp;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    ctx.clearRect(0, 0, W, H);

    // Once hero is fully scrolled past and all particles have expired, stop drawing
    if (sp >= 1.0) {
      energyStreamsRef.current = energyStreamsRef.current.filter(s => s.life < s.maxLife);
      leakParticlesRef.current = leakParticlesRef.current.filter(p => p.life < p.maxLife);
      if (energyStreamsRef.current.length === 0 && leakParticlesRef.current.length === 0) {
        // Nothing left to draw — idle until sp changes
        animRef.current = requestAnimationFrame(draw);
        return;
      }
    }

    if (sp < 0.05) {
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    // Orb center position (right column, ~67% across)
    const orbX = cx * 1.35;
    const orbY = cy;
    const orbR = Math.min(W, H) * 0.22; // approximate visual radius

    // ── Ambient glow (only during hero transition) ────────────────────────
    if (sp > 0.05 && sp < 1.0) {
      const glowAlpha = Math.min((sp - 0.05) / 0.6, 1) * 0.10;
      const ag = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, orbR * 3.5);
      ag.addColorStop(0, `rgba(59,130,246,${glowAlpha})`);
      ag.addColorStop(0.5, `rgba(37,99,235,${glowAlpha * 0.3})`);
      ag.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(orbX, orbY, orbR * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = ag;
      ctx.fill();
    }

    // ── Energy streams: only spawn during hero transition (sp 0.2–0.95) ──
    if (sp > 0.2 && sp < 0.95) {
      const streamIntensity = Math.min((sp - 0.2) / 0.6, 1);
      const streamInterval = Math.max(80, 280 - streamIntensity * 200);
      if (now - lastStreamRef.current > streamInterval) {
        lastStreamRef.current = now;
        const count = Math.floor(1 + streamIntensity * 2);
        for (let i = 0; i < count; i++) {
          energyStreamsRef.current.push({
            angle: Math.random() * Math.PI * 2,
            radius: orbR * 0.6,
            speed: 1.2 + Math.random() * 1.8 + streamIntensity * 1.5,
            life: 0,
            maxLife: 55 + Math.random() * 45,
            size: 0.8 + Math.random() * 1.4,
            trail: [],
          });
        }
      }
    }

    energyStreamsRef.current = energyStreamsRef.current.filter(s => s.life < s.maxLife);
    energyStreamsRef.current.forEach(s => {
      s.life++;
      s.radius += s.speed;
      // Slight angular drift for organic feel
      s.angle += 0.008 * (s.life % 2 === 0 ? 1 : -1);

      const px = orbX + Math.cos(s.angle) * s.radius;
      const py = orbY + Math.sin(s.angle) * s.radius * 0.75; // elliptical spread

      s.trail.push({ x: px, y: py });
      if (s.trail.length > 8) s.trail.shift();

      const t = s.life / s.maxLife;
      const alpha = Math.sin(t * Math.PI) * 0.65 * Math.min((sp - 0.15) / 0.2, 1);
      if (alpha < 0.01) return;

      // Draw trail
      if (s.trail.length > 1) {
        for (let i = 1; i < s.trail.length; i++) {
          const ta = alpha * (i / s.trail.length) * 0.4;
          ctx.beginPath();
          ctx.moveTo(s.trail[i - 1].x, s.trail[i - 1].y);
          ctx.lineTo(s.trail[i].x, s.trail[i].y);
          ctx.strokeStyle = `rgba(96,165,250,${ta})`;
          ctx.lineWidth = s.size * 0.5;
          ctx.stroke();
        }
      }

      // Head glow
      const hg = ctx.createRadialGradient(px, py, 0, px, py, s.size * 4);
      hg.addColorStop(0, `rgba(147,197,253,${alpha * 0.5})`);
      hg.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(px, py, s.size * 4, 0, Math.PI * 2);
      ctx.fillStyle = hg;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,225,255,${alpha})`;
      ctx.fill();
    });

    // ── Leak particles: burst outward when intensity is high (0.4–0.85) ────
    if (sp > 0.4 && sp < 0.88) {
      const leakIntensity = Math.min((sp - 0.4) / 0.4, 1);
      const leakInterval = Math.max(40, 130 - leakIntensity * 90);
      if (now - lastLeakRef.current > leakInterval) {
        lastLeakRef.current = now;
        const count = Math.floor(1 + leakIntensity * 2);
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spawnR = orbR * (0.5 + Math.random() * 0.5);
          leakParticlesRef.current.push({
            x: orbX + Math.cos(angle) * spawnR,
            y: orbY + Math.sin(angle) * spawnR * 0.7,
            vx: Math.cos(angle) * (0.4 + Math.random() * 1.2 + leakIntensity * 0.8),
            vy: Math.sin(angle) * (0.4 + Math.random() * 1.2 + leakIntensity * 0.8) * 0.7,
            life: 0,
            maxLife: 70 + Math.random() * 50,
            size: 0.8 + Math.random() * 1.5,
            color: Math.random() > 0.5 ? '147,197,253' : '96,165,250',
          });
        }
      }
    }

    leakParticlesRef.current = leakParticlesRef.current.filter(p => p.life < p.maxLife);
    leakParticlesRef.current.forEach(p => {
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.97;
      p.vy *= 0.97;
      const t = p.life / p.maxLife;
      const alpha = Math.sin(t * Math.PI) * 0.6 * Math.min((sp - 0.35) / 0.25, 1);
      if (alpha < 0.01) return;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${alpha})`;
      ctx.fill();
      // trail
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
      ctx.strokeStyle = `rgba(${p.color},${alpha * 0.25})`;
      ctx.lineWidth = p.size * 0.4;
      ctx.stroke();
    });

    // ── Final passage (0.8–1.0): energy converges downward, no flash ───────
    if (sp > 0.8) {
      const fp = (sp - 0.8) / 0.2; // 0 → 1

      // Soft directional bloom pulling energy downward — dark, NO white flash
      const sweepAlpha = Math.sin(fp * Math.PI) * 0.06;
      const sweepGrad = ctx.createLinearGradient(0, cy, 0, H);
      sweepGrad.addColorStop(0, `rgba(37,99,235,0)`);
      sweepGrad.addColorStop(0.5, `rgba(37,99,235,${sweepAlpha})`);
      sweepGrad.addColorStop(1, `rgba(5,5,5,0)`);
      ctx.fillStyle = sweepGrad;
      ctx.fillRect(0, cy, W, H - cy);

      // Thin arc streaks travelling downward from orb — like energy descending
      const streakCount = 18;
      for (let i = 0; i < streakCount; i++) {
        const angle = (i / streakCount) * Math.PI + Math.PI * 0.25 + elapsed * 0.15;
        const startR = orbR * (0.8 + fp * 0.4);
        const endR = orbR * (1.1 + fp * 1.8);
        const sx = orbX + Math.cos(angle) * startR;
        const sy = orbY + Math.sin(angle) * startR;
        const ex = orbX + Math.cos(angle) * endR;
        const ey = orbY + Math.sin(angle) * endR;
        const sa = Math.sin(fp * Math.PI) * 0.18 * (0.4 + 0.6 * Math.sin(i * 1.7));
        if (sa < 0.01) continue;
        const sg = ctx.createLinearGradient(sx, sy, ex, ey);
        sg.addColorStop(0, `rgba(96,165,250,${sa})`);
        sg.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = sg;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }

    animRef.current = requestAnimationFrame(draw);
  }, []);

  // GSAP ScrollTrigger
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    const init = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);
      const heroEl = document.querySelector('[data-hero-section]');
      if (!heroEl) return;
      const st = ScrollTrigger.create({
        trigger: heroEl,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
        onUpdate: (self) => { _scrollProgress = self.progress; },
      });
      cleanup = () => st.kill();
    };
    init();
    return () => {
      cleanup?.();
      _scrollProgress = 0;
      heroScrollIntensity.current = 0;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    animRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 20 }}
      aria-hidden
    />
  );
}
