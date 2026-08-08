import type { Types } from "mongoose";
import { PointEntry, User, type PointReason } from "@/lib/db/models";

/**
 * The only two functions allowed to move points.
 *
 * Everything else in the site asks these to do it. That is not tidiness: a
 * balance and its ledger have to change together or the ledger stops being able
 * to prove the balance, and the way to guarantee that is to have exactly one
 * place where both happen.
 *
 * Both use a single conditional `findOneAndUpdate` rather than read-then-write.
 * A read followed by a write can be interleaved by a second request between the
 * two, two tabs clicking "unlock" at once, and a lecture bought for half
 * price. The condition (`points: { $gte: cost }`) is evaluated by Mongo inside
 * the same atomic operation as the decrement, so the second request either sees
 * the already-reduced balance or fails.
 *
 * Transactions would be the textbook answer, but they need a replica set with
 * majority write concern and would make the site fail closed on a shared Atlas
 * tier. The saga these functions support, insert the access row first, charge
 * second, delete the row if the charge fails, reaches the same place with the
 * failure mode the right way round: the worst case is a student who owns
 * something they did not pay for, not one who paid for nothing.
 */

interface MoveOptions {
  reason: PointReason;
  description: string;
  slug?: string | null;
  classId?: string | null;
  /** Set when an external event could be replayed, a PayPal order id. */
  idempotencyKey?: string | null;
  meta?: Record<string, unknown> | null;
}

export interface MoveResult {
  ok: boolean;
  /** The balance after the move, or the unchanged balance when it failed. */
  balance: number;
}

/**
 * Take points away. Fails, changing nothing, if the balance will not cover it.
 *
 * Returns `ok: false` rather than throwing: being short of points is an
 * ordinary answer to an ordinary request, and the caller has to render it
 * either way.
 */
export async function spendPoints(userId: Types.ObjectId | string,
  cost: number,
  options: MoveOptions): Promise<MoveResult> {
  if (!Number.isInteger(cost) || cost <= 0) {
    throw new Error(`spendPoints: refusing a non-positive cost (${cost})`);
  }

  const user = await User.findOneAndUpdate({ _id: userId, points: { $gte: cost } },
    { $inc: { points: -cost, pointsSpent: cost } },
    { new: true, projection: { points: 1 } }).lean();

  if (!user) {
    const current = await User.findById(userId, { points: 1 }).lean();
    return { ok: false, balance: current?.points ?? 0 };
  }

  await writeEntry(userId, -cost, user.points, options);
  return { ok: true, balance: user.points };
}

/**
 * Add points.
 *
 * There is no guard here against granting the same thing twice, because the
 * guard belongs where the event is: a purchase is deduplicated by the unique
 * `orderId` on `Purchase`, an examination award by the unique
 * `(user, slug, questionId)` on `QuestionAttempt`. Callers must have won one of
 * those races before arriving here. `idempotencyKey` is the second line of
 * defence (the ledger's own unique index) and a duplicate there is swallowed
 * rather than thrown, since it means the credit already happened.
 */
export async function creditPoints(userId: Types.ObjectId | string,
  amount: number,
  options: MoveOptions & { kind?: "earned" | "purchased" }): Promise<MoveResult> {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`creditPoints: refusing a non-positive amount (${amount})`);
  }

  const counter =
    options.kind === "purchased" ? { pointsPurchased: amount } : { pointsEarned: amount };

  const user = await User.findByIdAndUpdate(userId,
    { $inc: { points: amount, ...counter } },
    { new: true, projection: { points: 1 } }).lean();

  if (!user) return { ok: false, balance: 0 };

  await writeEntry(userId, amount, user.points, options);
  return { ok: true, balance: user.points };
}

/**
 * Put back points taken for something that then failed to happen.
 *
 * Deliberately not `creditPoints` with a nicer name: a refund undoes a debit,
 * so it must unwind `pointsSpent` rather than inflate `pointsEarned`, or the
 * lifetime totals on the record page slowly become fiction.
 */
export async function refundPoints(userId: Types.ObjectId | string,
  amount: number,
  options: MoveOptions): Promise<MoveResult> {
  if (amount <= 0) return { ok: true, balance: 0 };

  const user = await User.findByIdAndUpdate(userId,
    { $inc: { points: amount, pointsSpent: -amount } },
    { new: true, projection: { points: 1 } }).lean();

  if (!user) return { ok: false, balance: 0 };

  await writeEntry(userId, amount, user.points, { ...options, reason: "correction" });
  return { ok: true, balance: user.points };
}

async function writeEntry(userId: Types.ObjectId | string,
  delta: number,
  balanceAfter: number,
  options: MoveOptions): Promise<void> {
  try {
    await PointEntry.create({
      user: userId,
      delta,
      balanceAfter,
      reason: options.reason,
      description: options.description,
      slug: options.slug ?? null,
      classId: options.classId ?? null,
      // Omitted entirely when there is no key, never written as null: the
      // unique index counts explicit nulls as equal to one another, so a null
      // here would make the second keyless entry in the ledger collide with the
      // first and vanish.
      ...(options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : {}),
      meta: options.meta ?? null,
    });
  } catch (err) {
    const duplicate = (err as { code?: number }).code === 11000;
    // A duplicate is only ever expected on an entry that carries a key, it
    // means this exact credit was already recorded, which is the index doing
    // its job. A duplicate on a keyless entry is a bug in the index, and
    // swallowing it quietly is how a ledger silently stops matching its
    // balance. Everything else is a write that failed after the balance moved:
    // worth shouting about, not worth failing the student's request over.
    if (!duplicate || !options.idempotencyKey) {
      console.error("[points] ledger write failed:", err);
    }
  }
}
