"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useProgress, isUnlocked } from "@/components/progress/ProgressProvider";
import { getClass, type ClassId } from "@/lib/curriculum";

/**
 * The lock on a lecture the reader has not reached.
 *
 * Both the article *and* its examination sit inside this gate. That is the
 * whole point: gating only the prose left the exam reachable by deep link, so
 * anyone could jump to lecture six, pass its test without reading a word, and
 * unlock the curriculum from the middle. The gate has to cover the thing that
 * grants progress, not just the thing that is pleasant to read.
 *
 * The content is still rendered into the HTML for crawlers — the same markup is
 * served to everyone, so this is a visibility rule rather than cloaking — but a
 * locked lecture offers a reader no way through except the lecture before it.
 */
export function GatedArticle({
  index,
  orderedSlugs,
  classId,
  positionInClass,
  previousSlug,
  previousTitle,
  children,
  exam,
}: {
  index: number;
  orderedSlugs: string[];
  classId: ClassId;
  positionInClass: number;
  previousSlug: string | null;
  previousTitle: string | null;
  children: ReactNode;
  exam?: ReactNode;
}) {
  const { ready, completed } = useProgress();

  // Until the record has been read, assume unlocked. Flashing a lock at a
  // reader who has legitimately finished the previous lecture is worse than
  // half a second of content they were entitled to anyway.
  const unlocked = !ready || isUnlocked(index, orderedSlugs, completed);

  if (unlocked) {
    return (
      <>
        {children}
        {exam}
      </>
    );
  }

  return (
    <>
      <motion.aside
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto my-8 max-w-2xl border border-[color:var(--rule)] bg-[color:var(--bg-elevated)]/60 p-8 text-center md:p-12"
      >
        <span
          className="genkou-cell mx-auto mb-6 flex h-14 w-14 font-serif text-2xl text-[color:var(--faint)]"
          aria-hidden="true"
        >
          鍵
        </span>

        <p className="font-hand text-xs tracking-[0.2em] text-[color:var(--muted)]">
          まだです
        </p>
        <h2 className="font-serif mt-3 text-2xl tracking-tight md:text-[1.75rem]">
          This lecture is not open to you yet.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-[color:var(--muted)]">
          It is lecture {positionInClass} of {getClass(classId).label}, and you
          have not passed the one before it. The curriculum is a line — each
          lecture assumes the last, and the examinations are what move you along
          it.
        </p>

        {previousSlug && (
          <Link
            href={`/lectures/${previousSlug}`}
            className="mt-8 inline-block border border-[color:var(--fg)] px-7 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)]"
          >
            Go to {previousTitle ? `“${previousTitle}”` : "the previous lecture"}
          </Link>
        )}

        <p className="mt-7 text-xs text-[color:var(--faint)]">
          <Link
            href="/lectures"
            className="underline decoration-[color:var(--rule)] underline-offset-4 transition-colors hover:text-[color:var(--muted)]"
          >
            See where you are in the class roster
          </Link>
        </p>
      </motion.aside>

      {/* Present in the document for crawlers — the same HTML everyone gets —
          but taken out of the reading experience entirely: no height, no
          pointer events, not reachable by keyboard, not read by a screen
          reader. There is no "read it anyway" here by design. */}
      <div className="sr-only" aria-hidden="true" inert>
        {children}
      </div>
    </>
  );
}
