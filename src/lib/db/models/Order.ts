import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A receipt. One document per thing bought with points.
 *
 * The ledger in `PointEntry` already records that a number moved; this records
 * *what was bought*, which is a different question and the one a student
 * actually asks. It carries the item, the price at the time, where in the site
 * the purchase was made from, and two running figures captured at the moment of
 * sale: how many times this student had bought this same item before, and what
 * they had spent in total.
 *
 * Those two are snapshots on purpose. Recomputing "was this a repeat?" later
 * means trusting that no order was ever deleted and that prices never changed;
 * writing it down at the till means the receipt stays true regardless of what
 * happens to the catalogue afterwards.
 */

const OrderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    /** Catalogue id. Stable, and what everything is grouped by. */
    sku: { type: String, required: true, index: true },
    /** The catalogue's title at the time of sale, so an old receipt still reads. */
    title: { type: String, required: true },
    /** Points charged. Zero for a use covered by the item's free allowance. */
    cost: { type: Number, required: true },
    /** True when this one was free, so the receipt can say why. */
    wasFree: { type: Boolean, required: true, default: false },

    /** Which surface it was bought from: "record", "header", "lecture". */
    source: { type: String, default: null },

    /**
     * Which purchase of this item this was, for this student. 1 is the first.
     *
     * This is what makes "repeat order" answerable without a scan, and what the
     * free-allowance rule is evaluated against.
     */
    repeatIndex: { type: Number, required: true, default: 1 },

    /** Lifetime totals for this student, as at this order. */
    lifetimeOrders: { type: Number, required: true, default: 1 },
    lifetimePointsSpent: { type: Number, required: true, default: 0 },

    /** The ledger line this order produced, when it cost anything. */
    ledgerEntry: { type: Schema.Types.ObjectId, ref: "PointEntry", default: null },

    /** Anything item-specific: the lecture slug, the name that was set. */
    meta: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// The receipt list, newest first, and the per-item history the repeat counter
// and the free allowance are both derived from.
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ user: 1, sku: 1, createdAt: -1 });

export type OrderDoc = InferSchemaType<typeof OrderSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Order: Model<OrderDoc> =
  (mongoose.models.Order as Model<OrderDoc>) ??
  mongoose.model<OrderDoc>("Order", OrderSchema);
