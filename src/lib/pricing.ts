/**
 * Server-authoritative pricing for the support flow.
 *
 * The client never decides how much is charged. It sends a tier id ("t1" |
 * "t2" | "t3") or a custom amount in *major* units, and the server maps that to
 * a currency and a subunit amount here, using the reader's country from the
 * edge geolocation header.
 *
 * Two rules matter and both are easy to get wrong:
 *
 *  1. Amounts are carried internally in subunits (integers), never floats.
 *     Money arithmetic in floating point drifts, and a drifting charge is a
 *     charge the reader did not agree to.
 *  2. Currencies do not all use 1/100 subunits, and PayPal rejects an amount
 *     carrying more precision than the currency allows — "1000.00" JPY is an
 *     error, not a harmless rounding. So the exponent lives with the price
 *     table, not scattered through the charge math.
 *
 * Only currencies PayPal will actually settle appear here. Everything else
 * falls back to the USD table, so a reader in Lagos or Dubai sees round numbers
 * ($3 / $5 / $15) rather than a converted "$13.61".
 */

export type TierId = "t1" | "t2" | "t3";

export interface PriceConfig {
  /** ISO 4217 code passed straight to PayPal. */
  currency: string;
  /** What the reader sees before the amount ("$", "£", "A$"). */
  symbol: string;
  /** Preset amounts in major units. */
  presets: Record<TierId, number>;
  /** Bounds for a custom amount, in major units. */
  min: number;
  max: number;
  /** Subunit exponent: 2 → ×100, 0 → ×1 (JPY / HUF / TWD). */
  decimals: number;
}

function cfg(
  currency: string,
  symbol: string,
  presets: [number, number, number],
  min: number,
  max: number,
  decimals = 2
): PriceConfig {
  return {
    currency,
    symbol,
    presets: { t1: presets[0], t2: presets[1], t3: presets[2] },
    min,
    max,
    decimals,
  };
}

/**
 * Tiers are tuned to a small / standard / generous "cup of coffee" in each
 * economy rather than a blind conversion, and rounded to amounts that read
 * naturally to someone who lives there.
 */
const CURRENCIES: Record<string, PriceConfig> = {
  USD: cfg("USD", "$", [3, 5, 15], 1, 5000),
  EUR: cfg("EUR", "€", [3, 5, 15], 1, 5000),
  GBP: cfg("GBP", "£", [3, 5, 12], 1, 4000),
  AUD: cfg("AUD", "A$", [5, 10, 25], 2, 7500),
  CAD: cfg("CAD", "C$", [5, 10, 25], 2, 7500),
  CHF: cfg("CHF", "CHF ", [3, 5, 15], 1, 5000),
  SGD: cfg("SGD", "S$", [4, 8, 20], 2, 7000),
  NZD: cfg("NZD", "NZ$", [5, 10, 25], 2, 8000),
  HKD: cfg("HKD", "HK$", [25, 50, 120], 10, 40000),
  SEK: cfg("SEK", "kr ", [35, 60, 160], 10, 50000),
  NOK: cfg("NOK", "kr ", [35, 60, 160], 10, 50000),
  DKK: cfg("DKK", "kr ", [25, 40, 110], 10, 35000),
  PLN: cfg("PLN", "zł ", [15, 25, 60], 5, 20000),
  CZK: cfg("CZK", "Kč ", [80, 130, 350], 25, 120000),
  ILS: cfg("ILS", "₪", [12, 20, 55], 5, 18000),
  MXN: cfg("MXN", "MX$", [60, 100, 260], 20, 90000),
  PHP: cfg("PHP", "₱", [180, 300, 800], 60, 280000),
  THB: cfg("THB", "฿", [110, 180, 480], 40, 160000),
  // Zero-decimal currencies: the value goes to PayPal as a whole number.
  JPY: cfg("JPY", "¥", [500, 800, 2000], 150, 700000, 0),
  HUF: cfg("HUF", "Ft ", [1200, 2000, 5000], 400, 1800000, 0),
  TWD: cfg("TWD", "NT$", [100, 160, 450], 30, 150000, 0),
};

/** Country → currency, for the countries where a local price reads better. */
const COUNTRY_CURRENCY: Record<string, string> = {
  US: "USD",
  GB: "GBP",
  AU: "AUD",
  CA: "CAD",
  CH: "CHF",
  SG: "SGD",
  NZ: "NZD",
  HK: "HKD",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  PL: "PLN",
  CZ: "CZK",
  IL: "ILS",
  MX: "MXN",
  PH: "PHP",
  TH: "THB",
  JP: "JPY",
  HU: "HUF",
  TW: "TWD",
  // Eurozone.
  AT: "EUR", BE: "EUR", CY: "EUR", DE: "EUR", EE: "EUR", ES: "EUR",
  FI: "EUR", FR: "EUR", GR: "EUR", HR: "EUR", IE: "EUR", IT: "EUR",
  LT: "EUR", LU: "EUR", LV: "EUR", MT: "EUR", NL: "EUR", PT: "EUR",
  SI: "EUR", SK: "EUR",
};

/** The price table for a reader's country. Unknown countries get USD. */
export function priceConfigFor(country: string | null): PriceConfig {
  const code = (country ?? "").trim().toUpperCase();
  const currency = COUNTRY_CURRENCY[code];
  return (currency && CURRENCIES[currency]) || CURRENCIES.USD;
}

export interface ResolvedAmount {
  subunits: number;
  /** The amount in major units, for display and for PayPal's decimal string. */
  major: number;
  tier: TierId | "custom";
}

/**
 * Turn what the client asked for into what we will actually charge.
 *
 * A tier id resolves against the server's own table, so it cannot carry an
 * amount. A custom amount is clamped to the table's bounds and rounded to the
 * currency's real precision — a request for "4.999" becomes 5.00, not a value
 * PayPal would reject.
 *
 * Throws when neither a valid tier nor a usable custom amount was sent; the
 * caller turns that into a message the reader can act on.
 */
export function resolveAmount(
  config: PriceConfig,
  input: { tier?: unknown; amount?: unknown }
): ResolvedAmount {
  const factor = 10 ** config.decimals;

  if (
    typeof input.tier === "string" &&
    Object.hasOwn(config.presets, input.tier)
  ) {
    const tier = input.tier as TierId;
    const major = config.presets[tier];
    return { subunits: Math.round(major * factor), major, tier };
  }

  const raw =
    typeof input.amount === "number"
      ? input.amount
      : typeof input.amount === "string"
        ? Number(input.amount)
        : NaN;

  if (!Number.isFinite(raw) || raw <= 0) {
    throw new Error("no-amount");
  }

  // Round to the currency's precision first, then bound it. Doing it the other
  // way round can round a clamped maximum back above the maximum.
  const subunits = Math.round(raw * factor);
  const bounded = Math.min(
    Math.max(subunits, Math.round(config.min * factor)),
    Math.round(config.max * factor)
  );

  return { subunits: bounded, major: bounded / factor, tier: "custom" };
}
