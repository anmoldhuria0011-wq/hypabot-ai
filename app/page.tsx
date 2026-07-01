import type { Metadata } from 'next';
import { Background } from '@/components/ui/Background';
import { Navigation } from '@/components/navigation/Navigation';
import { HeroSection } from '@/sections/HeroSection';
import { Scene2Section } from '@/sections/Scene2Section';
import { Scene3Section } from '@/sections/Scene3Section';
import { Scene4Section } from '@/sections/Scene4Section';
import { Scene5Section } from '@/sections/Scene5Section';
import { Scene6Section } from '@/sections/Scene6Section';
import { HeroTransitionOverlay } from '@/components/ui/HeroTransitionOverlay';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hypabot.ai';

// ── Page-level metadata (overrides layout defaults for this route) ─────────────
export const metadata: Metadata = {
  title: 'AI Employees That Never Sleep — HYPA BOT',
  description:
    'HYPA BOT deploys intelligent AI employees that answer customer calls, qualify leads, book appointments, and automate operations — 24 hours a day, 7 days a week. Free strategy session.',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: 'AI Employees That Never Sleep — HYPA BOT',
    description:
      'Deploy an AI receptionist, AI sales agent, or AI operations agent for your business. Responds in under 0.3 seconds. Available 24/7. Setup in 1 day.',
    url: SITE_URL,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'HYPA BOT AI Employees' }],
  },
};

export default function Home() {
  return (
    <>
      {/* Skip-to-content for screen readers and keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#3b82f6] focus:text-white focus:rounded-lg focus:text-sm"
      >
        Skip to main content
      </a>

      <Background />

      {/* Semantic header wraps the fixed navigation */}
      <header role="banner">
        <Navigation />
      </header>

      {/* Scroll transition overlay — aria-hidden, decorative only */}
      <HeroTransitionOverlay />

      {/* Main landmark — contains all page content */}
      <main id="main-content" role="main">

        {/* ── Hero: introduces the brand and primary value proposition ── */}
        <div data-hero-section>
          <HeroSection />
        </div>

        {/* ── Section: AI Employee showcase ── */}
        <Scene2Section />

        {/* ── Section: How it works / onboarding process ── */}
        <Scene3Section />

        {/* ── Section: Interactive AI demo ── */}
        <Scene4Section />

        {/* ── Section: Social proof / mission control ── */}
        <Scene5Section />

        {/* ── Section: CTA + contact form ── */}
        <Scene6Section />

      </main>
    </>
  );
}
