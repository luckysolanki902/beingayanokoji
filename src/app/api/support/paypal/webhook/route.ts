import { NextRequest, NextResponse } from "next/server";
import {
  fromPaypalAmount,
  getPaypalOrder,
  paypalFacts,
  paypalWebhookConfigured,
  verifyPaypalWebhook,
} from "@/lib/paypal";
import {
  recordFromFacts,
  recordSupport,
  type SupportEvent,
} from "@/lib/support-log";
import { grantPointsForPayment } from "@/lib/economy/grant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PayPal's server-to-server source of truth.
 *
 * The browser capture path handles the ordinary case, but it only runs if the
 * reader's tab survives long enough to call it. This route is what records a
 * payment when it doesn't, a closed tab, blocked JavaScript, a network drop
 * between approval and capture, and it is the only path that hears about
 * refunds and denials at all.
 *
 * Verification is a round trip to PayPal rather than a local HMAC, because
 * PayPal signs with a rotating certificate. It fails closed: an event that
 * cannot be proved to come from PayPal is dropped, never recorded.
 */

/** A capture resource names its order through `supplementary_data`. */
function orderIdFromResource(resource: Record<string, unknown>): string | null {
  const supplementary = (resource.supplementary_data ?? {}) as Record<string, unknown>;
  const related = (supplementary.related_ids ?? {}) as Record<string, unknown>;
  if (typeof related.order_id === "string" && related.order_id) {
    return related.order_id;
  }
  // CHECKOUT.ORDER.* events carry the order itself.
  if (typeof resource.id === "string" && Array.isArray(resource.purchase_units)) {
    return resource.id;
  }
  return null;
}

const HANDLED: Record<string, SupportEvent> = {
  "PAYMENT.CAPTURE.COMPLETED": "webhook.captured",
  "PAYMENT.CAPTURE.DENIED": "webhook.denied",
  "PAYMENT.CAPTURE.REFUNDED": "webhook.refunded",
  "CHECKOUT.ORDER.APPROVED": "webhook.approved",
};

export async function POST(request: NextRequest) {
  const raw = await request.text();

  let event: { event_type?: string; resource?: Record<string, unknown> };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ message: "Bad payload." }, { status: 400 });
  }

  // Without a webhook id we cannot prove the sender is PayPal, so we must not
  // act on it. 503 rather than 200 so the misconfiguration is visible in
  // PayPal's own delivery log instead of failing silently.
  if (!paypalWebhookConfigured()) {
    console.error("PayPal webhook received but PAYPAL_WEBHOOK_ID is not set.");
    return NextResponse.json({ message: "Not configured." }, { status: 503 });
  }
  if (!(await verifyPaypalWebhook(request.headers, event))) {
    return NextResponse.json({ message: "Invalid signature." }, { status: 400 });
  }

  const resource = event.resource ?? {};
  const type = event.event_type || "";
  const mapped = HANDLED[type];
  // Acknowledge everything else. A 200 stops PayPal retrying an event we have
  // simply chosen not to handle.
  if (!mapped) return NextResponse.json({ received: true });

  const orderId = orderIdFromResource(resource);
  if (!orderId) return NextResponse.json({ received: true });

  try {
    // A capture event describes the capture, not the payer. Fetch the order so
    // the record carries who paid, not just how much.
    let facts;
    if (Array.isArray(resource.purchase_units)) {
      facts = paypalFacts(resource);
    } else {
      try {
        facts = paypalFacts(await getPaypalOrder(orderId));
      } catch (err) {
        console.error("paypal webhook: order fetch failed:", err);
        facts = paypalFacts(null);
      }
      // Fall back to the capture resource's own amount if that fetch failed.
      const amount = (resource.amount ?? {}) as Record<string, unknown>;
      facts.paymentId ??= typeof resource.id === "string" ? resource.id : null;
      facts.amountSubunits ??= fromPaypalAmount(amount.value, amount.currency_code);
      facts.currency ??=
        typeof amount.currency_code === "string" ? amount.currency_code : null;
      facts.reference ??=
        typeof resource.custom_id === "string" ? resource.custom_id : null;
    }

    recordSupport(recordFromFacts(mapped, orderId, facts, { via: "webhook" }));

    // The reliable half of the grant. The browser usually gets here first, but
    // a reader who closed the tab on PayPal's confirmation screen never does
    // for them this is the only path, and the account it credits is the one
    // recorded when the order was created. Granting twice is not possible: the
    // `pointsGranted` flag is flipped under a conditional update.
    if (mapped === "webhook.captured") {
      await grantPointsForPayment(null, orderId, facts, "webhook");
    }
  } catch (error) {
    // 500 so PayPal retries this delivery.
    console.error("support/paypal/webhook error:", error);
    return NextResponse.json({ message: "Processing error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
