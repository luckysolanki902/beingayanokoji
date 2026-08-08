"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { unlockLecture } from "@/app/actions/economy";

/**
 * The button that spends a hundred points.
 *
 * It confirms once. Not because the action is dangerous, points come back as
 * lectures, which is what they are for, but because a purchase that happens on
 * a single mis-click is a purchase the reader will resent, and the second click
 * costs them nothing but a moment.
 *
 * On success it calls `router.refresh()` rather than setting local state. The
 * lock, the balance in the header, the roster and the ledger were all rendered
 * on the server from the same record; re-rendering that record is the only way
 * to move all four without four copies of the truth.
 */
export function UnlockLectureButton({
  slug,
  cost,
  balance,
  title,
}: {
  slug: string;
  cost: number;
  balance: number;
  title: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const affordable = balance >= cost;

  function open() {
    setError(null);
    startTransition(async () => {
      const result = await unlockLecture(slug);
      if (!result.ok) {
        setError(result.error);
        setConfirming(false);
        return;
      }
      router.refresh();
    });
  }

  if (!affordable) {
    return (<div className="mt-8">
        <p className="text-sm text-[color:var(--muted)]">
          This lecture costs {cost} points. You have{" "}
          <span className="text-[color:var(--fg)]">{balance}</span>.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-[color:var(--faint)]">
          Earn the difference by taking the examinations on the lectures already
          open to you, or buy points below.
        </p>
      </div>);
  }

  return (<div className="mt-8">
      {confirming ? (<div className="flex flex-col items-center gap-3">
          <p className="text-sm text-[color:var(--muted)]">
            Spend {cost} points on “{title}”? You will have {balance - cost} left.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={open}
              disabled={pending}
              className="border border-[color:var(--accent)] bg-[color:var(--accent)]/10 px-7 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--accent)] hover:text-[color:var(--bg)] disabled:opacity-40"
            >
              {pending ? "Opening…" : "Yes, open it"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)] transition-colors hover:text-[color:var(--fg)]"
            >
              Not yet
            </button>
          </div>
        </div>) : (<button
          type="button"
          onClick={() => setConfirming(true)}
          className="border border-[color:var(--fg)] px-7 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)]"
        >
          Open this lecture · {cost} points
        </button>)}

      {error && (<p role="alert" className="mt-4 text-sm text-[color:var(--muted)]">
          {error}
        </p>)}
    </div>);
}
