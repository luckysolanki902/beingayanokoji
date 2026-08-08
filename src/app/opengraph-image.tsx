import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Kiyotaka Ayanokoji seated in his Class D uniform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The source artwork is 1200 × 800. Social cards use 1200 × 630, so it is
 * centre-cropped rather than stretched; Ayanokoji remains fully framed across
 * Twitter/X, Discord, WhatsApp and Open Graph previews.
 */
export default async function OpenGraphImage() {
  // Embed the local source so image generation does not depend on fetching its
  // own deployment URL (which is unavailable while Vercel is still building).
  const source = await readFile(
    join(process.cwd(), "public", "images", "ayanokoji-full.jpg"),
  );
  const image = `data:image/jpeg;base64,${source.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#f7f8f9",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=""
        width={1200}
        height={800}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center top",
        }}
      />
    </div>,
    size,
  );
}
