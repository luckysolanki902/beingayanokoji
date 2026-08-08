import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Money that came in, and the points it bought.
 *
 * PayPal remains the authority on the payment itself; this is the site's own
 * copy of what it did about it. It matters because a capture can be reported
 * twice (the browser confirms it *and* the webhook arrives) and both paths
 * write here. The unique `orderId` decides which one wins, so the second is a
 * no-op rather than a second grant of points.
 *
 * `usdCents` is stored alongside the real amount because the exchange rate used
 * at the time is not recoverable later, and a student asking why a €5 payment
 * became 55 points deserves an answer that does not depend on today's rate.
 */

const PurchaseSchema = new Schema({
    /**
     * Who to credit. Null when the payer was not signed in, the payment is
     * still recorded, it simply has no balance to land in.
     *
     * Written when the *order* is created rather than when it is captured,
     * because the webhook that confirms a capture is a call from PayPal with no
     * session attached. Without this the money from anyone who closed the tab
     * before returning could never be attributed to them.
     */
    user: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    /** PayPal's order id. One purchase per order, enforced below. */
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String, default: null },

    /**
     * Whether the points have actually been handed over.
     *
     * The flag, not the row's existence, is what makes granting idempotent: the
     * row is written at order time and both the browser and the webhook then
     * race to flip this from false to true. Exactly one of them can win a
     * conditional update, and only the winner grants.
     */
    pointsGranted: { type: Boolean, required: true, default: false },

    /** What was actually charged, in the currency it was charged in. */
    amountSubunits: { type: Number, required: true, default: 0 },
    currency: { type: String, required: true, default: "USD" },
    /** The same amount converted to US cents at the time of capture. */
    usdCents: { type: Number, required: true, default: 0 },
    /** Points granted for it, `usdCents` at ten points to the dollar. */
    points: { type: Number, required: true, default: 0 },

    status: {
      type: String,
      enum: ["created", "completed", "pending", "refunded"],
      required: true,
      default: "created",
    },
    /** "browser" when the reader's tab reported it, "webhook" when PayPal did. */
    via: { type: String, enum: ["browser", "webhook"], default: "browser" },
    payerEmail: { type: String, default: null },
    payerName: { type: String, default: null },
    country: { type: String, default: null },
  },
  { timestamps: true });

export type PurchaseDoc = InferSchemaType<typeof PurchaseSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Purchase: Model<PurchaseDoc> =
  (mongoose.models.Purchase as Model<PurchaseDoc>) ??
  mongoose.model<PurchaseDoc>("Purchase", PurchaseSchema);
