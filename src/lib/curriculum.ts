import type { LectureMeta } from "@/lib/lectures";

/**
 * The class system.
 *
 * Lectures are not a flat list you graze; they are a curriculum you are placed
 * into at the bottom of. Everyone enrols in Class D. You leave it by finishing
 * the work, and the school does not care how long that takes.
 *
 * This is deliberately the school's own logic rather than a progress bar with a
 * Japanese label stuck on it: the promotion is earned by completing every
 * lecture in the class, the next class is not visible in advance, and nobody is
 * congratulated for arriving.
 */

export type ClassId = "D" | "C" | "B" | "A" | "GRAD";

export interface SchoolClass {
  id: ClassId;
  /** What the class is called in the interface. */
  label: string;
  japanese: string;
  /** Chabashira's line when you are placed here. */
  brief: string;
  /** Shown on promotion into this class. */
  promotion: string;
  /** How many lectures the class holds. */
  size: number;
}

export const CLASSES: SchoolClass[] = [
  {
    id: "D",
    label: "Class D",
    japanese: "Ｄクラス",
    brief:
      "You start here. Everyone does. Class D is not a punishment — it is an accurate description of what you have demonstrated so far, which is nothing. The lectures below are the only way out.",
    promotion: "Enrolled.",
    size: 10,
  },
  {
    id: "C",
    label: "Class C",
    japanese: "Ｃクラス",
    brief:
      "You finished Class D. That puts you ahead of most people who opened this site, which is a lower bar than it sounds. The work gets less comfortable from here.",
    promotion: "You have been promoted to Class C.",
    size: 10,
  },
  {
    id: "B",
    label: "Class B",
    japanese: "Ｂクラス",
    brief:
      "Class B is where the easy gains stop. Everything you have read so far described a problem you already suspected you had. What follows will describe ones you do not.",
    promotion: "You have been promoted to Class B.",
    size: 10,
  },
  {
    id: "A",
    label: "Class A",
    japanese: "Ａクラス",
    brief:
      "Class A. Understand that arriving here proves only that you finish things. Whether any of it changed you is a separate question, and not one I can grade.",
    promotion: "You have been promoted to Class A.",
    size: 10,
  },
  {
    id: "GRAD",
    label: "Graduation",
    japanese: "卒業",
    brief:
      "The final lectures. There is no class above this one and nothing waiting on the other side — which is the point. You were never being trained for the school.",
    promotion: "You have reached graduation.",
    size: 10,
  },
];

export const CLASS_ORDER: ClassId[] = ["D", "C", "B", "A", "GRAD"];

export function getClass(id: ClassId): SchoolClass {
  return CLASSES.find((c) => c.id === id) ?? CLASSES[0];
}

/** The class after this one, or null at graduation. */
export function nextClassOf(id: ClassId): ClassId | null {
  const i = CLASS_ORDER.indexOf(id);
  return i >= 0 && i < CLASS_ORDER.length - 1 ? CLASS_ORDER[i + 1] : null;
}

/**
 * Which class a lecture belongs to, by its position in reading order.
 *
 * Position rather than front matter: the reading order is already the
 * curriculum, and duplicating it into every markdown file would give two
 * sources of truth that drift the first time a lecture is reordered.
 */
export function classOfIndex(index: number): ClassId {
  const i = Math.floor(index / 10);
  return CLASS_ORDER[Math.min(i, CLASS_ORDER.length - 1)];
}

export interface CurriculumEntry {
  lecture: LectureMeta;
  /** Position in reading order, from 0. */
  index: number;
  classId: ClassId;
  /** Position within the class, from 1 — "Lecture 4 of Class D". */
  positionInClass: number;
}

export interface CurriculumClass {
  meta: SchoolClass;
  entries: CurriculumEntry[];
}

/** Group the reading order into classes. `lectures` must already be sorted. */
export function buildCurriculum(lectures: LectureMeta[]): CurriculumClass[] {
  const grouped = new Map<ClassId, CurriculumEntry[]>();
  for (const id of CLASS_ORDER) grouped.set(id, []);

  lectures.forEach((lecture, index) => {
    const classId = classOfIndex(index);
    const bucket = grouped.get(classId)!;
    bucket.push({
      lecture,
      index,
      classId,
      positionInClass: bucket.length + 1,
    });
  });

  return CLASS_ORDER.map((id) => ({
    meta: getClass(id),
    entries: grouped.get(id)!,
  })).filter((c) => c.entries.length > 0);
}

/** Flatten to a slug → entry lookup, for the lecture page. */
export function curriculumIndex(
  lectures: LectureMeta[]
): Record<string, CurriculumEntry> {
  const out: Record<string, CurriculumEntry> = {};
  lectures.forEach((lecture, index) => {
    out[lecture.slug] = {
      lecture,
      index,
      classId: classOfIndex(index),
      positionInClass: (index % 10) + 1,
    };
  });
  return out;
}
