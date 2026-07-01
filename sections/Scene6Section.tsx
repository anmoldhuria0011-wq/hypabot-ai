'use client';

import React, {
  useRef, useEffect, useState, useCallback, useMemo,
} from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { AICore } from '@/components/ui/AICore';
import { ArrowRight, Check, ExternalLink, Mail } from 'lucide-react';
import { SceneIntro } from '@/components/ui/SceneIntro';

// ─── Form state machine ───────────────────────────────────────────────────────
type FormStage = 'select' | 'expand' | 'success';

const SERVICE_OPTIONS = [
  'Answer customer calls',
  'Book appointments',
  'Qualify leads',
  'Customer support',
  'Sales follow-up',
  'Internal operations',
  'Something else',
];

interface FormData {
  service: string;
  name: string;
  business: string;
  email: string;
  phone: string;
  challenge: string;
}

const EMPTY_FORM: FormData = {
  service: '', name: '', business: '', email: '', phone: '', challenge: '',
};

// ─── Service chip ─────────────────────────────────────────────────────────────
function ServiceChip({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[12px] font-medium transition-all duration-250 text-left"
      style={{
        background: selected ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${selected ? 'rgba(59,130,246,0.45)' : 'rgba(255,255,255,0.08)'}`,
        color: selected ? '#93c5fd' : '#9ca3af',
        boxShadow: selected ? '0 0 16px rgba(59,130,246,0.12)' : 'none',
        cursor: 'pointer',
      }}
    >
      {selected && <Check className="w-3 h-3 flex-shrink-0" style={{ color: '#3b82f6' }} />}
      {label}
    </button>
  );
}

// ─── Form field ───────────────────────────────────────────────────────────────
function Field({
  label, name, type = 'text', value, onChange, placeholder, required, textarea, error,
}: {
  label: string; name: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  required?: boolean; textarea?: boolean; error?: string;
}) {
  const base: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.09)'}`,
    color: '#e8eaed',
    outline: 'none',
    width: '100%',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    resize: 'none',
  };

  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-[#6b7280] mb-1.5 font-medium">
        {label}{required && <span className="text-[#3b82f6] ml-0.5">*</span>}
      </label>
      {textarea
        ? <textarea name={name} value={value} rows={3} placeholder={placeholder}
            onChange={e => onChange(e.target.value)} style={base}
            onFocus={e => { e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.7)' : 'rgba(59,130,246,0.45)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.09)'; }} />
        : <input type={type} name={name} value={value} placeholder={placeholder}
            onChange={e => onChange(e.target.value)} style={base}
            onFocus={e => { e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.7)' : 'rgba(59,130,246,0.45)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.09)'; }} />
      }
      {error && (
        <p className="text-[10px] text-[#fca5a5] mt-1">{error}</p>
      )}
    </div>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────────
type FieldErrors = Partial<Record<keyof FormData, string>>;

function validateForm(form: FormData): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim()) errors.name = 'Your name is required';
  if (!form.business.trim()) errors.business = 'Business name is required';
  if (!form.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Please enter a valid email';
  }
  if (!form.phone.trim()) {
    errors.phone = 'Phone number is required';
  } else if (form.phone.replace(/\D/g, '').length < 7) {
    errors.phone = 'Please enter a valid phone number';
  }
  if (!form.challenge.trim()) errors.challenge = 'Please describe your challenge';
  return errors;
}

// ─── CTA Panel ────────────────────────────────────────────────────────────────
function CTAPanel({ onSubmit }: { onSubmit: () => void }) {
  const [stage, setStage] = useState<FormStage>('select');
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false); // prevent double-submit

  const setField = (k: keyof FormData) => (v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    // Clear field error on change
    if (fieldErrors[k]) setFieldErrors(e => ({ ...e, [k]: undefined }));
  };

  const handleServiceSelect = (svc: string) => {
    setForm(f => ({ ...f, service: svc }));
    setTimeout(() => setStage('expand'), 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || submitted) return;

    // Client-side validation
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          business: form.business,
          email: form.email,
          phone: form.phone,
          service: form.service,
          challenge: form.challenge,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Submission failed');
      }

      setSubmitted(true);
      setStage('success');
      onSubmit();

    } catch (err) {
      console.error('Form submission error:', err);
      setSubmitError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  // All required fields filled (service selected separately via chips)
  const canSubmit =
    form.service.trim() &&
    form.name.trim() &&
    form.business.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.challenge.trim();

  // ── Success view ─────────────────────────────────────────────────────────
  if (stage === 'success') {
    return (
      <div className="rounded-2xl border border-[rgba(59,130,246,0.18)] bg-[rgba(5,8,18,0.95)] px-7 py-8"
        style={{ boxShadow: '0 0 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(59,130,246,0.08)' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="py-6 text-center"
        >
          <div className="w-12 h-12 rounded-full bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.3)] flex items-center justify-center mx-auto mb-5">
            <Check className="w-5 h-5 text-[#22c55e]" />
          </div>
          <h3 className="text-[1.1rem] font-bold text-[#f0f0f0] mb-2"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.01em' }}>
            Thank you.
          </h3>
          <p className="text-[0.875rem] text-[#6b7280] leading-relaxed">
            Your strategy request has been received.<br />
            We'll contact you shortly.
          </p>
          <div className="mt-6 pt-5 border-t border-[rgba(255,255,255,0.05)] flex justify-center gap-6">
            {['Free Strategy Session', 'No Obligation', 'Custom AI Strategy'].map(t => (
              <div key={t} className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-[#22c55e]" />
                <span className="text-[10px] text-[#6b7280]">{t}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Select / Expand view ──────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-[rgba(59,130,246,0.18)] bg-[rgba(5,8,18,0.95)] px-7 py-8"
      style={{ boxShadow: '0 0 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(59,130,246,0.08)' }}>

      {/* Header */}
      <div className="mb-7">
        <div className="text-[9px] tracking-[0.2em] uppercase text-[#3b82f6] font-medium mb-3">
          Get Started
        </div>
        <h3 className="text-[1.4rem] sm:text-[1.6rem] font-bold text-[#f0f0f0] leading-[1.15] mb-3"
          style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.025em' }}>
          Your Business Deserves<br />Employees That Never Sleep.
        </h3>
        <p className="text-[0.82rem] text-[#6b7280] leading-[1.7]">
          You've seen how AI employees work. Now imagine what they could do for your business.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Service chips */}
        <div className="mb-6">
          <div className="text-[10px] uppercase tracking-wider text-[#6b7280] font-medium mb-3">
            What would you like your AI Employee to do?
          </div>
          <div className="flex flex-wrap gap-2">
            {SERVICE_OPTIONS.map(svc => (
              <ServiceChip
                key={svc}
                label={svc}
                selected={form.service === svc}
                onClick={() => handleServiceSelect(svc)}
              />
            ))}
          </div>
        </div>

        {/* Expanding form fields */}
        <AnimatePresence>
          {stage === 'expand' && (
            <motion.div
              key="fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-1 pb-6">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Your Name" name="name" value={form.name}
                    onChange={setField('name')} placeholder="Jane Smith"
                    required error={fieldErrors.name} />
                  <Field label="Business Name" name="business" value={form.business}
                    onChange={setField('business')} placeholder="Acme Co."
                    required error={fieldErrors.business} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Work Email" name="email" type="email" value={form.email}
                    onChange={setField('email')} placeholder="jane@acme.com"
                    required error={fieldErrors.email} />
                  <Field label="Phone Number" name="phone" type="tel" value={form.phone}
                    onChange={setField('phone')} placeholder="+1 (555) 000-0000"
                    required error={fieldErrors.phone} />
                </div>
                <Field label="Biggest Business Challenge" name="challenge"
                  value={form.challenge} onChange={setField('challenge')}
                  placeholder="e.g. Missing calls after hours, slow lead response…"
                  textarea required error={fieldErrors.challenge} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit button */}
        <AnimatePresence>
          {stage === 'expand' && (
            <motion.div
              key="submit"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {/* Network error message */}
              {submitError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 px-4 py-3 rounded-xl border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.06)]"
                >
                  <p className="text-[11px] text-[#fca5a5]">{submitError}</p>
                </motion.div>
              )}

              <button type="submit" disabled={!canSubmit || submitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-[14px] tracking-wide transition-all duration-300"
                style={{
                  background: canSubmit && !submitting
                    ? 'linear-gradient(135deg, #2563eb, #3b82f6)'
                    : 'rgba(59,130,246,0.25)',
                  color: canSubmit && !submitting ? '#fff' : '#4b5563',
                  boxShadow: canSubmit && !submitting ? '0 0 24px rgba(59,130,246,0.3)' : 'none',
                  cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed',
                }}>
                {submitting
                  ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Submitting…</>
                  : <>Book My Strategy Call<ArrowRight className="w-4 h-4" /></>
                }
              </button>

              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mt-4">
                {['Free Strategy Session', 'No Obligation', 'Custom AI Strategy', '30-Minute Consultation'].map(t => (
                  <div key={t} className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-[#22c55e]" />
                    <span className="text-[10px] text-[#4b5563]">{t}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}

// ─── Footer logo mark ─────────────────────────────────────────────────────────
function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full border border-[rgba(59,130,246,0.25)]" />
      <div className="absolute rounded-full border border-[rgba(59,130,246,0.45)]"
        style={{ inset: size * 0.14 }} />
      <div className="absolute rounded-full bg-[rgba(59,130,246,0.15)]"
        style={{ inset: size * 0.28 }} />
      <div className="absolute rounded-full bg-[#3b82f6]"
        style={{ inset: size * 0.39, boxShadow: '0 0 6px rgba(59,130,246,0.8)' }} />
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const navLinks = [
    { label: 'Solutions', href: '#ai-employees' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'About', href: '#about' },
  ];
  return (
    <footer className="relative border-t border-[rgba(255,255,255,0.05)] mt-24 pt-10 pb-8">
      <div className="max-w-[1380px] mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
          <a href="/" className="flex items-center gap-2.5">
            <LogoMark />
            <div className="flex items-baseline">
              <span className="text-[14px] font-bold tracking-[0.06em] text-[#f0f0f0]"
                style={{ fontFamily: 'Syne, sans-serif' }}>HYPA</span>
              <span className="text-[14px] font-bold tracking-[0.06em] text-[#3b82f6]"
                style={{ fontFamily: 'Syne, sans-serif' }}>&nbsp;BOT</span>
            </div>
          </a>
          <nav className="flex items-center gap-6">
            {navLinks.map(l => (
              <a key={l.label} href={l.href}
                className="text-[12px] text-[#4b5563] hover:text-[#9ca3af] transition-colors duration-200">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a href="mailto:hello@hypabot.ai"
              className="w-8 h-8 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] flex items-center justify-center hover:border-[rgba(59,130,246,0.3)] transition-all duration-200">
              <Mail className="w-3.5 h-3.5 text-[#6b7280]" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] flex items-center justify-center hover:border-[rgba(59,130,246,0.3)] transition-all duration-200">
              <ExternalLink className="w-3.5 h-3.5 text-[#6b7280]" />
            </a>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-6 border-t border-[rgba(255,255,255,0.04)]">
          <p className="text-[11px] text-[#2d3748]">© {new Date().getFullYear()} HYPA BOT. All rights reserved.</p>
          <p className="text-[11px] text-[#2d3748]">AI Workforce Platform</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Closing message ──────────────────────────────────────────────────────────
function ClosingMessage({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center pt-16 pb-8"
        >
          <p className="text-[1.3rem] sm:text-[1.7rem] font-semibold text-[#e8eaed] max-w-lg mx-auto leading-[1.3]"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>
            Let's build your AI workforce.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Scene 6 ─────────────────────────────────────────────────────────────
export function Scene6Section() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-5% 0px' });
  const [submitted, setSubmitted] = useState(false);
  const [showClosing, setShowClosing] = useState(false);

  const intensityRef = useMemo(() => ({ current: 0.08 }), []);

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    intensityRef.current = 0.55;
    setTimeout(() => {
      intensityRef.current = 0.12;
      setShowClosing(true);
    }, 2500);
  }, [intensityRef]);

  useEffect(() => {
    if (inView) intensityRef.current = 0.12;
  }, [inView, intensityRef]);

  return (
    <section
      ref={sectionRef}
      id="book-call"
      aria-label="Hire Your First AI Employee"
      className="relative"
      data-scene="6"
      style={{ scrollMarginTop: '64px' }}
    >
      {/* Top blend */}
      <div className="absolute top-0 inset-x-0 h-28 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to bottom, #050505, transparent)' }} />

      {/* Subtle ambient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 35% 40%, rgba(59,130,246,0.04) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-[1380px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28">

        {/* Section heading */}
        <div className="mb-14">
          <SceneIntro
            headline="Hire Your First AI Employee"
            body="Let's build an AI workforce for your business."
          />
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-[35%_65%] gap-10 lg:gap-14 items-start">

          {/* LEFT — AI Core */}
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-full max-w-[320px] aspect-square mx-auto">
              <div className="absolute inset-0 rounded-full pointer-events-none transition-all duration-[2000ms]"
                style={{
                  background: `radial-gradient(circle, rgba(${submitted ? '34,197,94' : '59,130,246'},${submitted ? 0.1 : 0.05}) 0%, transparent 65%)`,
                  transform: 'scale(1.5)',
                }} />
              <AICore className="w-full h-full" scrollIntensity={intensityRef} />
            </div>

            {/* Status badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.05)]"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" style={{ animation: 'pulse-glow 1.5s infinite' }} />
              <span className="text-[10px] font-medium text-[#22c55e] tracking-wide">AI Workforce Ready to Deploy</span>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.75 }}
              className="grid grid-cols-2 gap-3 w-full max-w-[280px]"
            >
              {[
                { label: 'Setup Time', value: '1 Day' },
                { label: 'Uptime', value: '99.9%' },
                { label: 'Languages', value: '47' },
                { label: 'Response', value: '<0.3s' },
              ].map(({ label, value }) => (
                <div key={label} className="text-center rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(5,8,18,0.8)] px-3 py-2.5">
                  <div className="text-[0.95rem] font-bold text-[#f0f0f0] mb-0.5"
                    style={{ fontFamily: 'Syne, sans-serif' }}>{value}</div>
                  <div className="text-[9px] text-[#374151] uppercase tracking-wider">{label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — CTA form (no motion wrapper that could re-animate) */}
          <div>
            <CTAPanel onSubmit={handleSubmit} />
          </div>

        </div>

        {/* Footer */}
        <Footer />

        {/* Closing message after submission */}
        <ClosingMessage visible={showClosing} />

      </div>
    </section>
  );
}
