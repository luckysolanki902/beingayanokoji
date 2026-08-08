"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  useProgress,
  deriveCurrentClass,
} from "@/components/progress/ProgressProvider";
import { CLASS_ORDER, getClass } from "@/lib/curriculum";

/**
 * Where the reader stands, on the front page.
 *
 * Two states, and they are genuinely different pages of copy rather than the
 * same panel with a number swapped: someone who has never read anything needs
 * to be enrolled, and someone mid-curriculum needs to be told what is next and
 * sent straight there. Showing "0 of 50 complete" to a first-time visitor would
 * be a progress bar for a thing they have not agreed to do.
 */
export function EnrollmentPanel({
  orderedSlugs,
  firstSlug,
  nextUp,
}: {
  orderedSlugs: string[];
  firstSlug: string;
  /** Title + slug of the first lecture the reader has not passed. */
  nextUp: { slug: string; title: string }[];
}) {
  const { ready, completed, count } = useProgress();

  if (!ready) {
    return <div className="mt-14 h-44" aria-hidden="true" />;
  }

  const currentClass = deriveCurrentClass(orderedSlugs, completed);
  const cls = getClass(currentClass);
  const started = count > 0;

  // The first lecture in reading order that has not been passed.
  const resume = nextUp.find((l) => !completed[l.slug]) ?? null;
  const classIndex = CLASS_ORDER.indexOf(currentClass);
  const inClass = orderedSlugs.slice(classIndex * 10, classIndex * 10 + 10);
  const doneInClass = inClass.filter((s) => completed[s]).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto mt-14 max-w-xl border border-[color:var(--rule)] bg-[color:var(--bg-elevated)]/40 p-7 text-center md:p-9"
    >
      <div className="flex items-center justify-center gap-4">
        <span className="genkou-cell h-12 w-12 font-serif text-xl text-[color:var(--accent)] border-[color:var(--accent)]">
          {currentClass === "GRAD" ? "卒" : currentClass}
        </span>
        <div className="text-left">
          <p className="font-serif text-lg tracking-tight">{cls.label}</p>
          <p className="font-jp text-[11px] tracking-[0.2em] text-[color:var(--faint)]">
            {cls.japanese}
          </p>
        </div>
      </div>

      {started ? (
        <>
          {/* Ten cells, one per lecture in the class — a roll sheet, not a bar. */}
          <div className="mt-7 flex justify-center gap-1.5" aria-hidden="true">
            {inClass.map((slug, i) => (
              <span
                key={slug}
                className={`h-2.5 w-2.5 border ${
                  completed[slug]
                    ? "border-[color:var(--accent)] bg-[color:var(--accent)]"
                    : "border-[color:var(--rule)]"
                }`}
                style={{ transitionDelay: `${i * 30}ms` }}
              />
            ))}
          </div>
          <p className="mt-5 text-sm text-[color:var(--muted)]">
            {doneInClass} of {inClass.length} passed in this class ·{" "}
            {count} of {orderedSlugs.length} overall
          </p>

          {resume ? (
            <Link
              href={`/lectures/${resume.slug}`}
              className="mt-7 inline-block border border-[color:var(--fg)] px-7 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)]"
            >
              Continue → {resume.title}
            </Link>
          ) : (
            <p className="mt-7 text-sm text-[color:var(--muted)]">
              You have passed everything published. The rest is being written.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-[color:var(--muted)]">
            {cls.brief}
          </p>
          <Link
            href={`/lectures/${firstSlug}`}
            className="mt-7 inline-block border border-[color:var(--fg)] px-7 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)]"
          >
            Begin the first lecture →
          </Link>
        </>
      )}

      <p className="mt-6 text-xs text-[color:var(--faint)]">
        Your record is kept in this browser only. No account, nothing sent
        anywhere.
      </p>
    </motion.div>
  );
}
