import "server-only";

import { cache } from "react";
import { connectToDatabase, databaseConfigured } from "@/lib/db/connect";
import { LectureAccess, QuestionAttempt } from "@/lib/db/models";
import { getCurrentUser, type SessionUser } from "@/lib/auth/session";
import { getAllLectures } from "@/lib/lectures";
import {
  CLASS_ORDER,
  buildCurriculum,
  classOfIndex,
  getClass,
  type ClassId,
} from "@/lib/curriculum";
import { LECTURE_UNLOCK_COST, classUnlockCost } from "@/lib/economy/prices";

/**
 * The student's record, assembled on the server.
 *
 * This is the module that replaced localStorage, and the reason for the change
 * is not persistence; it is that a lock worth points cannot be decided by the
 * browser holding the points. It is also why the whole record is resolved
 * during the render rather than fetched afterwards: the reader never sees a
 * lecture unlock itself half a second after the page appears, and a crawler
 * gets a finished page instead of a loading state.
 *
 * A signed-out visitor is not an error case. They get the same shape with
 * nothing unlocked but the first lecture, which is exactly what the interface
 * needs to show them.
 */

export interface LectureState {
  slug: string;
  title: string;
  index: number;
  classId: ClassId;
  positionInClass: number;
  published: boolean;
  unlocked: boolean;
  unlockedBy: "free" | "lecture" | "class" | "grant" | null;
  passed: boolean;
  bestScore: number;
  questionCount: number;
  /** Points this lecture's questions have already paid out to this student. */
  pointsEarned: number;
}

export interface ClassState {
  id: ClassId;
  label: string;
  japanese: string;
  brief: string;
  size: number;
  /** What buying the whole class costs, from its real size. */
  cost: number;
  unlockedCount: number;
  passedCount: number;
  publishedCount: number;
  /** True once every lecture in the class is open, however it was opened. */
  fullyUnlocked: boolean;
  slugs: string[];
}

export interface StudentRecord {
  signedIn: boolean;
  user: SessionUser | null;
  points: number;
  lectures: LectureState[];
  bySlug: Record<string, LectureState>;
  classes: ClassState[];
  /** The class they are working through: the first not fully passed. */
  currentClass: ClassId;
  unlockedCount: number;
  passedCount: number;
  totalCount: number;
  /** Points already banked from examinations, per the attempt records. */
  lectureUnlockCost: number;
  /** First lecture in reading order that is open but not yet passed. */
  resume: { slug: string; title: string } | null;
  /** First lecture in reading order that is still locked. */
  nextLocked: { slug: string; title: string; cost: number } | null;
}

/**
 * The first lecture in reading order is open to everyone, always.
 *
 * A locked front door is not a paywall, it is a closed shop. Someone has to be
 * able to read one whole lecture and take one whole examination before being
 * asked for anything, both because it is fair and because the examination is
 * how points are earned in the first place, charging for the only free source
 * of currency would make the economy a closed loop.
 */
export function isAlwaysOpen(index: number): boolean {
  return index === 0;
}

export const getStudentRecord = cache(async (): Promise<StudentRecord> => {
  const lectures = getAllLectures();
  const curriculum = buildCurriculum(lectures);
  const user = await getCurrentUser();

  // Access rows and examination rows, keyed by slug. Empty for a visitor.
  const access = new Map<
    string,
    { unlockedBy: LectureState["unlockedBy"]; passedAt: Date | null; bestScore: number; questionCount: number; pointsEarned: number }
  >();

  if (user && databaseConfigured()) {
    try {
      await connectToDatabase();
      const rows = await LectureAccess.find({ user: user.id },
        { slug: 1, unlockedBy: 1, passedAt: 1, bestScore: 1, questionCount: 1, pointsEarned: 1 }).lean();

      for (const row of rows) {
        access.set(row.slug, {
          unlockedBy: (row.unlockedBy as LectureState["unlockedBy"]) ?? "lecture",
          passedAt: row.passedAt ?? null,
          bestScore: row.bestScore ?? 0,
          questionCount: row.questionCount ?? 0,
          pointsEarned: row.pointsEarned ?? 0,
        });
      }
    } catch (err) {
      // Same principle as the session loader: a database that is down turns
      // the site back into a reading experience rather than an error.
      console.error("[progress] could not read the student record:", err);
    }
  }

  const states: LectureState[] = lectures.map((lecture, index) => {
    const row = access.get(lecture.slug);
    const free = isAlwaysOpen(index);
    return {
      slug: lecture.slug,
      title: lecture.title,
      index,
      classId: classOfIndex(index),
      positionInClass: (index % 10) + 1,
      published: lecture.published,
      unlocked: free || Boolean(row),
      unlockedBy: free ? "free" : (row?.unlockedBy ?? null),
      passed: Boolean(row?.passedAt),
      bestScore: row?.bestScore ?? 0,
      questionCount: row?.questionCount ?? 0,
      pointsEarned: row?.pointsEarned ?? 0,
    };
  });

  const bySlug: Record<string, LectureState> = {};
  for (const state of states) bySlug[state.slug] = state;

  const classes: ClassState[] = curriculum.map((group) => {
    const entries = group.entries.map((e) => bySlug[e.lecture.slug]);
    const meta = getClass(group.meta.id);
    return {
      id: group.meta.id,
      label: meta.label,
      japanese: meta.japanese,
      brief: meta.brief,
      size: entries.length,
      cost: classUnlockCost(entries.length),
      unlockedCount: entries.filter((e) => e.unlocked).length,
      passedCount: entries.filter((e) => e.passed).length,
      publishedCount: entries.filter((e) => e.published).length,
      fullyUnlocked: entries.every((e) => e.unlocked),
      slugs: entries.map((e) => e.slug),
    };
  });

  // The class they are in is the first one they have not finished, derived,
  // never stored, so it cannot disagree with the record it is drawn from.
  let currentClass: ClassId = CLASS_ORDER[CLASS_ORDER.length - 1];
  for (const group of classes) {
    if (group.passedCount < group.size) {
      currentClass = group.id;
      break;
    }
  }

  const resumeState = states.find((s) => s.unlocked && s.published && !s.passed) ?? null;
  const nextLockedState = states.find((s) => !s.unlocked && s.published) ?? null;

  return {
    signedIn: Boolean(user),
    user,
    points: user?.points ?? 0,
    lectures: states,
    bySlug,
    classes,
    currentClass,
    unlockedCount: states.filter((s) => s.unlocked).length,
    passedCount: states.filter((s) => s.passed).length,
    totalCount: states.length,
    lectureUnlockCost: LECTURE_UNLOCK_COST,
    resume: resumeState ? { slug: resumeState.slug, title: resumeState.title } : null,
    nextLocked: nextLockedState
      ? { slug: nextLockedState.slug, title: nextLockedState.title, cost: LECTURE_UNLOCK_COST }
      : null,
  };
});

/**
 * Which questions of one lecture this student has already been paid for.
 *
 * Read separately from the record because only the examination needs it, and
 * loading every attempt a student has ever made in order to draw the roster
 * would be a query that grows with their history for no reason.
 */
export async function getAnsweredQuestions(slug: string): Promise<
  Record<string, { firstCorrect: boolean; pointsAwarded: number; attempts: number }>
> {
  const user = await getCurrentUser();
  if (!user || !databaseConfigured()) return {};

  try {
    await connectToDatabase();
    const rows = await QuestionAttempt.find({ user: user.id, slug },
      { questionId: 1, firstCorrect: 1, pointsAwarded: 1, attempts: 1 }).lean();

    const out: Record<string, { firstCorrect: boolean; pointsAwarded: number; attempts: number }> = {};
    for (const row of rows) {
      out[row.questionId] = {
        firstCorrect: row.firstCorrect,
        pointsAwarded: row.pointsAwarded ?? 0,
        attempts: row.attempts ?? 1,
      };
    }
    return out;
  } catch (err) {
    console.error("[progress] could not read examination history:", err);
    return {};
  }
}
