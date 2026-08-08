"use client";

import { motion } from "motion/react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { THEMES } from "@/lib/themes";

/**
 * Five kanji in a row: 教 空 白 夜 桜.
 *
 * An icon set would have meant five generic glyphs, a sun, a moon, a sparkle
 * that say "light and dark" rather than naming five rooms. The kanji read as a
 * set immediately, are the right alphabet for the subject, and cost nothing to
 * ship. The English name and a line of description arrive on hover and focus,
 * so nobody has to read Japanese to use it.
 *
 * Rendered with the platform's own mincho face rather than a webfont: five
 * characters do not justify downloading a Japanese font, and every desktop and
 * phone already has one.
 */
export function ThemeSwitcher({ className = "" }: { className?: string }) {
  const { theme, setTheme, ready } = useTheme();

  return (<div
      className={`flex items-center gap-0.5 rounded-full border border-[color:var(--rule)] bg-[color:var(--bg-elevated)]/80 p-0.5 backdrop-blur-md sm:p-1 ${className}`}
      role="radiogroup"
      aria-label="Reading theme"
    >
      {THEMES.map((t) => {
        const active = ready && theme === t.id;
        return (<button
            key={t.id}
            type="button"
            data-track={ready && !active ? "theme.change" : undefined}
            data-track-label={ready && !active ? t.id : undefined}
            role="radio"
            aria-checked={active}
            aria-label={`${t.label}, ${t.note}`}
            onClick={() => setTheme(t.id)}
            className="group relative flex h-7 w-7 items-center justify-center rounded-full transition-colors sm:h-8 sm:w-8"
          >
            {active && (<motion.span
                layoutId="theme-pip"
                className="absolute inset-0 rounded-full bg-[color:var(--fg)]"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />)}
            <span
              className={`font-jp relative text-sm leading-none transition-colors sm:text-[15px] ${
                active
                  ? "text-[color:var(--bg)]"
                  : "text-[color:var(--muted)] group-hover:text-[color:var(--fg)]"
              }`}
            >
              {t.glyph}
            </span>

            <span
              role="tooltip"
              className="pointer-events-none absolute top-full right-0 z-20 mt-2 hidden whitespace-nowrap rounded-sm border border-[color:var(--rule)] bg-[color:var(--bg)] px-2.5 py-1.5 text-left opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 md:block"
            >
              <span className="block text-[11px] tracking-[0.14em] uppercase text-[color:var(--fg)]">
                {t.label}
              </span>
              <span className="block text-[10px] text-[color:var(--faint)]">
                {t.note}
              </span>
            </span>
          </button>);
      })}
    </div>);
}
