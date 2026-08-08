import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";

const LECTURES_DIR = path.join(process.cwd(), "src", "data", "lectures");

export type LectureMeta = {
  slug: string;
  title: string;
  order: number;
  pillar: string;
  secondaryPillars?: string[];
  difficulty?: "introductory" | "intermediate" | "advanced";
  keyClaim: string;
  tags?: string[];
  readingTimeMin: number;
  wordCount: number;
  excerpt?: string;
  published: boolean;
  /**
   * ISO date the lecture was first published, from `date:` in the front matter.
   * Null when the front matter does not say — search engines would rather have
   * no date than a date invented from a file timestamp, which on a fresh CI
   * checkout is just the build time.
   */
  publishedAt: string | null;
  /** ISO date of the last substantive revision, from `updated:`. */
  updatedAt: string | null;
};

export type Lecture = LectureMeta & {
  content: string;
};

export function getAllLectureSlugs(): string[] {
  if (!fs.existsSync(LECTURES_DIR)) return [];
  return fs
    .readdirSync(LECTURES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getLectureBySlug(slug: string): Lecture | null {
  const fullPath = path.join(LECTURES_DIR, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const stats = readingTime(content);

  return {
    slug,
    title: data.title ?? slug,
    order: data.order ?? 0,
    pillar: data.pillar ?? "—",
    secondaryPillars: data.secondary_pillars ?? [],
    difficulty: data.difficulty,
    keyClaim: data.key_claim ?? "",
    tags: data.tags ?? [],
    readingTimeMin: Math.max(1, Math.round(stats.minutes)),
    wordCount: stats.words,
    excerpt: data.excerpt ?? deriveExcerpt(content),
    published: data.published !== false,
    publishedAt: isoDate(data.date),
    updatedAt: isoDate(data.updated) ?? isoDate(data.date),
    content,
  };
}

/**
 * Front matter dates arrive as whatever YAML made of them — a Date when the
 * value was unquoted, a string when it was quoted. Anything unparseable becomes
 * null rather than an "Invalid Date" that would reach a schema.org field.
 */
function isoDate(value: unknown): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function getPublishedLectureSlugs(): string[] {
  return getAllLectures()
    .filter((l) => l.published)
    .map((l) => l.slug);
}

export function getAllLectures(): LectureMeta[] {
  return getAllLectureSlugs()
    .map((slug) => {
      const lec = getLectureBySlug(slug);
      if (!lec) return null;
      const { content: _omit, ...meta } = lec;
      return meta;
    })
    .filter((x): x is LectureMeta => x !== null)
    .sort((a, b) => b.order - a.order);
}

/**
 * Every lecture that draws on a pillar, primary or secondary, in reading order.
 *
 * Secondary pillars count deliberately: a lecture on sleep that leans on
 * discipline belongs on the discipline topic page too, and a topic page with
 * two entries on it is not worth having.
 */
export function getLecturesByPillar(pillar: string): LectureMeta[] {
  return getAllLectures().filter(
    (l) => l.pillar === pillar || (l.secondaryPillars ?? []).includes(pillar)
  );
}

function deriveExcerpt(content: string): string {
  const firstPara = content
    .split("\n\n")
    .find((block) => {
      const trimmed = block.trim();
      return (
        trimmed.length > 50 &&
        !trimmed.startsWith("#") &&
        !trimmed.startsWith(">") &&
        !trimmed.startsWith("-") &&
        !trimmed.startsWith("```")
      );
    });
  if (!firstPara) return "";
  const cleaned = firstPara.replace(/\s+/g, " ").trim();
  return cleaned.length > 220 ? cleaned.slice(0, 217) + "…" : cleaned;
}
