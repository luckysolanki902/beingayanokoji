import "server-only";

import { connectToDatabase, databaseConfigured } from "@/lib/db/connect";
import { Purchase } from "@/lib/db/models";
import { creditPoints } from "@/lib/economy/points";
import { pointsForUsdCents, usdCentsFor } from "@/lib/economy/prices";
import type { PaymentFacts } from "@/lib/paypal";

/**
 * Turning money into personal points, in two steps that happen minutes apart.
 *
 * The hard part is not the arithmetic. It is that a completed payment is
 * reported *twice*, once by the reader's browser when the PayPal window
 * closes, once by PayPal's webhook, and either can arrive first, or alone. The
 * browser knows who is signed in and the webhook does not; the webhook always
 * arrives and the browser does not, because tabs get closed.
 *
 * So the account to credit is written down when the order is created, while a
 * session still exists, and the grant itself is a race that exactly one caller
 * can win: `pointsGranted` flips from false to true under a conditional update,
 * and only the caller whose update matched hands over any points.
 */

/**
 * Record who this order belongs to, before anyone has paid anything.
 *
 * Called at order creation, with a session in hand. A signed-out payer gets a
 * row with no user, which is deliberate, the payment is still a payment, and a
 * row that says "nobody was signed in" is the answer to the support email that
 * eventually asks where the points went.
 */
export async function recordPurchaseIntent(params: {
  userId: string | null;
  orderId: string;
  subunits: number;
  currency: string;
}): Promise<void> {
  if (!databaseConfigured()) return;

  const usdCents = usdCentsFor(params.currency, params.subunits);

  try {
    await connectToDatabase();
    await Purchase.create({
      user: params.userId,
      orderId: params.orderId,
      amountSubunits: params.subunits,
      currency: params.currency,
      usdCents,
      points: pointsForUsdCents(usdCents),
      status: "created",
      pointsGranted: false,
    });
  } catch (err) {
    if ((err as { code?: number }).code !== 11000) {
      // Losing this row costs the payer their points if they never come back
      // to the tab, so it is worth a loud log, but not worth blocking the
      // payment over, since the browser path can still attribute it.
      console.error("[support] could not record a purchase intent:", err);
    }
  }
}

export interface GrantOutcome {
  granted: number;
  /** True when someone else had already granted this order's points. */
  alreadyGranted: boolean;
  /** True when nobody was signed in, so there is nowhere to put them. */
  unattributed: boolean;
}

/**
 * Hand over the points for a captured payment. Safe to call more than once.
 *
 * `sessionUserId` is the signed-in reader when the browser reports the capture,
 * and null when the webhook does. It is only ever used to *fill in* an intent
 * row that has no user; it can never redirect an order already attributed to
 * someone else, which is what stops a captured order id from being replayed by
 * a second account to steal the points.
 */
export async function grantPointsForPayment(sessionUserId: string | null,
  orderId: string,
  facts: PaymentFacts,
  via: "browser" | "webhook"): Promise<GrantOutcome> {
  const nothing: GrantOutcome = { granted: 0, alreadyGranted: false, unattributed: false };
  if (!databaseConfigured()) return nothing;

  await connectToDatabase();

  const subunits = facts.amountSubunits ?? 0;
  const currency = facts.currency ?? "USD";
  const captured = subunits > 0;
  const usdCents = captured ? usdCentsFor(currency, subunits) : 0;
  const points = captured ? pointsForUsdCents(usdCents) : 0;

  // The one conditional update that decides everything. Matching on
  // `pointsGranted: false` means a second caller, the webhook arriving after
  // the browser, a retried request, matches nothing and grants nothing.
  const purchase = await Purchase.findOneAndUpdate({ orderId, pointsGranted: false },
    {
      $set: {
        pointsGranted: true,
        status: "completed",
        via,
        paymentId: facts.paymentId ?? null,
        payerEmail: facts.email ?? null,
        payerName: facts.name ?? null,
        country: facts.countryCode ?? null,
        ...(captured ? { amountSubunits: subunits, currency, usdCents, points } : {}),
      },
      // Fills in an order this site never saw created, and, for a payer who
      // was signed out at order time and signed in by the time they returned,
      // gives the points somewhere to go. `$setOnInsert` on `user` means it
      // cannot overwrite an attribution that already exists.
      $setOnInsert: { orderId, user: sessionUserId },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }).catch((err: { code?: number }) => {
    // A duplicate here means the row exists with `pointsGranted: true`, the
    // filter missed it and the upsert then collided with the unique index.
    // Which is simply the other caller having got there first.
    if (err.code === 11000) return null;
    throw err;
  });

  if (!purchase) return { granted: 0, alreadyGranted: true, unattributed: false };

  // An intent row written for a signed-out payer, being captured by a reader
  // who has since signed in. Attribution is still open, so claim it.
  let owner = purchase.user ? String(purchase.user) : null;
  if (!owner && sessionUserId) {
    await Purchase.updateOne({ _id: purchase._id, user: null }, { $set: { user: sessionUserId } });
    owner = sessionUserId;
  }

  const finalPoints = purchase.points ?? points;
  if (!owner) return { granted: 0, alreadyGranted: false, unattributed: true };
  if (finalPoints <= 0) return nothing;

  await creditPoints(owner, finalPoints, {
    reason: "purchase.paypal",
    description: `Bought ${finalPoints.toLocaleString()} personal points`,
    idempotencyKey: `paypal:${orderId}`,
    kind: "purchased",
    meta: { orderId, currency: purchase.currency, subunits: purchase.amountSubunits, via },
  });

  return { granted: finalPoints, alreadyGranted: false, unattributed: false };
}
