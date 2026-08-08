import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Someone spent two million points to ask that the site be taken down.
 *
 * It is a real item at a real price, not a joke with no implementation, the
 * points are debited like any other purchase and this document is the receipt.
 * What it does *not* do is delete anything on its own. The order is placed;
 * whether it is carried out is a decision made by a person reading this
 * collection, which is the only sane way to build a button of that size.
 *
 * At ten points to the dollar, and setting aside anything earned by passing
 * examinations, two million points is two hundred thousand dollars.
 */

const DestructionOrderSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    /** Points debited. Recorded rather than assumed, in case the price moves. */
    cost: { type: Number, required: true },
    /** Whatever they wanted to say about it. Optional, and usually the point. */
    note: { type: String, default: null, maxlength: 2000 },

    status: {
      type: String,
      enum: ["placed", "acknowledged", "declined", "fulfilled"],
      required: true,
      default: "placed",
    },
    /** Filled in by whoever answers it. */
    response: { type: String, default: null, maxlength: 2000 },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true });

export type DestructionOrderDoc = InferSchemaType<typeof DestructionOrderSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const DestructionOrder: Model<DestructionOrderDoc> =
  (mongoose.models.DestructionOrder as Model<DestructionOrderDoc>) ??
  mongoose.model<DestructionOrderDoc>("DestructionOrder", DestructionOrderSchema);
