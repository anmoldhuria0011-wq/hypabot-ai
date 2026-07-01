'use client';

import React, {
  useRef, useEffect, useState, useCallback, useMemo,
} from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { AICore } from '@/components/ui/AICore';
import { SceneIntro } from '@/components/ui/SceneIntro';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
  timestamp: string;
}

interface Metric {
  label: string;
  value: string;
  raw: number;
  suffix: string;
  increment: number;
  color: string;
}

// ─── Prompt library ───────────────────────────────────────────────────────────
const PROMPTS = [
  {
    question: 'Can you book appointments?',
    answer: `Absolutely. I handle scheduling end-to-end — checking availability, booking slots, sending confirmations, and following up with reminders. Customers can book via chat, WhatsApp, or email, any time of day. Your calendar stays perfectly organised without any manual input from your team.`,
    metricIndex: 0,
  },
  {
    question: 'Can you answer after office hours?',
    answer: `Yes — I never go offline. Whether it's 2 AM or a public holiday, I respond instantly, qualify the lead, answer questions, and take action. Your business keeps moving while your team rests. Most clients find that 30–40% of their new inquiries arrive outside business hours.`,
    metricIndex: 1,
  },
  {
    question: 'Can you qualify leads?',
    answer: `That's one of my core strengths. I ask the right questions, score each lead against your criteria, and route hot prospects directly to your sales team — flagged and ready. Cold leads get nurtured automatically. You only spend time on conversations that are worth it.`,
    metricIndex: 1,
  },
  {
    question: 'Can you speak multiple languages?',
    answer: `I communicate fluently in 47 languages — automatically detecting the customer's language and responding in kind. Your team only needs to operate in one language. I handle the rest, making your business feel local everywhere in the world.`,
    metricIndex: 2,
  },
  {
    question: 'Can you integrate with my CRM?',
    answer: `Yes. I connect with HubSpot, Salesforce, Pipedrive, and most major CRMs. Every conversation is automatically logged, contacts are created or updated, and deal stages are progressed — all without your team lifting a finger. Your CRM stays accurate in real time.`,
    metricIndex: 2,
  },
  {
    question: 'Can you answer WhatsApp messages?',
    answer: `Absolutely. I operate across WhatsApp, Instagram, Facebook Messenger, your website chat, and email — all from one unified system. Customers reach you wherever they are, and I respond with the same quality on every channel.`,
    metricIndex: 0,
  },
];

// ─── Metrics ─────────────────────────────────────────────────────────────────
const INITIAL_METRICS: Metric[] = [
  { label: 'Appointments Booked', value: '532', raw: 532, suffix: '', increment: 1, color: '#22c55e' },
  { label: 'Qualified Leads', value: '1,250', raw: 1250, suffix: '', increment: 1, color: '#3b82f6' },
  { label: 'Customer Satisfaction', value: '95%', raw: 95, suffix: '%', increment: 1, color: '#22c55e' },
  { label: 'Avg Response Time', value: '<0.3s', raw: 0, suffix: '', increment: 0, color: '#3b82f6' },
];

// ─── Streaming hook ───────────────────────────────────────────────────────────
function useStreamText(text: string, active: boolean, charsPerTick = 3, interval = 18) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const posRef = useRef(0);

  useEffect(() => {
    if (!active) { setDisplayed(''); setDone(false); posRef.current = 0; return; }
    posRef.current = 0;
    setDisplayed('');
    setDone(false);

    const tick = () => {
      posRef.current = Math.min(posRef.current + charsPerTick, text.length);
      setDisplayed(text.slice(0, posRef.current));
      if (posRef.current < text.length) {
        timerRef.current = setTimeout(tick, interval);
      } else {
        setDone(true);
      }
    };

    // Small delay before starting — feels more natural
    timerRef.current = setTimeout(tick, 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active, text, charsPerTick, interval]);

  return { displayed, done };
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
        style={{
          background: isUser ? 'rgba(255,255,255,0.07)' : 'rgba(59,130,246,0.15)',
          border: isUser ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(59,130,246,0.3)',
        }}>
        {isUser
          ? <span className="text-[9px] text-[#9ca3af]">You</span>
          : <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" style={{ animation: 'pulse-glow 2s infinite' }} />
        }
      </div>

      {/* Bubble */}
      <div className="max-w-[82%]">
        <div className="rounded-2xl px-4 py-3"
          style={{
            background: isUser ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.08)',
            border: isUser ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(59,130,246,0.18)',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          }}>
          <p className="text-[13px] leading-[1.7] text-[#d1d5db] whitespace-pre-wrap">
            {msg.text}
            {msg.streaming && (
              <span className="inline-block w-0.5 h-3.5 bg-[#3b82f6] ml-0.5 rounded-sm"
                style={{ animation: 'pulse-glow 0.8s infinite', verticalAlign: 'middle' }} />
            )}
          </p>
        </div>
        <div className={`text-[9px] text-[#374151] mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {msg.timestamp}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Thinking indicator ───────────────────────────────────────────────────────
function ThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="flex items-end gap-2.5"
    >
      <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
        <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" style={{ animation: 'pulse-glow 1s infinite' }} />
      </div>
      <div className="rounded-2xl px-4 py-3.5"
        style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.14)', borderRadius: '18px 18px 18px 4px' }}>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"
              style={{ animation: `pulse-glow 1.2s ${i * 0.2}s ease-in-out infinite` }} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Prompt chips ─────────────────────────────────────────────────────────────
function PromptChips({
  prompts,
  usedIndices,
  onSelect,
  disabled,
}: {
  prompts: typeof PROMPTS;
  usedIndices: Set<number>;
  onSelect: (idx: number) => void;
  disabled: boolean;
}) {
  const available = prompts
    .map((p, i) => ({ ...p, i }))
    .filter(({ i }) => !usedIndices.has(i));

  if (available.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {available.slice(0, 4).map(({ question, i }) => (
        <button
          key={i}
          onClick={() => !disabled && onSelect(i)}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200"
          style={{
            background: 'rgba(59,130,246,0.07)',
            border: '1px solid rgba(59,130,246,0.2)',
            color: disabled ? '#374151' : '#93c5fd',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
          }}
          onMouseEnter={e => {
            if (!disabled) {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.14)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(59,130,246,0.4)';
            }
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.07)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(59,130,246,0.2)';
          }}
        >
          <span className="text-[#3b82f6] text-[10px]">→</span>
          {question}
        </button>
      ))}
    </div>
  );
}

// ─── Live metrics panel ───────────────────────────────────────────────────────
function MetricsPanel({ metrics, pulsing }: { metrics: Metric[]; pulsing: boolean }) {
  return (
    <div className="mt-6 space-y-2.5">
      <div className="text-[9px] tracking-[0.18em] uppercase text-[#374151] font-medium mb-3">Live Activity</div>
      {metrics.map(({ label, value, color }) => (
        <div key={label} className="flex items-center justify-between">
          <span className="text-[10px] text-[#4b5563]">{label}</span>
          <motion.span
            key={value}
            initial={{ opacity: 0.5, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-[11px] font-semibold tabular-nums"
            style={{ color, fontFamily: 'Syne, sans-serif' }}
          >
            {value}
          </motion.span>
        </div>
      ))}
    </div>
  );
}

// ─── AI Core status panel ─────────────────────────────────────────────────────
function CoreStatusPanel({ pulsing }: { pulsing: boolean }) {
  const stats = [
    { label: 'Status', value: 'Online', color: '#22c55e' },
    { label: 'Response Time', value: '<0.3s', color: '#3b82f6' },
    { label: 'Confidence', value: '99%', color: '#3b82f6' },
    { label: 'Memory', value: 'Synced', color: '#22c55e' },
    { label: 'Uptime', value: '24/7', color: '#22c55e' },
  ];
  return (
    <div className="rounded-2xl border border-[rgba(59,130,246,0.14)] bg-[rgba(5,8,18,0.92)] px-5 py-4 mt-4"
      style={{ boxShadow: '0 0 30px rgba(0,0,0,0.7), inset 0 1px 0 rgba(59,130,246,0.07)' }}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {stats.map(({ label, value, color }) => (
          <div key={label}>
            <div className="text-[9px] text-[#374151] uppercase tracking-wider mb-0.5">{label}</div>
            <div className="flex items-center gap-1.5">
              {label === 'Status' && (
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: '#22c55e', animation: 'pulse-glow 1.5s infinite' }} />
              )}
              <span className="text-[11px] font-semibold" style={{ color, fontFamily: 'Syne, sans-serif' }}>
                {value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Assembly animation canvas ────────────────────────────────────────────────
// Draws the "assembling from energy" entrance — lightweight, CSS-only approach
function AssemblyOverlay({ progress }: { progress: number }) {
  if (progress >= 1) return null;
  const inv = 1 - progress;
  return (
    <div className="absolute inset-0 pointer-events-none z-10 rounded-2xl overflow-hidden">
      {/* Corner brackets drawing in */}
      {['tl', 'tr', 'bl', 'br'].map((c) => (
        <div key={c} className="absolute w-6 h-6"
          style={{
            top: c.startsWith('t') ? 0 : 'auto',
            bottom: c.startsWith('b') ? 0 : 'auto',
            left: c.endsWith('l') ? 0 : 'auto',
            right: c.endsWith('r') ? 0 : 'auto',
            opacity: inv,
          }}>
          <div className="absolute inset-0"
            style={{
              borderTop: c.startsWith('t') ? '1px solid rgba(59,130,246,0.5)' : 'none',
              borderBottom: c.startsWith('b') ? '1px solid rgba(59,130,246,0.5)' : 'none',
              borderLeft: c.endsWith('l') ? '1px solid rgba(59,130,246,0.5)' : 'none',
              borderRight: c.endsWith('r') ? '1px solid rgba(59,130,246,0.5)' : 'none',
            }} />
        </div>
      ))}
      {/* Scan line */}
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgba(59,130,246,0.4)] to-transparent"
        style={{ top: `${(1 - inv) * 100}%`, opacity: inv * 2 }} />
    </div>
  );
}

// ─── Final closing message ────────────────────────────────────────────────────
function ClosingMessage({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-center py-16"
        >
          <div className="text-[9px] tracking-[0.2em] uppercase text-[#374151] mb-4">
            <span className="w-8 h-px bg-[rgba(255,255,255,0.06)] inline-block align-middle mr-3" />
            The Result
            <span className="w-8 h-px bg-[rgba(255,255,255,0.06)] inline-block align-middle ml-3" />
          </div>
          <p className="text-[1.4rem] sm:text-[1.7rem] font-semibold text-[#e8eaed] max-w-xl mx-auto leading-[1.35]"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>
            Imagine every customer receiving this experience —{' '}
            <span style={{
              background: 'linear-gradient(125deg, #bfdbfe 0%, #60a5fa 40%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              24 hours a day.
            </span>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Scene 4 ─────────────────────────────────────────────────────────────
export function Scene4Section() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-10% 0px' });

  const [messages, setMessages] = useState<Message[]>([]);
  const [thinking, setThinking] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [metrics, setMetrics] = useState<Metric[]>(INITIAL_METRICS);
  const [pulsing, setPulsing] = useState(false);
  const [assembled, setAssembled] = useState(0); // 0 → 1 assembly progress
  const [interactionCount, setInteractionCount] = useState(0);
  const [showClosing, setShowClosing] = useState(false);

  const intensityRef = useMemo(() => ({ current: 0 }), []);

  // Entrance assembly animation
  useEffect(() => {
    if (!inView) return;
    // Initial greeting after assembly
    const assembleTimer = setTimeout(() => {
      setAssembled(1);
      setTimeout(() => {
        const now = new Date();
        const ts = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages([{
          id: 'intro',
          role: 'assistant',
          text: '',
          streaming: true,
          timestamp: ts,
        }]);
        setStreamingId('intro');
      }, 400);
    }, 600);
    return () => clearTimeout(assembleTimer);
  }, [inView]);

  // Assembly progress ramp
  useEffect(() => {
    if (!inView) return;
    let v = 0;
    const id = setInterval(() => {
      v = Math.min(v + 0.04, 1);
      setAssembled(v);
      if (v >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [inView]);

  // Stream text for a message
  const streamMessage = useCallback((msgId: string, text: string, onDone?: () => void) => {
    let pos = 0;
    const tick = () => {
      pos = Math.min(pos + 3, text.length);
      setStreamingText(text.slice(0, pos));
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: text.slice(0, pos), streaming: pos < text.length } : m));
      if (pos < text.length) {
        setTimeout(tick, 16);
      } else {
        setStreamingText('');
        setStreamingId(null);
        onDone?.();
      }
    };
    setTimeout(tick, 700);
  }, []);

  // Stream the intro greeting
  useEffect(() => {
    if (streamingId !== 'intro') return;
    const intro = `Hi there. I'm your AI Employee, powered by HYPA BOT.\n\nI'm already connected to your business systems and ready to work. You can ask me anything — or choose a question below to see what I can do for you.`;
    streamMessage('intro', intro);
  }, [streamingId, streamMessage]);

  // Handle prompt selection
  const handlePrompt = useCallback((promptIdx: number) => {
    if (thinking || streamingId) return;
    const prompt = PROMPTS[promptIdx];
    const now = new Date();
    const ts = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userId = `user-${Date.now()}`;
    const aiId = `ai-${Date.now()}`;

    setUsedIndices(prev => new Set([...prev, promptIdx]));
    setThinking(true);
    setPulsing(true);
    intensityRef.current = 0.6;

    // Add user message
    setMessages(prev => [...prev, { id: userId, role: 'user', text: prompt.question, timestamp: ts }]);

    // After thinking delay, stream AI response
    setTimeout(() => {
      setThinking(false);
      setStreamingId(aiId);
      setMessages(prev => [...prev, { id: aiId, role: 'assistant', text: '', streaming: true, timestamp: ts }]);

      streamMessage(aiId, prompt.answer, () => {
        setPulsing(false);
        intensityRef.current = 0.2;

        // Update metric
        setMetrics(prev => prev.map((m, i) => {
          if (i !== prompt.metricIndex || m.increment === 0) return m;
          const newRaw = m.raw + m.increment;
          const newValue = m.suffix === '%'
            ? `${newRaw}%`
            : newRaw >= 1000
              ? newRaw.toLocaleString()
              : String(newRaw);
          return { ...m, raw: newRaw, value: newValue };
        }));

        const newCount = interactionCount + 1;
        setInteractionCount(newCount);
        if (newCount >= 4) {
          setTimeout(() => setShowClosing(true), 1200);
        }
      });
    }, 900 + Math.random() * 400);
  }, [thinking, streamingId, intensityRef, interactionCount, streamMessage]);

  // Ref for the chat scroll container (NOT the end sentinel)
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ONLY the chat container — never the page
  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, thinking]);

  // Intensity fades when idle
  useEffect(() => {
    if (!pulsing) {
      const t = setTimeout(() => { intensityRef.current = 0.1; }, 2000);
      return () => clearTimeout(t);
    }
  }, [pulsing, intensityRef]);

  const isIdle = !thinking && !streamingId;

  return (
    <section ref={sectionRef} id="demo" aria-label="Talk to Your AI Employee" className="relative pt-24 pb-20" data-scene="4" style={{ scrollMarginTop: '64px' }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 40% 50%, rgba(59,130,246,0.04) 0%, transparent 70%)' }} />

      {/* Top blend from Scene 3 */}
      <div className="absolute top-0 inset-x-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, #050505, transparent)' }} />

      <div className="relative z-10 w-full max-w-[1380px] mx-auto px-6 lg:px-10">

        {/* Section heading */}
        <div className="mb-10 lg:mb-12">
          <SceneIntro
            headline="Talk To Your AI Employee"
            body="Experience your future AI employee before booking a strategy call."
          />
        </div>

        {/* Main two-column layout */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="grid lg:grid-cols-[62%_38%] gap-6 items-start"
        >

          {/* LEFT — Chat interface */}
          <div className="relative rounded-2xl border border-[rgba(59,130,246,0.18)] bg-[rgba(5,8,18,0.95)]"
            style={{ boxShadow: '0 0 60px rgba(0,0,0,0.8), 0 0 24px rgba(59,130,246,0.04), inset 0 1px 0 rgba(59,130,246,0.08)' }}>

            <AssemblyOverlay progress={assembled} />

            {/* Chat header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(59,130,246,0.1)]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.35)] flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-[#3b82f6]" style={{ animation: 'pulse-glow 2s infinite' }} />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#22c55e] border-2 border-[#050505]" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#f0f0f0]" style={{ fontFamily: 'Syne, sans-serif' }}>
                    AI Employee
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" style={{ animation: 'pulse-glow 1.5s infinite' }} />
                    <span className="text-[9px] text-[#22c55e] font-medium tracking-wide">ONLINE</span>
                    <span className="text-[9px] text-[#374151]">· Powered by HYPA BOT</span>
                  </div>
                </div>
              </div>

              {/* Window dots */}
              <div className="flex items-center gap-1.5">
                {['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.06)', 'rgba(59,130,246,0.25)'].map((c, i) => (
                  <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>

            {/* Messages area */}
            <div ref={chatScrollRef} className="px-5 py-5 space-y-4 overflow-y-auto" style={{ minHeight: '340px', maxHeight: '420px' }}>
              <AnimatePresence initial={false}>
                {messages.map(msg => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}
                {thinking && <ThinkingIndicator key="thinking" />}
              </AnimatePresence>
            </div>

            {/* Prompt chips + input area */}
            <div className="px-5 pb-5 border-t border-[rgba(255,255,255,0.04)] pt-4">
              <div className="text-[9px] text-[#374151] uppercase tracking-wider mb-2">Ask your AI Employee</div>
              <PromptChips
                prompts={PROMPTS}
                usedIndices={usedIndices}
                onSelect={handlePrompt}
                disabled={!isIdle || assembled < 1}
              />
              {usedIndices.size >= PROMPTS.length && (
                <p className="text-[11px] text-[#374151] mt-3">
                  All questions answered. Your AI Employee is ready for deployment.
                </p>
              )}
            </div>
          </div>

          {/* RIGHT — AI Core + status */}
          <div className="flex flex-col gap-0">
            {/* AI Core */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full aspect-square max-w-[340px] mx-auto"
            >
              {/* Pulsing bloom during response */}
              <div className="absolute inset-0 rounded-full pointer-events-none transition-all duration-700"
                style={{
                  background: `radial-gradient(circle, rgba(59,130,246,${pulsing ? 0.12 : 0.05}) 0%, transparent 65%)`,
                  transform: 'scale(1.4)',
                }} />
              <AICore className="w-full h-full" scrollIntensity={intensityRef} />
            </motion.div>

            {/* Status + metrics */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <CoreStatusPanel pulsing={pulsing} />
              <MetricsPanel metrics={metrics} pulsing={pulsing} />
            </motion.div>
          </div>

        </motion.div>

        {/* Closing message */}
        <ClosingMessage visible={showClosing} />

      </div>

      {/* Bottom blend into CTA */}
      <div className="absolute bottom-0 inset-x-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #050505, transparent)' }} />
    </section>
  );
}
