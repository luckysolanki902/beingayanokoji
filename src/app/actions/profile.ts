"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase, databaseConfigured } from "@/lib/db/connect";
import { User } from "@/lib/db/models";
import { getCurrentUser } from "@/lib/auth/session";
import { placeOrder, timesBought } from "@/lib/economy/orders";
import { CATALOGUE } from "@/lib/economy/catalogue";
import { studentNumberFor } from "@/lib/id/credentials";

/**
 * The card photograph, and the student's own name on the card.
 *
 * The photo arrives as a data URI because the browser has already resized and
 * re-encoded it to something small; see `IdCard` for why that happens on the
 * client. It is still validated here as though the client were hostile, because
 * it is: a server action is an HTTP endpoint, and the fact that our own form
 * only ever sends a 320px JPEG says nothing about what someone else might post
 * to it.
 */

export interface ProfileResult {
  ok: boolean;
  error: string | null;
}

/** Room for a 320px JPEG with margin, and far short of anything abusive. */
const MAX_PHOTO_BYTES = 300_000;

/** Only formats a browser will render inline, and nothing that can carry script. */
const ALLOWED = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

export async function updatePhoto(dataUrl: string): Promise<ProfileResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You need to be enrolled to do that." };
  if (!databaseConfigured()) {
    return { ok: false, error: "The register is offline." };
  }

  if (typeof dataUrl !== "string" || dataUrl.length > MAX_PHOTO_BYTES) {
    return { ok: false, error: "That image is too large. Try a smaller one." };
  }

  // SVG is deliberately absent from the allow-list. It is an image format that
  // can contain script, and this string is handed to an image renderer and,
  // one day, possibly to a browser as a src.
  const match = ALLOWED.exec(dataUrl.trim());
  if (!match) {
    return { ok: false, error: "That does not look like a JPEG, PNG or WebP." };
  }

  // Check the decoded size too. Base64 inflates by a third, so the string
  // length alone is a loose bound on what is actually being stored.
  const bytes = Math.floor((match[2].length * 3) / 4);
  if (bytes > 220_000) {
    return { ok: false, error: "That image is too large. Try a smaller one." };
  }

  try {
    await connectToDatabase();
    await User.updateOne({ _id: user.id }, { $set: { photo: dataUrl.trim() } });
  } catch (err) {
    console.error("[profile] could not save the card photo:", err);
    return { ok: false, error: "The photo could not be saved. Try again." };
  }

  revalidatePath("/record");
  return { ok: true, error: null };
}

export async function removePhoto(): Promise<ProfileResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You need to be enrolled to do that." };

  try {
    await connectToDatabase();
    // A later upload must begin private again. Leaving photoPublic=true here
    // would silently publish the replacement the moment it was saved.
    await User.updateOne(
      { _id: user.id },
      { $set: { photo: null, photoPublic: false } }
    );
  } catch (err) {
    console.error("[profile] could not remove the card photo:", err);
    return { ok: false, error: "That could not be removed. Try again." };
  }

  revalidatePath("/record");
  revalidatePath("/");
  revalidatePath(`/students/${studentNumberFor(user.id)}`);
  return { ok: true, error: null };
}

/**
 * The name printed on the card.
 *
 * The first one is free, because choosing what you are called is part of
 * enrolling. Every one after it costs 30 points: a register that can be
 * rewritten on a whim is not a register, and the price is what makes the
 * difference between correcting a typo and using the card as a toy.
 *
 * The count comes from the receipts, not from a counter on the user, so it
 * cannot drift and the reason for each charge stays readable afterwards.
 */
export async function updateName(name: string): Promise<ProfileResult & { charged?: number }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You need to be enrolled to do that." };

  const clean = String(name ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
  if (clean.length < 1) {
    return { ok: false, error: "A card needs a name on it." };
  }

  await connectToDatabase();

  // Setting it to what it already says is not a change, and must not be sold
  // as one. Checked before the till, so a stray double submit is free.
  const current = await User.findById(user.id, { name: 1, nameChosen: 1 }).lean();
  if ((current?.name ?? "") === clean) {
    // Saving the existing text is still an explicit choice to publish it as
    // the card name. This also backfills accounts created before nameChosen.
    if (!current?.nameChosen) {
      await User.updateOne({ _id: user.id }, { $set: { nameChosen: true } });
      revalidatePath("/", "layout");
      revalidatePath("/record");
      revalidatePath(`/students/${studentNumberFor(user.id)}`);
    }
    return { ok: true, error: null, charged: 0 };
  }

  const order = await placeOrder(user.id, "name.change", {
    source: "record",
    meta: { from: current?.name ?? null, to: clean },
  });

  if (!order.ok) {
    return { ok: false, error: order.error };
  }

  try {
    await User.updateOne(
      { _id: user.id },
      { $set: { name: clean, nameChosen: true } }
    );
  } catch (err) {
    console.error("[profile] could not save the name:", err);
    return { ok: false, error: "That could not be saved. Try again." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/record");
  revalidatePath(`/students/${studentNumberFor(user.id)}`);
  return { ok: true, error: null, charged: order.cost };
}

/** What the next name change will cost this student. Zero while it is free. */
export async function nameChangePrice(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return CATALOGUE["name.change"].price;
  const used = await timesBought(user.id, "name.change");
  return used < CATALOGUE["name.change"].freeUses ? 0 : CATALOGUE["name.change"].price;
}

/**
 * The two publicity switches.
 *
 * Only ever applies the fields it was actually given, so flipping one switch
 * cannot silently reset the other, and refuses to publish a photograph that
 * does not exist: a stored `photoPublic: true` on an account with no photo is a
 * promise the site would break the moment one was uploaded.
 */
export async function setPublicity(next: {
  listed?: boolean;
  photoPublic?: boolean;
}): Promise<ProfileResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You need to be enrolled to do that." };

  // Server actions are HTTP endpoints. TypeScript describes our own caller;
  // it does not stop a crafted request from sending null or an array.
  if (!next || typeof next !== "object" || Array.isArray(next)) {
    return { ok: false, error: "Those publicity settings are not valid." };
  }

  const update: Record<string, boolean> = {};
  if (typeof next.listed === "boolean") update.publicListed = next.listed;
  if (typeof next.photoPublic === "boolean") update.photoPublic = next.photoPublic;
  if (Object.keys(update).length === 0) return { ok: true, error: null };

  try {
    await connectToDatabase();

    const result = await User.updateOne(
      update.photoPublic === true
        ? { _id: user.id, photo: { $type: "string", $ne: "" } }
        : { _id: user.id },
      { $set: update }
    );
    if (update.photoPublic === true && result.matchedCount === 0) {
      return { ok: false, error: "There is no photograph on your card yet." };
    }
  } catch (err) {
    console.error("[profile] could not save publicity settings:", err);
    return { ok: false, error: "That could not be saved. Try again." };
  }

  revalidatePath("/record");
  revalidatePath("/");
  revalidatePath(`/students/${studentNumberFor(user.id)}`);
  return { ok: true, error: null };
}
