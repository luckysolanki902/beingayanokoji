import "server-only";

import { cache } from "react";
import { connectToDatabase, databaseConfigured } from "@/lib/db/connect";
import { LectureAccess, User } from "@/lib/db/models";
import { studentNumberFor } from "@/lib/id/credentials";
import { classOfIndex, getClass, type ClassId } from "@/lib/curriculum";
import { getAllLectures } from "@/lib/lectures";

/**
 * Everything the world is allowed to see about a student.
 *
 * The important thing about this module is what it does *not* select. Email,
 * password hash, purchase history and the photograph of anyone who has not
 * opted in are never read into a `PublicProfile`, so no public page or
 * leaderboard can leak them by accident later: the data is not in the object
 * that reaches the component.
 */

export interface PublicProfile {
  studentNumber: string;
  name: string;
  classId: ClassId;
  className: string;
  /** All points ever added to the account, regardless of source. */
  lifetimePoints: number;
  passed: number;
  total: number;
  /** Present only when the student has one *and* has chosen to show it. */
  photo: string | null;
  graduated: boolean;
  enrolledAt: string;
  /** Position on the roll of honour, when the caller knows it. */
  rank?: number;
}

/** Fields a public view is permitted to read. Anything absent here cannot leak. */
const PUBLIC_FIELDS = {
  name: 1,
  pointsEarned: 1,
  pointsPurchased: 1,
  nameChosen: 1,
  studentNumber: 1,
  publicListed: 1,
  photoPublic: 1,
  createdAt: 1,
} as const;

interface RawUser {
  _id: unknown;
  name?: string | null;
  pointsEarned?: number;
  pointsPurchased?: number;
  nameChosen?: boolean;
  studentNumber?: string | null;
  publicListed?: boolean;
  photoPublic?: boolean;
  createdAt?: Date;
  photo?: string | null;
}

/**
 * A display name that cannot be someone's email handle.
 *
 * Enrolment seeds `name` from the local part of the address, which is fine on a
 * private record and not fine on a page anyone can read: "j.smith1987" published
 * next to a photograph is a piece of personal information the student never
 * chose to publish. `nameChosen` records the explicit save action, so legitimate
 * lowercase and single-word names are preserved without exposing untouched
 * email-derived defaults.
 */
function publicNameFor(raw: RawUser, studentNumber: string): string {
  const name = (raw.name ?? "").trim();
  return raw.nameChosen && name ? name : `Student ${studentNumber}`;
}

/** How many lectures this student has passed. One query, not one per student. */
async function passedCounts(ids: unknown[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (ids.length === 0) return out;

  const rows = await LectureAccess.aggregate<{ _id: unknown; n: number }>([
    { $match: { user: { $in: ids }, passedAt: { $ne: null } } },
    { $group: { _id: "$user", n: { $sum: 1 } } },
  ]);
  for (const row of rows) out.set(String(row._id), row.n);
  return out;
}

function classFromPassed(passed: number, total: number): ClassId {
  if (total > 0 && passed >= total) return "GRAD";
  // The class you are in is the first one you have not finished, which is the
  // same rule the private record uses, expressed against a count.
  return classOfIndex(Math.min(passed, Math.max(total - 1, 0)));
}

function toProfile(raw: RawUser, passed: number, total: number): PublicProfile {
  // Every public query requires this field. Never advertise a synthesized URL
  // that was not successfully reserved by Mongo's unique index.
  const studentNumber = raw.studentNumber as string;
  const classId = classFromPassed(passed, total);
  return {
    studentNumber,
    name: publicNameFor(raw, studentNumber),
    classId,
    className: getClass(classId).label,
    lifetimePoints: (raw.pointsEarned ?? 0) + (raw.pointsPurchased ?? 0),
    passed,
    total,
    photo: raw.photoPublic ? (raw.photo ?? null) : null,
    graduated: total > 0 && passed >= total,
    enrolledAt: (raw.createdAt ?? new Date()).toISOString().slice(0, 10),
  };
}

/**
 * The roll of honour: the highest lifetime point totals on the site.
 * Sources are deliberately combined; the public board says how many points a
 * student has accumulated, not how they obtained them.
 */
export const getLeaderboard = cache(async (limit = 10): Promise<PublicProfile[]> => {
  if (!databaseConfigured()) return [];

  try {
    await connectToDatabase();
    const total = getAllLectures().length;

    const rows = await User.aggregate<RawUser>([
      // Existing accounts predate this field. Missing means the schema's
      // intended default (listed); only an explicit false is an opt-out.
      {
        $match: {
          publicListed: { $ne: false },
          studentNumber: { $type: "string" },
        },
      },
      {
        // Aggregation bypasses Mongoose's select:false rules, so this is an
        // explicit public allow-list. The photo is removed inside Mongo unless
        // the student opted in; a private data URI never reaches application
        // memory on this path.
        $project: {
          ...PUBLIC_FIELDS,
          photo: { $cond: ["$photoPublic", "$photo", null] },
          lifetimeSort: {
            $add: [
              { $ifNull: ["$pointsEarned", 0] },
              { $ifNull: ["$pointsPurchased", 0] },
            ],
          },
        },
      },
      { $sort: { lifetimeSort: -1, createdAt: 1 } },
      { $limit: limit },
    ]);

    const counts = await passedCounts(rows.map((r) => r._id));

    return rows.map((raw, i) => ({
      ...toProfile(raw, counts.get(String(raw._id)) ?? 0, total),
      rank: i + 1,
    }));
  } catch (err) {
    // The front page must not fall over because the leaderboard could not be
    // read. An empty board renders as "nobody yet", which is survivable.
    console.error("[public] could not read the leaderboard:", err);
    return [];
  }
});

/** One student's public page, or null when there is nobody to show. */
export const getPublicProfile = cache(
  async (studentNumber: string): Promise<PublicProfile | null> => {
    if (!databaseConfigured()) return null;
    if (!/^\d{6}$/.test(studentNumber)) return null;

    try {
      await connectToDatabase();
      const [raw] = await User.aggregate<RawUser>([
        { $match: { studentNumber, publicListed: { $ne: false } } },
        {
          $project: {
            ...PUBLIC_FIELDS,
            photo: { $cond: ["$photoPublic", "$photo", null] },
          },
        },
        { $limit: 1 },
      ]);

      if (!raw) return null;

      const total = getAllLectures().length;
      const counts = await passedCounts([raw._id]);
      return toProfile(raw as RawUser, counts.get(String(raw._id)) ?? 0, total);
    } catch (err) {
      console.error("[public] could not read a profile:", err);
      return null;
    }
  }
);

/**
 * Make sure a student has a stored roll number.
 *
 * Called from the record page rather than at enrolment alone, so accounts
 * created before public profiles existed get one the first time their owner
 * looks at their record, with no migration to run.
 */
export async function ensureStudentNumber(userId: string): Promise<string> {
  await connectToDatabase();
  const existing = await User.findById(userId, { studentNumber: 1 }).lean();
  if (existing?.studentNumber) return existing.studentNumber;

  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = studentNumberFor(userId, attempt);
    try {
      const result = await User.updateOne(
        {
          _id: userId,
          $or: [
            { studentNumber: null },
            { studentNumber: { $exists: false } },
          ],
        },
        { $set: { studentNumber: candidate } }
      );
      if (result.modifiedCount === 1) return candidate;

      // Another request may have won the backfill race.
      const current = await User.findById(userId, { studentNumber: 1 }).lean();
      if (current?.studentNumber) return current.studentNumber;
    } catch (err) {
      const mongo = err as { code?: number; keyPattern?: Record<string, number> };
      if (mongo.code === 11000 && mongo.keyPattern?.studentNumber) continue;
      throw err;
    }
  }

  throw new Error("Could not allocate a unique student number.");
}
