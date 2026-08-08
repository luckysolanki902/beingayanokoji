import Link from "next/link";
import { FadeIn } from "@/components/AnimatedText";
import type { StudentRecord } from "@/lib/progress/state";
import { getClass } from "@/lib/curriculum";
import { FIRST_CORRECT_AWARD, LECTURE_UNLOCK_COST } from "@/lib/economy/prices";

/**
 * Where the reader stands, on the front page.
 *
 * Three genuinely different panels rather than one with numbers swapped in: a
 * stranger needs to be told what this is, someone enrolled but not started
 * needs sending to the first lecture, and someone mid-curriculum needs their
 * balance and the next thing to read. Showing "0 of 50 passed" to a first-time
 * visitor is a progress bar for a thing they have not agreed to do.
 *
 * Server-rendered from the session, so the panel is correct in the first paint
 * rather than after a flash of the signed-out version.
 */
export function EnrollmentPanel({ record }: { record: StudentRecord }) {
  const cls = getClass(record.currentClass);
  const firstSlug = record.lectures[0]?.slug;
  const inClass = record.classes.find((c) => c.id === record.currentClass);
  const started = record.passedCount > 0 || record.unlockedCount > 1;

  return (<FadeIn delay={0.2}>
      <div className="mx-auto mt-14 max-w-xl border border-[color:var(--rule)] bg-[color:var(--bg-elevated)]/40 p-7 text-center md:p-9">
        <div className="flex items-center justify-center gap-4">
          <span className="genkou-cell h-12 w-12 font-serif text-xl text-[color:var(--accent)] border-[color:var(--accent)]">
            {record.currentClass === "GRAD" ? "卒" : record.currentClass}
          </span>
          <div className="text-left">
            <p className="font-serif text-lg tracking-tight">{cls.label}</p>
            <p className="font-jp text-[11px] tracking-[0.2em] text-[color:var(--faint)]">
              {cls.japanese}
            </p>
          </div>
        </div>

        {record.signedIn && started && inClass ? (<>
            {/* One cell per lecture in the class, a roll sheet, not a bar.
                Filled means passed, outlined means open, empty means locked. */}
            <div className="mt-7 flex flex-wrap justify-center gap-1.5" aria-hidden="true">
              {inClass.slugs.map((slug) => {
                const lecture = record.bySlug[slug];
                return (<span
                    key={slug}
                    className={`h-2.5 w-2.5 border ${
                      lecture.passed
                        ? "border-[color:var(--accent)] bg-[color:var(--accent)]"
                        : lecture.unlocked
                          ? "border-[color:var(--accent)]"
                          : "border-[color:var(--rule)]"
                    }`}
                  />);
              })}
            </div>

            <p className="mt-5 text-sm text-[color:var(--muted)]">
              {inClass.passedCount} of {inClass.size} passed in this class ·{" "}
              {record.points.toLocaleString()} personal points
            </p>

            {record.resume ? (<Link
                href={`/lectures/${record.resume.slug}`}
                className="mt-7 inline-block border border-[color:var(--fg)] px-7 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)]"
              >
                Continue → {record.resume.title}
              </Link>) : record.nextLocked ? (<Link
                href={`/lectures/${record.nextLocked.slug}`}
                className="mt-7 inline-block border border-[color:var(--fg)] px-7 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)]"
              >
                Open the next lecture · {record.nextLocked.cost} points
              </Link>) : (<p className="mt-7 text-sm text-[color:var(--muted)]">
                You have passed everything published. The rest is being written.
              </p>)}

            <p className="mt-6 text-xs text-[color:var(--faint)]">
              <Link
                href="/record"
                className="underline decoration-[color:var(--rule)] underline-offset-4 transition-colors hover:text-[color:var(--muted)]"
              >
                Your full record
              </Link>
            </p>
          </>) : (<>
            <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-[color:var(--muted)]">
              {cls.brief}
            </p>
            {firstSlug && (<Link
                href={`/lectures/${firstSlug}`}
                className="mt-7 inline-block border border-[color:var(--fg)] px-7 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)]"
              >
                Begin the first lecture →
              </Link>)}
            <p className="mx-auto mt-6 max-w-sm text-xs leading-relaxed text-[color:var(--faint)]">
              The first lecture is open to anyone. Its examination pays{" "}
              {FIRST_CORRECT_AWARD} personal points a question, and{" "}
              {LECTURE_UNLOCK_COST} points opens the next one.{" "}
              {record.signedIn ? (<Link
                  href="/record"
                  className="underline decoration-[color:var(--rule)] underline-offset-4 hover:text-[color:var(--muted)]"
                >
                  Your record
                </Link>) : (<Link
                  href="/enroll"
                  className="underline decoration-[color:var(--rule)] underline-offset-4 hover:text-[color:var(--muted)]"
                >
                  Enrol
                </Link>)}{" "}
              to keep a record of it.
            </p>
          </>)}
      </div>
    </FadeIn>);
}
