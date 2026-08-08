import type { Metadata, Viewport } from "next";
import { Shippori_Mincho, Zen_Kaku_Gothic_New, Klee_One } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ProgressProvider } from "@/components/progress/ProgressProvider";
import { PromotionOverlay } from "@/components/progress/PromotionOverlay";
import { NO_FLASH_SCRIPT } from "@/lib/themes";
import { getAllLectures } from "@/lib/lectures";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_SHORT_DESCRIPTION,
  SITE_TAGLINE,
  SITE_URL,
  absoluteUrl,
  jsonLdGraph,
  publisherNode,
} from "@/lib/site";
import "./globals.css";

/*
 * A Japanese type system rather than a Western editorial one.
 *
 * Only the latin subset is requested from each. These faces carry full
 * Japanese coverage, which runs to megabytes; the handful of kanji in the
 * chrome are rendered with the reader's own system mincho instead (see
 * `.font-jp`), so nothing here needs the japanese subset.
 */

/** 明朝 — the display face. Brush-derived terminals, strong vertical stress. */
const mincho = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mincho",
  display: "swap",
});

/** ゴシック — body and UI. Even, unfussy, holds up at small sizes. */
const gothic = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-gothic",
  display: "swap",
});

/** A Japanese school-handwriting face, for labels that should read as chalk. */
const klee = Klee_One({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-klee",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Being Ayanokoji — Long-form lectures on self-discipline and clear thinking",
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  applicationName: SITE_NAME,
  category: "education",
  // Every page declares its own canonical relative to this; without it the
  // .vercel.app alias and the custom domain would compete as duplicates.
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_SHORT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Phone numbers in prose are a false positive risk on a site full of dates
  // and figures; Safari linkifying them is noise.
  formatDetection: { telephone: false, address: false, email: false },
  // Search Console. The meta tag verifies a URL-prefix property on any domain
  // the site is served from — including the .vercel.app alias, whose DNS we do
  // not control and therefore cannot add a TXT record to.
  verification: {
    google: "2lupVcjQkSBkgZYxGTlq838YyAziVlX-cfHHGLdtV64",
  },

};

export const viewport: Viewport = {
  // The default room — 教室, afternoon light on manuscript paper.
  themeColor: "#f2efe4",
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

/**
 * The site-level entities, declared once here so every page inherits them by
 * `@id` reference instead of redefining a publisher of its own.
 */
const siteJsonLd = jsonLdGraph(
  {
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: "en",
    publisher: { "@id": absoluteUrl("/#organization") },
  },
  publisherNode()
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orderedSlugs = getAllLectures().map((l) => l.slug);

  return (
    <html
      lang="en"
      className={`${mincho.variable} ${gothic.variable} ${klee.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Applies the reader's room before first paint. Without it every load
            would flash the default classroom before switching. */}
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        {/* PayPal's SDK is fetched only when a reader opens the support panel;
            warming the connection early keeps that first paint from stalling. */}
        {/* Declared here rather than in `metadata.alternates`: every page sets
            its own `alternates` for the canonical, and Next replaces the whole
            field rather than merging it — which silently dropped the feed. */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title={SITE_NAME}
          href="/feed.xml"
        />
        <link rel="preconnect" href="https://www.paypal.com" />
        <link rel="dns-prefetch" href="https://www.paypal.com" />
      </head>
      <body className="grain">
        <ThemeProvider>
          <ProgressProvider>
            <SiteHeader />
            <main className="min-h-screen">{children}</main>
            <SiteFooter />
            {/* Mounted site-wide so the promotion fires wherever the reader
                happened to finish the class — usually an exam, but a restored
                record on any page counts too. */}
            <PromotionOverlay orderedSlugs={orderedSlugs} />
          </ProgressProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
