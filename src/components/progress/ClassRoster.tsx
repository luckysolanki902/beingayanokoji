import Link from "next/link";
import { ClassUnlockButton } from "@/components/progress/ClassUnlockButton";
import type { CurriculumClass } from "@/lib/curriculum";
import type { StudentRecord } from "@/lib/progress/state";
import { LECTURE_UNLOCK_COST } from "@/lib/economy/prices";

/**
 * The index, as a class roster.
 *
 * Every lecture is named whether or not it is open. A locked row that says
 * "???" is a slot machine; a locked row that says "The Architecture of Habit"
 * and "100 points" is a syllabus with a price list. The reader is being asked
 * to spend something, so they are told exactly what for.
 *
 * Rendered on the server from the student's record, so the crawler and the
 * first-time visitor get the complete list and the enrolled reader gets their
 * own state in the same paint.
 */
export function ClassRoster({
  curriculum,
  record,
}: {
  curriculum: CurriculumClass[];
  record: StudentRecord;
}) {
  return (<div className="mt-16 space-y-16">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-y border-[color:var(--rule)] py-4 text-xs">
        <span className="uppercase tracking-[0.2em] text-[color:var(--muted)]">
          Your class ·{" "}
          <span className="text-[color:var(--accent)]">
            {record.currentClass === "GRAD" ? "Graduation" : `Class ${record.currentClass}`}
          </span>
        </span>
        <span className="text-[color:var(--faint)]">
          {record.signedIn ? (<>
              {record.passedCount} of {record.totalCount} passed ·{" "}
              {record.points.toLocaleString()} personal points
            </>) : (<Link href="/enroll" className="hover:text-[color:var(--muted)]">
              Enrol to keep a record
            </Link>)}
        </span>
      </div>

      {curriculum.map((cls) => {
        const state = record.classes.find((c) => c.id === cls.meta.id);
        const isCurrent = cls.meta.id === record.currentClass;

        return (<section key={cls.meta.id}>
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
                {state && state.publishedCount > 0
                  ? `${state.publishedCount} published · ${state.unlockedCount} open to you`
                  : "Being written"}
              </p>
            </header>

            {isCurrent && (<p className="mb-8 max-w-2xl text-sm leading-relaxed text-[color:var(--muted)]">
                {cls.meta.brief}
              </p>)}

            <ol className="divide-y divide-[color:var(--rule)] border-y border-[color:var(--rule)]">
              {cls.entries.map((entry) => {
                const lecture = record.bySlug[entry.lecture.slug];
                const { positionInClass } = entry;

                return (<li key={entry.lecture.slug}>
                    <Link
                      href={`/lectures/${entry.lecture.slug}`}
                      className="group grid grid-cols-12 items-baseline gap-x-4 gap-y-2 px-1 py-6 transition-colors hover:bg-[color:var(--bg-elevated)]/40"
                    >
                      <span className="col-span-12 flex items-baseline gap-4 md:col-span-9">
                        <span
                          className={`shrink-0 font-mono text-[11px] tabular-nums ${
                            lecture.passed
                              ? "text-[color:var(--accent)]"
                              : "text-[color:var(--faint)]"
                          }`}
                          aria-hidden="true"
                        >
                          {lecture.passed ? "✓" : String(positionInClass).padStart(2, "0")}
                        </span>
                        <span className="min-w-0">
                          <h3
                            className={`font-serif text-xl leading-snug tracking-tight transition-colors md:text-2xl ${
                              lecture.unlocked
                                ? "group-hover:text-[color:var(--accent)]"
                                : "text-[color:var(--muted)]"
                            }`}
                          >
                            {entry.lecture.title}
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted)]">
                            {entry.lecture.keyClaim || entry.lecture.excerpt}
                          </p>
                        </span>
                      </span>

                      <span className="col-span-12 pl-8 text-xs text-[color:var(--faint)] md:col-span-3 md:pl-0 md:text-right">
                        {!entry.lecture.published ? (<span className="uppercase tracking-[0.16em]">Not yet written</span>) : lecture.passed ? (<span className="uppercase tracking-[0.16em] text-[color:var(--accent)]">
                            Passed
                          </span>) : lecture.unlocked ? (<span>{entry.lecture.readingTimeMin} min</span>) : (<span className="uppercase tracking-[0.16em]">
                            {LECTURE_UNLOCK_COST} points
                          </span>)}
                      </span>
                    </Link>
                  </li>);
              })}
            </ol>

            {/* The block purchase, offered where the class is, not buried on
                another page. Hidden once nothing is left to buy. */}
            {record.signedIn && state && state.publishedCount > 0 && (<ClassUnlockButton
                classId={state.id}
                label={state.label}
                cost={state.cost}
                size={state.size}
                publishedCount={state.publishedCount}
                remaining={state.size - state.unlockedCount}
                balance={record.points}
              />)}
          </section>);
      })}
    </div>);
}
