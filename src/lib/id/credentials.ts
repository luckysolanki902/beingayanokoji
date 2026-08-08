import "server-only";

import { connectToDatabase, databaseConfigured } from "@/lib/db/connect";
import { User } from "@/lib/db/models";
import { getCurrentUser } from "@/lib/auth/session";
import { getStudentRecord } from "@/lib/progress/state";
import { getClass, type ClassId } from "@/lib/curriculum";

/**
 * What goes on a student card and on a graduation certificate.
 *
 * Assembled on the server and never accepted from a request. That is the whole
 * security model for these two images: the browser sends nothing but a cookie,
 * so there is no field a reader can set to award themselves a class, a balance
 * or a graduation. The images are rendered from the record, and the record is
 * the database.
 */

export interface Credentials {
  /** The account this card belongs to. */
  id: string;
  name: string;
  email: string;
  /** A stable six-digit roll number, derived from the account id. */
  studentNumber: string;
  classId: ClassId;
  className: string;
  points: number;
  pointsEarned: number;
  passed: number;
  total: number;
  enrolledAt: Date;
  /** Data URI, or null when they have not uploaded one. */
  photo: string | null;
  graduated: boolean;
}

/**
 * Graduation means having passed every lecture in the school.
 *
 * Not "passed everything published", which would graduate someone today and
 * un-graduate them the moment the next lecture ships, and not "owns every
 * lecture", because buying the curriculum is buying time rather than standing
 * and the certificate would be worthless if it could be purchased. It is the
 * examinations or nothing.
 */
export function hasGraduated(passed: number, total: number): boolean {
  return total > 0 && passed >= total;
}

/**
 * A roll number that looks like a school issued it.
 *
 * Derived from the account id rather than stored, so it is stable for the life
 * of the account and needs no counter, no uniqueness index and no migration. A
 * collision would mean two cards sharing a printed number, which is a cosmetic
 * problem and not a security one, since nothing is ever looked up by it.
 */
export function studentNumberFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return String(hash % 1_000_000).padStart(6, "0");
}

/** The signed-in student's credentials, or null when nobody is signed in. */
export async function getCredentials(): Promise<Credentials | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const record = await getStudentRecord();

  // The photo is `select: false`, so it takes its own small query rather than
  // being dragged through every render that touches the user.
  let photo: string | null = null;
  let enrolledAt = new Date();
  if (databaseConfigured()) {
    try {
      await connectToDatabase();
      const row = await User.findById(user.id, { photo: 1, createdAt: 1 })
        .select("+photo")
        .lean();
      photo = row?.photo ?? null;
      enrolledAt = (row as { createdAt?: Date } | null)?.createdAt ?? enrolledAt;
    } catch (err) {
      console.error("[credentials] could not read the card photo:", err);
    }
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    studentNumber: studentNumberFor(user.id),
    classId: record.currentClass,
    className: getClass(record.currentClass).label,
    points: user.points,
    pointsEarned: user.pointsEarned,
    passed: record.passedCount,
    total: record.totalCount,
    enrolledAt,
    photo,
    graduated: hasGraduated(record.passedCount, record.totalCount),
  };
}

/**
 * The stand-in credentials printed on the specimen certificate.
 *
 * A real name would be a lie about a real person and the reader's own name
 * would be the thing being withheld, so the specimen belongs to the school's
 * own example student. Everything on it is visibly fictional, which is what
 * makes it safe to hand to anyone.
 */
export const SPECIMEN: Credentials = {
  id: "specimen",
  name: "Kiyotaka Ayanokoji",
  email: "specimen@example.invalid",
  studentNumber: "000000",
  classId: "GRAD",
  className: "Graduation",
  points: 0,
  pointsEarned: 0,
  passed: 50,
  total: 50,
  enrolledAt: new Date("2016-04-01T00:00:00Z"),
  photo: null,
  graduated: true,
};
