"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PaypalButtons } from "@/components/support/PaypalButtons";

type TierId = "t1" | "t2" | "t3";

interface SupportConfig {
  configured: boolean;
  currency: string;
  symbol: string;
  presets: Record<TierId, number>;
  min: number;
  max: number;
  decimals: number;
  originalCurrency: string | null;
  clientId: string | null;
  env: "live" | "sandbox";
}

/** What each tier is *for*, in the reader's terms rather than ours. */
const TIER_NOTE: Record<TierId, string> = {
  t1: "A page of it",
  t2: "A lecture's research",
  t3: "A month of writing",
};

function formatMajor(value: number, decimals: number): string {
  return decimals === 0 ? String(Math.round(value)) : value.toFixed(2).replace(/\.00$/, "");
}

export function SupportBlock({
  compact = false,
  showHeader = true,
  source = "footer",
}: {
  compact?: boolean;
  showHeader?: boolean;
  /** Which surface the reader started from, recorded with the order. */
  source?: string;
}) {
  const [config, setConfig] = useState<SupportConfig | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [tier, setTier] = useState<TierId | "custom">("t2");
  const [custom, setCustom] = useState("");
  const [status, setStatus] = useState<"idle" | "done" | "cancelled">("idle");
  const [error, setError] = useState<string | null>(null);
  const [supporterName, setSupporterName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/support/config")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: SupportConfig) => {
        if (!cancelled) setConfig(data);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * The selection, kept in a ref as well as in state. PayPal reads the amount
   * from inside its own iframe at click time, long after this component last
   * rendered, so the getter it holds has to see the live value rather than the
   * one that existed when the buttons were drawn.
   */
  const selection = useRef({ tier, custom });
  useEffect(() => {
    selection.current = { tier, custom };
  }, [tier, custom]);

  const customValue = Number(custom);
  const customTooSmall =
    tier === "custom" &&
    custom.trim() !== "" &&
    config !== null &&
    (!Number.isFinite(customValue) || customValue < config.min);

  const getPayload = useCallback(() => {
    const { tier: t, custom: c } = selection.current;
    if (t !== "custom") return { tier: t, source };

    const amount = Number(c);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter an amount first.");
      return null;
    }
    if (config && amount < config.min) {
      setError(`The smallest amount PayPal will process here is ${config.symbol}${formatMajor(config.min,
          config.decimals)}.`);
      return null;
    }
    setError(null);
    return { amount, source };
  }, [config, source]);

  const onSuccess = useCallback((result: { name?: string | null }) => {
    setSupporterName(result?.name ?? null);
    setStatus("done");
    setError(null);
  }, []);

  const onError = useCallback((message: string) => {
    setError(message);
    setStatus("idle");
  }, []);

  const onCancel = useCallback(() => {
    setStatus("cancelled");
  }, []);

  const tiers = useMemo(() => (["t1", "t2", "t3"] as TierId[]),
    []);

  if (status === "done") {
    return (<section className="border border-[color:var(--color-accent)]/40 bg-[color:var(--color-bg-elevated)]/60 p-8 md:p-12 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
          Received
        </p>
        <h2 className="mt-5 font-serif text-3xl md:text-4xl tracking-tight leading-tight">
          {supporterName ? `Thank you, ${supporterName}.` : "Thank you."}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm md:text-base text-[color:var(--color-muted)] leading-relaxed">
          That goes straight into the next lecture, the reading, the drafting,
          the eight rewrites nobody sees. PayPal has your receipt. There is
          nothing else to do, and nothing else will be asked of you.
        </p>
      </section>);
  }

  return (<section className={`border border-[color:var(--color-rule)] bg-[color:var(--color-bg-elevated)]/40 ${compact ? "p-6 md:p-8" : "p-6 md:p-12"}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* ---------------------------------------------------- the argument */}
        <div className="lg:col-span-6 space-y-6">
          {showHeader && (<p className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-muted)]">
              Sustain the work
            </p>)}

          <h2 className="font-serif text-3xl md:text-[2.75rem] tracking-tight leading-[1.05]">
            Free to read.
            <span className="block italic text-[color:var(--color-accent)]">
              Not free to write.
            </span>
          </h2>

          <p className="text-sm md:text-base text-[color:var(--color-muted)] leading-relaxed">
            One lecture runs four to six thousand words and takes fifteen to
            twenty hours, the reading behind it, the structuring, the drafting,
            the rewrites that make it read as though it were easy. There is no
            paywall, no sponsor deciding what gets said, and no newsletter
            waiting to sell you something later.
          </p>

          <p className="text-sm md:text-base text-[color:var(--color-muted)] leading-relaxed">
            That model only holds if the people it helps carry it. If a lecture
            here changed how you think about a decision, one contribution buys
            the hours for the next one.
          </p>

          <ul className="space-y-px bg-[color:var(--color-rule)]/60 text-sm">
            {[
              ["No account needed", "Card or PayPal balance. One screen, then done."],
              ["No subscription", "A single payment. Nothing recurs, ever."],
              ["No email capture", "You will not hear from this site again."],
            ].map(([label, note]) => (<li
                key={label}
                className="bg-[color:var(--color-bg-elevated)]/60 px-4 py-3 flex flex-wrap items-baseline gap-x-3"
              >
                <span className="text-[color:var(--color-fg)]">{label}</span>
                <span className="text-xs text-[color:var(--color-faint)]">{note}</span>
              </li>))}
          </ul>
        </div>

        {/* ------------------------------------------------------ the action */}
        <div className="lg:col-span-6">
          {loadFailed && (<div className="border border-[color:var(--color-rule)] p-6 text-sm text-[color:var(--color-muted)]">
              The payment panel could not load. Refreshing usually fixes it, and
              if it doesn&apos; t, the lectures are free regardless.
            </div>)}

          {!config && !loadFailed && (<div className="space-y-3" aria-hidden="true">
              <div className="h-4 w-32 animate-pulse bg-[color:var(--color-rule)]/60" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-20 animate-pulse bg-[color:var(--color-rule)]/40" />
                <div className="h-20 animate-pulse bg-[color:var(--color-rule)]/40" />
                <div className="h-20 animate-pulse bg-[color:var(--color-rule)]/40" />
              </div>
              <div className="h-12 animate-pulse bg-[color:var(--color-rule)]/40" />
            </div>)}

          {config && !config.configured && (<div className="border border-[color:var(--color-rule)] p-6 text-sm text-[color:var(--color-muted)]">
              Contributions are paused at the moment. The lectures carry on
              either way.
            </div>)}

          {config?.configured && (<>
              <fieldset>
                <legend className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)] mb-4">
                  Choose an amount
                </legend>

                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {tiers.map((t) => {
                    const active = tier === t;
                    return (<button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTier(t);
                          setError(null);
                          setStatus("idle");
                        }}
                        aria-pressed={active}
                        className={`group border px-3 py-4 text-left transition-colors ${
                          active
                            ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10"
                            : "border-[color:var(--color-rule)] hover:border-[color:var(--color-muted)]"
                        }`}
                      >
                        <span
                          className={`block font-serif text-2xl md:text-[1.75rem] tracking-tight ${
                            active ? "text-[color:var(--color-accent)]" : ""
                          }`}
                        >
                          {config.symbol}
                          {formatMajor(config.presets[t], config.decimals)}
                        </span>
                        <span className="mt-1 block text-[11px] leading-snug text-[color:var(--color-muted)]">
                          {TIER_NOTE[t]}
                        </span>
                      </button>);
                  })}
                </div>

                <div className="mt-3 flex items-stretch border border-[color:var(--color-rule)] focus-within:border-[color:var(--color-muted)] transition-colors">
                  <span className="flex items-center px-3 text-sm text-[color:var(--color-muted)] border-r border-[color:var(--color-rule)]">
                    {config.symbol.trim() || config.currency}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={config.min}
                    max={config.max}
                    step={config.decimals === 0 ? 1 : "any"}
                    value={custom}
                    placeholder="Another amount"
                    aria-label={`Another amount in ${config.currency}`}
                    onChange={(e) => {
                      setCustom(e.target.value);
                      setTier("custom");
                      setError(null);
                      setStatus("idle");
                    }}
                    onFocus={() => setTier("custom")}
                    className={`w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-[color:var(--color-faint)] ${
                      tier === "custom" ? "text-[color:var(--color-accent)]" : ""
                    }`}
                  />
                </div>

                {customTooSmall && (<p className="mt-2 text-xs text-[color:var(--color-faint)]">
                    Minimum {config.symbol}
                    {formatMajor(config.min, config.decimals)}, below that,
                    PayPal&apos; s fee takes most of it.
                  </p>)}
              </fieldset>

              {config.originalCurrency && (<p className="mt-3 text-xs text-[color:var(--color-faint)]">
                  Shown in {config.currency}, PayPal cannot settle{" "}
                  {config.originalCurrency}. Your bank converts at its own rate.
                </p>)}

              {config.env === "sandbox" && (<p className="mt-3 border border-yellow-500/40 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-500/90">
                  Sandbox mode, no real money moves.
                </p>)}

              {config.clientId && (<PaypalButtons
                  clientId={config.clientId}
                  currency={config.currency}
                  getPayload={getPayload}
                  onSuccess={onSuccess}
                  onError={onError}
                  onCancel={onCancel}
                />)}

              <div aria-live="polite">
                {error && (<p className="mt-3 text-xs text-red-400">{error}</p>)}
                {status === "cancelled" && !error && (<p className="mt-3 text-xs text-[color:var(--color-faint)]">
                    Cancelled; nothing was charged. The lectures stay free
                    either way.
                  </p>)}
              </div>

              <p className="mt-5 text-xs leading-relaxed text-[color:var(--color-faint)]">
                Handled entirely by PayPal. Card details never touch this site,
                and this site never learns them.
              </p>
            </>)}
        </div>
      </div>
    </section>);
}
