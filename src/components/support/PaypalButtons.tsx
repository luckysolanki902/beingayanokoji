"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { paypalColorFor } from "@/lib/themes";

/**
 * PayPal's own buttons. PayPal draws these itself, the branded button is not
 * something an integrator is allowed to fake, so this mounts their SDK into a
 * container div rather than rendering markup of our own.
 *
 * The amount is never handed to the browser SDK. `createOrder` calls our
 * server, which prices the tier and creates the order; the SDK only ever learns
 * an order id. That keeps "the client never decides how much is charged" true
 * at the one place it would otherwise be easy to break.
 */

interface PaypalNamespace {
  Buttons: (config: Record<string, unknown>) => {
    render: (target: HTMLElement) => Promise<void>;
    close?: () => void;
  };
}
declare global {
  interface Window {
    paypal?: PaypalNamespace;
  }
}

function sdkUrl(clientId: string, currency: string): string {
  const params = new URLSearchParams({
    "client-id": clientId,
    currency,
    intent: "capture",
    components: "buttons",
    // Buying points is a one-off purchase and has no business offering
    // instalment credit. The value is a comma-separated list and PayPal
    // validates each entry against a fixed set: a single stray space makes
    // " paylater" an unknown funding source, and the whole SDK script 400s
    // rather than ignoring it. That failure surfaces to the reader as "PayPal
    // could not load", which reads like an ad blocker and is not.
    "disable-funding": "credit,paylater",
  });
  return `https://www.paypal.com/sdk/js?${params.toString()}`;
}

/**
 * Load the SDK once. PayPal keys its global on the currency baked into the
 * script URL, so a currency change would need a fresh script, but the currency
 * is fixed per reader for the life of a session, so in practice this runs once.
 */
function loadSdk(clientId: string, currency: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.paypal) return resolve(true);

    const src = sdkUrl(clientId, currency);
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function PaypalButtons({
  clientId,
  currency,
  /**
   * Read the *current* selection at click time. A ref-backed getter rather than
   * a prop, because PayPal renders its buttons into an iframe once and closes
   * over whatever it was given, a plain prop would freeze the reader on
   * whichever amount happened to be selected when the panel opened.
   */
  getPayload,
  onSuccess,
  onError,
  onCancel,
}: {
  clientId: string;
  currency: string;
  getPayload: () => Record<string, unknown> | null;
  onSuccess: (result: { name?: string | null; points?: number }) => void;
  onError: (message: string) => void;
  onCancel: () => void;
}) {
  const { theme } = useTheme();
  const paypalColor = paypalColorFor(theme);

  const container = useRef<HTMLDivElement | null>(null);
  /** Set when we threw on purpose, so onError knows not to talk over us. */
  const suppressError = useRef(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Keep the callbacks fresh without re-rendering the buttons. Written in an
  // effect rather than during render: PayPal's iframe reads these long after
  // the fact, so what matters is that the ref is current by the time the reader
  // clicks, and mutating a ref mid-render is not allowed.
  const handlers = useRef({ getPayload, onSuccess, onError, onCancel });
  useEffect(() => {
    handlers.current = { getPayload, onSuccess, onError, onCancel };
  }, [getPayload, onSuccess, onError, onCancel]);

  useEffect(() => {
    let cancelled = false;
    let instance: ReturnType<PaypalNamespace["Buttons"]> | null = null;

    (async () => {
      const ok = await loadSdk(clientId, currency);
      if (cancelled) return;
      if (!ok || !window.paypal || !container.current) {
        setFailed(true);
        return;
      }

      instance = window.paypal.Buttons({
        // PayPal draws inside its own iframe, so the only styling available is
        // the handful of options it exposes. Square corners to match every
        // other control on the site, and a colour chosen from its palette to
        // suit the room the reader picked, black in the light themes and white
        // in the dark ones. Gold is never used; it is the one option that would
        // look like an advertisement dropped into a lecture.
        style: {
          layout: "vertical",
          shape: "rect",
          label: "paypal",
          height: 48,
          color: paypalColor,
          tagline: false,
        },

        createOrder: async () => {
          const payload = handlers.current.getPayload();
          if (!payload) {
            // The panel has already told the reader exactly what is wrong (an
            // empty or too-small custom amount). PayPal routes any throw here
            // into onError, so flag it, replacing "Enter at least $1" with a
            // generic failure would send them hunting for a problem that isn't
            // there.
            suppressError.current = true;
            throw new Error("no-amount");
          }
          const res = await fetch("/api/support/paypal/order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok || !data?.orderId) {
            throw new Error(data?.message || "order-failed");
          }
          return data.orderId as string;
        },

        onApprove: async (data: { orderID: string }) => {
          // The capture is the charge, so a failure here matters: say so rather
          // than showing a thank-you for money that never moved.
          const res = await fetch("/api/support/paypal/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.orderID }),
          });
          const body = await res.json().catch(() => null);
          if (!res.ok || !body?.success) {
            handlers.current.onError(body?.message || "The payment did not go through. Nothing was charged.");
            return;
          }
          handlers.current.onSuccess({ name: body.name, points: body.points });
        },

        onCancel: () => handlers.current.onCancel(),

        onError: (err: unknown) => {
          if (suppressError.current) {
            suppressError.current = false;
            return;
          }
          console.error("paypal button error:", err);
          handlers.current.onError("PayPal could not be reached. Please try again in a moment.");
        },
      });

      try {
        await instance.render(container.current);
        if (!cancelled) setReady(true);
      } catch (err) {
        console.error("paypal render failed:", err);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      try {
        instance?.close?.();
      } catch {
        /* the SDK throws if it was never rendered; nothing to undo */
      }
    };
  }, [clientId, currency, paypalColor]);

  return (<div className="mt-6">
      {!ready && !failed && (<div
          className="h-[48px] w-full animate-pulse rounded-sm bg-[color:var(--color-bg-elevated)]"
          aria-label="Loading PayPal"
        />)}
      {failed && (<p className="py-3 text-center text-xs text-red-400">
          PayPal could not load. A browser extension or network filter may be
          blocking it.
        </p>)}
      {/* PayPal renders into this node. It stays mounted while loading so the
          SDK always has a target to draw into. */}
      <div ref={container} className={failed ? "hidden" : undefined} />
    </div>);
}
