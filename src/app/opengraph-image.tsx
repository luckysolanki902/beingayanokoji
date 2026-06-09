import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Being Ayanokoji — Calm in tone. Heavy in substance.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
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
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, color: "#8a8a8a", textTransform: "uppercase" }}>
          beingayanokoji.vercel.app
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 90, fontWeight: 500, letterSpacing: -2, lineHeight: 1 }}>
            Calm in tone.
          </div>
          <div style={{ fontSize: 90, fontWeight: 300, fontStyle: "italic", color: "#e6a259", letterSpacing: -2, lineHeight: 1 }}>
            Heavy in substance.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#a1a1aa", fontStyle: "italic" }}>
          Long-form lectures. Cognition · Psychology · Strength · Strategy · Purpose.
        </div>
      </div>
    ),
    { ...size }
  );
}
