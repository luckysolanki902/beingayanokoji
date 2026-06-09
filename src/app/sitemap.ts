import type { MetadataRoute } from "next";
import { getAllLectures } from "@/lib/lectures";

const SITE_URL = "https://beingayanokoji.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lectures = getAllLectures();

  const lectureEntries: MetadataRoute.Sitemap = lectures.map((lec) => ({
    url: `${SITE_URL}/lectures/${lec.slug}`,
    changeFrequency: "yearly",
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/lectures`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...lectureEntries,
  ];
}
