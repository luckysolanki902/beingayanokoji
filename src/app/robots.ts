import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The print pages duplicate each lecture's text verbatim, and the API
      // routes have nothing to index. Both would only dilute the real page.
      disallow: ["/api/", "/lectures/*/print"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
