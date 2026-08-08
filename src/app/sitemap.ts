import type { MetadataRoute } from "next";
import { getAllLectures } from "@/lib/lectures";
import { PILLARS } from "@/lib/pillars";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lectures = getAllLectures();

  /**
   * Unpublished lectures are still listed. Their pages exist, they are
   * internally linked, and a placeholder that says "being written" is a real
   * page — but they rank below everything finished, which the priority says.
   */
  const lectureEntries: MetadataRoute.Sitemap = lectures.map((lec) => ({
    url: absoluteUrl(`/lectures/${lec.slug}`),
    ...(lec.updatedAt ? { lastModified: new Date(lec.updatedAt) } : {}),
    changeFrequency: lec.published ? ("yearly" as const) : ("monthly" as const),
    priority: lec.published ? 0.8 : 0.3,
  }));

  const topicEntries: MetadataRoute.Sitemap = PILLARS.map((p) => ({
    url: absoluteUrl(`/topics/${p.slug}`),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/lectures"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/topics"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/feed.xml"), changeFrequency: "weekly", priority: 0.4 },
    ...topicEntries,
    ...lectureEntries,
  ];
}
