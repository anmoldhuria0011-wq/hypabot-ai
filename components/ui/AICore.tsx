'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { useMousePosition } from '@/hooks/useMousePosition';

interface AICoreProps {
  className?: string;
  // Scroll progress 0–1: drives intensity multiplier during transition
  scrollIntensity?: React.MutableRefObject<number>;
}

interface Node {
  x: number;
  y: number;
  radius: number;
  pulsePhase: number;
  pulseSpeed: number;
  layer: number;
  depth: number;
}

interface EmitPulse {
  startTime: number;
  duration: number;
}

interface FloatingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export function AICore({ className = '', scrollIntensity }: AICoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useMousePosition();
  const mouseRef = useRef({ nx: 0, ny: 0 });
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const lastPulseRef = useRef<number>(0);
  const pulseRef = useRef<EmitPulse | null>(null);
  const floatingParticlesRef = useRef<FloatingParticle[]>([]);
  const lastParticleSpawnRef = useRef<number>(0);

  useEffect(() => {
    mouseRef.current = {
      nx: mouse.normalizedX,
      ny: mouse.normalizedY,
    };
  }, [mouse]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const now = Date.now();
    const elapsed = (now - startTimeRef.current) / 1000;

    // Scroll intensity multiplier (0 = normal, 1 = max energy)
    const si = scrollIntensity ? scrollIntensity.current : 0;

    ctx.clearRect(0, 0, W, H);

    // — Emit pulse every 6s (or triggered by scroll) —
    if (now - lastPulseRef.current > Math.max(6000 - si * 3000, 2000)) {
      pulseRef.current = { startTime: now, duration: 2800 };
      lastPulseRef.current = now;
    }

    const pulseProgress = pulseRef.current
      ? Math.min((now - pulseRef.current.startTime) / pulseRef.current.duration, 1)
      : 0;
    const pulseActive = pulseProgress > 0 && pulseProgress < 1;
    const pulseGlow = pulseActive ? Math.sin(pulseProgress * Math.PI) : 0;

    // Scroll boosts everything
    const energyBoost = si * 0.8;

    const mx = mouseRef.current.nx * 10;
    const my = mouseRef.current.ny * 10;

    const breathe = 1 + Math.sin(elapsed * 0.55) * 0.022 + si * 0.04;

    const R = Math.min(W, H) * 0.38 * breathe;
    const innerR = R * 0.62;
    const coreR = R * 0.18;

    // ================================================================
    // 1. DEEP AMBIENT BLOOM
    // ================================================================
    for (let i = 3; i >= 0; i--) {
      const bloomR = R * (1.2 + i * 0.45);
      const bloomAlpha = (0.08 + pulseGlow * 0.10 + energyBoost * 0.14) / (i + 1);
      const bg = ctx.createRadialGradient(cx + mx * 0.2, cy + my * 0.2, 0, cx, cy, bloomR);
      bg.addColorStop(0, `rgba(59,130,246,${bloomAlpha})`);
      bg.addColorStop(0.5, `rgba(37,99,235,${bloomAlpha * 0.4})`);
      bg.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, bloomR, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();
    }

    // ================================================================
    // 2. OUTER STRUCTURAL RINGS (spin faster with scroll)
    // ================================================================
    const ringAngles = [0, Math.PI / 3, (2 * Math.PI) / 3];
    ringAngles.forEach((baseAngle, ri) => {
      const rAngle = baseAngle + elapsed * (0.06 + ri * 0.02 + si * 0.15);
      ctx.save();
      ctx.translate(cx + mx * 0.15, cy + my * 0.15);
      ctx.rotate(rAngle);
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 1.08, R * (0.3 + ri * 0.12), 0, 0, Math.PI * 2);
      const ringAlpha = 0.10 + pulseGlow * 0.12 + energyBoost * 0.18;
      ctx.strokeStyle = `rgba(59,130,246,${ringAlpha})`;
      ctx.lineWidth = 0.8 + si * 0.4;
      ctx.stroke();
      ctx.restore();
    });

    // ================================================================
    // 3. NETWORK NODES (36)
    // ================================================================
    const nodeCount = 36;
    const nodes: Node[] = [];
    const rotX = elapsed * (0.1 + si * 0.1) + mx * 0.012;
    const rotY = elapsed * (0.065 + si * 0.07) + my * 0.012;

    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi + elapsed * (0.07 + si * 0.06);
      const layer = i < 12 ? 0 : i < 24 ? 1 : 2;
      const r = layer === 0 ? R : layer === 1 ? innerR : R * 0.78;

      const x3 = Math.sin(phi) * Math.cos(theta);
      const y3 = Math.sin(phi) * Math.sin(theta);
      const z3 = Math.cos(phi);

      const rx = x3 * Math.cos(rotX) + z3 * Math.sin(rotX);
      const rz = -x3 * Math.sin(rotX) + z3 * Math.cos(rotX);
      const ry = y3 * Math.cos(rotY) - rz * Math.sin(rotY);
      const fz = y3 * Math.sin(rotY) + rz * Math.cos(rotY);

      const depth = (fz + 1) / 2;
      const nr = r * (0.72 + depth * 0.28);
      const nx2 = cx + rx * nr + mx * (1 - depth) * 0.8;
      const ny2 = cy + ry * nr + my * (1 - depth) * 0.8;

      nodes.push({
        x: nx2,
        y: ny2,
        radius: 1.2 + depth * 2.2,
        pulsePhase: i * 0.38,
        pulseSpeed: 0.7 + (i % 7) * 0.15,
        layer,
        depth,
      });
    }

    // ================================================================
    // 4. CONNECTIONS
    // ================================================================
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const maxDist = R * 0.72;
        if (dist < maxDist) {
          const t = 1 - dist / maxDist;
          const depthFade = (a.depth + b.depth) / 2;
          const alpha = t * t * (0.45 + energyBoost * 0.3) * depthFade + pulseGlow * t * 0.25;

          if ((pulseActive || si > 0.3) && alpha > 0.06) {
            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            grad.addColorStop(0, `rgba(147,197,253,${alpha * 0.8})`);
            grad.addColorStop(0.5, `rgba(96,165,250,${alpha})`);
            grad.addColorStop(1, `rgba(147,197,253,${alpha * 0.8})`);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(59,130,246,${alpha})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      }
    }

    // ================================================================
    // 5. NODES with bloom
    // ================================================================
    nodes.forEach((node) => {
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * node.pulseSpeed + node.pulsePhase);
      const alpha = (0.45 + pulse * 0.55 + pulseGlow * 0.4 + energyBoost * 0.4) * (0.5 + node.depth * 0.5);
      const r = node.radius * (0.75 + pulse * 0.5 + si * 0.3);

      const bloomSize = r * 7;
      const grd = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, bloomSize);
      grd.addColorStop(0, `rgba(96,165,250,${alpha * 0.25})`);
      grd.addColorStop(0.4, `rgba(59,130,246,${alpha * 0.1})`);
      grd.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(node.x, node.y, bloomSize, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,225,255,${alpha})`;
      ctx.fill();
    });

    // ================================================================
    // 6. INNER PLASMA SPHERE
    // ================================================================
    const coronaGrad = ctx.createRadialGradient(cx, cy, coreR * 0.5, cx, cy, R * 0.55);
    coronaGrad.addColorStop(0, `rgba(147,197,253,${0.26 + pulseGlow * 0.18 + energyBoost * 0.22})`);
    coronaGrad.addColorStop(0.35, `rgba(59,130,246,${0.14 + pulseGlow * 0.12 + energyBoost * 0.12})`);
    coronaGrad.addColorStop(0.7, `rgba(37,99,235,${0.06 + pulseGlow * 0.05})`);
    coronaGrad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = coronaGrad;
    ctx.fill();

    for (let s = 0; s < 3; s++) {
      const swirlSpeed = 0.3 + s * 0.15 + si * 0.25;
      const swirlAngle = elapsed * swirlSpeed + (s * Math.PI * 2) / 3;
      const ox = Math.cos(swirlAngle) * coreR * 0.6;
      const oy = Math.sin(swirlAngle) * coreR * 0.6;
      const plasmaGrad = ctx.createRadialGradient(cx + ox, cy + oy, 0, cx, cy, coreR * 2.2);
      plasmaGrad.addColorStop(0, `rgba(219,234,254,${0.12 + pulseGlow * 0.1 + energyBoost * 0.12})`);
      plasmaGrad.addColorStop(0.4, `rgba(96,165,250,${0.07 + pulseGlow * 0.07 + energyBoost * 0.08})`);
      plasmaGrad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = plasmaGrad;
      ctx.fill();
    }

    // ================================================================
    // 7. CORE CENTER
    // ================================================================
    const coreGrad = ctx.createRadialGradient(cx + mx * 0.05, cy + my * 0.05, 0, cx, cy, coreR);
    coreGrad.addColorStop(0, `rgba(255,255,255,${0.85 + pulseGlow * 0.15 + energyBoost * 0.15})`);
    coreGrad.addColorStop(0.2, `rgba(219,234,254,${0.7 + pulseGlow * 0.2 + energyBoost * 0.2})`);
    coreGrad.addColorStop(0.5, `rgba(147,197,253,${0.4 + pulseGlow * 0.15 + energyBoost * 0.15})`);
    coreGrad.addColorStop(0.8, `rgba(59,130,246,${0.15 + pulseGlow * 0.1})`);
    coreGrad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.fill();

    const innerCore = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 0.35);
    innerCore.addColorStop(0, `rgba(255,255,255,1)`);
    innerCore.addColorStop(0.5, `rgba(219,234,254,0.9)`);
    innerCore.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, coreR * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = innerCore;
    ctx.fill();

    // ================================================================
    // 8. ELECTRIC ARCS (more frequent with scroll)
    // ================================================================
    const arcThreshold = Math.max(0.04, 0.08 - si * 0.06);
    if (elapsed % 1.2 < arcThreshold || pulseActive || si > 0.3) {
      const arcCount = Math.floor(2 + si * 4 + (pulseActive ? 3 : 0));
      for (let a = 0; a < arcCount; a++) {
        const n1 = nodes[Math.floor((elapsed * 17 + a * 7) % nodes.length)];
        const n2 = nodes[Math.floor((elapsed * 13 + a * 11 + 5) % nodes.length)];
        if (!n1 || !n2) continue;
        const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
        if (dist > R * 0.5 || dist < R * 0.1) continue;

        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        const midX = (n1.x + n2.x) / 2 + (Math.random() - 0.5) * 20;
        const midY = (n1.y + n2.y) / 2 + (Math.random() - 0.5) * 20;
        ctx.quadraticCurveTo(midX, midY, n2.x, n2.y);
        const arcAlpha = (0.3 + pulseGlow * 0.5 + energyBoost * 0.4) * (0.5 + 0.5 * Math.random());
        ctx.strokeStyle = `rgba(147,197,253,${arcAlpha})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }

    // ================================================================
    // 9. ORBIT PARTICLES (accelerate with scroll)
    // ================================================================
    const orbitLayers = [
      { count: 4, rFactor: 0.98, speed: 0.22 + si * 0.3, tilt: 0.35 },
      { count: 5, rFactor: 1.08, speed: -(0.16 + si * 0.2), tilt: 0.55 },
      { count: 3, rFactor: 1.18, speed: 0.13 + si * 0.15, tilt: 0.25 },
      { count: 6, rFactor: 1.28, speed: -(0.1 + si * 0.12), tilt: 0.7 },
    ];

    orbitLayers.forEach((layer, li) => {
      for (let i = 0; i < layer.count; i++) {
        const angle = elapsed * layer.speed + (i * Math.PI * 2) / layer.count;
        const orbitR = R * layer.rFactor;
        const px = cx + Math.cos(angle) * orbitR + mx * 0.3;
        const py = cy + Math.sin(angle) * orbitR * layer.tilt + my * 0.2;
        const pSize = 0.8 + (li % 2) * 0.8 + si * 0.5;
        const pAlpha = (0.25 + 0.5 * Math.sin(elapsed * 1.2 + i + li)) * (1 + si * 0.5);

        const pGlow = ctx.createRadialGradient(px, py, 0, px, py, pSize * 5);
        pGlow.addColorStop(0, `rgba(147,197,253,${pAlpha * 0.5})`);
        pGlow.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(px, py, pSize * 5, 0, Math.PI * 2);
        ctx.fillStyle = pGlow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,225,255,${Math.min(pAlpha, 1)})`;
        ctx.fill();

        const trailAngle = angle - (layer.speed > 0 ? 0.18 : -0.18);
        const tx = cx + Math.cos(trailAngle) * orbitR + mx * 0.3;
        const ty = cy + Math.sin(trailAngle) * orbitR * layer.tilt + my * 0.2;
        const trailGrad = ctx.createLinearGradient(px, py, tx, ty);
        trailGrad.addColorStop(0, `rgba(147,197,253,${pAlpha * 0.4})`);
        trailGrad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = trailGrad;
        ctx.lineWidth = pSize * 0.8;
        ctx.stroke();
      }
    });

    // ================================================================
    // 10. FLOATING PARTICLES
    // ================================================================
    const spawnInterval = Math.max(60, 180 - si * 120);
    if (now - lastParticleSpawnRef.current > spawnInterval) {
      lastParticleSpawnRef.current = now;
      const angle = Math.random() * Math.PI * 2;
      const spawnR = R * (0.4 + Math.random() * 0.7);
      floatingParticlesRef.current.push({
        x: cx + Math.cos(angle) * spawnR,
        y: cy + Math.sin(angle) * spawnR,
        vx: (Math.random() - 0.5) * (0.3 + si * 0.5),
        vy: -(0.2 + Math.random() * 0.5 + si * 0.6),
        life: 0,
        maxLife: 120 + Math.random() * 80,
        size: 0.6 + Math.random() * 1.2,
      });
    }

    floatingParticlesRef.current = floatingParticlesRef.current.filter(p => p.life < p.maxLife);
    floatingParticlesRef.current.forEach(p => {
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      const t = p.life / p.maxLife;
      const alpha = Math.sin(t * Math.PI) * 0.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(147,197,253,${alpha})`;
      ctx.fill();
    });

    // ================================================================
    // 11. ENERGY PULSE RINGS
    // ================================================================
    if (pulseActive) {
      for (let ring = 0; ring < 3; ring++) {
        const delay = ring * 0.18;
        if (pulseProgress < delay) continue;
        const rp = (pulseProgress - delay) / (1 - delay);
        if (rp >= 1) continue;
        const pulseR = R * 0.4 + R * 1.4 * rp;
        const ringAlpha = Math.sin(rp * Math.PI) * (0.45 - ring * 0.12);

        ctx.beginPath();
        ctx.arc(cx + mx * 0.08, cy + my * 0.08, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(59,130,246,${ringAlpha})`;
        ctx.lineWidth = ring === 0 ? 1.2 : 0.6;
        ctx.stroke();
      }
    }

    // ================================================================
    // 12. OUTER TENDRILS
    // ================================================================
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + elapsed * (0.035 + si * 0.04);
      const flutter = Math.sin(elapsed * 1.5 + i * 0.9) * 0.06;
      const startR = R * 1.0;
      const endR = R * (1.35 + flutter + (i % 3) * 0.05 + si * 0.2);
      const sx = cx + Math.cos(angle) * startR;
      const sy = cy + Math.sin(angle) * startR * 0.92;
      const ex = cx + Math.cos(angle) * endR;
      const ey = cy + Math.sin(angle) * endR * 0.92;
      const alpha = (0.04 + pulseGlow * 0.1 + energyBoost * 0.12) * (0.4 + 0.6 * Math.sin(elapsed * 0.7 + i));

      const tendrilGrad = ctx.createLinearGradient(sx, sy, ex, ey);
      tendrilGrad.addColorStop(0, `rgba(59,130,246,${alpha})`);
      tendrilGrad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = tendrilGrad;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // ================================================================
    // 13. GROUND REFLECTION
    // ================================================================
    const groundGrad = ctx.createRadialGradient(cx, cy + R * 0.9, 0, cx, cy + R * 0.9, R);
    groundGrad.addColorStop(0, `rgba(59,130,246,${0.06 + pulseGlow * 0.06 + energyBoost * 0.06})`);
    groundGrad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.ellipse(cx, cy + R * 0.9, R, R * 0.18, 0, 0, Math.PI * 2);
    ctx.fillStyle = groundGrad;
    ctx.fill();

    animRef.current = requestAnimationFrame(draw);
  }, [scrollIntensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const size = Math.min(parent.clientWidth, parent.clientHeight, 700);
      canvas.width = size;
      canvas.height = size;
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
      className={`block ${className}`}
    />
  );
}
