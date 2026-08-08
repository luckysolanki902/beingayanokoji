import {
  CLASS_UNLOCK_COST,
  GRADUATION_COST,
  LECTURE_UNLOCK_COST,
  SITE_DESTRUCTION_COST,
  bulkCost,
} from "@/lib/economy/prices";

/**
 * What a number of points actually reaches.
 *
 * A balance is meaningless on its own. "2,000,000 points" tells a reader
 * nothing; "enough to order this site destroyed" tells them exactly what they
 * are holding. So every place a points figure appears next to a decision, this
 * turns it into the highest rung of the ladder it clears.
 *
 * Deliberately a pure function with no database and no session: it is used by
 * the shop while the reader is still typing an amount, and it has to answer
 * without a round trip.
 */

export interface Affordance {
  /** The rung's own price. */
  cost: number;
  /** One line, in the school's voice. */
  label: string;
  /** True once the points in hand clear it. */
  reached: boolean;
}

/** The ladder, cheapest first. */
export function affordanceLadder(points: number): Affordance[] {
  const rungs: { cost: number; label: string }[] = [
    {
      cost: LECTURE_UNLOCK_COST,
      label: "Open a lecture",
    },
    {
      cost: CLASS_UNLOCK_COST,
      label: "Promotion into a whole class",
    },
    {
      cost: bulkCost(30),
      label: "Promotion all the way to Class A",
    },
    {
      cost: GRADUATION_COST,
      label: "Graduate outright, every lecture in the school",
    },
    {
      cost: SITE_DESTRUCTION_COST,
      label: "Ask us to destroy this site",
    },
  ];

  return rungs.map((r) => ({ ...r, reached: points >= r.cost }));
}

/**
 * The single most interesting true thing about this many points.
 *
 * The top rung cleared, or, below the first rung, how much further there is to
 * go. Returning the *highest* one is the point: telling someone holding two
 * million points that they could open a lecture is technically correct and
 * completely useless.
 */
export function bestAffordance(points: number): string | null {
  if (points <= 0) return null;

  const ladder = affordanceLadder(points);
  const cleared = ladder.filter((r) => r.reached);

  if (cleared.length === 0) {
    const short = LECTURE_UNLOCK_COST - points;
    return `${short} short of a lecture`;
  }

  const top = cleared[cleared.length - 1];

  // Between rungs, say how many of the top rung it buys where that reads
  // naturally. "Two lectures" is useful; "two graduations" is not.
  if (top.cost === LECTURE_UNLOCK_COST) {
    const n = Math.floor(points / LECTURE_UNLOCK_COST);
    return n === 1 ? "Opens one lecture" : `Opens ${n} lectures`;
  }

  return top.label;
}
