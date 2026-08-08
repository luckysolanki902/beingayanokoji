"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PaypalButtons } from "@/components/support/PaypalButtons";
import { useStudent } from "@/components/progress/StudentProvider";
import { EnrolForm } from "@/components/progress/EnrolForm";
import { affordanceLadder, bestAffordance } from "@/lib/economy/affordances";
import {
  LECTURE_UNLOCK_COST,
  POINTS_PER_USD,
  SITE_DESTRUCTION_COST,
  classUnlockCost,
} from "@/lib/economy/prices";

/**
 * The bursary. Where points are bought.
 *
 * This is not a tip jar and it does not ask to be thanked. Points are the
 * school's currency and this is the counter they are sold at, so the copy is
 * priced rather than grateful: here is the rate, here is what the rate buys,
 * here is the alternative to paying it. A reader who would rather earn every
 * point by examination is told plainly that they can, because the offer is only
 * honest if the free route is stated as loudly as the paid one.
 */

type TierId = "t1" | "t2" | "t3";

interface ShopConfig {
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

function formatMajor(value: number, decimals: number): string {
  return decimals === 0 ? String(Math.round(value)) : value.toFixed(2).replace(/\.00$/, "");
}

/**
 * Points for a displayed amount, worked out the same way the server does.
 *
 * Only ever used for the label on the button. The server prices the order
 * against its own table and its own rate; if the two ever disagree, the server
 * is right and this is a cosmetic bug rather than a mispriced sale.
 */
function pointsForDisplay(major: number, currency: string): number {
  const RATES: Record<string, number> = {
    USD: 1, EUR: 1.08, GBP: 1.27, AUD: 0.66, CAD: 0.73, CHF: 1.12, SGD: 0.74,
    NZD: 0.61, HKD: 0.128, SEK: 0.096, NOK: 0.094, DKK: 0.145, PLN: 0.25,
    CZK: 0.043, ILS: 0.27, MXN: 0.058, PHP: 0.017, THB: 0.028, JPY: 0.0067,
    HUF: 0.0028, TWD: 0.031,
  };
  const usd = major * (RATES[currency.toUpperCase()] ?? 1);
  return Math.ceil(usd * POINTS_PER_USD);
}

export function PointsShop({
  compact = false,
  showHeader = true,
  source = "footer",
}: {
  compact?: boolean;
  showHeader?: boolean;
  source?: string;
}) {
  const student = useStudent();
  const router = useRouter();

  const [config, setConfig] = useState<ShopConfig | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [tier, setTier] = useState<TierId | "custom">("t2");
  const [custom, setCustom] = useState("");
  const [status, setStatus] = useState<"idle" | "done" | "cancelled">("idle");
  const [error, setError] = useState<string | null>(null);
  const [granted, setGranted] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/support/config")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: ShopConfig) => {
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

  /** The amount currently selected, in major units, or null. */
  const selectedMajor = useMemo(() => {
    if (!config) return null;
    if (tier === "custom") {
      return Number.isFinite(customValue) && customValue > 0 ? customValue : null;
    }
    return config.presets[tier];
  }, [config, tier, customValue]);

  const selectedPoints =
    config && selectedMajor ? pointsForDisplay(selectedMajor, config.currency) : null;

  const getPayload = useCallback(() => {
    const { tier: t, custom: c } = selection.current;
    if (t !== "custom") return { tier: t, source };

    const amount = Number(c);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Choose an amount first.");
      return null;
    }
    if (config && amount < config.min) {
      setError(`The smallest amount PayPal will process here is ${config.symbol}${formatMajor(config.min, config.decimals)}.`);
      return null;
    }
    setError(null);
    return { amount, source };
  }, [config, source]);

  const onSuccess = useCallback(
    (result: { name?: string | null; points?: number }) => {
      setGranted(typeof result?.points === "number" ? result.points : null);
      setStatus("done");
      setError(null);
      // The balance in the header and on every priced button just moved, and
      // the server owns all of them.
      router.refresh();
    },
    [router]
  );

  const onError = useCallback((message: string) => {
    setError(message);
    setStatus("idle");
  }, []);

  const onCancel = useCallback(() => setStatus("cancelled"), []);

  const tiers = useMemo(() => ["t1", "t2", "t3"] as TierId[], []);

  /* ------------------------------------------------------------------ done */

  if (status === "done") {
    return (
      <section className="border border-[color:var(--accent)]/40 bg-[color:var(--bg-elevated)]/60 p-8 text-center md:p-12">
        <p className="font-hand text-xs tracking-[0.24em] text-[color:var(--muted)]">受領</p>
        <h2 className="font-serif mt-4 text-3xl leading-tight tracking-tight md:text-4xl">
          {granted ? `${granted.toLocaleString()} points, credited.` : "Credited."}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[color:var(--muted)] md:text-base">
          They are on your record and they are spendable now. Nobody is going to
          congratulate you for buying them, and nothing about the examinations
          gets easier. What you have bought is time, not standing.
        </p>
        <Link
          href="/record"
          className="mt-7 inline-block border border-[color:var(--fg)] px-7 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)]"
        >
          Go to your record
        </Link>
      </section>
    );
  }

  /* ------------------------------------------------------------ the counter */

  return (
    <section
      className={`border border-[color:var(--rule)] bg-[color:var(--bg-elevated)]/40 ${
        compact ? "p-6 md:p-8" : "p-6 md:p-12"
      }`}
    >
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
        {/* ------------------------------------------------------- the terms */}
        <div className="space-y-6 lg:col-span-6">
          {showHeader && (
            <p className="font-hand text-xs tracking-[0.24em] text-[color:var(--muted)]">
              個人ポイント
            </p>
          )}

          <h2 className="font-serif text-3xl leading-[1.05] tracking-tight md:text-[2.75rem]">
            Points are the only
            <span className="block italic text-[color:var(--accent)]">
              currency here.
            </span>
          </h2>

          <p className="text-sm leading-relaxed text-[color:var(--muted)] md:text-base">
            Every lecture past the first is bought with them, and there are
            exactly two ways to hold any. You answer examination questions
            correctly at the first attempt, which pays five points each and
            costs you nothing but attention. Or you buy them here, at{" "}
            <span className="text-[color:var(--fg)]">
              {POINTS_PER_USD} to the dollar
            </span>
            .
          </p>

          <p className="text-sm leading-relaxed text-[color:var(--muted)] md:text-base">
            The school has no opinion about which you choose. It has an opinion
            about what the choice reveals, but that is not something you pay for
            and not something I am going to explain.
          </p>

          {/* The price list. A currency with no visible prices is a donation. */}
          <dl className="space-y-px bg-[color:var(--rule)]/60 text-sm">
            {[
              [`${LECTURE_UNLOCK_COST} points`, "Opens one lecture, and its examination."],
              [`${classUnlockCost(10)} points`, "Promotion into a whole class. Half price per lecture."],
              [
                `${SITE_DESTRUCTION_COST.toLocaleString()} points`,
                "Orders this site destroyed. The price is not a joke and neither is the item.",
              ],
            ].map(([label, note]) => (
              <div
                key={label}
                className="flex flex-wrap items-baseline gap-x-3 bg-[color:var(--bg-elevated)]/60 px-4 py-3"
              >
                <dt className="font-mono text-xs tabular-nums text-[color:var(--accent)]">
                  {label}
                </dt>
                <dd className="text-xs text-[color:var(--faint)]">{note}</dd>
              </div>
            ))}
          </dl>

          <p className="text-xs leading-relaxed text-[color:var(--faint)]">
            One payment. Nothing recurs, nothing is subscribed to, and no
            address is collected that anything will ever be sent to.
          </p>
        </div>

        {/* ------------------------------------------------------ the counter */}
        <div className="lg:col-span-6">
          {/* Signed out, this is not a shop at all. Points are held against a
              name and there is no name, so showing a price list and a PayPal
              button would be selling something that cannot be delivered. The
              counter is replaced by the register, not decorated with a notice
              above it. */}
          {!student.signedIn ? (
            <div className="border border-[color:var(--accent)]/50 bg-[color:var(--accent)]/5 p-6 md:p-7">
              <p className="font-hand text-xs tracking-[0.24em] text-[color:var(--muted)]">
                入学手続き
              </p>
              <h3 className="font-serif mt-3 text-2xl tracking-tight">
                Give the register a name first.
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-[color:var(--muted)]">
                Points are held against an account, so there is nowhere to put
                them until there is one. An email and a password. No
                verification, and nothing is ever sent to the address.
              </p>

              <EnrolForm />
            </div>
          ) : null}

          {student.signedIn && (
            <div className="mb-6 flex items-baseline justify-between border-b border-[color:var(--rule)] pb-3">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Your balance
              </span>
              <span className="font-mono text-lg tabular-nums text-[color:var(--accent)]">
                {student.points.toLocaleString()}
              </span>
            </div>
          )}

          {student.signedIn && loadFailed && (
            <div className="border border-[color:var(--rule)] p-6 text-sm text-[color:var(--muted)]">
              The counter could not load. Refreshing usually fixes it. The
              examinations pay either way, and they were always the cheaper
              route.
            </div>
          )}

          {student.signedIn && !config && !loadFailed && (
            <div className="space-y-3" aria-hidden="true">
              <div className="h-4 w-32 animate-pulse bg-[color:var(--rule)]/60" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="h-20 animate-pulse bg-[color:var(--rule)]/40" />
                <div className="h-20 animate-pulse bg-[color:var(--rule)]/40" />
                <div className="h-20 animate-pulse bg-[color:var(--rule)]/40" />
              </div>
              <div className="h-12 animate-pulse bg-[color:var(--rule)]/40" />
            </div>
          )}

          {student.signedIn && config && !config.configured && (
            <div className="border border-[color:var(--rule)] p-6 text-sm text-[color:var(--muted)]">
              The counter is shut. Points can still be earned, which is how most
              of them are held anyway.
            </div>
          )}

          {student.signedIn && config?.configured && (
            <>
              <fieldset>
                <legend className="mb-4 text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  How many
                </legend>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:gap-3">
                  {tiers.map((t) => {
                    const active = tier === t;
                    const pts = pointsForDisplay(config.presets[t], config.currency);
                    return (
                      <button
                        key={t}
                        type="button"
                        data-track="shop.tier_select"
                        data-track-label={`${source}:${t}`}
                        onClick={() => {
                          setTier(t);
                          setError(null);
                          setStatus("idle");
                        }}
                        aria-pressed={active}
                        className={`group border px-3 py-4 text-left transition-colors ${
                          active
                            ? "border-[color:var(--accent)] bg-[color:var(--accent)]/10"
                            : "border-[color:var(--rule)] hover:border-[color:var(--muted)]"
                        }`}
                      >
                        {/* The points lead. The money is the small print,
                            because points are what is actually being bought. */}
                        <span
                          className={`block font-serif text-2xl tracking-tight tabular-nums md:text-[1.75rem] ${
                            active ? "text-[color:var(--accent)]" : ""
                          }`}
                        >
                          {pts.toLocaleString()}
                        </span>
                        <span className="mt-1 block text-[11px] leading-snug text-[color:var(--muted)]">
                          {config.symbol}
                          {formatMajor(config.presets[t], config.decimals)}
                        </span>
                        <span className="mt-1.5 block text-[10px] uppercase leading-snug tracking-[0.14em] text-[color:var(--faint)]">
                          {bestAffordance(pts)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-stretch border border-[color:var(--rule)] transition-colors focus-within:border-[color:var(--accent)]">
                  <span className="flex items-center border-r border-[color:var(--rule)] px-3 text-sm text-[color:var(--muted)]">
                    {config.symbol.trim() || config.currency}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={config.min}
                    max={config.max}
                    step={config.decimals === 0 ? 1 : "any"}
                    value={custom}
                    placeholder="Some other number"
                    aria-label={`Another amount in ${config.currency}`}
                    onChange={(e) => {
                      setCustom(e.target.value);
                      setTier("custom");
                      setError(null);
                      setStatus("idle");
                    }}
                    onFocus={() => setTier("custom")}
                    className={`w-full bg-transparent px-3 py-3 text-base outline-none placeholder:text-[color:var(--faint)] sm:text-sm ${
                      tier === "custom" ? "text-[color:var(--accent)]" : ""
                    }`}
                  />
                </div>

                {customTooSmall && (
                  <p className="mt-2 text-xs text-[color:var(--faint)]">
                    Minimum {config.symbol}
                    {formatMajor(config.min, config.decimals)}. Below that
                    PayPal&apos;s fee takes most of it, and you would be paying
                    them rather than the school.
                  </p>
                )}
              </fieldset>

              {/* What the money actually turns into, and then what those
                  points actually reach. A balance figure on its own tells a
                  reader nothing; the ladder underneath is the part that means
                  something, and it is why the amount box is worth typing in. */}
              {selectedPoints !== null && selectedMajor !== null && (
                <div
                  aria-live="polite"
                  className="mt-4 border-l-2 border-[color:var(--accent)] pl-4"
                >
                  <p className="text-sm text-[color:var(--muted)]">
                    {config.symbol}
                    {formatMajor(selectedMajor, config.decimals)} buys{" "}
                    <span className="font-mono tabular-nums text-[color:var(--accent)]">
                      {selectedPoints.toLocaleString()}
                    </span>{" "}
                    points, which is enough to{" "}
                    <span className="text-[color:var(--fg)]">
                      {(bestAffordance(selectedPoints) ?? "").toLowerCase()}
                    </span>
                    .
                  </p>

                  <ul className="mt-3 space-y-1">
                    {affordanceLadder(selectedPoints).map((rung) => (
                      <li
                        key={rung.label}
                        className={`flex items-baseline gap-2.5 text-xs ${
                          rung.reached
                            ? "text-[color:var(--muted)]"
                            : "text-[color:var(--faint)] line-through decoration-[color:var(--rule)]"
                        }`}
                      >
                        <span aria-hidden="true" className="w-3 shrink-0">
                          {rung.reached ? "✓" : ""}
                        </span>
                        <span className="font-mono tabular-nums">
                          {rung.cost.toLocaleString()}
                        </span>
                        <span>{rung.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {config.originalCurrency && (
                <p className="mt-3 text-xs text-[color:var(--faint)]">
                  Shown in {config.currency}; PayPal cannot settle{" "}
                  {config.originalCurrency}. Your bank converts at its own rate.
                </p>
              )}

              {config.env === "sandbox" && (
                <p className="mt-3 border border-yellow-500/40 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-500/90">
                  Sandbox mode. No real money moves.
                </p>
              )}

              {config.clientId && (
                <PaypalButtons
                  clientId={config.clientId}
                  currency={config.currency}
                  getPayload={getPayload}
                  onSuccess={onSuccess}
                  onError={onError}
                  onCancel={onCancel}
                />
              )}

              <div aria-live="polite">
                {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
                {status === "cancelled" && !error && (
                  <p className="mt-3 text-xs text-[color:var(--faint)]">
                    Cancelled. Nothing was charged, and the examinations are
                    still open.
                  </p>
                )}
              </div>

              <p className="mt-5 text-xs leading-relaxed text-[color:var(--faint)]">
                Handled entirely by PayPal. Card details never touch this site,
                and this site never learns them.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
