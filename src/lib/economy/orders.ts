import "server-only";

import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { Order, User } from "@/lib/db/models";
import { spendPoints } from "@/lib/economy/points";
import { CATALOGUE, type Sku } from "@/lib/economy/catalogue";

/**
 * The till. One way to buy anything priced in the catalogue.
 *
 * It exists so that "charge for it, write the receipt, count the repeat, update
 * the running totals" happens identically everywhere rather than being
 * re-implemented, slightly differently, at each button. The price is never
 * passed in; it is read from the catalogue by id, so no caller can name its own
 * number.
 *
 * The order is written *after* the charge succeeds. That is the opposite of the
 * lecture-unlock saga, and deliberately: an unlock row is a thing the student
 * owns and must not be lost, whereas an order is a record of a completed sale,
 * and a receipt for a charge that failed would be worse than no receipt.
 */

export interface OrderResult {
  ok: boolean;
  error: string | null;
  balance: number;
  /** True when this use fell inside the item's free allowance. */
  wasFree: boolean;
  /** Which purchase of this item it was, from 1. */
  repeatIndex: number;
  cost: number;
}

export interface PlaceOrderOptions {
  /** Which surface it was bought from, for the receipt. */
  source?: string;
  meta?: Record<string, unknown> | null;
  /**
   * Buy at most once, ever. A second attempt succeeds, changes nothing and
   * charges nothing, which is what "you already own this" should feel like.
   */
  once?: boolean;
}

export async function placeOrder(
  userId: Types.ObjectId | string,
  sku: Sku,
  options: PlaceOrderOptions = {}
): Promise<OrderResult> {
  const item = CATALOGUE[sku];
  await connectToDatabase();

  const priorCount = await Order.countDocuments({ user: userId, sku });
  const repeatIndex = priorCount + 1;

  const current = await User.findById(userId, { points: 1 }).lean();
  const balance = current?.points ?? 0;

  // Already owned, and owning it once is the whole entitlement.
  if (options.once && priorCount > 0) {
    return { ok: true, error: null, balance, wasFree: true, repeatIndex: priorCount, cost: 0 };
  }

  // Inside the free allowance: still a real order, still a receipt, no charge.
  const free = priorCount < item.freeUses;
  const cost = free ? 0 : item.price;

  let ledgerEntry: Types.ObjectId | null = null;
  let after = balance;

  if (cost > 0) {
    const spend = await spendPoints(userId, cost, {
      reason: sku === "name.change" ? "grant" : "unlock.lecture",
      description: `${item.title} (${cost} points)`,
      meta: { sku, repeatIndex, source: options.source ?? null },
    });

    if (!spend.ok) {
      return {
        ok: false,
        error: `That costs ${cost} points and you have ${spend.balance}.`,
        balance: spend.balance,
        wasFree: false,
        repeatIndex,
        cost,
      };
    }
    after = spend.balance;
  }

  // Running totals, captured at the till rather than recomputed later.
  const [lifetimeOrders, spentDoc] = await Promise.all([
    Order.countDocuments({ user: userId }),
    User.findById(userId, { pointsSpent: 1 }).lean(),
  ]);

  try {
    await Order.create({
      user: userId,
      sku,
      title: item.title,
      cost,
      wasFree: free,
      source: options.source ?? null,
      repeatIndex,
      lifetimeOrders: lifetimeOrders + 1,
      lifetimePointsSpent: spentDoc?.pointsSpent ?? 0,
      ledgerEntry,
      meta: options.meta ?? null,
    });
  } catch (err) {
    // The charge already happened and the student already has the thing. A
    // missing receipt is worth shouting about and not worth failing over.
    console.error("[orders] could not write the receipt:", err);
  }

  return { ok: true, error: null, balance: after, wasFree: free, repeatIndex, cost };
}

/** Whether this student has ever bought this item. */
export async function owns(userId: Types.ObjectId | string, sku: Sku): Promise<boolean> {
  await connectToDatabase();
  return (await Order.countDocuments({ user: userId, sku })) > 0;
}

/** How many times they have bought it, for pricing the next one. */
export async function timesBought(
  userId: Types.ObjectId | string,
  sku: Sku
): Promise<number> {
  await connectToDatabase();
  return Order.countDocuments({ user: userId, sku });
}
