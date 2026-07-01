'use client';

import React, {
  useRef, useEffect, useState, useCallback, useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AICore } from '@/components/ui/AICore';
import { SceneIntro } from '@/components/ui/SceneIntro';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function pct(sp: number, s: number, e: number) { return clamp((sp - s) / (e - s), 0, 1); }

// ─── Counter ──────────────────────────────────────────────────────────────────
function useCounter(target: number, active: boolean, duration = 1600) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    if (!active) { setVal(0); return; }
    const t0 = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - t0) / duration, 1);
      setVal(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [active, target, duration]);
  return val;
}

// ─── Connection Canvas ────────────────────────────────────────────────────────
const STAGE_BOUNDS = [
  [0.00, 0.22],   // Stage 1: Connect
  [0.22, 0.48],   // Stage 2: Train
  [0.48, 0.72],   // Stage 3: Integrate
  [0.72, 0.95],   // Stage 4: Deploy
];

function ConnectionCanvas({ sp, coreC, bizC, intNodes, stage }: {
  sp: number;
  coreC: { x: number; y: number };
  bizC: { x: number; y: number };
  intNodes: Array<{ x: number; y: number; active: boolean }>;
  stage: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const v = useRef({ sp, coreC, bizC, intNodes, stage });
  useEffect(() => { v.current = { sp, coreC, bizC, intNodes, stage }; }, [sp, coreC, bizC, intNodes, stage]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { sp, coreC: cc, bizC: bc, intNodes: nodes, stage } = v.current;
    const now = Date.now() / 1000;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const retract = pct(sp, 0.93, 0.99);
    const globalAlpha = 1 - retract;

    // Stage 1 & 2: business → core line
    if (stage <= 1 && globalAlpha > 0) {
      const lineP = stage === 0 ? pct(sp, 0.02, 0.10) : 1;
      if (lineP > 0 && bc.x > 0 && cc.x > 0) {
        const ex = bc.x + (cc.x - bc.x) * lineP;
        const ey = bc.y + (cc.y - bc.y) * lineP;
        const g = ctx.createLinearGradient(bc.x, bc.y, ex, ey);
        g.addColorStop(0, `rgba(59,130,246,${0.2 * globalAlpha})`);
        g.addColorStop(1, `rgba(59,130,246,${0.55 * globalAlpha})`);
        ctx.beginPath(); ctx.moveTo(bc.x, bc.y); ctx.lineTo(ex, ey);
        ctx.strokeStyle = g; ctx.lineWidth = 1.2; ctx.stroke();

        // Data packets (stage 2)
        if (stage === 1) {
          const flow = pct(sp, 0.25, 0.46);
          for (let i = 0; i < 4; i++) {
            const t = ((now * 0.5 + i * 0.25) % 1);
            if (t > flow) continue;
            const px = bc.x + (cc.x - bc.x) * t;
            const py = bc.y + (cc.y - bc.y) * t;
            const a = Math.sin(t * Math.PI) * 0.9 * globalAlpha;
            const pg = ctx.createRadialGradient(px, py, 0, px, py, 6);
            pg.addColorStop(0, `rgba(147,197,253,${a})`);
            pg.addColorStop(1, 'transparent');
            ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fillStyle = pg; ctx.fill();
            ctx.beginPath(); ctx.arc(px, py, 1.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200,225,255,${a})`; ctx.fill();
          }
        }
      }
    }

    // Stage 3+: integration lines
    if (stage >= 2 && globalAlpha > 0) {
      const intP = pct(sp, 0.50, 0.63);
      nodes.forEach(({ x, y, active }, i) => {
        if (!active || cc.x === 0) return;
        const lp = clamp(intP * nodes.length - i, 0, 1);
        if (lp <= 0) return;
        const ex2 = x + (cc.x - x) * (1 - lp);
        const ey2 = y + (cc.y - y) * (1 - lp);
        const g2 = ctx.createLinearGradient(x, y, cc.x, cc.y);
        g2.addColorStop(0, `rgba(59,130,246,${0.1 * globalAlpha})`);
        g2.addColorStop(0.6, `rgba(59,130,246,${0.3 * globalAlpha})`);
        g2.addColorStop(1, 'rgba(59,130,246,0)');
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex2, ey2);
        ctx.strokeStyle = g2; ctx.lineWidth = 0.8; ctx.stroke();
        // Pulse
        const pt2 = ((now * 0.65 + i * 0.14) % 1);
        const ppx = x + (cc.x - x) * pt2;
        const ppy = y + (cc.y - y) * pt2;
        const pa = Math.sin(pt2 * Math.PI) * 0.55 * lp * globalAlpha;
        if (pa > 0.02) {
          ctx.beginPath(); ctx.arc(ppx, ppy, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(147,197,253,${pa})`; ctx.fill();
        }
      });
    }

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    rafRef.current = requestAnimationFrame(draw);
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 25 }} aria-hidden />;
}

// ─── Shared subcomponents ─────────────────────────────────────────────────────
function Check() {
  return (
    <svg viewBox="0 0 10 10" className="w-3 h-3">
      <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#22c55e" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StepHeader({ step, title, subtitle, active }: { step: string; title: string; subtitle: string; active: boolean }) {
  return (
    <div className="mb-5" style={{ opacity: active ? 1 : 0.35, transition: 'opacity 0.5s' }}>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[9px] font-mono tracking-[0.2em] text-[#3b82f6]">STEP {step}</span>
        <span className="w-5 h-px bg-[rgba(59,130,246,0.3)]" />
      </div>
      <h3 className="text-[1.25rem] font-bold text-[#f0f0f0] mb-2 leading-tight"
        style={{ fontFamily: 'Syne,sans-serif', letterSpacing: '-0.02em' }}>
        {title}
      </h3>
      <p className="text-[0.85rem] text-[#6b7280] leading-[1.65]">{subtitle}</p>
    </div>
  );
}

// ─── Panel wrapper ─────────────────────────────────────────────────────────────
function Panel({ children, accentColor = '#3b82f6' }: { children: React.ReactNode; accentColor?: string }) {
  return (
    <div className="rounded-2xl border px-6 py-6"
      style={{
        background: 'rgba(5,8,18,0.96)',
        borderColor: `${accentColor}28`,
        boxShadow: `0 0 40px rgba(0,0,0,0.9), 0 0 18px rgba(0,0,0,0.6), inset 0 1px 0 ${accentColor}0d`,
      }}>
      {children}
    </div>
  );
}

// ─── Stage 1: Connect ─────────────────────────────────────────────────────────
function Stage1Panel({ sp, nodeRef }: { sp: number; nodeRef: React.RefObject<HTMLDivElement | null> }) {
  const [s, e] = STAGE_BOUNDS[0];
  const appear = pct(sp, s + 0.01, s + 0.06);
  const scanP = pct(sp, s + 0.06, s + 0.14);
  const checks = [
    { label: 'Customer Support systems', at: s + 0.10 },
    { label: 'Sales workflows', at: s + 0.14 },
    { label: 'Operations processes', at: s + 0.17 },
  ];

  return (
    <div style={{ opacity: appear, transition: 'opacity 0.3s' }}>
      <StepHeader step="01" title="Connect Your Business" subtitle="Connect your business systems so the AI understands how your company works." active />
      <Panel>
        {/* Business node */}
        <div ref={nodeRef as React.RefObject<HTMLDivElement>} className="flex items-center gap-3 mb-5">
          <div className="relative w-10 h-10 flex-shrink-0">
            <div className="absolute inset-0 rounded-xl border border-[rgba(59,130,246,0.35)] bg-[rgba(59,130,246,0.08)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 rounded-sm border border-[rgba(59,130,246,0.55)] bg-[rgba(59,130,246,0.15)] flex items-center justify-center">
                <div className="w-2 h-2 rounded-sm bg-[#3b82f6] opacity-80" />
              </div>
            </div>
            {scanP > 0 && scanP < 1 && (
              <div className="absolute inset-0 rounded-xl border border-[#3b82f6]"
                style={{ opacity: scanP < 0.5 ? scanP * 2 : (1 - scanP) * 2, transform: `scale(${1 + scanP * 0.35})` }} />
            )}
          </div>
          <div>
            <div className="text-[9px] tracking-[0.16em] uppercase text-[#3b82f6] font-medium mb-0.5">Detected</div>
            <div className="text-[0.95rem] font-semibold text-[#f0f0f0]" style={{ fontFamily: 'Syne,sans-serif' }}>Your Business</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-ping opacity-60" />
            <span className="text-[9px] text-[#22c55e] font-medium">Scanning</span>
          </div>
        </div>

        <div className="text-[9px] tracking-[0.16em] uppercase text-[#4b5563] font-medium mb-3">Analysis</div>
        <div className="space-y-2.5">
          {checks.map(({ label, at }) => {
            const cp = pct(sp, at, at + 0.04);
            const done = cp >= 1;
            return (
              <div key={label} className="flex items-center gap-2.5"
                style={{ opacity: cp > 0 ? 1 : 0.2, transition: 'opacity 0.4s' }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-400"
                  style={{
                    background: done ? 'rgba(34,197,94,0.14)' : 'rgba(59,130,246,0.1)',
                    border: `1px solid ${done ? 'rgba(34,197,94,0.45)' : 'rgba(59,130,246,0.3)'}`,
                  }}>
                  {done ? <Check /> : <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] opacity-70" style={{ animation: 'pulse-glow 1s infinite' }} />}
                </div>
                <span className="text-[11px] font-medium transition-colors duration-400"
                  style={{ color: done ? '#d1fae5' : '#9ca3af' }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

// ─── Stage 2: Train ───────────────────────────────────────────────────────────
function Stage2Panel({ sp }: { sp: number }) {
  const [s, e] = STAGE_BOUNDS[1];
  const appear = pct(sp, s + 0.01, s + 0.06);
  const tasks = [
    { label: 'Import Business Knowledge', at: s + 0.03 },
    { label: 'Connect CRM',              at: s + 0.07 },
    { label: 'Configure Scheduling',      at: s + 0.12 },
    { label: 'Train AI Responses',        at: s + 0.17 },
    { label: 'Validate Conversations',    at: s + 0.21 },
  ];

  return (
    <div style={{ opacity: appear, transition: 'opacity 0.3s' }}>
      <StepHeader step="02" title="Train Your AI Employee" subtitle="We train your AI using your documents, FAQs, CRM data and workflows." active />
      <Panel>
        <div className="text-[9px] tracking-[0.16em] uppercase text-[#4b5563] font-medium mb-4">Training Progress</div>
        <div className="space-y-3">
          {tasks.map(({ label, at }) => {
            const p = pct(sp, at, at + 0.04);
            const done = p >= 1;
            const running = p > 0 && p < 1;
            return (
              <div key={label} className="flex items-center gap-3"
                style={{ opacity: p > 0 ? 1 : 0.2, transition: 'opacity 0.4s' }}>
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{
                    background: done ? 'rgba(34,197,94,0.14)' : running ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${done ? 'rgba(34,197,94,0.45)' : running ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                  {done && <Check />}
                  {running && <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" style={{ animation: 'pulse-glow 1s infinite' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium" style={{ color: done ? '#d1fae5' : running ? '#93c5fd' : '#6b7280' }}>
                      {label}
                    </span>
                    {done && <span className="text-[9px] text-[#22c55e] font-medium">✓ Done</span>}
                  </div>
                  <div className="h-[2px] rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${p * 100}%`, background: done ? 'linear-gradient(90deg,#22c55e,#86efac)' : 'linear-gradient(90deg,#3b82f6,#93c5fd)' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

// ─── Stage 3: Integrate ───────────────────────────────────────────────────────
const INTEGRATIONS = [
  { name: 'Gmail',    angle: 315 },
  { name: 'Slack',    angle:  45 },
  { name: 'HubSpot',  angle: 270 },
  { name: 'Calendar', angle:  90 },
  { name: 'WhatsApp', angle: 225 },
  { name: 'Shopify',  angle: 135 },
  { name: 'Notion',   angle:   0 },
];

function IntegrationRing({ sp, nodeRefs }: { sp: number; nodeRefs: React.MutableRefObject<Array<HTMLDivElement | null>> }) {
  const [s] = STAGE_BOUNDS[2];
  const appear = pct(sp, s, s + 0.07);
  const dissolve = pct(sp, 0.90, 0.96);
  const globalOp = Math.max(0, appear - dissolve * 2);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ opacity: globalOp }}>
      {INTEGRATIONS.map(({ name, angle }, i) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 50 + Math.cos(rad) * 46;
        const cy = 50 + Math.sin(rad) * 46;
        const np = pct(sp, s + i * 0.025, s + 0.04 + i * 0.025);
        return (
          <div key={name} ref={(el) => { nodeRefs.current[i] = el; }}
            className="absolute"
            style={{ left: `${cx}%`, top: `${cy}%`, transform: 'translate(-50%,-50%)', opacity: np, transition: 'opacity 0.3s' }}>
            <div className="relative flex items-center justify-center">
              <div className="absolute w-8 h-8 rounded-full"
                style={{ background: 'radial-gradient(circle,rgba(59,130,246,0.14) 0%,transparent 70%)', transform: 'scale(2)' }} />
              <div className="relative w-8 h-8 rounded-xl border border-[rgba(59,130,246,0.3)] bg-[rgba(5,8,18,0.95)] flex items-center justify-center"
                style={{ boxShadow: '0 0 14px rgba(59,130,246,0.1)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" style={{ animation: 'pulse-glow 2s infinite' }} />
              </div>
              <div className="absolute whitespace-nowrap text-[9px] font-medium text-[#6b7280] tracking-wide"
                style={{ top: angle > 135 && angle < 315 ? 'auto' : '112%', bottom: angle > 135 && angle < 315 ? '112%' : 'auto' }}>
                {name}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Stage3RightPanel({ sp }: { sp: number }) {
  const [s] = STAGE_BOUNDS[2];
  const appear = pct(sp, s + 0.02, s + 0.08);
  const dissolve = pct(sp, 0.90, 0.96);
  const opacity = Math.max(0, appear - dissolve * 2);
  return (
    <div style={{ opacity, transition: 'opacity 0.3s' }}>
      <StepHeader step="03" title="Connect Your Tools" subtitle="Your AI employee integrates with the software you already use every day." active />
      <Panel>
        <div className="text-[9px] tracking-[0.16em] uppercase text-[#4b5563] font-medium mb-3">Integrations</div>
        <div className="space-y-1.5">
          {INTEGRATIONS.map(({ name }, i) => (
            <div key={name}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.04)]"
              style={{ opacity: sp > s + i * 0.025 + 0.02 ? 1 : 0, transition: 'opacity 0.3s' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] flex-shrink-0" style={{ animation: 'pulse-glow 2s infinite' }} />
              <span className="text-[11px] text-[#d1d5db] font-medium flex-1">{name}</span>
              <Check />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ─── Stage 4: Deploy ──────────────────────────────────────────────────────────
function Stage4Panel({ sp }: { sp: number }) {
  const [s] = STAGE_BOUNDS[3];
  const appear = pct(sp, s + 0.01, s + 0.06);
  const chatActive = sp > s + 0.06;
  const metricsActive = sp > s + 0.12;
  const finalMsg = sp > s + 0.18;

  const calls = useCounter(1463, metricsActive, 1400);
  const meetings = useCounter(47, metricsActive, 1000);

  const [chatStep, setChatStep] = useState(0);
  useEffect(() => {
    if (!chatActive) { setChatStep(0); return; }
    const timers = [
      setTimeout(() => setChatStep(1), 300),
      setTimeout(() => setChatStep(2), 1300),
      setTimeout(() => setChatStep(3), 2100),
    ];
    return () => timers.forEach(clearTimeout);
  }, [chatActive]);

  return (
    <div style={{ opacity: appear, transition: 'opacity 0.3s' }}>
      <StepHeader step="04" title="Go Live" subtitle="Your AI employee is now answering customers, booking appointments and working 24/7." active />
      <Panel accentColor="#22c55e">
        {/* Online status */}
        <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-[rgba(34,197,94,0.12)]">
          <div className="relative flex items-center">
            <div className="w-2 h-2 rounded-full bg-[#22c55e]" style={{ animation: 'pulse-glow 1.5s infinite' }} />
            <div className="absolute inset-0 rounded-full bg-[#22c55e] animate-ping opacity-25" />
          </div>
          <span className="text-[11px] tracking-[0.14em] uppercase font-bold text-[#22c55e]">AI EMPLOYEE ONLINE</span>
          <span className="text-[9px] text-[#374151] ml-auto">24/7 Active</span>
        </div>

        {/* Live conversation */}
        <div className="mb-4">
          <div className="text-[9px] tracking-[0.16em] uppercase text-[#4b5563] font-medium mb-3">Live Conversation</div>
          <div className="space-y-2.5 min-h-[90px]">
            <AnimatePresence>
              {chatStep >= 1 && (
                <motion.div key="c1" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.1)] flex-shrink-0 flex items-center justify-center">
                    <span className="text-[7px] text-[#9ca3af]">C</span>
                  </div>
                  <div className="rounded-lg rounded-tl-none bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] px-3 py-2">
                    <span className="text-[11px] text-[#d1d5db]">I'd like to book an appointment.</span>
                  </div>
                </motion.div>
              )}
              {chatStep >= 2 && (
                <motion.div key="c2" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2 flex-row-reverse">
                  <div className="w-5 h-5 rounded-full bg-[rgba(59,130,246,0.18)] border border-[rgba(59,130,246,0.35)] flex-shrink-0 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                  </div>
                  <div className="rounded-lg rounded-tr-none bg-[rgba(59,130,246,0.09)] border border-[rgba(59,130,246,0.2)] px-3 py-2">
                    <span className="text-[11px] text-[#93c5fd]">Absolutely. You're booked for tomorrow at 2:00 PM.</span>
                  </div>
                </motion.div>
              )}
              {chatStep >= 3 && (
                <motion.div key="c3" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 px-1">
                  <Check />
                  <span className="text-[11px] text-[#22c55e] font-medium">Appointment Scheduled</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Calls Answered', value: calls.toLocaleString(), trend: '↑', color: '#22c55e' },
            { label: 'Meetings Booked', value: String(meetings), trend: '↑', color: '#22c55e' },
            { label: 'Response Time', value: '<0.3s', trend: '↓', color: '#3b82f6' },
            { label: 'Revenue Impact', value: '+$12k', trend: '↑', color: '#22c55e' },
          ].map(({ label, value, trend, color }) => (
            <div key={label} className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(8,12,24,0.90)] px-3 py-2.5"
              style={{ opacity: metricsActive ? 1 : 0, transition: 'opacity 0.5s' }}>
              <div className="flex items-baseline gap-1 mb-0.5">
                <span className="text-[1rem] font-bold" style={{ fontFamily: 'Syne,sans-serif', color }}>{value}</span>
                <span className="text-[10px]" style={{ color }}>{trend}</span>
              </div>
              <div className="text-[9px] text-[#4b5563] uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Final sentence */}
      {finalMsg && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 text-center"
        >
          <p className="text-[0.8rem] text-[#9ca3af] leading-relaxed">
            Your AI Employee is now working{' '}
            <span className="text-[#f0f0f0] font-semibold">24/7.</span>
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ─── Progress Tracker ─────────────────────────────────────────────────────────
function ProgressTracker({ stage }: { stage: number }) {
  const steps = ['Connect', 'Train', 'Integrate', 'Deploy'];
  return (
    <div className="absolute left-6 top-1/2 -translate-y-1/2 z-30 hidden xl:flex flex-col gap-1.5 pointer-events-none">
      {steps.map((label, i) => {
        const done = i < stage;
        const active = i === stage;
        return (
          <div key={label} className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500"
              style={{
                background: done ? 'rgba(34,197,94,0.15)' : active ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${done ? 'rgba(34,197,94,0.45)' : active ? 'rgba(59,130,246,0.45)' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: active ? '0 0 10px rgba(59,130,246,0.25)' : 'none',
              }}>
              {done
                ? <Check />
                : <div className="w-1.5 h-1.5 rounded-full transition-colors duration-500"
                    style={{ backgroundColor: active ? '#3b82f6' : 'rgba(255,255,255,0.15)' }} />
              }
            </div>
            <span className="text-[9px] uppercase tracking-wider font-medium transition-colors duration-500"
              style={{ color: done ? '#22c55e' : active ? '#93c5fd' : '#2d3748' }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Compact completed summary pill ──────────────────────────────────────────
function CompletedMilestones({ stage }: { stage: number }) {
  const milestones = ['Business Connected', 'AI Trained', 'Tools Integrated'];
  const visible = milestones.slice(0, stage);
  if (visible.length === 0) return null;
  return (
    <div className="absolute top-16 inset-x-0 flex justify-center z-30 pointer-events-none">
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {visible.map((m) => (
          <div key={m}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.05)]">
            <Check />
            <span className="text-[9px] font-medium text-[#86efac] tracking-wide">{m}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section headline ─────────────────────────────────────────────────────────
function SceneLabel({ sp }: { sp: number }) {
  const showIntro = sp < 0.07;
  return (
    <div className="absolute top-[8%] inset-x-0 z-30 pointer-events-none px-6"
      style={{ opacity: sp < 0.01 ? 1 : Math.max(0, 1 - (sp - 0.01) / 0.04) }}>
      <SceneIntro
        scene="03"
        headline="Building Your First AI Employee"
        body="Watch as the AI Core connects to your business, learns your workflows, and deploys a fully operational AI employee in four steps."
        active={showIntro}
      />
    </div>
  );
}

// ─── Main Scene 3 ─────────────────────────────────────────────────────────────
export function Scene3Section() {
  const outerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [sp, setSp] = useState(0);
  const coreRef = useRef<HTMLDivElement>(null);
  const bizRef = useRef<HTMLDivElement>(null);
  const intNodeRefs = useRef<Array<HTMLDivElement | null>>(Array(INTEGRATIONS.length).fill(null));
  const intensityRef = useMemo(() => ({ current: 0 }), []);

  // Position state for canvas
  const [coreC, setCoreC] = useState({ x: 0, y: 0 });
  const [bizC, setBizC] = useState({ x: 0, y: 0 });
  const [intCenters, setIntCenters] = useState<Array<{ x: number; y: number; active: boolean }>>([]);

  const measurePositions = useCallback(() => {
    if (coreRef.current) {
      const r = coreRef.current.getBoundingClientRect();
      setCoreC({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }
    if (bizRef.current) {
      const r = bizRef.current.getBoundingClientRect();
      setBizC({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }
    const centers = intNodeRefs.current.map((el, i) => {
      if (!el) return { x: 0, y: 0, active: false };
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, active: sp > 0.5 + i * 0.025 };
    });
    setIntCenters(centers);
  }, [sp]);

  useEffect(() => {
    const id = requestAnimationFrame(measurePositions);
    return () => cancelAnimationFrame(id);
  }, [sp, measurePositions]);

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    const init = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);
      const st = ScrollTrigger.create({
        trigger: outerRef.current,
        start: 'top top',
        end: '+=500%',          // 500vh scroll travel — more breathing room
        pin: stickyRef.current,
        scrub: 0.9,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress;
          intensityRef.current = p * 0.45;
          setSp(prev => Math.abs(prev - p) > 0.002 ? p : prev);
        },
      });
      cleanup = () => st.kill();
    };
    init();
    return () => cleanup?.();
  }, [intensityRef]);

  const stage = sp < 0.22 ? 0 : sp < 0.48 ? 1 : sp < 0.72 ? 2 : 3;
  const showStage1 = sp > 0.01;
  const showStage2 = sp > STAGE_BOUNDS[1][0];
  const showStage3 = sp > STAGE_BOUNDS[2][0];
  const showStage4 = sp > STAGE_BOUNDS[3][0];

  // Dim previous stages once they complete (retain but reduce emphasis)
  const s1opacity = stage > 0 ? 0.45 : 1;
  const s2opacity = stage > 1 ? 0.45 : (stage === 1 ? 1 : 0);
  const s3scale = 1 + (stage === 2 ? 0.04 : 0) + (stage === 3 ? 0.06 : 0);

  return (
    // 600vh total: 100vh sticky + 500vh scroll travel
    <div ref={outerRef} id="how-it-works" aria-label="Building Your First AI Employee" style={{ height: '600vh', scrollMarginTop: '64px' }} data-scene="3">
      <div ref={stickyRef} className="relative w-full overflow-hidden" style={{ height: '100vh' }}>

        <ConnectionCanvas sp={sp} coreC={coreC} bizC={bizC} intNodes={intCenters} stage={stage} />

        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none z-0"
          style={{ background: 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(59,130,246,0.04) 0%, transparent 70%)' }} />

        {/* Top / bottom blends */}
        <div className="absolute top-0 inset-x-0 h-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, #050505, transparent)' }} />
        <div className="absolute bottom-0 inset-x-0 h-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #050505, transparent)' }} />

        <SceneLabel sp={sp} />
        <CompletedMilestones stage={stage} />
        <ProgressTracker stage={stage} />

        {/* ── Three-column layout ── */}
        <div className="absolute inset-0 flex items-center z-20">
          <div className="w-full max-w-[1380px] mx-auto px-6 lg:px-10 xl:pl-24">
            <div className="grid lg:grid-cols-[30%_38%_32%] items-center gap-6" style={{ minHeight: '82vh' }}>

              {/* LEFT */}
              <div className="flex items-center justify-end lg:pr-4">
                <div className="w-full max-w-[360px] space-y-4">
                  {showStage1 && (
                    <div style={{ opacity: s1opacity, transform: stage > 0 ? 'scale(0.96) translateY(-4px)' : 'none', transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1)' }}>
                      <Stage1Panel sp={sp} nodeRef={bizRef} />
                    </div>
                  )}
                  {showStage2 && (
                    <div style={{ opacity: s2opacity, transform: stage > 1 ? 'scale(0.96) translateY(-4px)' : 'none', transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1)' }}>
                      <Stage2Panel sp={sp} />
                    </div>
                  )}
                </div>
              </div>

              {/* CENTER — AI Core */}
              <div className="flex items-center justify-center relative">
                <div ref={coreRef} className="relative"
                  style={{ width: '100%', maxWidth: '380px', aspectRatio: '1', transform: `scale(${s3scale})`, transition: 'transform 0.8s cubic-bezier(0.16,1,0.3,1)' }}>
                  {showStage3 && <IntegrationRing sp={sp} nodeRefs={intNodeRefs} />}
                  <div className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ background: `radial-gradient(circle, rgba(59,130,246,${0.04 + sp * 0.05}) 0%, transparent 65%)`, transform: 'scale(1.5)' }} />
                  <AICore className="w-full h-full" scrollIntensity={intensityRef} />
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex items-center justify-start lg:pl-4">
                <div className="w-full max-w-[360px]">
                  {showStage3 && !showStage4 && <Stage3RightPanel sp={sp} />}
                  {showStage4 && <Stage4Panel sp={sp} />}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom progress tracker (mobile) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-5 z-30 xl:hidden">
          {['Connect','Train','Integrate','Deploy'].map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div className="rounded-full transition-all duration-500"
                style={{ width: 6, height: 6, backgroundColor: i < stage ? '#22c55e' : i === stage ? '#3b82f6' : 'rgba(255,255,255,0.1)', boxShadow: i === stage ? '0 0 8px #3b82f6' : 'none' }} />
              <span className="text-[8px] uppercase tracking-wider"
                style={{ color: i < stage ? '#22c55e' : i === stage ? '#93c5fd' : '#1f2937' }}>{label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
