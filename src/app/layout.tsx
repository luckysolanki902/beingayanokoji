import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

const SITE_URL = "https://beingayanokoji.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Being Ayanokoji — A daily training ground for the mind, body, and operator",
    template: "%s · Being Ayanokoji",
  },
  description:
    "One deeply-researched lecture per day on cognition, psychology, strength, strategy, and purpose. No platitudes. No hype. Compounding clarity for the patient reader.",
  keywords: [
    "self improvement",
    "psychology",
    "stoicism",
    "cognition",
    "strength training",
    "discipline",
    "ayanokoji",
    "mental models",
    "purpose",
  ],
  authors: [{ name: "Being Ayanokoji" }],
  creator: "Being Ayanokoji",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    title: "Being Ayanokoji",
    description:
      "A daily lecture on becoming sharper, stronger, and more deliberate. Calm in tone. Heavy in substance.",
    siteName: "Being Ayanokoji",
  },
  twitter: {
    card: "summary_large_image",
    title: "Being Ayanokoji",
    description:
      "A daily lecture on becoming sharper, stronger, and more deliberate.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="grain">
        <SiteHeader />
        <main className="min-h-screen">{children}</main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}

function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[color:var(--color-bg)]/70 border-b border-[color:var(--color-rule)]/40">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-base tracking-tight hover:text-[color:var(--color-accent)] transition-colors"
        >
          <span className="text-[color:var(--color-faint)]">being</span>
          <span className="font-medium">ayanokoji</span>
        </Link>
        <nav className="flex items-center gap-8 text-sm text-[color:var(--color-muted)]">
          <Link href="/lectures" className="hover:text-[color:var(--color-fg)] transition-colors">
            Lectures
          </Link>
          <Link href="/about" className="hover:text-[color:var(--color-fg)] transition-colors">
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-[color:var(--color-rule)]/40 mt-32">
      <div className="mx-auto max-w-6xl px-6 py-12 flex flex-col md:flex-row gap-6 justify-between items-start">
        <div className="space-y-2">
          <p className="font-serif text-sm">
            <span className="text-[color:var(--color-faint)]">being</span>
            <span className="font-medium">ayanokoji</span>
          </p>
          <p className="text-xs text-[color:var(--color-muted)] max-w-md">
            Calm in tone. Heavy in substance. Quiet in delivery. Compounding in effect.
          </p>
        </div>
        <div className="flex gap-8 text-xs text-[color:var(--color-muted)]">
          <Link href="/lectures" className="hover:text-[color:var(--color-fg)]">
            Index
          </Link>
          <Link href="/about" className="hover:text-[color:var(--color-fg)]">
            Philosophy
          </Link>
          <span className="text-[color:var(--color-faint)]">© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
