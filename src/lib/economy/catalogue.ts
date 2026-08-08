/**
 * Everything the school sells, in one list.
 *
 * A price that lives in the button that charges it will eventually disagree
 * with the button that displays it. So every purchasable thing is an entry
 * here, with an id the ledger records and a price the server reads, and no
 * caller is allowed to pass an amount of its own.
 */

export type Sku = "card.download" | "name.change" | "unlock.lecture" | "unlock.class";

export interface CatalogueItem {
  sku: Sku;
  /** What the receipt calls it. */
  title: string;
  price: number;
  /**
   * How many times this can be bought before it starts costing anything.
   *
   * Naming yourself once is part of enrolling and is free. Changing your mind
   * about it repeatedly is a thing you are doing to the register, and the
   * register charges for it.
   */
  freeUses: number;
  /** One line for the confirmation, in the school's voice. */
  note: string;
}

export const CATALOGUE: Record<Sku, CatalogueItem> = {
  "card.download": {
    sku: "card.download",
    title: "Student card, issued",
    price: 50,
    freeUses: 0,
    note: "A printable card with no specimen mark on it. Issued once; after that you may take a fresh copy whenever your record changes, at no further cost.",
  },
  "name.change": {
    sku: "name.change",
    title: "Name changed on the register",
    price: 30,
    freeUses: 1,
    note: "The first name you choose is free. Every one after it costs 30 points, because a register that changes on a whim is not a register.",
  },
  // Present so the ledger and the receipts can name them; charged by their own
  // dedicated actions, which have unlock sagas the generic order path does not.
  "unlock.lecture": {
    sku: "unlock.lecture",
    title: "Lecture opened",
    price: 100,
    freeUses: 0,
    note: "One lecture, and its examination.",
  },
  "unlock.class": {
    sku: "unlock.class",
    title: "Class opened",
    price: 500,
    freeUses: 0,
    note: "A whole class, at half the per-lecture price.",
  },
};

export function priceOf(sku: Sku): number {
  return CATALOGUE[sku].price;
}
