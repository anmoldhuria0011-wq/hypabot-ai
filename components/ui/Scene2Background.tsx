'use client';

import React, { useRef, useEffect, useCallback } from 'react';

interface NeuralLine {
  x1: number; y1: number;
  x2: number; y2: number;
  vx1: number; vy1: number;
  vx2: number; vy2: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface DriftParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
}

interface EnergyTrail {
  points: Array<{ x: number; y: number }>;
  speed: number;
  progress: number;
  alpha: number;
}

export function Scene2Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(Date.now());
  const neuralLinesRef = useRef<NeuralLine[]>([]);
  const particlesRef = useRef<DriftParticle[]>([]);
  const trailsRef = useRef<EnergyTrail[]>([]);
  const lastLineSpawnRef = useRef<number>(0);
  const lastTrailSpawnRef = useRef<number>(0);

  // Initialize particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width || window.innerWidth;
    const H = canvas.height || 900;

    particlesRef.current = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -0.05 - Math.random() * 0.12,
      size: 0.5 + Math.random() * 1.5,
      alpha: 0.1 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const now = Date.now();
    const elapsed = (now - startRef.current) / 1000;

    ctx.clearRect(0, 0, W, H);

    // ============================================================
    // VOLUMETRIC FOG — soft layered gradients
    // ============================================================
    for (let i = 0; i < 3; i++) {
      const fogX = W * (0.2 + i * 0.3) + Math.sin(elapsed * 0.08 + i) * W * 0.04;
      const fogY = H * (0.3 + i * 0.2) + Math.cos(elapsed * 0.06 + i) * H * 0.03;
      const fogR = W * (0.35 + i * 0.1);
      const fogAlpha = 0.015 + i * 0.008;

      const fg = ctx.createRadialGradient(fogX, fogY, 0, fogX, fogY, fogR);
      fg.addColorStop(0, `rgba(59,130,246,${fogAlpha})`);
      fg.addColorStop(0.5, `rgba(37,99,235,${fogAlpha * 0.4})`);
      fg.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(fogX, fogY, fogR, 0, Math.PI * 2);
      ctx.fillStyle = fg;
      ctx.fill();
    }

    // ============================================================
    // NEURAL LINES — spawn, drift, fade
    // ============================================================
    if (now - lastLineSpawnRef.current > 800) {
      lastLineSpawnRef.current = now;
      const x1 = Math.random() * W;
      const y1 = Math.random() * H;
      const len = 60 + Math.random() * 140;
      const angle = Math.random() * Math.PI * 2;
      neuralLinesRef.current.push({
        x1, y1,
        x2: x1 + Math.cos(angle) * len,
        y2: y1 + Math.sin(angle) * len,
        vx1: (Math.random() - 0.5) * 0.08,
        vy1: -0.04 - Math.random() * 0.06,
        vx2: (Math.random() - 0.5) * 0.08,
        vy2: -0.04 - Math.random() * 0.06,
        alpha: 0.06 + Math.random() * 0.1,
        life: 0,
        maxLife: 240 + Math.random() * 180,
      });
    }

    neuralLinesRef.current = neuralLinesRef.current.filter(l => l.life < l.maxLife);
    neuralLinesRef.current.forEach(l => {
      l.life++;
      l.x1 += l.vx1; l.y1 += l.vy1;
      l.x2 += l.vx2; l.y2 += l.vy2;
      const t = l.life / l.maxLife;
      const alpha = Math.sin(t * Math.PI) * l.alpha;

      const grad = ctx.createLinearGradient(l.x1, l.y1, l.x2, l.y2);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.2, `rgba(59,130,246,${alpha})`);
      grad.addColorStop(0.8, `rgba(96,165,250,${alpha})`);
      grad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Node at each end
      [{ x: l.x1, y: l.y1 }, { x: l.x2, y: l.y2 }].forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147,197,253,${alpha * 1.5})`;
        ctx.fill();
      });
    });

    // ============================================================
    // ENERGY TRAILS — slow-moving bright paths
    // ============================================================
    if (now - lastTrailSpawnRef.current > 2500) {
      lastTrailSpawnRef.current = now;
      // Curved path via control points
      const startX = Math.random() * W;
      const pts: Array<{ x: number; y: number }> = [];
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        pts.push({
          x: startX + Math.sin(t * Math.PI * 1.5 + Math.random() * 0.5) * W * 0.15,
          y: H * 0.05 + t * H * 0.9,
        });
      }
      trailsRef.current.push({ points: pts, speed: 0.003 + Math.random() * 0.004, progress: 0, alpha: 0.12 + Math.random() * 0.1 });
    }

    trailsRef.current = trailsRef.current.filter(tr => tr.progress < 1);
    trailsRef.current.forEach(tr => {
      tr.progress = Math.min(tr.progress + tr.speed, 1);
      const endIdx = Math.floor(tr.progress * tr.points.length);
      if (endIdx < 2) return;
      const fade = Math.sin(tr.progress * Math.PI);

      ctx.beginPath();
      ctx.moveTo(tr.points[0].x, tr.points[0].y);
      for (let i = 1; i < endIdx; i++) {
        ctx.lineTo(tr.points[i].x, tr.points[i].y);
      }
      ctx.strokeStyle = `rgba(96,165,250,${tr.alpha * fade})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Glowing head
      const head = tr.points[endIdx - 1];
      const hg = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 8);
      hg.addColorStop(0, `rgba(147,197,253,${tr.alpha * fade * 1.5})`);
      hg.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(head.x, head.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = hg;
      ctx.fill();
    });

    // ============================================================
    // DRIFT PARTICLES
    // ============================================================
    particlesRef.current.forEach(p => {
      p.x += p.vx + Math.sin(elapsed * 0.4 + p.phase) * 0.06;
      p.y += p.vy;
      p.phase += 0.005;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;

      const alpha = p.alpha * (0.6 + 0.4 * Math.sin(elapsed * 0.8 + p.phase));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(147,197,253,${alpha})`;
      ctx.fill();
    });

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    />
  );
}
