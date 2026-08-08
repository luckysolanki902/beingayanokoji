import { NextRequest, NextResponse } from "next/server";
import { getClientCountry } from "@/lib/request";
import { priceConfigFor, resolveAmount } from "@/lib/pricing";
import { createPaypalOrder, paypalConfigured, paypalSupports } from "@/lib/paypal";
import { recordSupport } from "@/lib/support-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Where in the site the reader started from. Anything else is "unknown". */
const ALLOWED_SOURCES = new Set(["header", "footer", "reader", "lectures", "about", "unknown"]);

/**
 * Create a PayPal order.
 *
 * The amount is decided here and nowhere else: the client sends a tier id or a
 * custom amount, and the server prices it against its own table for the
 * reader's edge-reported country. Nothing in the request body can raise or
 * lower what PayPal is told to collect.
 */
export async function POST(request: NextRequest) {
  try {
    if (!paypalConfigured()) {
      return NextResponse.json(
        { message: "Support is not available right now." },
        { status: 503 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      tier?: unknown;
      amount?: unknown;
      source?: unknown;
      message?: unknown;
    } | null;

    const country = getClientCountry(request);
    const local = priceConfigFor(country);
    const cfg = paypalSupports(local.currency) ? local : priceConfigFor("US");

    let priced;
    try {
      priced = resolveAmount(cfg, { tier: body?.tier, amount: body?.amount });
    } catch {
      return NextResponse.json(
        { message: "Please choose an amount first." },
        { status: 400 }
      );
    }

    const source =
      typeof body?.source === "string" && ALLOWED_SOURCES.has(body.source)
        ? body.source
        : "unknown";
    const note =
      typeof body?.message === "string" && body.message.trim()
        ? body.message.trim().slice(0, 300)
        : null;

    const reference = `ba_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const order = await createPaypalOrder({
      subunits: priced.subunits,
      currency: cfg.currency,
      reference,
      description: "Support Being Ayanokoji",
    });

    recordSupport({
      event: "order.created",
      orderId: order.id,
      reference,
      amountSubunits: priced.subunits,
      currency: cfg.currency,
      source,
      country,
      message: note,
    });

    return NextResponse.json({
      orderId: order.id,
      display: priced.major,
      symbol: cfg.symbol,
      currency: cfg.currency,
    });
  } catch (error) {
    console.error("support/paypal/order error:", error);
    return NextResponse.json(
      { message: "Could not start the payment. Please try again." },
      { status: 500 }
    );
  }
}
