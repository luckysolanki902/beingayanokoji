"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useProgress } from "@/components/progress/ProgressProvider";
import { PASS_THRESHOLD, type Quiz } from "@/lib/quizzes";

/**
 * The examination at the end of a lecture.
 *
 * One question at a time, answered irrevocably, with the explanation shown
 * immediately. Deliberately not a form you fill in and submit: seeing all three
 * at once invites answering by pattern-matching across them, and being able to
 * change an answer after reading the explanation would make the score a measure
 * of nothing.
 *
 * Failing is not punished. You are told which ones you missed and invited to
 * take it again — the gate exists to stop people skimming forward, not to
 * withhold the next essay from someone who has genuinely read this one.
 */
export function LectureExam({
  slug,
  quiz,
  nextSlug,
  nextTitle,
}: {
  slug: string;
  quiz: Quiz;
  nextSlug: string | null;
  nextTitle: string | null;
}) {
  const { isComplete, completeLecture, ready } = useProgress();
  const alreadyPassed = ready && isComplete(slug);

  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  /** Chosen option per question index; undefined until answered. */
  const [choices, setChoices] = useState<(number | undefined)[]>(
    () => quiz.questions.map(() => undefined)
  );

  const total = quiz.questions.length;
  const answeredCount = choices.filter((c) => c !== undefined).length;
  const finished = answeredCount === total;
  const score = choices.reduce<number>(
    (acc, choice, i) => acc + (choice === quiz.questions[i].answer ? 1 : 0),
    0
  );
  const passed = finished && score >= PASS_THRESHOLD;

  function choose(optionIndex: number) {
    if (choices[current] !== undefined) return;
    const next = [...choices];
    next[current] = optionIndex;
    setChoices(next);

    const nextScore = next.reduce<number>(
      (acc, choice, i) => acc + (choice === quiz.questions[i].answer ? 1 : 0),
      0
    );
    // Record the pass the moment it is earned, not on some later click, so a
    // closed tab cannot cost someone a lecture they answered correctly.
    if (next.every((c) => c !== undefined) && nextScore >= PASS_THRESHOLD) {
      completeLecture(slug, nextScore, total);
    }
  }

  function retake() {
    setChoices(quiz.questions.map(() => undefined));
    setCurrent(0);
  }

  if (!ready) {
    return <div className="mt-24 h-40" aria-hidden="true" />;
  }

  return (
    <section className="mx-auto mt-24 max-w-2xl border-t border-[color:var(--rule)] pt-14">
      <div className="mb-8 text-center">
        <p className="font-hand text-xs tracking-[0.2em] text-[color:var(--muted)]">
          小テスト
        </p>
        <h2 className="font-serif mt-2 text-2xl tracking-tight md:text-3xl">
          {alreadyPassed && !started ? "You have passed this one." : "The examination"}
        </h2>
      </div>

      {/* Already passed, and not currently retaking. */}
      {alreadyPassed && !started && !finished && (
        <div className="border border-[color:var(--rule)] p-7 text-center">
          <p className="text-sm leading-relaxed text-[color:var(--muted)]">
            This lecture is marked complete on your record.
            {nextSlug
              ? " The next one is open."
              : " There is nothing after it yet."}
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {nextSlug && (
              <Link
                href={`/lectures/${nextSlug}`}
                className="border border-[color:var(--fg)] px-6 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)]"
              >
                Next lecture →
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                retake();
                setStarted(true);
              }}
              className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)] transition-colors hover:text-[color:var(--fg)]"
            >
              Take it again
            </button>
          </div>
        </div>
      )}

      {(!alreadyPassed || started) && !finished && (
        <div className="border border-[color:var(--rule)] bg-[color:var(--bg-elevated)]/40 p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--faint)]">
              Question {current + 1} of {total}
            </span>
            <div className="flex gap-1.5" aria-hidden="true">
              {quiz.questions.map((q, i) => (
                <span
                  key={q.id}
                  className={`h-1 w-6 transition-colors ${
                    choices[i] !== undefined
                      ? "bg-[color:var(--accent)]"
                      : i === current
                        ? "bg-[color:var(--muted)]"
                        : "bg-[color:var(--rule)]"
                  }`}
                />
              ))}
            </div>
          </div>

          <p className="font-serif text-lg leading-snug md:text-xl">
            {quiz.questions[current].prompt}
          </p>

          <ul className="mt-6 space-y-2.5">
            {quiz.questions[current].options.map((option, i) => {
              const chosen = choices[current];
              const answered = chosen !== undefined;
              const isAnswer = i === quiz.questions[current].answer;
              const isChosen = chosen === i;

              let tone = "border-[color:var(--rule)] hover:border-[color:var(--muted)]";
              if (answered && isAnswer) {
                tone = "border-[color:var(--accent)] bg-[color:var(--accent)]/10";
              } else if (answered && isChosen) {
                tone = "border-red-500/50 bg-red-500/5";
              } else if (answered) {
                tone = "border-[color:var(--rule)] opacity-50";
              }

              return (
                <li key={i}>
                  <button
                    type="button"
                    disabled={answered}
                    onClick={() => choose(i)}
                    className={`w-full border px-4 py-3 text-left text-sm leading-relaxed transition-colors ${tone} ${
                      answered ? "cursor-default" : "cursor-pointer"
                    }`}
                  >
                    {option}
                  </button>
                </li>
              );
            })}
          </ul>

          <AnimatePresence>
            {choices[current] !== undefined && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <p className="mt-5 border-l-2 border-[color:var(--accent)] pl-4 text-sm leading-relaxed text-[color:var(--muted)]">
                  {quiz.questions[current].explanation}
                </p>
                {current < total - 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrent(current + 1)}
                    className="mt-5 border border-[color:var(--fg)] px-6 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)]"
                  >
                    Next question →
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {finished && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border p-7 text-center ${
            passed
              ? "border-[color:var(--accent)]/50 bg-[color:var(--accent)]/5"
              : "border-[color:var(--rule)]"
          }`}
        >
          <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--muted)]">
            {passed ? "Passed" : "Not yet"}
          </p>
          <p className="font-serif mt-3 text-3xl tracking-tight">
            {score} / {total}
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[color:var(--muted)]">
            {passed
              ? nextTitle
                ? `Recorded. “${nextTitle}” is now open.`
                : "Recorded. That is the last lecture currently published."
              : `You need ${PASS_THRESHOLD} of ${total}. Read back through the sections you missed and take it again — there is no penalty and no limit.`}
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {passed && nextSlug && (
              <Link
                href={`/lectures/${nextSlug}`}
                className="border border-[color:var(--fg)] px-6 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)]"
              >
                Next lecture →
              </Link>
            )}
            <button
              type="button"
              onClick={retake}
              className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)] transition-colors hover:text-[color:var(--fg)]"
            >
              Take it again
            </button>
          </div>
        </motion.div>
      )}
    </section>
  );
}
