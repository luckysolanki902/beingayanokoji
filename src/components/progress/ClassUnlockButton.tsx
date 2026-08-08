"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { unlockClass } from "@/app/actions/economy";

/**
 * Promotion by purchase: a whole class at half the per-lecture price.
 *
 * The confirmation spells out both halves of what is being bought, the
 * lectures that exist and the ones that do not yet. A class bought today opens
 * everything published into it later, and a reader who discovers that after
 * paying would be right to feel sold something.
 */
export function ClassUnlockButton({
  classId,
  label,
  cost,
  size,
  publishedCount,
  remaining,
  balance,
}: {
  classId: string;
  label: string;
  cost: number;
  size: number;
  publishedCount: number;
  /** Lectures in the class not already open. */
  remaining: number;
  balance: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (remaining === 0) return null;

  const affordable = balance >= cost;
  const unwritten = size - publishedCount;

  function buy() {
    setError(null);
    startTransition(async () => {
      const result = await unlockClass(classId);
      if (!result.ok) {
        setError(result.error);
        setConfirming(false);
        return;
      }
      router.refresh();
    });
  }

  return (<div className="mt-5 border border-[color:var(--rule)] bg-[color:var(--bg-elevated)]/40 p-5">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
        Promotion by purchase
      </p>
      <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">
        {label}, {size} lectures for{" "}
        <span className="text-[color:var(--fg)]">{cost} points</span>, half what
        they cost one at a time.
        {unwritten > 0 && (<>
            {" "}
            {unwritten} of them {unwritten === 1 ? "is" : "are"} still being
            written; buying the class now opens them as they appear.
          </>)}
      </p>

      {confirming ? (<div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={buy}
            disabled={pending}
            className="border border-[color:var(--accent)] bg-[color:var(--accent)]/10 px-6 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--accent)] hover:text-[color:var(--bg)] disabled:opacity-40"
          >
            {pending ? "Promoting…" : `Yes, spend ${cost}`}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={pending}
            className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)] transition-colors hover:text-[color:var(--fg)]"
          >
            Cancel
          </button>
        </div>) : (<button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={!affordable}
          className="mt-5 border border-[color:var(--fg)] px-6 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)] disabled:cursor-not-allowed disabled:border-[color:var(--rule)] disabled:text-[color:var(--faint)] disabled:hover:bg-transparent"
        >
          {affordable
            ? `Buy ${label} · ${cost} points`
            : `${cost} points; you have ${balance}`}
        </button>)}

      {error && (<p role="alert" className="mt-4 text-sm text-[color:var(--muted)]">
          {error}
        </p>)}
    </div>);
}
