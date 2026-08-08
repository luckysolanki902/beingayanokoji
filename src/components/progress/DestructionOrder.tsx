"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestDestruction } from "@/app/actions/economy";
import { SITE_DESTRUCTION_COST, usdForPoints } from "@/lib/economy/prices";

/**
 * The last item on the shelf.
 *
 * Two million points to order this site destroyed. It is priced, listed and
 * implemented like any other purchase because a joke item that cannot actually
 * be bought is just a sign; this one debits the points and writes the order.
 *
 * What it does not do is delete anything by itself; that is a decision made by
 * a person reading the orders, not by a POST request. The distinction is stated
 * here rather than buried, since the whole point of the item is that it is
 * honest about what it costs and what it does.
 *
 * Below the threshold it still renders, greyed, with the balance needed. An
 * item you cannot see is not a price, and the price is the joke.
 */
export function DestructionOrder({ balance }: { balance: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);

  const affordable = balance >= SITE_DESTRUCTION_COST;
  const short = SITE_DESTRUCTION_COST - balance;

  function place() {
    setError(null);
    startTransition(async () => {
      const result = await requestDestruction(note);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPlaced(true);
      setOpen(false);
      router.refresh();
    });
  }

  if (placed) {
    return (<section className="mt-16 border border-[color:var(--accent)]/40 bg-[color:var(--accent)]/5 p-7">
        <p className="font-hand text-xs tracking-[0.2em] text-[color:var(--muted)]">
          受理
        </p>
        <h2 className="font-serif mt-3 text-2xl tracking-tight">
          The order is placed.
        </h2>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-[color:var(--muted)]">
          {SITE_DESTRUCTION_COST.toLocaleString()} points have been taken and the
          request is on the record. Someone will read it and reply. Whether it is
          carried out is not something a form decides.
        </p>
      </section>);
  }

  return (<section className="mt-16 border border-[color:var(--rule)] p-7">
      <p className="font-hand text-xs tracking-[0.2em] text-[color:var(--muted)]">
        最終品目
      </p>
      <h2 className="font-serif mt-3 text-2xl tracking-tight">
        Have this site destroyed.
      </h2>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-[color:var(--muted)]">
        {SITE_DESTRUCTION_COST.toLocaleString()} points, about $
        {usdForPoints(SITE_DESTRUCTION_COST).toLocaleString()} if bought rather
        than earned. Points are personal points; they can be spent on anything
        the school sells, and this is the largest thing it sells. The order is
        real, the debit is real, and the decision that follows is made by a
        person rather than by this button.
      </p>

      {!affordable ? (<p className="mt-6 border-t border-[color:var(--rule)] pt-5 text-xs uppercase tracking-[0.18em] text-[color:var(--faint)]">
          {short.toLocaleString()} points short
        </p>) : open ? (<div className="mt-6">
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Say why, if you want to
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              maxLength={2000}
              className="mt-2 w-full border border-[color:var(--rule)] bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[color:var(--accent)]"
            />
          </label>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={place}
              disabled={pending}
              className="border border-red-500/60 px-6 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-red-500/10 disabled:opacity-40"
            >
              {pending
                ? "Placing…"
                : `Spend ${SITE_DESTRUCTION_COST.toLocaleString()} points`}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
              className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)] transition-colors hover:text-[color:var(--fg)]"
            >
              Cancel
            </button>
          </div>
        </div>) : (<button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-6 border border-[color:var(--fg)] px-6 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)]"
        >
          Place the order
        </button>)}

      {error && (<p role="alert" className="mt-4 text-sm text-[color:var(--muted)]">
          {error}
        </p>)}
    </section>);
}
