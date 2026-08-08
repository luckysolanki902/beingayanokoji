/**
 * What things cost, and what a dollar is worth.
 *
 * Every number the economy turns on lives here rather than being spelled out at
 * the call sites, because a price that appears in the button label, the ledger
 * description and the server check has to be one number in three places or it
 * will eventually be three numbers.
 */

/** Ten personal points to the dollar. The exchange rate for real money. */
export const POINTS_PER_USD = 10;

/**
 * What a question pays the first time it is answered correctly.
 *
 * First time only, per question, forever, a retake pays nothing, and neither
 * does the same question met again on a later attempt. Twenty questions of
 * genuine first-pass work is one lecture; the curriculum is therefore payable
 * in attention as well as in money, but only by someone actually reading it.
 */
export const FIRST_CORRECT_AWARD = 5;

/** What it costs to open a single lecture. */
export const LECTURE_UNLOCK_COST = 100;

/**
 * What it costs to open a whole class at once.
 *
 * Half price per lecture: `100 × size ÷ 2`, so a ten-lecture class is 500
 * points rather than 1,000. Buying the class is a commitment to the class, and
 * the discount is the school's side of that bargain.
 */
export function classUnlockCost(size: number): number {
  return Math.ceil((LECTURE_UNLOCK_COST * size) / 2);
}

/**
 * The price of asking that this site be taken down.
 *
 * Two million points. At ten to the dollar that is two hundred thousand
 * dollars, which is the correct price for the request: high enough that it is
 * not a prank, real enough that it is not a lie.
 */
export const SITE_DESTRUCTION_COST = 2_000_000;

/**
 * Approximate value of one major unit in US dollars.
 *
 * Used only to decide how many points a payment buys, never to price anything
 * the charge itself comes from the local table in `src/lib/pricing.ts` and is
 * settled by PayPal in the reader's own currency. A rate that drifts a few
 * percent therefore moves the points granted by a few percent and nothing else,
 * which does not justify a live rates API and its failure modes.
 *
 * Rounding is always in the reader's favour: `pointsForPayment` rounds up.
 */
const USD_PER_UNIT: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  AUD: 0.66,
  CAD: 0.73,
  CHF: 1.12,
  SGD: 0.74,
  NZD: 0.61,
  HKD: 0.128,
  SEK: 0.096,
  NOK: 0.094,
  DKK: 0.145,
  PLN: 0.25,
  CZK: 0.043,
  ILS: 0.27,
  MXN: 0.058,
  PHP: 0.017,
  THB: 0.028,
  JPY: 0.0067,
  HUF: 0.0028,
  TWD: 0.031,
};

/** Subunit exponent per currency, the zero-decimal ones are the exceptions. */
const DECIMALS: Record<string, number> = { JPY: 0, HUF: 0, TWD: 0 };

/** A charged amount, in its own currency and subunits, as US cents. */
export function usdCentsFor(currency: string, subunits: number): number {
  const code = currency.toUpperCase();
  const factor = 10 ** (DECIMALS[code] ?? 2);
  const major = subunits / factor;
  const rate = USD_PER_UNIT[code] ?? 1;
  return Math.round(major * rate * 100);
}

/**
 * Points bought by a payment.
 *
 * Rounded up, so a payment that converts to $4.97 still buys the fifty points
 * the reader thought they were buying. The site can afford to lose the rounding
 * error; a reader who feels short-changed by three points cannot be argued out
 * of it.
 */
export function pointsForUsdCents(usdCents: number): number {
  return Math.ceil((usdCents * POINTS_PER_USD) / 100);
}

/** How many dollars a points total is worth, for copy that quotes both. */
export function usdForPoints(points: number): number {
  return points / POINTS_PER_USD;
}
