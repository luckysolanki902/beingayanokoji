import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * The ledger. Every point that has ever moved, in or out, with the balance it
 * left behind.
 *
 * `User.points` is a running total and running totals go wrong, a crashed
 * request, a retried webhook, a bug written next year. This collection is the
 * append-only history that can be replayed to say what the balance *should* be,
 * which is the difference between a number a student is asked to trust and a
 * number that can be checked.
 *
 * Nothing here is ever updated or deleted. A mistake is corrected by writing
 * its opposite, the way a ledger has always worked.
 */

/** Why points moved. Positive kinds credit, negative kinds debit. */
export const POINT_REASONS = [
  "exam.first-correct",
  "purchase.paypal",
  "unlock.lecture",
  "unlock.class",
  "site.destruction",
  "grant",
  "correction",
] as const;

export type PointReason = (typeof POINT_REASONS)[number];

const PointEntrySchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    /** Signed: +50 for a purchase, −100 for a lecture. Never zero. */
    delta: { type: Number, required: true },
    /** The balance immediately after this entry was applied. */
    balanceAfter: { type: Number, required: true },
    reason: { type: String, enum: POINT_REASONS, required: true },

    /** One line the record page can show without decoding `meta`. */
    description: { type: String, required: true, maxlength: 200 },

    /** The lecture or class this concerns, when it concerns one. */
    slug: { type: String, default: null },
    classId: { type: String, default: null },

    /**
     * An external id this entry is tied to, a PayPal order, a question id.
     *
     * Uniquely indexed, so replaying the same PayPal webhook cannot credit the
     * same payment twice: the second insert loses to the index.
     *
     * There is no `default: null`, and that is load-bearing. A default would
     * write the field as an explicit null on every ordinary entry, and a unique
     * index treats two explicit nulls as a collision, so the *second* entry
     * with no external id would be rejected, and the ledger would silently stop
     * recording almost everything. The field has to be genuinely absent.
     */
    idempotencyKey: { type: String },

    meta: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } });

// The record page reads a student's history newest-first; this is that query.
PointEntrySchema.index({ user: 1, createdAt: -1 });
// Partial rather than sparse. `sparse` only excludes documents where the field
// is *absent*, so a single stray explicit null would put the entry back in the
// index and collide with the next one. The partial filter excludes anything
// that is not a string, which is the property actually wanted: uniqueness
// applies to real keys and to nothing else.
PointEntrySchema.index({ idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } });

export type PointEntryDoc = InferSchemaType<typeof PointEntrySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PointEntry: Model<PointEntryDoc> =
  (mongoose.models.PointEntry as Model<PointEntryDoc>) ??
  mongoose.model<PointEntryDoc>("PointEntry", PointEntrySchema);
