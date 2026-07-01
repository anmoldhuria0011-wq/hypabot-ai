'use client';

import React, {
  useRef, useEffect, useState, useCallback, useMemo,
} from 'react';
import { AICore } from '@/components/ui/AICore';
import { SceneIntro } from '@/components/ui/SceneIntro';

// ─── Shared module-level scroll progress (written by GSAP, read by rAF) ──────
const scene2Progress = { current: 0 };

// ─── Animated counter ────────────────────────────────────────────────────────
function useCounter(target: number, active: boolean, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (!active) { setValue(0); return; }
    const startTime = Date.now();
    const startVal = 0;
    const tick = () => {
      const t = Math.min((Date.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(startVal + (target - startVal) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, target, duration]);

  return value;
}

// ─── Cycling text ─────────────────────────────────────────────────────────────
function useTextCycle(items: string[], active: boolean, interval = 1800) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!active) { setIdx(0); return; }
    const id = setInterval(() => setIdx(i => (i + 1) % items.length), interval);
    return () => clearInterval(id);
  }, [active, items.length, interval]);
  return items[idx];
}

// ─── Live pulse dot ───────────────────────────────────────────────────────────
function PulseDot({ color }: { color: string }) {
  return (
    <span className="relative inline-flex w-2 h-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
        style={{ backgroundColor: color }} />
      <span className="relative inline-flex rounded-full w-2 h-2"
        style={{ backgroundColor: color }} />
    </span>
  );
}

// ─── Construction canvas: draws frame + nodes + connections via scroll ────────
function ConstructionCanvas({
  buildT, dissolveT, color,
}: { buildT: number; dissolveT: number; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const vals = useRef({ buildT, dissolveT, color });
  useEffect(() => { vals.current = { buildT, dissolveT, color }; }, [buildT, dissolveT, color]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { buildT, dissolveT, color } = vals.current;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const alpha = Math.max(0, Math.min(buildT * 1.5, 1) - dissolveT * 2);
    if (alpha < 0.01) { rafRef.current = requestAnimationFrame(draw); return; }

    const now = Date.now() / 1000;
    const hex = color.replace('#', '');
    const R = parseInt(hex.slice(0, 2), 16);
    const G = parseInt(hex.slice(2, 4), 16);
    const B = parseInt(hex.slice(4, 6), 16);
    const c = (a: number) => `rgba(${R},${G},${B},${Math.min(a * alpha, 1)})`;

    // ── Corner brackets assemble from 4 corners inward ──────────────────────
    const m = 20; // margin
    const cLen = Math.min(W, H) * 0.13; // corner arm length

    const drawCorner = (ox: number, oy: number, hd: number, vd: number, p: number) => {
      if (p <= 0) return;
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = c(0.8);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + hd * cLen * Math.min(p * 2, 1), oy);
      ctx.stroke();
      if (p > 0.5) {
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox, oy + vd * cLen * Math.min((p - 0.5) * 2, 1));
        ctx.stroke();
      }
    };

    const p0 = Math.min(buildT / 0.2, 1);
    const p1 = Math.min(Math.max((buildT - 0.08) / 0.2, 0), 1);
    const p2 = Math.min(Math.max((buildT - 0.16) / 0.2, 0), 1);
    const p3 = Math.min(Math.max((buildT - 0.24) / 0.2, 0), 1);

    drawCorner(m,     m,     1,  1,  p0);
    drawCorner(W - m, m,    -1,  1,  p1);
    drawCorner(m,     H - m, 1, -1, p2);
    drawCorner(W - m, H - m, -1, -1, p3);

    // ── Inner dashed grid lines appear after frame is drawn ──────────────────
    if (buildT > 0.35) {
      const gp = Math.min((buildT - 0.35) / 0.3, 1);
      ctx.setLineDash([3, 8]);
      ctx.lineWidth = 0.4;
      ctx.strokeStyle = c(0.12);

      // 3 horizontal lines
      [0.3, 0.5, 0.7].forEach((fy, i) => {
        const lp = Math.min(Math.max((gp - i * 0.12) / 0.5, 0), 1);
        ctx.beginPath();
        ctx.moveTo(m, H * fy);
        ctx.lineTo(m + (W - m * 2) * lp, H * fy);
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    // ── Network nodes materialise ─────────────────────────────────────────────
    const nodePositions = [
      [0.18, 0.3], [0.18, 0.7], [0.45, 0.2], [0.45, 0.5], [0.45, 0.8],
      [0.72, 0.35], [0.72, 0.65], [0.9, 0.5],
    ];

    if (buildT > 0.5) {
      const nodePairs = [[0,3],[1,3],[2,3],[3,4],[3,5],[4,6],[5,6],[6,7]];
      nodePairs.forEach(([ai, bi], i) => {
        const lp = Math.min(Math.max((buildT - 0.5 - i * 0.025) / 0.25, 0), 1);
        if (lp <= 0) return;
        const [ax, ay] = nodePositions[ai];
        const [bx, by] = nodePositions[bi];
        const grad = ctx.createLinearGradient(W * ax, H * ay, W * bx, H * by);
        grad.addColorStop(0, c(0.3 * lp));
        grad.addColorStop(1, c(0.1 * lp));
        ctx.beginPath();
        ctx.moveTo(W * ax, H * ay);
        ctx.lineTo(W * bx, H * by);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      nodePositions.forEach(([nx, ny], i) => {
        const np = Math.min(Math.max((buildT - 0.5 - i * 0.03) / 0.15, 0), 1);
        if (np <= 0) return;
        const px = W * nx, py = H * ny;
        const pulse = 0.6 + 0.4 * Math.sin(now * 2.2 + i);
        const nr = (1.5 + pulse * 1.2) * np;

        // bloom
        const grad = ctx.createRadialGradient(px, py, 0, px, py, nr * 6);
        grad.addColorStop(0, c(0.35 * np));
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(px, py, nr * 6, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // dot
        ctx.beginPath();
        ctx.arc(px, py, nr, 0, Math.PI * 2);
        ctx.fillStyle = c(0.9);
        ctx.fill();
      });
    }

    // ── Dissolve: particles stream back toward left (toward AICore) ──────────
    if (dissolveT > 0) {
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const rad = Math.min(W, H) * 0.38 * (1 - dissolveT * 0.9);
        const px = W / 2 + Math.cos(angle) * rad;
        const py = H / 2 + Math.sin(angle) * rad;
        const pa = (1 - dissolveT) * 0.7;
        if (pa <= 0) continue;
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = c(pa);
        ctx.fill();
        // trailing line
        const tx = px + Math.cos(angle + Math.PI) * 12;
        const ty = py + Math.sin(angle + Math.PI) * 12;
        const tGrad = ctx.createLinearGradient(px, py, tx, ty);
        tGrad.addColorStop(0, c(pa * 0.5));
        tGrad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = tGrad;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const resize = () => {
      const p = canvas.parentElement!;
      canvas.width = p.clientWidth;
      canvas.height = p.clientHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    rafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [draw]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" aria-hidden />;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function stageProgress(sp: number, s: number, e: number) {
  const local = Math.max(0, Math.min((sp - s) / (e - s), 1));
  return {
    local,
    build: Math.min(local / 0.22, 1),
    hold: local >= 0.22 ? Math.min((local - 0.22) / 0.5, 1) : 0,
    dissolve: local >= 0.72 ? Math.min((local - 0.72) / 0.28, 1) : 0,
  };
}

function inStage(sp: number, s: number, e: number) {
  return sp > s && sp < e;
}

// ─── Stat box ─────────────────────────────────────────────────────────────────
function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-[rgba(255,255,255,0.09)] bg-[rgba(8,12,22,0.90)] px-3 py-2.5">
      <div className="text-[1rem] font-bold mb-0.5 text-[#e8eaed]"
        style={{ fontFamily: 'Syne,sans-serif', color }}>{value}</div>
      <div className="text-[9px] text-[#6b7280] uppercase tracking-wider">{label}</div>
    </div>
  );
}

// ─── Receptionist UI ──────────────────────────────────────────────────────────
function ReceptionistUI({ buildT, holdT, dissolveT }: { buildT: number; holdT: number; dissolveT: number }) {
  const active = holdT > 0.2 && dissolveT < 0.6;
  const calls = useCounter(1462, active);
  const status = useTextCycle(
    ['Incoming Call…', 'AI Answering…', 'Appointment Scheduled', 'Confirmation Sent ✓'],
    active,
  );
  const color = '#3b82f6';
  const o = Math.max(0, Math.min(buildT * 1.8, 1) - dissolveT * 2.5);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
      style={{ opacity: o, transition: 'opacity 0.1s' }}>
      <div className="w-full max-w-[360px] mx-auto px-4">
        <div className="rounded-2xl border border-[rgba(59,130,246,0.18)] bg-[rgba(5,8,18,0.93)] px-5 py-5"
          style={{ boxShadow: '0 0 48px rgba(0,0,0,0.9), 0 0 20px rgba(59,130,246,0.04), inset 0 1px 0 rgba(59,130,246,0.07)' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[9px] tracking-[0.2em] uppercase font-medium mb-1"
              style={{ color }}>ARIA — AI RECEPTIONIST</div>
            <h3 className="text-[1.2rem] font-bold text-[#f0f0f0]"
              style={{ fontFamily: 'Syne,sans-serif', letterSpacing: '-0.02em' }}>AI Receptionist</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <PulseDot color="#22c55e" />
            <span className="text-[10px] text-[#22c55e] font-medium">Online</span>
          </div>
        </div>

        <div className="rounded-xl border border-[rgba(59,130,246,0.28)] bg-[rgba(8,14,28,0.92)] px-4 py-3 mb-4">
          <div className="text-[9px] text-[#6b7280] uppercase tracking-wider mb-1.5">Live Status</div>
          <div className="text-[0.875rem] font-medium min-h-[1.25em]" style={{ color: '#93c5fd' }}>{status}</div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <Stat label="Calls Answered" value={calls.toLocaleString()} color={color} />
          <Stat label="Availability" value="24 / 7" color={color} />
          <Stat label="Languages" value="47" color={color} />
          <Stat label="Avg Response" value="<0.3s" color={color} />
        </div>

        <div className="flex items-center gap-2 px-2">
          <div className="flex gap-1 items-end">
            {[0, 1, 2].map(i => (
              <span key={i} className="rounded-full bg-[#3b82f6]"
                style={{ width: 3, height: 3 + i * 2,
                  animation: `pulse-glow 1.2s ${i * 0.2}s ease-in-out infinite` }} />
            ))}
          </div>
          <span className="text-[10px] text-[#6b7280]">ARIA is responding…</span>
        </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sales UI ─────────────────────────────────────────────────────────────────
function SalesUI({ buildT, holdT, dissolveT }: { buildT: number; holdT: number; dissolveT: number }) {
  const active = holdT > 0.2 && dissolveT < 0.6;
  const revenue = useCounter(284750, active, 1500);
  const leads = useCounter(47, active, 900);
  const status = useTextCycle(
    ['New Lead Detected…', 'Qualifying…', 'Proposal Sent ✓', 'Meeting Booked ✓'],
    active,
  );
  const color = '#8b5cf6';
  const o = Math.max(0, Math.min(buildT * 1.8, 1) - dissolveT * 2.5);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
      style={{ opacity: o, transition: 'opacity 0.1s' }}>
      <div className="w-full max-w-[360px] mx-auto px-4">
        <div className="rounded-2xl border border-[rgba(139,92,246,0.18)] bg-[rgba(8,5,18,0.93)] px-5 py-5"
          style={{ boxShadow: '0 0 48px rgba(0,0,0,0.9), 0 0 20px rgba(139,92,246,0.04), inset 0 1px 0 rgba(139,92,246,0.07)' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[9px] tracking-[0.2em] uppercase font-medium mb-1"
              style={{ color }}>VEGA — AI SALES AGENT</div>
            <h3 className="text-[1.2rem] font-bold text-[#f0f0f0]"
              style={{ fontFamily: 'Syne,sans-serif', letterSpacing: '-0.02em' }}>AI Sales Agent</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <PulseDot color="#8b5cf6" />
            <span className="text-[10px] font-medium" style={{ color: '#a78bfa' }}>Hunting</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="rounded-xl border border-[rgba(139,92,246,0.28)] bg-[rgba(12,8,26,0.92)] px-3 py-3">
            <div className="text-[9px] text-[#6b7280] uppercase tracking-wider mb-1">Pipeline</div>
            <div className="text-[1.1rem] font-bold text-[#e8eaed]"
              style={{ fontFamily: 'Syne,sans-serif' }}>
              ${(revenue / 1000).toFixed(1)}k
            </div>
          </div>
          <div className="rounded-xl border border-[rgba(139,92,246,0.28)] bg-[rgba(12,8,26,0.92)] px-3 py-3">
            <div className="text-[9px] text-[#6b7280] uppercase tracking-wider mb-1">Hot Leads</div>
            <div className="text-[1.1rem] font-bold text-[#e8eaed]"
              style={{ fontFamily: 'Syne,sans-serif' }}>{leads}</div>
          </div>
        </div>

        <div className="rounded-xl border border-[rgba(139,92,246,0.25)] bg-[rgba(12,8,26,0.92)] px-4 py-3 mb-4">
          <div className="text-[9px] text-[#6b7280] uppercase tracking-wider mb-1.5">Live Action</div>
          <div className="text-[0.875rem] font-medium min-h-[1.25em]" style={{ color: '#c4b5fd' }}>{status}</div>
        </div>

        <div className="space-y-1.5">
          {[
            { text: 'Lead Qualified', delay: 0 },
            { text: 'Meeting Scheduled', delay: 0.15 },
            { text: 'Follow-up Sent', delay: 0.3 },
          ].map(({ text, delay }) => (
            <div key={text}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[rgba(139,92,246,0.22)] bg-[rgba(12,8,26,0.90)]"
              style={{ opacity: active ? 1 : 0, transition: `opacity 0.4s ${delay}s` }}>
              <span className="text-[#22c55e] text-[11px]">✓</span>
              <span className="text-[10px] font-medium" style={{ color: '#a78bfa' }}>{text}</span>
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}

// ─── Operations UI ────────────────────────────────────────────────────────────
function OpsUI({ buildT, holdT, dissolveT }: { buildT: number; holdT: number; dissolveT: number }) {
  const active = holdT > 0.2 && dissolveT < 0.6;
  const tasks = useCounter(10847, active, 1600);
  const status = useTextCycle(
    ['Running Workflow…', 'Processing…', 'Completed ✓', 'Archiving…'],
    active, 1600,
  );
  const color = '#06b6d4';
  const o = Math.max(0, Math.min(buildT * 1.8, 1) - dissolveT * 2.5);

  const integrations = ['Slack', 'Calendar', 'HubSpot', 'Notion', 'Zapier'];

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
      style={{ opacity: o, transition: 'opacity 0.1s' }}>
      <div className="w-full max-w-[360px] mx-auto px-4">
        <div className="rounded-2xl border border-[rgba(6,182,212,0.18)] bg-[rgba(4,12,16,0.93)] px-5 py-5"
          style={{ boxShadow: '0 0 48px rgba(0,0,0,0.9), 0 0 20px rgba(6,182,212,0.04), inset 0 1px 0 rgba(6,182,212,0.07)' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[9px] tracking-[0.2em] uppercase font-medium mb-1"
              style={{ color }}>NEXUS — AI OPS AGENT</div>
            <h3 className="text-[1.2rem] font-bold text-[#f0f0f0]"
              style={{ fontFamily: 'Syne,sans-serif', letterSpacing: '-0.02em' }}>AI Operations Agent</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <PulseDot color={color} />
            <span className="text-[10px] font-medium" style={{ color: '#67e8f9' }}>Automating</span>
          </div>
        </div>

        <div className="rounded-xl border border-[rgba(6,182,212,0.28)] bg-[rgba(4,14,20,0.92)] px-4 py-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] text-[#6b7280] uppercase tracking-wider mb-1">Tasks Completed Today</div>
              <div className="text-[1.3rem] font-bold text-[#e8eaed]"
                style={{ fontFamily: 'Syne,sans-serif' }}>{tasks.toLocaleString()}</div>
            </div>
            <div className="text-[10px] text-[#6b7280] text-right max-w-[90px]">{status}</div>
          </div>
        </div>

        <div className="rounded-xl border border-[rgba(6,182,212,0.22)] bg-[rgba(4,14,20,0.92)] px-4 py-3 mb-4">
          <div className="text-[9px] text-[#6b7280] uppercase tracking-wider mb-3">Connected Systems</div>
          <div className="flex flex-wrap gap-1.5">
            {integrations.map((name, i) => (
              <div key={name}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[rgba(6,182,212,0.30)] bg-[rgba(4,14,20,0.85)]"
                style={{ opacity: active ? 1 : 0, transition: `opacity 0.3s ${i * 0.08}s` }}>
                <span className="w-1 h-1 rounded-full bg-[#06b6d4]"
                  style={{ animation: 'pulse-glow 2s infinite' }} />
                <span className="text-[9px] font-medium" style={{ color: '#67e8f9' }}>{name}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] text-[#6b7280] uppercase tracking-wider">Workflow Health</span>
            <span className="text-[9px]" style={{ color }}>99.97%</span>
          </div>
          <div className="h-0.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-[1600ms] ease-out"
              style={{
                width: active ? '99.97%' : '0%',
                background: `linear-gradient(90deg, ${color}, #67e8f9)`,
              }} />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stage progress dots ──────────────────────────────────────────────────────
function StageIndicator({ active }: { active: number }) {
  const items = [
    { label: 'Receptionist', color: '#3b82f6' },
    { label: 'Sales Agent', color: '#8b5cf6' },
    { label: 'Ops Agent', color: '#06b6d4' },
  ];
  return (
    <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex items-center gap-6 z-30">
      {items.map(({ label, color }, i) => (
        <div key={label} className="flex flex-col items-center gap-1.5">
          <div className="rounded-full transition-all duration-500"
            style={{
              width: 6, height: 6,
              backgroundColor: i === active ? color : 'rgba(255,255,255,0.12)',
              boxShadow: i === active ? `0 0 8px ${color}` : 'none',
            }} />
          <span className="text-[8px] uppercase tracking-wider transition-colors duration-500"
            style={{ color: i === active ? color : '#2d3748' }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Scene 2 ─────────────────────────────────────────────────────────────
export function Scene2Section() {
  const outerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [sp, setSp] = useState(0);

  // Stable scrollIntensity ref passed into AICore
  const intensityRef = useRef<number>(0);
  const stableIntensityRef = useMemo(() => ({ current: 0 }), []);

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    const init = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      const st = ScrollTrigger.create({
        trigger: outerRef.current,
        start: 'top top',
        end: '+=500%',        // 500vh scroll distance — more dwell per employee
        pin: stickyRef.current,
        scrub: 0.9,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress;
          scene2Progress.current = p;
          stableIntensityRef.current = p * 0.6;
          // Throttle setState — only update when visible change
          setSp(prev => Math.abs(prev - p) > 0.002 ? p : prev);
        },
      });
      cleanup = () => st.kill();
    };
    init();
    return () => cleanup?.();
  }, [stableIntensityRef]);

  // Stage boundaries
  // Wider stage windows: each employee gets ~1/3 of scroll with generous overlap
  // 0.02–0.35  = Receptionist  (assemble 0.02–0.10, hold 0.10–0.28, dissolve 0.28–0.35)
  // 0.33–0.66  = Sales         (assemble 0.33–0.41, hold 0.41–0.59, dissolve 0.59–0.66)
  // 0.64–0.97  = Ops           (assemble 0.64–0.72, hold 0.72–0.90, dissolve 0.90–0.97)
  const s0 = stageProgress(sp, 0.02, 0.35);
  const s1 = stageProgress(sp, 0.33, 0.66);
  const s2 = stageProgress(sp, 0.64, 0.97);

  const activeStage = sp < 0.35 ? 0 : sp < 0.66 ? 1 : 2;
  const stageColors = ['#3b82f6', '#8b5cf6', '#06b6d4'] as const;
  const currentColor = stageColors[activeStage];

  const activeBuild = activeStage === 0 ? s0.build : activeStage === 1 ? s1.build : s2.build;
  const activeDissolve = activeStage === 0 ? s0.dissolve : activeStage === 1 ? s1.dissolve : s2.dissolve;
  const activeHold = activeStage === 0 ? s0.hold : activeStage === 1 ? s1.hold : s2.hold;

  return (
    // 400vh total: 100vh sticky viewport + 300vh scroll travel
    <div ref={outerRef} id="ai-employees" aria-label="Meet Your AI Employees" style={{ height: '600vh', scrollMarginTop: '64px' }} data-scene="2">
      <div ref={stickyRef} className="relative w-full overflow-hidden" style={{ height: '100vh' }}>

        {/* Ambient glow — tints with stage color */}
        <div className="absolute inset-0 pointer-events-none z-0 transition-all duration-1000"
          style={{ background: `radial-gradient(ellipse 70% 55% at 60% 50%, ${currentColor}07 0%, transparent 70%)` }} />

        {/* Top/bottom blends */}
        <div className="absolute top-0 inset-x-0 h-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, #050505, transparent)' }} />
        <div className="absolute bottom-0 inset-x-0 h-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #050505, transparent)' }} />

        {/* Scene intro — fades out as employee sequence begins */}
        <div className="absolute top-[8%] inset-x-0 z-30 pointer-events-none px-6"
          style={{ opacity: sp < 0.02 ? 1 : Math.max(0, 1 - (sp - 0.02) / 0.05) }}>
          <SceneIntro
            scene="02"
            headline="Meet Your AI Employees"
            body="Three specialized AI employees, each built for a different part of your business. Scroll to watch them come to life."
            active={sp < 0.07}
          />
        </div>

        {/* ── Two-column layout ── */}
        <div className="absolute inset-0 flex items-center z-20">
          <div className="w-full max-w-[1380px] mx-auto px-6 lg:px-10">
            <div className="grid lg:grid-cols-[46%_8%_46%] items-center" style={{ minHeight: '78vh' }}>

              {/* LEFT — AI Core */}
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="text-center mb-2 pointer-events-none">
                  <div className="text-[8px] tracking-[0.2em] uppercase text-[#2d3748] mb-0.5">Powered by</div>
                  <div className="text-[0.75rem] font-semibold text-[#374151]"
                    style={{ fontFamily: 'Syne,sans-serif' }}>HYPA BOT Core</div>
                </div>

                <div className="relative w-full max-w-[400px] aspect-square">
                  {/* Stage-color bloom behind orb */}
                  <div className="absolute inset-0 rounded-full pointer-events-none transition-all duration-1000"
                    style={{
                      background: `radial-gradient(circle, ${currentColor}0a 0%, transparent 65%)`,
                      transform: 'scale(1.5)',
                    }} />
                  <AICore className="w-full h-full" scrollIntensity={stableIntensityRef} />
                </div>
              </div>

              {/* CENTER — Energy conduit */}
              <div className="hidden lg:flex items-center justify-center h-full">
                <div className="relative h-56 flex items-center justify-center">
                  {/* Central line */}
                  <div className="w-px h-full transition-colors duration-1000"
                    style={{ background: `linear-gradient(to bottom, transparent, ${currentColor}35, transparent)` }} />
                  {/* Flowing energy particle on line */}
                  <div className="absolute w-1.5 h-1.5 rounded-full transition-colors duration-700"
                    style={{
                      backgroundColor: currentColor,
                      boxShadow: `0 0 8px ${currentColor}`,
                      animation: 'flow-down 2.5s ease-in-out infinite',
                      top: `${20 + sp * 60}%`,
                    }} />
                </div>
              </div>

              {/* RIGHT — Interface panel */}
              <div className="relative flex items-center justify-center" style={{ minHeight: '480px' }}>

                {/* Construction frame canvas */}
                <ConstructionCanvas
                  buildT={activeBuild}
                  dissolveT={activeDissolve}
                  color={currentColor}
                />

                {/* Employee UI layers */}
                {inStage(sp, 0.02, 0.35) && (
                  <ReceptionistUI buildT={s0.build} holdT={s0.hold} dissolveT={s0.dissolve} />
                )}
                {inStage(sp, 0.33, 0.66) && (
                  <SalesUI buildT={s1.build} holdT={s1.hold} dissolveT={s1.dissolve} />
                )}
                {inStage(sp, 0.64, 0.97) && (
                  <OpsUI buildT={s2.build} holdT={s2.hold} dissolveT={s2.dissolve} />
                )}

                {/* Pre-start hint */}
                {sp < 0.03 && (
                  <div className="text-center z-10 relative">
                    <div className="text-[0.8rem] text-[#2d3748] mb-1">Scroll to witness</div>
                    <div className="text-[0.7rem] text-[#1f2937]">AI Employees being created</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stage indicator */}
        {/* Bottom progress — subtle dots only, no labels */}
        <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-full transition-all duration-500"
              style={{
                width: 5, height: 5,
                backgroundColor: i === activeStage
                  ? ['#3b82f6','#8b5cf6','#06b6d4'][i]
                  : 'rgba(255,255,255,0.10)',
                boxShadow: i === activeStage ? `0 0 6px ${['#3b82f6','#8b5cf6','#06b6d4'][i]}` : 'none',
              }} />
          ))}
        </div>

      </div>
    </div>
  );
}
