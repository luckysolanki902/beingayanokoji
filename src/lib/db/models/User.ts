import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A student.
 *
 * Email and a password, nothing else required; there is no verification step,
 * no profile to fill in, and no third party told that someone reads this site.
 * The account exists for one reason: a record of the curriculum that survives
 * clearing a browser.
 *
 * `points` is the live balance and the only field the spending code reads. The
 * three totals beside it are cumulative counters that never decrease; they let
 * the record page say "earned 340, bought 500, spent 600" without walking the
 * whole ledger, and they are what a balance is reconciled against if it is ever
 * doubted.
 */

const UserSchema = new Schema({
    /** Stored lowercased and trimmed, the unique index is on this exact form. */
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    /** bcrypt. The plaintext never leaves the action that received it. */
    passwordHash: { type: String, required: true, select: false },
    /** What the roster calls them. Defaults to the local part of the email. */
    name: { type: String, trim: true, maxlength: 60 },
    /** True after the student explicitly saves the name shown on their card. */
    nameChosen: { type: Boolean, required: true, default: false },

    /**
     * The photograph on the student card, as a `data:image/jpeg;base64` URI.
     *
     * Stored in the document rather than in object storage, which is the right
     * call only because of how small these are: the browser resizes to 320px
     * and re-encodes as JPEG before uploading, so a card photo is around 20KB
     * and the field is capped well under Mongo's 16MB document limit. It buys a
     * whole storage provider's worth of avoided complexity, and it means a photo
     * is deleted by deleting the student, with nothing left in a bucket
     * afterwards.
     *
     * `select: false` because almost nothing needs it. Loading a 30KB string on
     * every page render to draw a header that shows a class letter and a number
     * would be a bad trade repeated on every request.
     */
    photo: { type: String, default: null, select: false, maxlength: 400_000 },

    /**
     * The roll number, stored rather than derived.
     *
     * It is computed from the account id, so it could be recomputed on demand,
     * but a public profile is addressed *by* this number and a hash cannot be
     * run backwards. Storing it makes the lookup an indexed query instead of a
     * scan over every student. Written on enrolment and backfilled on first
     * read for accounts that predate it.
     */
    studentNumber: { type: String, default: null },

    /**
     * Whether this student appears on the roll of honour and has a public page.
     *
     * On by default, because a leaderboard nobody is on is not a leaderboard.
     * Off is one click away on the record, and turning it off also takes the
     * public page down: there is no version of this where a student is ranked
     * publicly and cannot stop it.
     */
    publicListed: { type: Boolean, required: true, default: true },

    /**
     * Whether the photograph may be shown publicly.
     *
     * Off by default, and deliberately a *separate* decision from being listed.
     * Agreeing to have a score ranked is not agreeing to have your face on the
     * front page, and defaulting a photograph to public because it was uploaded
     * for a private card would be putting words in someone's mouth.
     */
    photoPublic: { type: Boolean, required: true, default: false },

    /**
     * Personal points, the site's whole economy in one integer.
     *
     * Never written directly. Every change goes through `spendPoints` /
     * `creditPoints` in `src/lib/economy/points.ts`, which move this field and
     * append to the ledger in the same operation.
     */
    points: { type: Number, required: true, default: 0, min: 0 },

    /** Lifetime counters, for the record page and for reconciliation. */
    pointsEarned: { type: Number, required: true, default: 0 },
    pointsPurchased: { type: Number, required: true, default: 0 },
    pointsSpent: { type: Number, required: true, default: 0 },

    /**
     * The highest class the student has been *shown* the promotion for.
     *
     * The class they are actually in is derived from their unlocks and passes,
     * never stored, a stored copy is a second source of truth that drifts the
     * first time a lecture is reordered. This field only stops the promotion
     * overlay firing twice for the same class.
     */
    promotionsSeen: { type: [String], default: [] },

    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true });

// Public profile URLs must identify exactly one student. The partial filter
// keeps legacy null/missing values out of the unique index until backfilled.
UserSchema.index(
  { studentNumber: 1 },
  { unique: true, partialFilterExpression: { studentNumber: { $type: "string" } } }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

// `mongoose.models.X ?? model(...)` throughout: the dev server re-evaluates
// this module on every edit, and registering a model name twice throws.
export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) ?? mongoose.model<UserDoc>("User", UserSchema);
