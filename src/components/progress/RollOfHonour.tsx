import Link from "next/link";
import { FadeIn } from "@/components/AnimatedText";
import type { PublicProfile } from "@/lib/profile/public";

/**
 * The roll of honour: the ten highest lifetime point totals on the site.
 *
 * A leaderboard is the bluntest gamification there is, so this one is set as a
 * posted roll rather than a scoreboard: no medals, no confetti, no arrows
 * showing who is climbing. The first three are marked only by the rule getting
 * heavier, which is the school's register doing what a register does.
 *
 * One source-neutral number is shown. The public board records how many points
 * entered the account over its lifetime, without exposing how they arrived.
 */
export function RollOfHonour({ students }: { students: PublicProfile[] }) {
  if (students.length === 0) return null;

  return (
    <section className="border-t border-[color:var(--rule)] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-3xl">
        <FadeIn>
          <p className="font-hand text-center text-xs tracking-[0.24em] text-[color:var(--muted)]">
            成績上位者
          </p>
          <h2 className="font-serif mt-4 text-center text-3xl tracking-tight md:text-4xl">
            The roll of honour.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-center text-sm leading-relaxed text-[color:var(--muted)]">
            The ten largest lifetime private-point totals in the school.
          </p>
        </FadeIn>

        <ol className="mt-12 divide-y divide-[color:var(--rule)] border-y border-[color:var(--rule)]">
          {students.map((student, i) => (
            <FadeIn key={student.studentNumber} delay={Math.min(i * 0.04, 0.3)}>
              <li>
                <Link
                  href={`/students/${student.studentNumber}`}
                  className="group grid grid-cols-12 items-center gap-x-4 py-4 transition-colors hover:bg-[color:var(--bg-elevated)]/40"
                >
                  <span
                    className={`col-span-1 font-mono text-xs tabular-nums ${
                      i < 3
                        ? "text-[color:var(--accent)]"
                        : "text-[color:var(--faint)]"
                    }`}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* The photograph, only for students who chose to show one. */}
                  <span className="col-span-2 flex justify-center sm:col-span-1">
                    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[color:var(--rule)] bg-[color:var(--bg-elevated)] transition-colors group-hover:border-[color:var(--accent)]">
                      {student.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={student.photo}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-serif text-xs text-[color:var(--muted)]">
                          {student.classId === "GRAD" ? "卒" : student.classId}
                        </span>
                      )}
                    </span>
                  </span>

                  <span className="col-span-9 min-w-0 sm:col-span-7">
                    <span className="block truncate font-serif text-lg tracking-tight transition-colors group-hover:text-[color:var(--accent)]">
                      {student.name}
                    </span>
                    <span className="block text-xs text-[color:var(--faint)]">
                      {student.className} · {student.passed} of {student.total}{" "}
                      passed
                    </span>
                  </span>

                  <span className="col-span-9 col-start-4 text-right sm:col-span-3 sm:col-start-auto">
                    <span className="block font-mono text-base tabular-nums text-[color:var(--accent)]">
                      {student.lifetimePoints.toLocaleString()}
                    </span>
                    <span className="block text-[10px] uppercase tracking-[0.16em] text-[color:var(--faint)]">
                      private points
                    </span>
                  </span>
                </Link>
              </li>
            </FadeIn>
          ))}
        </ol>

        <FadeIn delay={0.2}>
          <p className="mt-8 text-center text-xs text-[color:var(--faint)]">
            Every student here has a page anyone can read. Yours is listed too
            unless you say otherwise, and your photograph is never shown unless
            you ask for it.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
