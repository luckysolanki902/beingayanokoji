"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase, databaseConfigured } from "@/lib/db/connect";
import {
  DestructionOrder,
  LectureAccess,
  QuestionAttempt,
  User,
} from "@/lib/db/models";
import { getCurrentUser } from "@/lib/auth/session";
import { creditPoints, refundPoints, spendPoints } from "@/lib/economy/points";
import {
  FIRST_CORRECT_AWARD,
  LECTURE_UNLOCK_COST,
  SITE_DESTRUCTION_COST,
  classUnlockCost,
} from "@/lib/economy/prices";
import { getAllLectures } from "@/lib/lectures";
import { buildCurriculum, getClass, type ClassId } from "@/lib/curriculum";
import { PASS_THRESHOLD, getQuiz } from "@/lib/quizzes";
import { isAlwaysOpen } from "@/lib/progress/state";
import { Types } from "mongoose";

/**
 * Everything that spends or earns points.
 *
 * All of it is here and none of it is in the browser. The client sends what the
 * reader did ("I chose option 2", "open this lecture") and this module
 * decides what that was worth by looking things up for itself: the answer key
 * from the server-only quiz file, the price from the price table, the balance
 * from the database. Nothing in a request body is treated as a fact about
 * money.
 */

export interface ActionResult {
  ok: boolean;
  /** Shown to the reader when it failed. Null on success. */
  error: string | null;
  balance: number;
}

const SIGNED_OUT: ActionResult = {
  ok: false,
  error: "You need to be enrolled to do that.",
  balance: 0,
};

/* ------------------------------------------------------------------ *
 * Opening lectures
 * ------------------------------------------------------------------ */

/**
 * Buy one lecture, for 100 points.
 *
 * The access row is written *before* the points are taken, which looks backwards
 * and is deliberate. The row carries a unique `(user, slug)` index, so a
 * double-clicked button loses its second insert to the database and never
 * reaches the charge, whereas charging first would take 200 points and open
 * one lecture. If the charge then fails for want of a balance, the row is
 * removed again. The only way this order can go wrong is a crash in the
 * half-millisecond between the two, and it goes wrong in the direction of a
 * student owning a lecture they did not pay for, which is the right way for it
 * to fail.
 */
export async function unlockLecture(slug: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  if (!databaseConfigured()) {
    return { ok: false, error: "The register is offline.", balance: user.points };
  }

  const lectures = getAllLectures();
  const index = lectures.findIndex((l) => l.slug === slug);
  if (index < 0) {
    return { ok: false, error: "No such lecture.", balance: user.points };
  }

  const lecture = lectures[index];
  if (!lecture.published) {
    return {
      ok: false,
      error: "That lecture has not been written yet. It cannot be bought.",
      balance: user.points,
    };
  }

  const free = isAlwaysOpen(index);
  const cost = free ? 0 : LECTURE_UNLOCK_COST;

  await connectToDatabase();

  try {
    await LectureAccess.create({
      user: user.id,
      slug,
      unlockedBy: free ? "free" : "lecture",
      unlockCost: cost,
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      // Already open. Not a failure, the reader is where they wanted to be.
      return { ok: true, error: null, balance: user.points };
    }
    console.error("[economy] could not open a lecture:", err);
    return { ok: false, error: "Something went wrong. Try again.", balance: user.points };
  }

  if (cost === 0) {
    revalidateReader(slug);
    return { ok: true, error: null, balance: user.points };
  }

  const spend = await spendPoints(user.id, cost, {
    reason: "unlock.lecture",
    description: `Opened “${lecture.title}”`,
    slug,
  });

  if (!spend.ok) {
    // Unwind the row we optimistically wrote. Deleting by the same key we
    // inserted, so a pre-existing unlock can never be revoked by this path.
    await LectureAccess.deleteOne({ user: user.id, slug, unlockedBy: "lecture" });
    return {
      ok: false,
      error: `That costs ${cost} points and you have ${spend.balance}.`,
      balance: spend.balance,
    };
  }

  revalidateReader(slug);
  return { ok: true, error: null, balance: spend.balance };
}

/**
 * Buy a whole class, at half the per-lecture price.
 *
 * Same saga as a single lecture, widened: the access rows go in first with an
 * unordered bulk write, the ones that were genuinely new are counted, and only
 * that count decides whether anything is charged. A second click therefore
 * inserts nothing, is charged nothing, and reports success, which is what the
 * reader means by clicking it twice.
 *
 * The whole class is charged for even when part of it is unwritten. That is
 * stated on the button rather than hidden: the purchase is of the class, and
 * lectures published into it later open with it.
 */
export async function unlockClass(classId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  if (!databaseConfigured()) {
    return { ok: false, error: "The register is offline.", balance: user.points };
  }

  const group = buildCurriculum(getAllLectures()).find((c) => c.meta.id === classId);
  if (!group) {
    return { ok: false, error: "No such class.", balance: user.points };
  }
  if (!group.entries.some((e) => e.lecture.published)) {
    return {
      ok: false,
      error: "Nothing in that class has been written yet. It cannot be bought.",
      balance: user.points,
    };
  }

  const cost = classUnlockCost(group.entries.length);
  await connectToDatabase();

  // `user` is an ObjectId in the schema; the session carries it as a string.
  // Mongoose casts that at runtime but bulkWrite's types do not, so the
  // conversion happens here rather than being asserted away.
  const userId = new Types.ObjectId(user.id);

  const result = await LectureAccess.bulkWrite(group.entries.map((entry) => ({
      updateOne: {
        filter: { user: userId, slug: entry.lecture.slug },
        update: {
          $setOnInsert: {
            user: userId,
            slug: entry.lecture.slug,
            unlockedBy: "class" as const,
            unlockCost: 0,
            unlockedAt: new Date(),
          },
        },
        upsert: true,
      },
    })),
    { ordered: false });

  const opened = result.upsertedCount ?? 0;
  if (opened === 0) {
    return { ok: true, error: null, balance: user.points };
  }

  const spend = await spendPoints(user.id, cost, {
    reason: "unlock.class",
    description: `Promoted into ${getClass(group.meta.id).label}, ${group.entries.length} lectures`,
    classId: group.meta.id,
    meta: { opened, size: group.entries.length },
  });

  if (!spend.ok) {
    // Remove only what this call created. Lectures already owned outright keep
    // their own rows, which were never touched by the upserts above.
    const newlyOpened = Object.values(result.upsertedIds ?? {});
    if (newlyOpened.length > 0) {
      await LectureAccess.deleteMany({ _id: { $in: newlyOpened } });
    }
    return {
      ok: false,
      error: `${getClass(group.meta.id).label} costs ${cost} points and you have ${spend.balance}.`,
      balance: spend.balance,
    };
  }

  revalidatePath("/", "layout");
  revalidatePath("/lectures");
  return { ok: true, error: null, balance: spend.balance };
}

/* ------------------------------------------------------------------ *
 * Examinations
 * ------------------------------------------------------------------ */

export interface AnswerResult extends ActionResult {
  correct: boolean;
  /** The right option, revealed only now that an answer is committed. */
  answerIndex: number;
  explanation: string;
  /** Points this answer paid. Five, or zero. */
  awarded: number;
  /** Why it paid nothing, when it paid nothing. */
  awardNote: string | null;
}

const NO_ANSWER: AnswerResult = {
  ok: false,
  error: "Something went wrong marking that.",
  balance: 0,
  correct: false,
  answerIndex: -1,
  explanation: "",
  awarded: 0,
  awardNote: null,
};

/**
 * Mark one answer, and pay for it if it deserves paying for.
 *
 * Five points for a correct answer, the *first* time this student meets this
 * question, and nothing in every other case: not the second attempt, not the
 * same question on a retake, not the same question a year later. That rule is
 * not enforced by a check in this function, a check could be raced by two tabs
 *, but by the unique `(user, slug, questionId)` index on the attempt
 * collection. The upsert below pays out only when Mongo reports that it created
 * the row. If it did not create the row, the question has been seen, and seen
 * questions are worth nothing.
 */
export async function answerQuestion(slug: string,
  questionId: string,
  choice: number): Promise<AnswerResult> {
  const user = await getCurrentUser();

  const quiz = getQuiz(slug);
  const question = quiz?.questions.find((q) => q.id === questionId);
  if (!question) return NO_ANSWER;

  const correct = choice === question.answer;
  const revealed = {
    correct,
    answerIndex: question.answer,
    explanation: question.explanation,
  };

  // Signed out, the examination still works as an examination; it simply does
  // not pay. Refusing to mark it would teach nothing and sell nothing.
  if (!user || !databaseConfigured()) {
    return {
      ...revealed,
      ok: true,
      error: null,
      balance: 0,
      awarded: 0,
      awardNote: user ? null : "Enrol to be paid for correct answers.",
    };
  }

  // Reading a lecture you have not opened must not pay for it.
  await connectToDatabase();
  const lectures = getAllLectures();
  const index = lectures.findIndex((l) => l.slug === slug);
  const owned =
    isAlwaysOpen(index) ||
    Boolean(await LectureAccess.exists({ user: user.id, slug }));
  if (!owned) {
    return { ...revealed, ok: false, error: "That lecture is not open to you.", balance: user.points, awarded: 0, awardNote: null };
  }

  const now = new Date();
  let firstTime = false;

  try {
    // Insert-only. Every field of a first attempt is set here and nowhere else,
    // so a repeat cannot rewrite what the first attempt said, and `attempts`
    // is not touched by an operator in the same statement, which Mongo would
    // reject as a path collision.
    const res = await QuestionAttempt.updateOne({ user: user.id, slug, questionId },
      {
        $setOnInsert: {
          user: user.id,
          slug,
          questionId,
          firstChoice: choice,
          firstCorrect: correct,
          pointsAwarded: correct ? FIRST_CORRECT_AWARD : 0,
          firstAt: now,
          lastAt: now,
          attempts: 1,
          everCorrect: correct,
        },
      },
      { upsert: true });
    firstTime = (res.upsertedCount ?? 0) > 0;
  } catch (err) {
    if ((err as { code?: number }).code !== 11000) {
      console.error("[economy] could not record an answer:", err);
      return { ...revealed, ok: true, error: null, balance: user.points, awarded: 0, awardNote: null };
    }
    // Two tabs answered the same question in the same instant. The other one
    // created the row, so this one is a repeat, and repeats pay nothing.
    firstTime = false;
  }

  if (!firstTime) {
    await QuestionAttempt.updateOne({ user: user.id, slug, questionId },
      { $inc: { attempts: 1 }, $set: { lastAt: now, ...(correct ? { everCorrect: true } : {}) } });
  }

  const awarded = firstTime && correct ? FIRST_CORRECT_AWARD : 0;

  if (awarded > 0) {
    const credit = await creditPoints(user.id, awarded, {
      reason: "exam.first-correct",
      description: `First-attempt correct answer, ${lectures[index]?.title ?? slug}`,
      slug,
      idempotencyKey: `q:${user.id}:${slug}:${questionId}`,
      kind: "earned",
    });
    await LectureAccess.updateOne({ user: user.id, slug },
      {
        $inc: { pointsEarned: awarded },
        $setOnInsert: { user: user.id, slug, unlockedBy: "free", unlockCost: 0 },
      },
      // Only the free first lecture can be missing a row here; anything else
      // was checked for ownership above.
      { upsert: isAlwaysOpen(index) });
    revalidateReader(slug);
    return { ...revealed, ok: true, error: null, balance: credit.balance, awarded, awardNote: null };
  }

  return {
    ...revealed,
    ok: true,
    error: null,
    balance: user.points,
    awarded: 0,
    awardNote: firstTime
      ? "First attempt, and wrong; this question will not pay again."
      : "You have answered this one before. It pays once only.",
  };
}

export interface ExamResult extends ActionResult {
  score: number;
  total: number;
  passed: boolean;
}

/**
 * Close out an attempt and record the pass.
 *
 * The score is recomputed here from the answer key rather than believed from
 * the client, so the only thing the browser contributes is which options were
 * chosen. A pass is written once and its date never moves; the best score can
 * rise on a retake and can never fall.
 */
export async function submitExam(slug: string,
  answers: Record<string, number>): Promise<ExamResult> {
  const quiz = getQuiz(slug);
  if (!quiz) {
    return { ok: false, error: "No examination here.", balance: 0, score: 0, total: 0, passed: false };
  }

  const total = quiz.questions.length;
  const score = quiz.questions.reduce((acc, q) => acc + (answers[q.id] === q.answer ? 1 : 0),
    0);
  const passed = score >= PASS_THRESHOLD;

  const user = await getCurrentUser();
  if (!user || !databaseConfigured()) {
    return { ok: true, error: null, balance: 0, score, total, passed };
  }

  try {
    await connectToDatabase();

    // Passing an examination must not be a way to acquire the lecture. The
    // only row this is allowed to create is the free first lecture, for a
    // student whose enrolment somehow did not write one.
    const index = getAllLectures().findIndex((l) => l.slug === slug);
    const free = isAlwaysOpen(index);
    const owned = free || Boolean(await LectureAccess.exists({ user: user.id, slug }));
    if (!owned) {
      return {
        ok: false,
        error: "That lecture is not open to you.",
        balance: user.points,
        score,
        total,
        passed: false,
      };
    }

    await LectureAccess.updateOne({ user: user.id, slug },
      {
        $inc: { attempts: 1 },
        // Best ever, not latest: a retake can raise this number and nothing
        // can lower it. The record is of having understood the lecture.
        $max: { bestScore: score },
        $set: { questionCount: total },
        $setOnInsert: { user: user.id, slug, unlockedBy: "free", unlockCost: 0 },
      },
      { upsert: free });

    if (passed) {
      // Matching on `passedAt: null` is what keeps the first pass's date from
      // being overwritten by every retake afterwards.
      await LectureAccess.updateOne({ user: user.id, slug, passedAt: null },
        { $set: { passedAt: new Date() } });
    }
  } catch (err) {
    console.error("[economy] could not record an examination:", err);
  }

  revalidateReader(slug);
  return { ok: true, error: null, balance: user.points, score, total, passed };
}

/* ------------------------------------------------------------------ *
 * The rest of the shop
 * ------------------------------------------------------------------ */

/** Remember that a promotion has been shown, so it is not shown twice. */
export async function acknowledgePromotion(classId: ClassId): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !databaseConfigured()) return;
  try {
    await connectToDatabase();
    await User.updateOne({ _id: user.id }, { $addToSet: { promotionsSeen: classId } });
  } catch (err) {
    console.error("[economy] could not record a promotion:", err);
  }
}

/**
 * Spend two million points to ask that the site be destroyed.
 *
 * The points are genuinely taken and the order is genuinely recorded. What is
 * not automated is the destruction itself, a single request should not be able
 * to delete the thing it was made through, and anyone who has spent two hundred
 * thousand dollars to make the request has earned a conversation rather than a
 * cron job.
 */
export async function requestDestruction(note: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  if (!databaseConfigured()) {
    return { ok: false, error: "The register is offline.", balance: user.points };
  }

  await connectToDatabase();

  const spend = await spendPoints(user.id, SITE_DESTRUCTION_COST, {
    reason: "site.destruction",
    description: "Ordered the destruction of the site",
  });

  if (!spend.ok) {
    return {
      ok: false,
      error: `That costs ${SITE_DESTRUCTION_COST.toLocaleString()} points. You have ${spend.balance.toLocaleString()}.`,
      balance: spend.balance,
    };
  }

  try {
    await DestructionOrder.create({
      user: user.id,
      cost: SITE_DESTRUCTION_COST,
      note: note.trim().slice(0, 2000) || null,
    });
  } catch (err) {
    console.error("[economy] could not record a destruction order:", err);
    // The points came out for something that was not written down. Put them
    // back, an unrecorded order is not an order.
    await refundPoints(user.id, SITE_DESTRUCTION_COST, {
      reason: "correction",
      description: "Refund, destruction order could not be recorded",
    });
    return { ok: false, error: "The order could not be placed. Nothing was charged.", balance: user.points };
  }

  revalidatePath("/", "layout");
  revalidatePath("/record");
  return { ok: true, error: null, balance: spend.balance };
}

/** The pages whose server-rendered state a purchase or a pass has just changed. */
function revalidateReader(slug: string): void {
  revalidatePath(`/lectures/${slug}`);
  revalidatePath("/lectures");
  revalidatePath("/record");
  revalidatePath("/");
}
