import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { connectToDatabase, databaseConfigured } from "@/lib/db/connect";
import { User } from "@/lib/db/models";

/**
 * Sessions.
 *
 * A signed JWT in an httpOnly cookie, and nothing else, no session collection,
 * no lookup on the way in. The site's own pages are read far more often than
 * they are written, and paying a database round trip on every render of every
 * lecture to learn something the cookie already proves is a cost with nothing
 * on the other side of it.
 *
 * The trade is that a session cannot be revoked server-side before it expires.
 * For a site whose entire private surface is "which lectures have I opened",
 * that is an acceptable trade; if it ever stops being one, the fix is a token
 * version integer on the user, compared here.
 *
 * The cookie is httpOnly so no script (ours or anyone else's) can read it,
 * and SameSite=Lax so it is not sent on cross-site requests, which is what
 * makes the point-spending actions safe from a form posted by another origin.
 */

const COOKIE_NAME = "ba_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days
const ISSUER = "beingayanokoji";

function secret(): Uint8Array {
  const raw = process.env.AUTH_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error("AUTH_SECRET is missing or too short (needs 32+ characters).");
  }
  return new TextEncoder().encode(raw);
}

export interface SessionClaims {
  userId: string;
  email: string;
}

/** Sign a session and write it to the response's cookies. */
export async function startSession(claims: SessionClaims): Promise<void> {
  const token = await new SignJWT({ email: claims.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.userId)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/**
 * The claims in the current request's cookie, or null.
 *
 * `cache` from React, not a module variable: this is called by the layout, the
 * page and two or three components in a single render, and the memo is scoped
 * to one request so it cannot leak one reader's session into another's.
 */
export const getSessionClaims = cache(async (): Promise<SessionClaims | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: ISSUER });
    if (!payload.sub) return null;
    return { userId: payload.sub, email: String(payload.email ?? "") };
  } catch {
    // Expired, tampered with, or signed by a previous AUTH_SECRET. All three
    // mean the same thing to a reader: they are logged out.
    return null;
  }
});

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  points: number;
  pointsEarned: number;
  pointsPurchased: number;
  pointsSpent: number;
  promotionsSeen: string[];
}

/**
 * The signed-in student, loaded from the database.
 *
 * Also memoised per request. Returns null both when nobody is signed in and
 * when the cookie names a user who no longer exists, since the caller has to
 * treat those identically anyway.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const claims = await getSessionClaims();
  if (!claims || !databaseConfigured()) return null;

  try {
    await connectToDatabase();
    const user = await User.findById(claims.userId, {
      email: 1,
      name: 1,
      points: 1,
      pointsEarned: 1,
      pointsPurchased: 1,
      pointsSpent: 1,
      promotionsSeen: 1,
    }).lean();

    if (!user) return null;

    return {
      id: String(user._id),
      email: user.email,
      name: user.name || user.email.split("@")[0],
      points: user.points ?? 0,
      pointsEarned: user.pointsEarned ?? 0,
      pointsPurchased: user.pointsPurchased ?? 0,
      pointsSpent: user.pointsSpent ?? 0,
      promotionsSeen: user.promotionsSeen ?? [],
    };
  } catch (err) {
    // The database being unreachable must not blank the site. Every caller
    // treats null as "signed out", which degrades to the public reading
    // experience rather than an error page.
    console.error("[auth] could not load the signed-in user:", err);
    return null;
  }
});

/** For actions that have no meaning without an account. Throws if signed out. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("not-signed-in");
  return user;
}
