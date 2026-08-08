"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SupportButton } from "@/components/SupportButton";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { useStudent } from "@/components/progress/StudentProvider";
import { PILLARS } from "@/lib/pillars";
import { CONTACT_MAILTO } from "@/lib/site";

function useIsPrint() {
  const pathname = usePathname();
  return pathname?.endsWith("/print") ?? false;
}

/**
 * The chrome is a school noticeboard, not an app bar.
 *
 * Navigation sits flush left in small caps, the theme switcher flush right, and
 * the masthead is centred underneath between two rules, the arrangement of a
 * printed bulletin rather than a website header. It scrolls away with the page
 * instead of sticking, because a fixed bar on top of a 5,000-word essay is a
 * permanent reminder that you are on a website.
 */
export function SiteHeader() {
  const isPrint = useIsPrint();
  const pathname = usePathname();
  if (isPrint) return null;

  const isHome = pathname === "/";

  return (<header className="relative">
      <div className="mx-auto max-w-5xl px-4 pt-3 sm:flex sm:items-center sm:justify-between sm:px-5 sm:pt-5 md:px-8 md:pt-6">
        {/* Phones get two intentional rows. Keeping navigation, enrolment and
            five room controls on one line made the right edge disappear below
            430px. Navigation stays first visually and in the accessibility
            tree; the controls settle beneath it until the noticeboard row has
            enough room at `sm`. */}
        <nav className="grid min-h-11 grid-cols-4 items-center border-y border-[color:var(--rule)] text-center text-[10px] uppercase tracking-[0.12em] text-[color:var(--muted)] sm:flex sm:min-h-0 sm:gap-5 sm:border-0 sm:text-left sm:text-[11px] sm:tracking-[0.18em] md:gap-7 md:text-xs">
          <Link
            href="/"
            aria-current={isHome ? "page" : undefined}
            className={`flex h-11 items-center justify-center transition-colors hover:text-[color:var(--fg)] sm:h-auto ${
              isHome ? "text-[color:var(--fg)]" : ""
            }`}
          >
            Home
          </Link>
          <Link
            href="/lectures"
            className="flex h-11 items-center justify-center transition-colors hover:text-[color:var(--fg)] sm:h-auto"
          >
            Lectures
          </Link>
          <Link
            href="/topics"
            className="flex h-11 items-center justify-center transition-colors hover:text-[color:var(--fg)] sm:h-auto"
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

        <div className="mt-2 flex min-h-11 items-center justify-end gap-3 sm:mt-0 sm:min-h-0 md:gap-5">
          <StudentBadge />
          <ThemeSwitcher />
        </div>
      </div>

      {/* The masthead is the site's nameplate, so it appears at full size on
          the front page and shrinks to a single line everywhere else, the
          reader on lecture 34 does not need reintroducing. */}
      {isHome ? (<div className="relative mt-10 md:mt-14">
          <div
            className="genkou-grid genkou-fade pointer-events-none absolute inset-0"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-3xl px-5 text-center">
            <div className="border-t border-[color:var(--rule)]" />
            <h1 className="font-serif mt-6 text-[clamp(1.45rem,7vw,1.9rem)] font-medium tracking-[0.12em] uppercase leading-none sm:tracking-[0.16em] md:mt-7 md:text-[2.9rem] md:tracking-[0.2em]">
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
        </div>) : (<div className="mx-auto mt-8 max-w-3xl px-5 text-center md:mt-10">
          <Link
            href="/"
            className="font-serif inline-block text-xs uppercase tracking-[0.3em] text-[color:var(--muted)] transition-colors hover:text-[color:var(--fg)] md:text-sm"
          >
            Being Ayanokoji
          </Link>
          <div className="mt-6 border-t border-[color:var(--rule)]" />
        </div>)}
    </header>);
}

/**
 * The student's own corner of the chrome: their face, their class, their money.
 *
 * It is a link to the record, which is where the student card lives, so the
 * photograph doubles as the way in. Before a photo is uploaded the frame holds
 * the class letter instead, which is what a real card would show in the same
 * space and is more useful than a generic silhouette.
 *
 * The photograph is fetched from `/api/avatar` rather than passed down as
 * props: it is a 25KB base64 string on the user document, and inlining it into
 * every page's payload to draw a 28-pixel circle would be a bad trade made on
 * every single request.
 */
function StudentBadge() {
  const student = useStudent();
  const [hasPhoto, setHasPhoto] = useState(true);

  // Signed out, this is the most important control on the page: nothing can be
  // earned, held or spent without it. So it is the one filled element in a
  // header that is otherwise entirely small caps and hairlines, which is what
  // makes it impossible to miss without shouting.
  if (!student.signedIn) {
    return (
      <Link
        href="/enroll"
        className="flex min-h-11 items-center border border-[color:var(--accent)] bg-[color:var(--accent)] px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-[color:var(--bg)] transition-opacity hover:opacity-85 sm:min-h-0 md:px-5 md:text-xs"
      >
        Enrol
      </Link>
    );
  }

  // Signed in, the balance is on every page of the site, because every page has
  // something on it that costs points and a price is useless without a purse.
  return (
    <Link
      href="/record"
      aria-label={`Your student card. ${student.name}, ${student.points.toLocaleString()} personal points`}
      title={`${student.name} · ${student.points.toLocaleString()} personal points`}
      className="group flex min-h-11 items-center gap-2.5 rounded-full border border-[color:var(--rule)] py-1 pl-1 pr-3 transition-colors hover:border-[color:var(--accent)] sm:min-h-0"
    >
      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[color:var(--rule)] bg-[color:var(--bg-elevated)] transition-colors group-hover:border-[color:var(--accent)]">
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/api/avatar"
            alt=""
            width={28}
            height={28}
            className="h-full w-full object-cover"
            // 404 means no photograph uploaded yet; fall back to the letter.
            onError={() => setHasPhoto(false)}
          />
        ) : (
          <span className="font-serif text-[11px] text-[color:var(--muted)] transition-colors group-hover:text-[color:var(--accent)]">
            {student.currentClass === "GRAD" ? "卒" : student.currentClass}
          </span>
        )}
      </span>
      <span className="font-mono text-[11px] tabular-nums text-[color:var(--accent)]">
        {student.points.toLocaleString()}
      </span>
      <span className="hidden text-[9px] uppercase tracking-[0.16em] text-[color:var(--faint)] sm:inline">
        pts
      </span>
    </Link>
  );
}

export function SiteFooter() {
  if (useIsPrint()) return null;

  return (<footer className="mt-28 md:mt-36">
      {/* Every subject reachable from every page. This is the bulk of the
          site's internal linking, without it the topic hubs would depend on
          being found through individual lectures. */}
      <nav
        aria-label="Topics"
        className="mx-auto mt-20 max-w-5xl border-t border-[color:var(--rule)] px-5 pt-12 md:px-8"
      >
        <p className="font-hand mb-6 text-center text-xs tracking-[0.2em] text-[color:var(--muted)]">
          Browse by subject
        </p>
        <ul className="mx-auto flex max-w-3xl flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-[color:var(--muted)]">
          {PILLARS.map((p) => (<li key={p.slug}>
              <Link
                href={`/topics/${p.slug}`}
                className="transition-colors hover:text-[color:var(--accent)]"
              >
                {p.headline}
              </Link>
            </li>))}
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
              href={CONTACT_MAILTO}
              className="transition-colors hover:text-[color:var(--fg)]"
            >
              Contact
            </a>
            <span className="text-[color:var(--faint)]">© Being Ayanokoji</span>
          </div>
        </div>
      </div>
    </footer>);
}
