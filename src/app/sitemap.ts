import type { MetadataRoute } from "next";
import { getAllLectures } from "@/lib/lectures";

const SITE_URL = "https://beingayanokoji.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lectures = getAllLectures();

  const lectureEntries: MetadataRoute.Sitemap = lectures.map((lec) => ({
    url: `${SITE_URL}/lectures/${lec.slug}`,
    lastModified: new Date(lec.date),
    changeFrequency: "yearly",
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/lectures`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...lectureEntries,
  ];
}
