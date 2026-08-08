import { NextRequest, NextResponse } from "next/server";
import {
  capturePaypalOrder,
  getPaypalOrder,
  paypalConfigured,
  paypalFacts,
} from "@/lib/paypal";
import { recordFromFacts, recordSupport } from "@/lib/support-log";
import { getCurrentUser } from "@/lib/auth/session";
import { grantPointsForPayment } from "@/lib/economy/grant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Take the money, once the reader has approved in the PayPal window.
 *
 * There is no signature to check here because nothing the client sends is
 * trusted in the first place, only an order id, and an id that isn't ours
 * cannot be captured with our credentials, so a forged one simply fails at
 * PayPal. The amount that gets recorded comes from PayPal's response, never
 * from the request body.
 */
export async function POST(request: NextRequest) {
  try {
    if (!paypalConfigured()) {
      return NextResponse.json({ message: "Not configured." }, { status: 503 });
    }

    const body = (await request.json().catch(() => null)) as {
      orderId?: unknown;
      source?: unknown;
    } | null;

    const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
    // PayPal order ids are short uppercase alphanumerics; reject anything else
    // before it reaches a URL.
    if (!orderId || !/^[A-Z0-9]{6, 32}$/i.test(orderId)) {
      return NextResponse.json({ message: "Invalid payment." }, { status: 400 });
    }

    let captured: Record<string, unknown>;
    try {
      captured = await capturePaypalOrder(orderId);
    } catch (err) {
      // A capture can fail precisely because it already succeeded, a
      // double-submitted button, a retried request. Read the order back before
      // calling it a failure; telling someone their payment broke when the
      // money actually moved is the worse of the two mistakes.
      console.error("paypal capture failed, re-reading order:", err);
      try {
        captured = await getPaypalOrder(orderId);
      } catch {
        return NextResponse.json({ message: "Could not complete the payment." },
          { status: 502 });
      }
    }

    const facts = paypalFacts(captured);
    const status = String(captured.status || "").toUpperCase();
    const completed = status === "COMPLETED";

    recordSupport(recordFromFacts(completed ? "order.captured" : "order.pending",
        orderId,
        facts,
        { via: "browser" }));

    if (!completed) {
      // Approved but not captured. The webhook finishes the job if PayPal
      // completes it asynchronously, so this is not an error to shout about.
      return NextResponse.json({ success: false, status });
    }

    // Money in becomes points, for a reader with somewhere to put them. The
    // session is read here rather than trusted from the request body: a user id
    // in a POST is an invitation to credit someone else's account.
    let granted = 0;
    try {
      const user = await getCurrentUser();
      const result = await grantPointsForPayment(user?.id ?? null,
        orderId,
        facts,
        "browser");
      granted = result.granted;
    } catch (err) {
      // The payment succeeded and the points did not. Never fail the response
      // over this, the reader's money moved and telling them it did not would
      // be the worse of the two wrongs. The purchase row is the trail to fix it.
      console.error("[support] captured but could not grant points:", err);
    }

    return NextResponse.json({
      success: true,
      name: facts.name,
      amount: facts.amountSubunits,
      currency: facts.currency,
      points: granted,
    });
  } catch (error) {
    console.error("support/paypal/capture error:", error);
    return NextResponse.json({ message: "Could not complete the payment." },
      { status: 500 });
  }
}
