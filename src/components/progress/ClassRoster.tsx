"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  useProgress,
  deriveCurrentClass,
  isUnlocked,
} from "@/components/progress/ProgressProvider";
import type { CurriculumClass } from "@/lib/curriculum";

/**
 * The index, as a class roster.
 *
 * Each class is a block; the reader's own class is open, the ones above it are
 * folded shut with their contents named but not described. Naming them matters
 * — a locked row that says "???" is a slot machine, and a locked row that says
 * "The Architecture of Habit" is a syllabus.
 *
 * Everything here is rendered server-side regardless of state; the client only
 * decides what is dimmed. A crawler and a first-time visitor both get the
 * complete list.
 */
export function ClassRoster({ curriculum }: { curriculum: CurriculumClass[] }) {
  const { ready, completed, count } = useProgress();
  const orderedSlugs = curriculum.flatMap((c) => c.entries.map((e) => e.lecture.slug));
  const currentClass = ready ? deriveCurrentClass(orderedSlugs, completed) : "D";

  return (
    <div className="mt-16 space-y-16">
      {ready && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-baseline justify-between gap-3 border-y border-[color:var(--rule)] py-4 text-xs"
        >
          <span className="uppercase tracking-[0.2em] text-[color:var(--muted)]">
            Your class ·{" "}
            <span className="text-[color:var(--accent)]">{currentClass === "GRAD" ? "Graduation" : `Class ${currentClass}`}</span>
          </span>
          <span className="text-[color:var(--faint)]">
            {count} of {orderedSlugs.length} lectures passed
          </span>
        </motion.div>
      )}

      {curriculum.map((cls) => {
        const isCurrent = ready && cls.meta.id === currentClass;
        const publishedCount = cls.entries.filter((e) => e.lecture.published).length;

        return (
          <section key={cls.meta.id}>
            <header className="mb-7 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-[color:var(--rule)] pb-4">
              <div className="flex items-baseline gap-4">
                <span
                  className={`genkou-cell h-11 w-11 shrink-0 font-serif text-xl ${
                    isCurrent
                      ? "border-[color:var(--accent)] text-[color:var(--accent)]"
                      : "text-[color:var(--faint)]"
                  }`}
                >
                  {cls.meta.id === "GRAD" ? "卒" : cls.meta.id}
                </span>
                <div>
                  <h2 className="font-serif text-2xl tracking-tight md:text-3xl">
                    {cls.meta.label}
                  </h2>
                  <p className="font-jp text-[11px] tracking-[0.2em] text-[color:var(--faint)]">
                    {cls.meta.japanese}
                  </p>
                </div>
              </div>
              <p className="text-xs text-[color:var(--faint)]">
                {publishedCount > 0
                  ? `${publishedCount} published`
                  : "Being written"}
              </p>
            </header>

            {isCurrent && (
              <p className="mb-8 max-w-2xl text-sm leading-relaxed text-[color:var(--muted)]">
                {cls.meta.brief}
              </p>
            )}

            <ol className="divide-y divide-[color:var(--rule)] border-y border-[color:var(--rule)]">
              {cls.entries.map((entry) => {
                const { lecture, index, positionInClass } = entry;
                const done = ready && Boolean(completed[lecture.slug]);
                const open = !ready || isUnlocked(index, orderedSlugs, completed);

                return (
                  <li key={lecture.slug}>
                    <Link
                      href={`/lectures/${lecture.slug}`}
                      className="group grid grid-cols-12 items-baseline gap-x-4 gap-y-2 px-1 py-6 transition-colors hover:bg-[color:var(--bg-elevated)]/40"
                    >
                      <span className="col-span-12 flex items-baseline gap-4 md:col-span-9">
                        <span
                          className={`shrink-0 font-mono text-[11px] tabular-nums ${
                            done
                              ? "text-[color:var(--accent)]"
                              : "text-[color:var(--faint)]"
                          }`}
                          aria-hidden="true"
                        >
                          {done ? "✓" : String(positionInClass).padStart(2, "0")}
                        </span>
                        <span className="min-w-0">
                          <h3
                            className={`font-serif text-xl leading-snug tracking-tight transition-colors md:text-2xl ${
                              open
                                ? "group-hover:text-[color:var(--accent)]"
                                : "text-[color:var(--muted)]"
                            }`}
                          >
                            {lecture.title}
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted)]">
                            {lecture.keyClaim || lecture.excerpt}
                          </p>
                        </span>
                      </span>

                      <span className="col-span-12 pl-8 text-xs text-[color:var(--faint)] md:col-span-3 md:pl-0 md:text-right">
                        {!lecture.published ? (
                          <span className="uppercase tracking-[0.16em]">
                            Not yet written
                          </span>
                        ) : done ? (
                          <span className="uppercase tracking-[0.16em] text-[color:var(--accent)]">
                            Passed
                          </span>
                        ) : open ? (
                          <span>{lecture.readingTimeMin} min</span>
                        ) : (
                          <span className="uppercase tracking-[0.16em]">
                            Locked
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
