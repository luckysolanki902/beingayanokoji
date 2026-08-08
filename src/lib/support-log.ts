import type { PaymentFacts } from "@/lib/paypal";

/**
 * Where a support payment gets recorded.
 *
 * This site has no database, so "recorded" means a single structured line in
 * the platform logs, which is genuinely enough for an optional tip jar: the
 * money and the authoritative record both live in PayPal, and this is only the
 * trail that says which page a contribution came from.
 *
 * It is written as one function rather than scattered console.log calls so that
 * adding a real store later (or an email on each payment) is one edit here
 * instead of four across the routes.
 */

export type SupportEvent =
  | "order.created"
  | "order.captured"
  | "order.pending"
  | "webhook.captured"
  | "webhook.denied"
  | "webhook.refunded"
  | "webhook.approved";

export interface SupportRecord {
  event: SupportEvent;
  orderId: string;
  reference?: string | null;
  amountSubunits?: number | null;
  currency?: string | null;
  /** Where in the site the reader started from ("footer", "reader", …). */
  source?: string | null;
  country?: string | null;
  email?: string | null;
  name?: string | null;
  paymentId?: string | null;
  fee?: number | null;
  /** Set only when the reader typed one. */
  message?: string | null;
  via?: "browser" | "webhook";
}

export function recordSupport(record: SupportRecord): void {
  // One line, JSON, so it stays greppable in the Vercel log drain.
  console.log("[support] " +
      JSON.stringify({ ...record, at: new Date().toISOString() }));
}

/** Fold PayPal's flattened facts into a record, dropping the empty fields. */
export function recordFromFacts(event: SupportEvent,
  orderId: string,
  facts: PaymentFacts,
  extra: Partial<SupportRecord> = {}): SupportRecord {
  return {
    event,
    orderId,
    reference: facts.reference,
    amountSubunits: facts.amountSubunits,
    currency: facts.currency,
    email: facts.email,
    name: facts.name,
    country: facts.countryCode,
    paymentId: facts.paymentId,
    fee: facts.fee,
    ...extra,
  };
}
