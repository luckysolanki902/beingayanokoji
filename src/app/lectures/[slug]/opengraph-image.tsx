import { ImageResponse } from "next/og";
import { getAllLectureSlugs, getLectureBySlug } from "@/lib/lectures";
import { getPillar } from "@/lib/pillars";

export const alt = "Being Ayanokoji lecture";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllLectureSlugs().map((slug) => ({ slug }));
}

/**
 * Cut at the last word boundary before the limit, and drop any trailing
 * punctuation the cut left dangling — "one of the few ," reads as a bug.
 */
function truncateWords(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:—-]+$/, "") + "…";
}

/**
 * A share card per lecture, carrying the title and its key claim.
 *
 * The site-wide card is fine on the homepage and useless on an essay: fifty
 * links that all preview as the same image tell a reader nothing about which
 * one they were sent.
 */
export default async function OG({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lec = getLectureBySlug(slug);
  const title = lec?.title ?? "Being Ayanokoji";
  const claim = lec?.keyClaim || lec?.excerpt || "";
  const topic = lec ? getPillar(lec.pillar)?.headline : null;

  // Long titles need to come down a size or they wrap into the claim below.
  const titleSize = title.length > 46 ? 62 : title.length > 30 ? 74 : 86;
  const shownClaim = truncateWords(claim, 165);

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          color: "#f4f4f5",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 20,
            fontSize: 20,
            letterSpacing: 5,
            color: "#8a8a8a",
            textTransform: "uppercase",
          }}
        >
          <span>being ayanokoji</span>
          {topic && <span style={{ color: "#4a4a4a" }}>/</span>}
          {topic && <span>{topic}</span>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: titleSize,
              fontWeight: 500,
              letterSpacing: -2,
              lineHeight: 1.05,
            }}
          >
            {title}
          </div>
          {shownClaim && (
            <div
              style={{
                display: "flex",
                fontSize: 27,
                fontStyle: "italic",
                color: "#a1a1aa",
                lineHeight: 1.4,
                borderLeft: "3px solid #e6a259",
                paddingLeft: 24,
              }}
            >
              {shownClaim}
            </div>
          )}
        </div>

        <div style={{ display: "flex", fontSize: 22, color: "#6a6a6a" }}>
          {lec ? `${lec.readingTimeMin} min · ${lec.wordCount.toLocaleString()} words` : ""}
        </div>
      </div>
    ),
    { ...size }
  );
}
