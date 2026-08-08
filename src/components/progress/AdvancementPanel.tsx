"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { graduate, promoteTo } from "@/app/actions/economy";


/**
 * Promotion and graduation, bought outright.
 *
 * Both are the same purchase at different sizes: clear every class standing
 * between the student and somewhere further up, at 500 a class. So they are one
 * component with one confirmation, and the price on every button is computed on
 * the server by the same rule that charges for it, rather than from a headline
 * figure that would be wrong for anyone who already owns part of the way.
 *
 * The copy does not celebrate. Buying your way to Class A is permitted and it
 * is priced; it is not an achievement, and a panel that treated it as one would
 * be lying to the person paying.
 */

export interface AdvancementOption {
  /** `null` means graduation: the whole school. */
  classId: string | null;
  label: string;
  /** What it opens, in the reader's terms. */
  detail: string;
  /** Lectures this option would open that are not open already. */
  lockedCount: number;
  /**
   * The price, computed on the server from the same rule the action charges by.
   * Passed down rather than recomputed here so the button can never quote a
   * number the purchase would not honour.
   */
  cost: number;
}

export function AdvancementPanel({
  options,
  balance,
}: {
  options: AdvancementOption[];
  balance: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const live = options.filter((o) => o.lockedCount > 0);
  if (live.length === 0) return null;

  function run(option: AdvancementOption) {
    setError(null);
    startTransition(async () => {
      const result = option.classId
        ? await promoteTo(option.classId)
        : await graduate();
      if (!result.ok) {
        setError(result.error);
        setConfirming(null);
        return;
      }
      setConfirming(null);
      router.refresh();
    });
  }

  return (
    <section className="mt-14">
      <h2 className="font-hand text-xs tracking-[0.24em] text-[color:var(--muted)]">
        昇級・卒業
      </h2>
      <h3 className="font-serif mt-3 text-2xl tracking-tight">
        Buy your way up the school.
      </h3>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[color:var(--muted)]">
        A class costs 500, and promotion is charged for every class it clears:
        from Class D, reaching C is 500, B is 1,000 and A is 1,500. Classes you
        already own are not billed again. The examinations do not get easier and
        nothing is marked differently. What you are buying is the wait.
      </p>

      <ul className="mt-6 divide-y divide-[color:var(--rule)] border-y border-[color:var(--rule)]">
        {live.map((option) => {
          const key = option.classId ?? "graduate";
          const cost = option.cost;
          const affordable = balance >= cost;
          const isConfirming = confirming === key;

          return (
            <li key={key} className="py-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <div className="min-w-0">
                  <p className="font-serif text-lg tracking-tight">{option.label}</p>
                  <p className="mt-1 text-xs text-[color:var(--faint)]">
                    {option.detail}
                  </p>
                </div>

                {isConfirming ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => run(option)}
                      disabled={pending}
                      className="border border-[color:var(--accent)] bg-[color:var(--accent)]/10 px-5 py-2 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--accent)] hover:text-[color:var(--bg)] disabled:opacity-40"
                    >
                      {pending ? "Working…" : `Spend ${cost.toLocaleString()}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(null)}
                      disabled={pending}
                      className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)] transition-colors hover:text-[color:var(--fg)]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(key)}
                    disabled={!affordable}
                    className="shrink-0 border border-[color:var(--fg)] px-5 py-2 text-[11px] uppercase tracking-[0.2em] tabular-nums transition-colors hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)] disabled:cursor-not-allowed disabled:border-[color:var(--rule)] disabled:text-[color:var(--faint)] disabled:hover:bg-transparent"
                  >
                    {cost.toLocaleString()} points
                    {!affordable && (
                      <span className="ml-2 normal-case tracking-normal">
                        ({(cost - balance).toLocaleString()} short)
                      </span>
                    )}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="alert" className="mt-4 text-sm text-[color:var(--muted)]">
          {error}
        </p>
      )}
    </section>
  );
}
