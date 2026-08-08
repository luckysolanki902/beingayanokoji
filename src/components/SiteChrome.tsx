"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SupportButton } from "@/components/SupportButton";
import { SupportBlock } from "@/components/Support";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { PILLARS } from "@/lib/pillars";

function useIsPrint() {
  const pathname = usePathname();
  return pathname?.endsWith("/print") ?? false;
}

/**
 * The chrome is a school noticeboard, not an app bar.
 *
 * Navigation sits flush left in small caps, the theme switcher flush right, and
 * the masthead is centred underneath between two rules — the arrangement of a
 * printed bulletin rather than a website header. It scrolls away with the page
 * instead of sticking, because a fixed bar on top of a 5,000-word essay is a
 * permanent reminder that you are on a website.
 */
export function SiteHeader() {
  const isPrint = useIsPrint();
  const pathname = usePathname();
  if (isPrint) return null;

  const isHome = pathname === "/";

  return (
    <header className="relative">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-5 md:px-8 md:pt-6">
        <nav className="flex items-center gap-5 text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)] md:gap-7 md:text-xs">
          <Link
            href="/lectures"
            className="transition-colors hover:text-[color:var(--fg)]"
          >
            Lectures
          </Link>
          <Link
            href="/topics"
            className="transition-colors hover:text-[color:var(--fg)]"
          >
            Topics
          </Link>
          <Link
            href="/about"
            className="hidden transition-colors hover:text-[color:var(--fg)] sm:inline"
          >
            About
          </Link>
          <SupportButton />
        </nav>

        <ThemeSwitcher />
      </div>

      {/* The masthead is the site's nameplate, so it appears at full size on
          the front page and shrinks to a single line everywhere else — the
          reader on lecture 34 does not need reintroducing. */}
      {isHome ? (
        <div className="relative mt-10 md:mt-14">
          <div
            className="genkou-grid genkou-fade pointer-events-none absolute inset-0"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-3xl px-5 text-center">
            <div className="border-t border-[color:var(--rule)]" />
            <h1 className="font-serif mt-6 text-[1.9rem] font-medium tracking-[0.16em] uppercase leading-none md:mt-7 md:text-[2.9rem] md:tracking-[0.2em]">
              Being Ayanokoji
            </h1>
            <p className="font-jp mt-4 text-[10px] tracking-[0.34em] text-[color:var(--faint)] md:text-[11px]">
              実力至上主義 · 高度育成高等学校
            </p>
            <p className="mt-2.5 text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)] md:text-[11px]">
              Long-form lectures · Read slowly
            </p>
            <div className="mt-6 border-t border-[color:var(--rule)] md:mt-7" />
          </div>
        </div>
      ) : (
        <div className="mx-auto mt-8 max-w-3xl px-5 text-center md:mt-10">
          <Link
            href="/"
            className="font-serif inline-block text-xs uppercase tracking-[0.3em] text-[color:var(--muted)] transition-colors hover:text-[color:var(--fg)] md:text-sm"
          >
            Being Ayanokoji
          </Link>
          <div className="mt-6 border-t border-[color:var(--rule)]" />
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  if (useIsPrint()) return null;

  return (
    <footer className="mt-28 md:mt-36">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <SupportBlock source="footer" />
      </div>

      {/* Every subject reachable from every page. This is the bulk of the
          site's internal linking — without it the topic hubs would depend on
          being found through individual lectures. */}
      <nav
        aria-label="Topics"
        className="mx-auto mt-20 max-w-5xl border-t border-[color:var(--rule)] px-5 pt-12 md:px-8"
      >
        <p className="font-hand mb-6 text-center text-xs tracking-[0.2em] text-[color:var(--muted)]">
          Browse by subject
        </p>
        <ul className="mx-auto flex max-w-3xl flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-[color:var(--muted)]">
          {PILLARS.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/topics/${p.slug}`}
                className="transition-colors hover:text-[color:var(--accent)]"
              >
                {p.headline}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mx-auto mt-12 max-w-5xl border-t border-[color:var(--rule)] px-5 py-10 md:px-8">
        <div className="flex flex-col items-center gap-5 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <p className="font-serif text-xs uppercase tracking-[0.24em]">
              Being Ayanokoji
            </p>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-[color:var(--faint)]">
              Calm in tone. Heavy in substance. Quiet in delivery. Compounding in
              effect.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-[color:var(--muted)]">
            <Link href="/lectures" className="hover:text-[color:var(--fg)]">
              Index
            </Link>
            <Link href="/topics" className="hover:text-[color:var(--fg)]">
              Topics
            </Link>
            <Link href="/about" className="hover:text-[color:var(--fg)]">
              Philosophy
            </Link>
            <a
              href="mailto:luckysolanki902@gmail.com"
              className="transition-colors hover:text-[color:var(--fg)]"
            >
              Contact
            </a>
            <span className="text-[color:var(--faint)]">© Being Ayanokoji</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
