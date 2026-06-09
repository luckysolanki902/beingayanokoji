import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";

const LECTURES_DIR = path.join(process.cwd(), "src", "data", "lectures");

export type LectureMeta = {
  slug: string;
  title: string;
  date: string;
  pillar: string;
  secondaryPillars?: string[];
  difficulty?: "introductory" | "intermediate" | "advanced";
  keyClaim: string;
  tags?: string[];
  readingTimeMin: number;
  wordCount: number;
  excerpt?: string;
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
    date: data.date ?? new Date().toISOString().slice(0, 10),
    pillar: data.pillar ?? "—",
    secondaryPillars: data.secondary_pillars ?? [],
    difficulty: data.difficulty,
    keyClaim: data.key_claim ?? "",
    tags: data.tags ?? [],
    readingTimeMin: Math.max(1, Math.round(stats.minutes)),
    wordCount: stats.words,
    excerpt: data.excerpt ?? deriveExcerpt(content),
    content,
  };
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
    .sort((a, b) => (a.date < b.date ? 1 : -1));
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
