'use client';

import React, {
  useRef, useEffect, useState, useCallback, useMemo,
} from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { AICore } from '@/components/ui/AICore';
import { SceneIntro } from '@/components/ui/SceneIntro';

// ─── Agent nodes around the core ─────────────────────────────────────────────
const AGENT_NODES = [
  { label: 'Receptionist',      angle:   0, color: '#3b82f6' },
  { label: 'Sales',             angle:  60, color: '#8b5cf6' },
  { label: 'Operations',        angle: 120, color: '#06b6d4' },
  { label: 'Support',           angle: 180, color: '#3b82f6' },
  { label: 'Scheduling',        angle: 240, color: '#8b5cf6' },
  { label: 'Lead Qualification', angle: 300, color: '#06b6d4' },
];

// ─── Network canvas: core + agent nodes + connection lines ────────────────────
function NetworkCanvas({
  active,
  containerRef,
}: {
  active: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef(Date.now());
  const entryRef = useRef(0); // entry progress 0→1

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
    const elapsed = (now - startRef.current) / 1000;

    // Entry ramp
    if (active && entryRef.current < 1) {
      entryRef.current = Math.min(entryRef.current + 0.012, 1);
    }
    const entry = entryRef.current;

    ctx.clearRect(0, 0, W, H);
    if (entry <= 0) { rafRef.current = requestAnimationFrame(draw); return; }

    const orbR = Math.min(W, H) * 0.14; // space the orb occupies
    const nodeR = Math.min(W, H) * 0.30; // distance of agent nodes from center

    AGENT_NODES.forEach(({ angle, color }, i) => {
      const rad = (angle * Math.PI) / 180;
      const nodeAppear = Math.min(Math.max((entry - i * 0.12) / 0.15, 0), 1);
      if (nodeAppear <= 0) return;

      const nx = cx + Math.cos(rad) * nodeR;
      const ny = cy + Math.sin(rad) * nodeR;

      // Connection line from center
      const lineLen = nodeAppear;
      const ex = cx + Math.cos(rad) * orbR + (nx - cx - Math.cos(rad) * orbR) * lineLen;
      const ey = cy + Math.sin(rad) * orbR + (ny - cy - Math.sin(rad) * orbR) * lineLen;

      const hex = color.replace('#', '');
      const r = parseInt(hex.slice(0,2),16);
      const g2 = parseInt(hex.slice(2,4),16);
      const b = parseInt(hex.slice(4,6),16);

      const grad = ctx.createLinearGradient(cx + Math.cos(rad)*orbR, cy + Math.sin(rad)*orbR, ex, ey);
      grad.addColorStop(0, `rgba(${r},${g2},${b},0.12)`);
      grad.addColorStop(1, `rgba(${r},${g2},${b},0.35)`);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(rad)*orbR, cy + Math.sin(rad)*orbR);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      if (lineLen < 0.98) return;

      // Travelling pulse along line
      const pulseT = ((elapsed * 0.6 + i * 0.18) % 1);
      const ppx = cx + Math.cos(rad)*orbR + (nx - cx - Math.cos(rad)*orbR) * pulseT;
      const ppy = cy + Math.sin(rad)*orbR + (ny - cy - Math.sin(rad)*orbR) * pulseT;
      const pa = Math.sin(pulseT * Math.PI) * 0.65;
      if (pa > 0.04) {
        const pg = ctx.createRadialGradient(ppx, ppy, 0, ppx, ppy, 5);
        pg.addColorStop(0, `rgba(${r},${g2},${b},${pa})`);
        pg.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(ppx, ppy, 5, 0, Math.PI * 2);
        ctx.fillStyle = pg; ctx.fill();
        ctx.beginPath(); ctx.arc(ppx, ppy, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,220,255,${pa})`; ctx.fill();
      }

      // Node dot
      const nodePulse = 0.6 + 0.4 * Math.sin(elapsed * 1.2 + i * 1.1);
      const nr = (3 + nodePulse * 1.5) * nodeAppear;

      const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr * 5);
      ng.addColorStop(0, `rgba(${r},${g2},${b},${0.3 * nodeAppear})`);
      ng.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(nx, ny, nr * 5, 0, Math.PI * 2);
      ctx.fillStyle = ng; ctx.fill();

      ctx.beginPath(); ctx.arc(nx, ny, nr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,255,${0.85 * nodeAppear})`; ctx.fill();

      // Node ring
      ctx.beginPath();
      ctx.arc(nx, ny, nr * 3.5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r},${g2},${b},${0.18 * nodeAppear})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    });

    rafRef.current = requestAnimationFrame(draw);
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    rafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [draw, containerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden
    />
  );
}

// ─── Agent node labels (CSS-positioned over canvas) ──────────────────────────
function AgentLabels({ active }: { active: boolean }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {AGENT_NODES.map(({ label, angle, color }, i) => {
        const rad = (angle * Math.PI) / 180;
        // Mirror the 30% radius used in canvas
        const cx = 50 + Math.cos(rad) * 30;
        const cy = 50 + Math.sin(rad) * 30;

        return (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={active ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.5 + i * 0.12, ease: [0.16,1,0.3,1] }}
            className="absolute flex flex-col items-center gap-1"
            style={{ left: `${cx}%`, top: `${cy}%`, transform: 'translate(-50%, -50%)' }}
          >
            {/* Just the label below the node dot drawn by canvas */}
            <div className="mt-5 text-[9px] font-medium tracking-wide whitespace-nowrap"
              style={{ color }}>
              {label}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Activity feed ────────────────────────────────────────────────────────────
const ACTIVITY_POOL = [
  { icon: '📅', text: 'Appointment booked',         agent: 'Receptionist', color: '#3b82f6' },
  { icon: '✅', text: 'Lead qualified',               agent: 'Sales',        color: '#8b5cf6' },
  { icon: '💬', text: 'WhatsApp replied',             agent: 'Support',      color: '#3b82f6' },
  { icon: '🔧', text: 'Workflow automated',           agent: 'Operations',   color: '#06b6d4' },
  { icon: '📧', text: 'Follow-up email sent',         agent: 'Scheduling',   color: '#8b5cf6' },
  { icon: '🎯', text: 'Customer inquiry resolved',    agent: 'Support',      color: '#3b82f6' },
  { icon: '💰', text: 'Invoice generated',            agent: 'Operations',   color: '#06b6d4' },
  { icon: '⭐', text: 'Review request sent',          agent: 'Scheduling',   color: '#8b5cf6' },
  { icon: '📞', text: 'Inbound call handled',         agent: 'Receptionist', color: '#3b82f6' },
  { icon: '🚀', text: 'Proposal sent',                agent: 'Sales',        color: '#8b5cf6' },
  { icon: '🗓️', text: 'Reminder dispatched',         agent: 'Scheduling',   color: '#06b6d4' },
  { icon: '🤝', text: 'Meeting confirmed',            agent: 'Lead Qual.',   color: '#3b82f6' },
];

interface ActivityItem {
  id: string;
  icon: string;
  text: string;
  agent: string;
  color: string;
  secsAgo: number;
}

function ActivityFeed({ active }: { active: boolean }) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const poolIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Age items every second
  useEffect(() => {
    if (!active) return;
    const ageId = setInterval(() => {
      setItems(prev => prev.map(i => ({ ...i, secsAgo: i.secsAgo + 1 })));
    }, 1000);
    return () => clearInterval(ageId);
  }, [active]);

  // Spawn new items
  useEffect(() => {
    if (!active) return;
    // Seed initial items with staggered ages
    const initial: ActivityItem[] = [0,1,2,3].map((j) => {
      const p = ACTIVITY_POOL[(poolIdxRef.current++) % ACTIVITY_POOL.length];
      return { ...p, id: `init-${j}`, secsAgo: 12 - j * 3 };
    });
    setItems(initial);

    timerRef.current = setInterval(() => {
      const p = ACTIVITY_POOL[(poolIdxRef.current++) % ACTIVITY_POOL.length];
      const item: ActivityItem = { ...p, id: `act-${Date.now()}`, secsAgo: 0 };
      setItems(prev => [item, ...prev].slice(0, 7));
    }, 2200);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [active]);

  const formatAge = (s: number) => {
    if (s < 5) return 'just now';
    if (s < 60) return `${s}s ago`;
    return `${Math.floor(s / 60)}m ago`;
  };

  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(5,8,18,0.93)] overflow-hidden"
      style={{ boxShadow: '0 0 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(59,130,246,0.06)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" style={{ animation: 'pulse-glow 1.5s infinite' }} />
          <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#9ca3af]">Live Activity</span>
        </div>
        <span className="text-[9px] text-[#2d3748]">Real-time</span>
      </div>

      {/* Feed */}
      <div className="px-4 py-3 space-y-1" style={{ minHeight: 260 }}>
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3 py-2 border-b border-[rgba(255,255,255,0.03)] last:border-0"
            >
              <span className="text-[13px] flex-shrink-0 w-5 text-center">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-[#d1d5db] font-medium">{item.text}</span>
                <span className="text-[10px] ml-2 font-medium" style={{ color: item.color }}>
                  · {item.agent}
                </span>
              </div>
              <span className="text-[9px] text-[#2d3748] flex-shrink-0 tabular-nums">
                {formatAge(item.secsAgo)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── KPI cards ────────────────────────────────────────────────────────────────
interface KPI {
  label: string;
  value: number;
  suffix: string;
  prefix: string;
  increment: number;
  color: string;
  interval: number; // ms between increments
}

const INITIAL_KPIS: KPI[] = [
  { label: 'Calls Answered',        value: 24850, suffix: '',   prefix: '',  increment: 1,  color: '#3b82f6', interval: 3200 },
  { label: 'Conversations Handled', value: 18340, suffix: '',   prefix: '',  increment: 1,  color: '#8b5cf6', interval: 2800 },
  { label: 'Appointments Booked',   value:  5621, suffix: '',   prefix: '',  increment: 1,  color: '#22c55e', interval: 4100 },
  { label: 'Tasks Automated',       value: 91200, suffix: '',   prefix: '',  increment: 10, color: '#06b6d4', interval: 2200 },
  { label: 'Revenue Influenced',    value:   284, suffix: 'k',  prefix: '$', increment: 1,  color: '#22c55e', interval: 5500 },
  { label: 'Avg Response Time',     value:   0.3, suffix: 's',  prefix: '<', increment: 0,  color: '#3b82f6', interval: 0 },
];

function KpiCards({ active }: { active: boolean }) {
  const [kpis, setKpis] = useState<KPI[]>(INITIAL_KPIS);

  useEffect(() => {
    if (!active) return;
    const timers = INITIAL_KPIS
      .filter(k => k.increment > 0)
      .map((k, i) => {
        const id = setInterval(() => {
          setKpis(prev => prev.map(p =>
            p.label === k.label ? { ...p, value: p.value + p.increment } : p
          ));
        }, k.interval);
        return id;
      });
    return () => timers.forEach(clearInterval);
  }, [active]);

  const fmt = (k: KPI) => {
    const n = k.value >= 1000 ? k.value.toLocaleString() : String(k.value);
    return `${k.prefix}${n}${k.suffix}`;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {kpis.map((k, i) => (
        <motion.div
          key={k.label}
          initial={{ opacity: 0, y: 12 }}
          animate={active ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16,1,0.3,1] }}
          className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(5,8,18,0.92)] px-4 py-3.5"
          style={{ boxShadow: '0 0 20px rgba(0,0,0,0.6)' }}
        >
          <motion.div
            key={fmt(k)}
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="text-[1.25rem] font-bold mb-0.5 tabular-nums"
            style={{ fontFamily: 'Syne, sans-serif', color: k.color }}
          >
            {fmt(k)}
          </motion.div>
          <div className="text-[9px] text-[#4b5563] uppercase tracking-wider">{k.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Proof cards ──────────────────────────────────────────────────────────────
const PROOFS = [
  {
    stars: 5,
    quote: 'Reduced missed calls by 96%',
    biz: 'Dental Clinic',
    delay: 0,
    floatPhase: 0,
  },
  {
    stars: 5,
    quote: '240 appointments booked in the first month',
    biz: 'Real Estate Agency',
    delay: 0.15,
    floatPhase: 2.1,
  },
  {
    stars: 5,
    quote: 'Customer support available 24 / 7',
    biz: 'E-commerce Brand',
    delay: 0.3,
    floatPhase: 4.2,
  },
];

function ProofCards({ active }: { active: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {PROOFS.map(({ stars, quote, biz, delay, floatPhase }) => (
        <motion.div
          key={biz}
          initial={{ opacity: 0, y: 16 }}
          animate={active ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay, ease: [0.16,1,0.3,1] }}
          className="rounded-2xl border border-[rgba(59,130,246,0.14)] bg-[rgba(5,8,18,0.92)] px-5 py-5"
          style={{
            boxShadow: '0 0 30px rgba(0,0,0,0.7), inset 0 1px 0 rgba(59,130,246,0.06)',
            animation: `float-card-${floatPhase > 3 ? 'c' : floatPhase > 1 ? 'b' : 'a'} 6s ease-in-out infinite`,
            animationDelay: `${floatPhase}s`,
          }}
        >
          {/* Stars */}
          <div className="flex gap-0.5 mb-3">
            {Array.from({ length: stars }).map((_, i) => (
              <span key={i} className="text-[#f59e0b] text-[12px]">★</span>
            ))}
          </div>
          <p className="text-[0.875rem] font-semibold text-[#e8eaed] leading-[1.45] mb-3"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            "{quote}"
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" style={{ animation: 'pulse-glow 2s infinite' }} />
            <span className="text-[10px] text-[#6b7280]">{biz}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Closing line ─────────────────────────────────────────────────────────────
function ClosingLine({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center py-12"
        >
          <div className="inline-flex items-center gap-3 text-[9px] tracking-[0.22em] uppercase text-[#2d3748] mb-5">
            <span className="w-8 h-px bg-[rgba(255,255,255,0.06)]" />
            The Opportunity
            <span className="w-8 h-px bg-[rgba(255,255,255,0.06)]" />
          </div>
          <p className="text-[1.5rem] sm:text-[1.9rem] font-semibold text-[#e8eaed] max-w-lg mx-auto leading-[1.3]"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>
            Your business<br />
            <span style={{
              background: 'linear-gradient(125deg, #bfdbfe 0%, #60a5fa 40%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              could be next.
            </span>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Scene 5 ─────────────────────────────────────────────────────────────
export function Scene5Section() {
  const sectionRef = useRef<HTMLElement>(null);
  const networkContainerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-8% 0px' });
  const [showClosing, setShowClosing] = useState(false);
  const intensityRef = useMemo(() => ({ current: 0.15 }), []);

  useEffect(() => {
    if (!inView) return;
    intensityRef.current = 0.25;
    const t = setTimeout(() => setShowClosing(true), 5000);
    return () => clearTimeout(t);
  }, [inView, intensityRef]);

  return (
    <section ref={sectionRef} id="about" aria-label="Your AI Workforce Never Stops Working" className="relative py-20 lg:py-28" data-scene="5" style={{ scrollMarginTop: '64px' }}>
      {/* Top blend */}
      <div className="absolute top-0 inset-x-0 h-24 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to bottom, #050505, transparent)' }} />

      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 30%, rgba(59,130,246,0.04) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-[1380px] mx-auto px-6 lg:px-10">

        {/* Section heading */}
        <div className="mb-14">
          <SceneIntro
            headline="Your AI Workforce Never Stops Working"
            body="See your AI employees working around the clock."
          />
        </div>

        {/* ── Top zone: network + activity ── */}
        <div className="grid lg:grid-cols-[55%_45%] gap-6 items-center mb-10">

          {/* Network visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16,1,0.3,1] }}
            ref={networkContainerRef}
            className="relative aspect-square max-h-[440px]"
          >
            <NetworkCanvas active={inView} containerRef={networkContainerRef} />
            <AgentLabels active={inView} />
            {/* AI Core centered */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-[42%] aspect-square">
                <div className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(circle,rgba(59,130,246,0.07) 0%,transparent 65%)', transform:'scale(1.8)' }} />
                <AICore className="w-full h-full" scrollIntensity={intensityRef} />
              </div>
            </div>
          </motion.div>

          {/* Activity feed */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.16,1,0.3,1] }}
          >
            <ActivityFeed active={inView} />
          </motion.div>
        </div>

        {/* ── KPI strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mb-10"
        >
          <div className="text-[9px] tracking-[0.2em] uppercase text-[#2d3748] mb-4 text-center">
            Cumulative Impact
          </div>
          <KpiCards active={inView} />
        </motion.div>

        {/* ── Proof cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="mb-4"
        >
          <div className="text-[9px] tracking-[0.2em] uppercase text-[#2d3748] mb-4 text-center">
            Client Results
          </div>
          <ProofCards active={inView} />
        </motion.div>

        {/* ── Closing line ── */}
        <ClosingLine visible={showClosing} />

      </div>

      {/* Bottom blend */}
      <div className="absolute bottom-0 inset-x-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #050505, transparent)' }} />
    </section>
  );
}
