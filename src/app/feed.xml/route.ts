import { getAllLectures } from "@/lib/lectures";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

/**
 * RSS, because the people most likely to read a five-thousand-word essay are
 * disproportionately the people who still run a reader. It also gives the site
 * a machine-readable surface that is not the sitemap, aggregators, Google
 * Discover and a number of indexing services consume feeds directly.
 *
 * Only published lectures appear. A feed advertising essays that do not exist
 * yet would train subscribers to ignore it.
 */

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const lectures = getAllLectures().filter((l) => l.published);

  const items = lectures
    .map((lec) => {
      const url = absoluteUrl(`/lectures/${lec.slug}`);
      const date = lec.publishedAt ?? lec.updatedAt;
      return `    <item>
      <title>${escapeXml(lec.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(lec.keyClaim || lec.excerpt || "")}</description>
      ${date ? `<pubDate>${new Date(date).toUTCString()}</pubDate>` : ""}
      ${(lec.tags ?? [])
        .map((t) => `<category>${escapeXml(t)}</category>`)
        .join("\n      ")}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
