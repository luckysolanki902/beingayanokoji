"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { connectToDatabase, databaseConfigured } from "@/lib/db/connect";
import { LectureAccess, User } from "@/lib/db/models";
import { endSession, startSession } from "@/lib/auth/session";
import { getAllLectures } from "@/lib/lectures";

/**
 * Enrolment: one form that both creates an account and signs into one.
 *
 * The form does not ask which. An address the school has seen before is a
 * sign-in and an address it has not is an enrolment, because making someone
 * remember whether they already registered is a question the server can answer
 * for itself. What it will not do is tell a stranger which of the two happened
 * for an address they typed, see the failure copy below.
 *
 * There is no email verification and there is nothing to verify: the address is
 * the name on the register, not a channel. Nothing is ever sent to it.
 */

export interface EnrolState {
  error: string | null;
  /** What happened, for the copy shown on arrival. */
  outcome: "enrolled" | "returned" | null;
}

const MIN_PASSWORD = 8;
const EMAIL_SHAPE = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;

export async function enrol(_prev: EnrolState, formData: FormData): Promise<EnrolState> {
  if (!databaseConfigured()) {
    return { error: "The register is offline. Try again shortly.", outcome: null };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "").trim();

  if (!EMAIL_SHAPE.test(email) || email.length > 254) {
    return { error: "That does not look like an email address.", outcome: null };
  }
  if (password.length < MIN_PASSWORD) {
    return {
      error: `A password needs at least ${MIN_PASSWORD} characters. Nobody is checking it for anything else.`,
      outcome: null,
    };
  }
  // bcrypt silently truncates past 72 bytes, which would make two different
  // long passwords equivalent. Rejecting is honest; truncating is not.
  if (new TextEncoder().encode(password).length > 72) {
    return { error: "That password is too long. 72 characters at most.", outcome: null };
  }

  let outcome: EnrolState["outcome"];
  let userId: string;

  try {
    await connectToDatabase();
    const existing = await User.findOne({ email }, { passwordHash: 1, email: 1 })
      .select("+passwordHash")
      .lean();

    if (existing) {
      const matches = await bcrypt.compare(password, existing.passwordHash);
      if (!matches) {
        // Deliberately the same sentence whether the address is unknown or the
        // password is wrong. Distinguishing them turns this form into a way to
        // ask the site who has an account here.
        return { error: "That email and password do not match a record.", outcome: null };
      }
      userId = String(existing._id);
      outcome = "returned";
      await User.updateOne({ _id: existing._id }, { $set: { lastSeenAt: new Date() } });
    } else {
      const passwordHash = await bcrypt.hash(password, 12);
      const created = await User.create({
        email,
        passwordHash,
        name: email.split("@")[0],
        points: 0,
      });
      userId = String(created._id);
      outcome = "enrolled";
      await openFirstLecture(userId);
    }

    await startSession({ userId, email });
  } catch (err) {
    // A duplicate key here means two enrolments for the same address raced.
    // The loser is a returning student who simply needs to try again.
    if ((err as { code?: number }).code === 11000) {
      return { error: "That address was just registered. Try signing in.", outcome: null };
    }
    console.error("[auth] enrolment failed:", err);
    return { error: "Something went wrong on our side. Try again.", outcome: null };
  }

  revalidatePath("/", "layout");
  // Only ever a path on this site, an absolute URL here would make the form an
  // open redirect for anyone who could get someone to submit it.
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/record");
}

export async function signOut(): Promise<void> {
  await endSession();
  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Open the first lecture for a new student.
 *
 * Written as a real access row rather than being inferred everywhere from "is
 * this index zero", so that a student's record says plainly what it says: this
 * lecture is yours, it cost nothing. The reading code still treats index zero
 * as open regardless, which is what keeps the lecture readable before anyone
 * has enrolled at all.
 */
async function openFirstLecture(userId: string): Promise<void> {
  const first = getAllLectures()[0];
  if (!first) return;

  try {
    await LectureAccess.create({
      user: userId,
      slug: first.slug,
      unlockedBy: "free",
      unlockCost: 0,
    });
  } catch (err) {
    if ((err as { code?: number }).code !== 11000) {
      console.error("[auth] could not open the first lecture:", err);
    }
  }
}
