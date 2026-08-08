"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { answerQuestion, submitExam } from "@/app/actions/economy";
import { FIRST_CORRECT_AWARD } from "@/lib/economy/prices";
import type { PublicQuiz } from "@/lib/quizzes";

/**
 * The examination at the end of a lecture, and the only way to earn points
 * without paying for them.
 *
 * One question at a time, answered irrevocably. That was already the design
 * seeing all three at once invites answering by pattern-matching across them
 * but it now carries weight it did not before: a first-attempt correct answer
 * pays five points, so being able to change an answer after reading the
 * explanation would be a way to print money.
 *
 * Which is also why the answer key is not in this file. `PublicQuiz` carries
 * prompts and options and nothing else; the correct option and its explanation
 * arrive from the server action, after the answer has been committed and
 * recorded. There is no version of this component that knows the answers before
 * the reader does.
 *
 * Failing is not punished. You are told what you missed and invited to take it
 * again, the retake simply pays nothing, per question, forever.
 */

interface Marked {
  choice: number;
  correct: boolean;
  answerIndex: number;
  explanation: string;
  awarded: number;
  awardNote: string | null;
}

export function LectureExam({
  slug,
  quiz,
  nextSlug,
  nextTitle,
  nextUnlocked,
  signedIn,
  alreadyPassed,
  bestScore,
}: {
  slug: string;
  quiz: PublicQuiz;
  nextSlug: string | null;
  nextTitle: string | null;
  /** Whether the next lecture is already open, so the copy can be honest. */
  nextUnlocked: boolean;
  signedIn: boolean;
  alreadyPassed: boolean;
  bestScore: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [marked, setMarked] = useState<(Marked | undefined)[]>(() =>
    quiz.questions.map(() => undefined));
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean } | null>(null);

  const total = quiz.questions.length;
  const question = quiz.questions[current];
  const here = marked[current];
  const answeredCount = marked.filter(Boolean).length;
  const earned = marked.reduce<number>((acc, m) => acc + (m?.awarded ?? 0), 0);

  function choose(optionIndex: number) {
    if (marked[current] || pending) return;

    startTransition(async () => {
      const res = await answerQuestion(slug, question.id, optionIndex);
      if (!res.ok && res.error) return;

      const next = [...marked];
      next[current] = {
        choice: optionIndex,
        correct: res.correct,
        answerIndex: res.answerIndex,
        explanation: res.explanation,
        awarded: res.awarded,
        awardNote: res.awardNote,
      };
      setMarked(next);

      // The last answer closes the attempt out. Recorded the moment it is
      // earned rather than on some later click, so a closed tab cannot cost
      // someone a lecture they answered correctly.
      if (next.every(Boolean)) {
        const answers: Record<string, number> = {};
        quiz.questions.forEach((q, i) => {
          answers[q.id] = next[i]!.choice;
        });
        const finish = await submitExam(slug, answers);
        setResult({ score: finish.score, total: finish.total, passed: finish.passed });
        // The balance in the header and the roster both moved; the server owns
        // both, so ask it again rather than patching them here.
        router.refresh();
      }
    });
  }

  function retake() {
    setMarked(quiz.questions.map(() => undefined));
    setResult(null);
    setCurrent(0);
    setStarted(true);
  }

  return (<section className="mx-auto mt-24 max-w-2xl border-t border-[color:var(--rule)] pt-14">
      <div className="mb-8 text-center">
        <p className="font-hand text-xs tracking-[0.2em] text-[color:var(--muted)]">
          小テスト
        </p>
        <h2 className="font-serif mt-2 text-2xl tracking-tight md:text-3xl">
          {alreadyPassed && !started && !result
            ? "You have passed this one."
            : "The examination"}
        </h2>
        {!signedIn && (<p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[color:var(--muted)]">
            You can sit it without enrolling. It will not pay you, and it will
            not be recorded, {" "}
            <Link
              href={`/enroll?next=/lectures/${slug}`}
              className="underline decoration-[color:var(--rule)] underline-offset-4 hover:text-[color:var(--fg)]"
            >
              enrol first
            </Link>{" "}
            if you want the {FIRST_CORRECT_AWARD} points a question.
          </p>)}
      </div>

      {/* Passed already, not currently retaking. */}
      {alreadyPassed && !started && !result && (<div className="border border-[color:var(--rule)] p-7 text-center">
          <p className="text-sm leading-relaxed text-[color:var(--muted)]">
            This lecture is marked complete on your record
            {bestScore > 0 ? `, best score ${bestScore} of ${total}` : ""}.
          </p>
          <p className="mt-3 text-xs text-[color:var(--faint)]">
            A retake pays nothing. Every question here has already been answered
            once, and questions pay once.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {nextSlug && (<Link
                href={`/lectures/${nextSlug}`}
                className="border border-[color:var(--fg)] px-6 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)]"
              >
                {nextUnlocked ? "Next lecture →" : "The next lecture →"}
              </Link>)}
            <button
              type="button"
              onClick={retake}
              className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)] transition-colors hover:text-[color:var(--fg)]"
            >
              Take it again
            </button>
          </div>
        </div>)}

      {(!alreadyPassed || started) && !result && (<div className="border border-[color:var(--rule)] bg-[color:var(--bg-elevated)]/40 p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--faint)]">
              Question {current + 1} of {total}
            </span>
            <div className="flex gap-1.5" aria-hidden="true">
              {quiz.questions.map((q, i) => (<span
                  key={q.id}
                  className={`h-1 w-6 transition-colors ${
                    marked[i]
                      ? "bg-[color:var(--accent)]"
                      : i === current
                        ? "bg-[color:var(--muted)]"
                        : "bg-[color:var(--rule)]"
                  }`}
                />))}
            </div>
          </div>

          <p className="font-serif text-lg leading-snug md:text-xl">{question.prompt}</p>

          <ul className="mt-6 space-y-2.5">
            {question.options.map((option, i) => {
              const isAnswer = here ? i === here.answerIndex : false;
              const isChosen = here ? i === here.choice : false;

              let tone = "border-[color:var(--rule)] hover:border-[color:var(--muted)]";
              if (here && isAnswer) {
                tone = "border-[color:var(--accent)] bg-[color:var(--accent)]/10";
              } else if (here && isChosen) {
                tone = "border-red-500/50 bg-red-500/5";
              } else if (here) {
                tone = "border-[color:var(--rule)] opacity-50";
              }

              return (<li key={i}>
                  <button
                    type="button"
                    disabled={Boolean(here) || pending}
                    onClick={() => choose(i)}
                    className={`w-full border px-4 py-3 text-left text-sm leading-relaxed transition-colors ${tone} ${
                      here ? "cursor-default" : "cursor-pointer"
                    } disabled:cursor-default`}
                  >
                    {option}
                  </button>
                </li>);
            })}
          </ul>

          {pending && !here && (<p className="mt-5 text-xs uppercase tracking-[0.2em] text-[color:var(--faint)]">
              Marking…
            </p>)}

          <AnimatePresence>
            {here && (<motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <p className="mt-5 border-l-2 border-[color:var(--accent)] pl-4 text-sm leading-relaxed text-[color:var(--muted)]">
                  {here.explanation}
                </p>

                {here.awarded > 0 ? (<motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-[11px] uppercase tracking-[0.2em] text-[color:var(--accent)]"
                  >
                    + {here.awarded} personal points
                  </motion.p>) : (here.awardNote && (<p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[color:var(--faint)]">
                      {here.awardNote}
                    </p>))}

                {current < total - 1 && (<button
                    type="button"
                    onClick={() => setCurrent(current + 1)}
                    className="mt-5 border border-[color:var(--fg)] px-6 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)]"
                  >
                    Next question →
                  </button>)}

                {current === total - 1 && answeredCount === total && !result && (<p className="mt-5 text-xs uppercase tracking-[0.2em] text-[color:var(--faint)]">
                    Recording…
                  </p>)}
              </motion.div>)}
          </AnimatePresence>
        </div>)}

      {result && (<motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border p-7 text-center ${
            result.passed
              ? "border-[color:var(--accent)]/50 bg-[color:var(--accent)]/5"
              : "border-[color:var(--rule)]"
          }`}
        >
          <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--muted)]">
            {result.passed ? "Passed" : "Not yet"}
          </p>
          <p className="font-serif mt-3 text-3xl tracking-tight">
            {result.score} / {result.total}
          </p>

          {earned > 0 && (<p className="mt-3 text-sm text-[color:var(--accent)]">
              {earned} personal points earned
            </p>)}

          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[color:var(--muted)]">
            {result.passed
              ? nextTitle
                ? nextUnlocked
                  ? `Recorded. “${nextTitle}” is open to you.`
                  : `Recorded. “${nextTitle}” is next; it is not open yet, and points open it.`
                : "Recorded. That is the last lecture currently published."
              : "Read back through the sections you missed and take it again. There is no penalty and no limit, only the questions you have already met will not pay a second time."}
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {result.passed && nextSlug && (<Link
                href={`/lectures/${nextSlug}`}
                className="border border-[color:var(--fg)] px-6 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)]"
              >
                Next lecture →
              </Link>)}
            <button
              type="button"
              onClick={retake}
              className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)] transition-colors hover:text-[color:var(--fg)]"
            >
              Take it again
            </button>
          </div>
        </motion.div>)}
    </section>);
}
