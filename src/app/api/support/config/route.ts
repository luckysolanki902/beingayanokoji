import { NextRequest, NextResponse } from "next/server";
import { getClientCountry } from "@/lib/request";
import { priceConfigFor } from "@/lib/pricing";
import { getPaypalClientId, isLive, paypalConfigured, paypalSupports } from "@/lib/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tells the support panel what to render: the currency, its symbol, the three
 * preset amounts, the bounds on a custom amount, and the public PayPal client
 * id its SDK needs.
 *
 * Display only. The order endpoint re-derives every one of these server-side,
 * so a client that lies about its country or its currency gets nowhere.
 */
export async function GET(request: NextRequest) {
  const country = getClientCountry(request);
  const local = priceConfigFor(country);

  // PayPal cannot settle every currency. When it cannot settle the reader's,
  // quote USD tiers rather than a converted local amount — round numbers the
  // reader recognises beat an exact conversion nobody asked for.
  const settleable = paypalSupports(local.currency);
  const cfg = settleable ? local : priceConfigFor("US");

  return NextResponse.json({
    configured: paypalConfigured(),
    currency: cfg.currency,
    symbol: cfg.symbol,
    country,
    presets: cfg.presets,
    min: cfg.min,
    max: cfg.max,
    decimals: cfg.decimals,
    // Set when we had to swap the reader's own currency out, so the panel can
    // say why the amounts are in dollars.
    originalCurrency: settleable ? null : local.currency,
    // Public by design — the browser SDK needs it in a script URL. The secret
    // never leaves the server.
    clientId: paypalConfigured() ? getPaypalClientId() : null,
    env: isLive() ? "live" : "sandbox",
  });
}
