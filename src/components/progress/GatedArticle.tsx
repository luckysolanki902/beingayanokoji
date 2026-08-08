import type { ReactNode } from "react";
import Link from "next/link";
import { UnlockLectureButton } from "@/components/progress/UnlockLectureButton";
import { getClass, type ClassId } from "@/lib/curriculum";
import { FIRST_CORRECT_AWARD, LECTURE_UNLOCK_COST } from "@/lib/economy/prices";

/**
 * The lock on a lecture that has not been paid for.
 *
 * This used to be a client component that assumed "unlocked" until localStorage
 * came back. It is a server component now, and the difference is the whole
 * point of the rewrite: the answer is known before the first byte is sent, so
 * there is no frame in which a locked lecture is legible, and no state a reader
 * can put their browser into that changes the answer.
 *
 * Both the article *and* its examination sit inside the gate. Gating only the
 * prose left the exam reachable by deep link, which now would mean earning
 * points from a lecture you never bought.
 *
 * The content is still present in the HTML, marked `.paywall`, and the page
 * declares `isAccessibleForFree: false` against that selector. That is Google's
 * documented arrangement for subscription content, not a loophole: the crawler
 * is told plainly that what it is reading is gated, so serving it is disclosed
 * rather than cloaked. Without the declaration this markup would be cloaking;
 * with it, it is how every paywalled publisher on the web is indexed.
 */
export function GatedArticle({
  slug,
  title,
  unlocked,
  published,
  classId,
  positionInClass,
  signedIn,
  balance,
  children,
  exam,
}: {
  slug: string;
  title: string;
  unlocked: boolean;
  published: boolean;
  classId: ClassId;
  positionInClass: number;
  signedIn: boolean;
  balance: number;
  children: ReactNode;
  exam?: ReactNode;
}) {
  if (unlocked) {
    return (<>
        {children}
        {exam}
      </>);
  }

  const cls = getClass(classId);

  return (<>
      <aside className="mx-auto my-8 max-w-2xl border border-[color:var(--rule)] bg-[color:var(--bg-elevated)]/60 p-8 text-center md:p-12">
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
          Lecture {positionInClass} of {cls.label}. It costs{" "}
          {LECTURE_UNLOCK_COST} personal points to open, which you can earn, at{" "}
          {FIRST_CORRECT_AWARD} points for every examination question you answer
          correctly at the first attempt, or buy at ten to the dollar.
        </p>

        {!published ? (<p className="mx-auto mt-7 max-w-md text-sm text-[color:var(--muted)]">
            It has not been written yet, so it cannot be bought either. It will
            appear here when it is finished.
          </p>) : signedIn ? (<UnlockLectureButton
            slug={slug}
            title={title}
            cost={LECTURE_UNLOCK_COST}
            balance={balance}
          />) : (<>
            <Link
              href={`/enroll?next=/lectures/${slug}`}
              className="mt-8 inline-block border border-[color:var(--fg)] px-7 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)]"
            >
              Enrol to open it
            </Link>
            <p className="mt-4 text-xs text-[color:var(--faint)]">
              The first lecture is free and its examination pays. You can reach
              this one without spending anything.
            </p>
          </>)}

        <p className="mt-7 text-xs text-[color:var(--faint)]">
          <Link
            href="/lectures"
            className="underline decoration-[color:var(--rule)] underline-offset-4 transition-colors hover:text-[color:var(--muted)]"
          >
            See the whole roster
          </Link>
        </p>
      </aside>

      {/* Present for crawlers, and declared as paywalled in the page's JSON-LD
          against this exact class. Taken out of the reading experience
          entirely: no height, no pointer events, not reachable by keyboard, not
          read by a screen reader. There is no "read it anyway" here. */}
      <div className="paywall sr-only" aria-hidden="true" inert>
        {children}
      </div>
    </>);
}
