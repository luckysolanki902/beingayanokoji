"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SupportButton } from "@/components/SupportButton";
import { SupportBlock } from "@/components/Support";

function useIsPrint() {
  const pathname = usePathname();
  return pathname?.endsWith("/print") ?? false;
}

export function SiteHeader() {
  if (useIsPrint()) return null;

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
        <nav className="flex items-center gap-6 md:gap-8 text-sm text-[color:var(--color-muted)]">
          <Link href="/lectures" className="hover:text-[color:var(--color-fg)] transition-colors">
            Lectures
          </Link>
          <Link href="/about" className="hover:text-[color:var(--color-fg)] transition-colors">
            About
          </Link>
          <SupportButton />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  if (useIsPrint()) return null;

  return (
    <footer className="border-t border-[color:var(--color-rule)]/40 mt-32">
      <div className="mx-auto max-w-4xl px-6 pt-16">
        <SupportBlock />
      </div>
      <div className="mx-auto max-w-6xl px-6 py-12 mt-12 border-t border-[color:var(--color-rule)]/40 flex flex-col md:flex-row gap-6 justify-between items-start">
        <div className="space-y-2">
          <p className="font-serif text-sm">
            <span className="text-[color:var(--color-faint)]">being</span>
            <span className="font-medium">ayanokoji</span>
          </p>
          <p className="text-xs text-[color:var(--color-muted)] max-w-md">
            Calm in tone. Heavy in substance. Quiet in delivery. Compounding in effect.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-[color:var(--color-muted)]">
          <Link href="/lectures" className="hover:text-[color:var(--color-fg)]">
            Index
          </Link>
          <Link href="/about" className="hover:text-[color:var(--color-fg)]">
            Philosophy
          </Link>
          <a
            href="mailto:luckysolanki902@gmail.com"
            className="hover:text-[color:var(--color-fg)] transition-colors"
          >
            luckysolanki902@gmail.com
          </a>
          <span className="text-[color:var(--color-faint)]">© Being Ayanokoji</span>
        </div>
      </div>
    </footer>
  );
}
