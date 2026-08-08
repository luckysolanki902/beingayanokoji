import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Every question a student has ever answered, one document each.
 *
 * This collection exists to answer exactly one question honestly: *was this the
 * first time?* Points are paid for a first-attempt correct answer and for
 * nothing else, not for the second try, not for the same question met again on
 * a retake, not for the same question after clearing cookies.
 *
 * Storing that as a boolean on a quiz-level document would not survive a
 * double-submitted form or two tabs racing. So the fact is stored as the
 * *existence of a row*, guarded by a unique index on `(user, slug, questionId)`.
 * The award path inserts with `upsert` and pays out only when Mongo reports the
 * insert actually happened; every subsequent answer to that question finds the
 * row already there and is worth nothing. There is no code path that can pay
 * twice, because paying twice would require the index to fail.
 */

const QuestionAttemptSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    slug: { type: String, required: true },
    /** The stable question id from `src/lib/quizzes.ts`, not its position. */
    questionId: { type: String, required: true },

    /** The option index chosen on the very first attempt, kept verbatim. */
    firstChoice: { type: Number, required: true },
    /** Whether that first attempt was right. This is what was paid for. */
    firstCorrect: { type: Boolean, required: true },
    /** Points paid out, the first-attempt award, or zero. Never changes. */
    pointsAwarded: { type: Number, required: true, default: 0 },
    firstAt: { type: Date, default: Date.now },

    /** Bumped on every later encounter. Worth nothing; kept for the record. */
    attempts: { type: Number, required: true, default: 1 },
    /** Whether it has ever been answered correctly, first time or later. */
    everCorrect: { type: Boolean, required: true, default: false },
    lastAt: { type: Date, default: Date.now },
  },
  { timestamps: true });

// The constraint that makes "first time only" true rather than intended.
QuestionAttemptSchema.index({ user: 1, slug: 1, questionId: 1 }, { unique: true });

export type QuestionAttemptDoc = InferSchemaType<typeof QuestionAttemptSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const QuestionAttempt: Model<QuestionAttemptDoc> =
  (mongoose.models.QuestionAttempt as Model<QuestionAttemptDoc>) ??
  mongoose.model<QuestionAttemptDoc>("QuestionAttempt", QuestionAttemptSchema);
