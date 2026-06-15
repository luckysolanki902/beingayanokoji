import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
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
    default: "Being Ayanokoji — A training ground for the mind, body, and operator",
    template: "%s · Being Ayanokoji",
  },
  description:
    "Deeply-researched long-form lectures on cognition, psychology, strength, strategy, and purpose. No platitudes. No hype. New lectures published regularly. Compounding clarity for the patient reader.",
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
      "Long-form lectures on becoming sharper, stronger, and more deliberate. Calm in tone. Heavy in substance.",
    siteName: "Being Ayanokoji",
  },
  twitter: {
    card: "summary_large_image",
    title: "Being Ayanokoji",
    description:
      "Long-form lectures on becoming sharper, stronger, and more deliberate.",
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
