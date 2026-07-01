import type { Metadata, Viewport } from 'next';
import './globals.css';

// ─── Site constants ───────────────────────────────────────────────────────────
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hypabot.ai';
const SITE_NAME = 'HYPA BOT';
const SITE_DESCRIPTION =
  'HYPA BOT builds intelligent AI employees that answer customers, qualify leads, automate operations, and work 24/7 — so your business keeps growing while your team rests.';

// ─── Metadata ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: `${SITE_NAME} — AI Employees That Never Sleep`,
    template: `%s | ${SITE_NAME}`,
  },

  description: SITE_DESCRIPTION,

  keywords: [
    'AI employees',
    'AI receptionist',
    'AI sales agent',
    'AI customer support',
    'business automation',
    'AI workforce',
    'intelligent automation',
    'AI operations agent',
    'lead qualification AI',
    'appointment booking AI',
    '24/7 customer service AI',
    'AI for small business',
    'AI for dental clinic',
    'AI for real estate',
    'conversational AI',
  ],

  authors: [{ name: 'HYPA BOT', url: SITE_URL }],
  creator: 'HYPA BOT',
  publisher: 'HYPA BOT',

  // ── Canonical & alternates ────────────────────────────────────────────────
  alternates: {
    canonical: '/',
  },

  // ── Open Graph ────────────────────────────────────────────────────────────
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — AI Employees That Never Sleep`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HYPA BOT — AI Employees That Never Sleep',
        type: 'image/png',
      },
    ],
  },

  // ── Twitter / X ───────────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    site: '@hypabot',
    creator: '@hypabot',
    title: `${SITE_NAME} — AI Employees That Never Sleep`,
    description: SITE_DESCRIPTION,
    images: ['/og-image.png'],
  },

  // ── Icons ─────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },

  // ── Manifest ──────────────────────────────────────────────────────────────
  manifest: '/manifest.json',

  // ── Robots ────────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // ── Verification (add your tokens here when ready) ────────────────────────
  verification: {
    // google: 'YOUR_GOOGLE_SEARCH_CONSOLE_TOKEN',
    // yandex: 'YOUR_YANDEX_TOKEN',
  },

  // ── App-specific ──────────────────────────────────────────────────────────
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: SITE_NAME,
  },

  category: 'technology',
};

// ─── Viewport ─────────────────────────────────────────────────────────────────
export const viewport: Viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'dark',
};

// ─── JSON-LD Structured Data ──────────────────────────────────────────────────
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'HYPA BOT',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/logo.png`,
    width: 512,
    height: 512,
  },
  description: SITE_DESCRIPTION,
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    email: 'hello@hypabot.ai',
    availableLanguage: 'English',
  },
  sameAs: [
    'https://linkedin.com/company/hypabot',
  ],
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  publisher: { '@id': `${SITE_URL}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
};

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': `${SITE_URL}/#webpage`,
  url: SITE_URL,
  name: `${SITE_NAME} — AI Employees That Never Sleep`,
  description: SITE_DESCRIPTION,
  isPartOf: { '@id': `${SITE_URL}/#website` },
  about: { '@id': `${SITE_URL}/#organization` },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    ],
  },
};

const servicesSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'AI Employee Services',
  description: 'Specialized AI employees for business automation',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      item: {
        '@type': 'Service',
        name: 'AI Receptionist',
        description: 'Answers every inbound call, qualifies inquiries, and books appointments 24 hours a day across phone, chat, and WhatsApp.',
        provider: { '@id': `${SITE_URL}/#organization` },
        serviceType: 'AI Customer Reception',
        areaServed: 'Worldwide',
      },
    },
    {
      '@type': 'ListItem',
      position: 2,
      item: {
        '@type': 'Service',
        name: 'AI Sales Agent',
        description: 'Qualifies every inbound lead, scores pipeline opportunities in real time, and routes hot prospects directly to your sales team.',
        provider: { '@id': `${SITE_URL}/#organization` },
        serviceType: 'AI Sales Automation',
        areaServed: 'Worldwide',
      },
    },
    {
      '@type': 'ListItem',
      position: 3,
      item: {
        '@type': 'Service',
        name: 'AI Operations Agent',
        description: 'Executes business workflows, integrates with your existing tools, and handles administrative tasks autonomously.',
        provider: { '@id': `${SITE_URL}/#organization` },
        serviceType: 'AI Business Automation',
        areaServed: 'Worldwide',
      },
    },
  ],
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is an AI employee?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'An AI employee is an intelligent software agent trained on your business knowledge, capable of handling customer conversations, booking appointments, qualifying leads, and automating operations — 24 hours a day, 7 days a week, without human intervention.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can your AI employee book appointments?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Our AI receptionist handles end-to-end scheduling — checking calendar availability, booking slots, sending confirmations, and dispatching reminders — across chat, WhatsApp, and email.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does setup take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most businesses have their first AI employee deployed within one business day. We connect your systems, train the AI on your business knowledge, and go live — typically in under 24 hours.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which tools does the AI employee integrate with?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'HYPA BOT AI employees integrate with over 120 tools including HubSpot, Salesforce, Google Calendar, Slack, WhatsApp, Shopify, Notion, Zapier, and most major CRMs and scheduling platforms.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can the AI employee speak multiple languages?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Our AI employees communicate fluently in 47 languages, automatically detecting and responding in the customer\'s preferred language.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the response time of an AI employee?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'HYPA BOT AI employees respond in under 0.3 seconds on average — significantly faster than human response times — ensuring customers never wait.',
      },
    },
  ],
};

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        {/* Preconnect for critical third-party origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Fonts — display=swap prevents FOIT */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Syne:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
