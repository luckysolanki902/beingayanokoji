import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * One student's relationship with one lecture: whether it is open to them, and
 * whether they have passed its examination.
 *
 * Access and completion live in the same document because they are the same
 * question asked twice ("can I read this" and "am I done with this") and
 * splitting them would mean two round trips to draw a single row of the roster.
 *
 * The `(user, slug)` unique index is doing real work: it is what makes paying
 * for a lecture twice impossible. The unlock flow inserts this document *first*
 * and charges afterwards, so a double-clicked button loses the second insert to
 * the index instead of the student's points.
 */

const LectureAccessSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    /** The lecture's slug, the same id used everywhere else in the site. */
    slug: { type: String, required: true },

    unlockedAt: { type: Date, default: Date.now },
    /**
     * How it was opened, so the record can explain itself.
     *
     * `free` is the first lecture, which nobody pays for. `lecture` is a single
     * purchase, `class` a whole class bought at once, `grant` anything the site
     * handed over outside the economy.
     */
    unlockedBy: {
      type: String,
      enum: ["free", "lecture", "class", "grant"],
      required: true,
      default: "lecture",
    },
    /** What it actually cost, in points. Zero for `free` and `grant`. */
    unlockCost: { type: Number, required: true, default: 0 },

    /** Set the first time the examination is passed, and never moved after. */
    passedAt: { type: Date, default: null },
    /**
     * The best score ever recorded, not the most recent one.
     *
     * A retake is allowed to improve the number and can never lower it, the
     * record is of having understood the lecture, not of the last time someone
     * happened to click through it while distracted.
     */
    bestScore: { type: Number, default: 0 },
    questionCount: { type: Number, default: 0 },
    attempts: { type: Number, default: 0 },
    /** Total points this lecture's questions have paid out. */
    pointsEarned: { type: Number, default: 0 },
  },
  { timestamps: true });

// One access row per student per lecture. This constraint is the paywall.
LectureAccessSchema.index({ user: 1, slug: 1 }, { unique: true });

export type LectureAccessDoc = InferSchemaType<typeof LectureAccessSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const LectureAccess: Model<LectureAccessDoc> =
  (mongoose.models.LectureAccess as Model<LectureAccessDoc>) ??
  mongoose.model<LectureAccessDoc>("LectureAccess", LectureAccessSchema);
