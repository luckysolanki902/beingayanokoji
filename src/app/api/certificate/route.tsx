import { ImageResponse } from "next/og";
import { SPECIMEN, getCredentials, type Credentials } from "@/lib/id/credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const W = 1440;
const H = 1018;

const INK = "#14161a";
const PAPER = "#f7f5ee";
const GOLD = "#a8894b";
const RULE = "#c8c4b6";
const ACCENT = "#8c2f39";

/**
 * The graduation certificate.
 *
 * Two versions come out of this route and the difference between them is
 * decided here, on the server, before a single pixel is drawn.
 *
 * A graduate gets their certificate: their name, their numbers, legible.
 *
 * Everyone else gets a *specimen*. Not their certificate with a blur laid over
 * it, which is what a CSS filter would be and which anyone could strip in
 * devtools in about four seconds. A specimen carries the school's example
 * student rather than the reader, so the private details are not in the file at
 * all, and the text is rendered blurred into the PNG itself, so there is
 * nothing to un-blur. The bytes that leave the server are the bytes the reader
 * gets, and they do not contain the thing being withheld.
 */
export async function GET() {
  const me = await getCredentials();
  if (!me) return new Response("Not enrolled.", { status: 401 });

  const real = me.graduated;
  const shown: Credentials = real ? me : SPECIMEN;

  return new ImageResponse(<Certificate credentials={shown} blurred={!real} />, {
    width: W,
    height: H,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="${
        real ? `ayanokoji-graduation-${me.studentNumber}` : "ayanokoji-certificate-specimen"
      }.png"`,
    },
  });
}

/**
 * Blur, applied to the glyphs rather than to a layer above them.
 *
 * Satori has no `filter: blur()`, so a transparent fill with a wide text shadow
 * does the work: the shadow is the only thing drawn, and a shadow with an
 * eighteen pixel radius and no offset is an illegible smear of the letterform.
 * The result is baked into the PNG, which is exactly what makes it safe.
 */
function blurStyle(color: string) {
  return {
    color: "transparent",
    textShadow: `0 0 18px ${color}`,
  } as const;
}

function Certificate({
  credentials,
  blurred,
}: {
  credentials: Credentials;
  blurred: boolean;
}) {
  const secret = (color: string) => (blurred ? blurStyle(color) : { color });
  const awarded = credentials.enrolledAt.getUTCFullYear();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: PAPER,
        color: INK,
        fontFamily: "serif",
        padding: 54,
        position: "relative",
      }}
    >
      {/* Double rule, the way a real certificate is bordered. */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          height: "100%",
          border: `3px solid ${INK}`,
          padding: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            height: "100%",
            border: `1px solid ${RULE}`,
            padding: "56px 64px",
          }}
        >
          {/* A crest rule above the school's name: two hairlines with the
              seal between them, which is what the eye reads as "document"
              before it has read a single word. */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", width: 150, height: 1, background: RULE }} />
            <div
              style={{
                display: "flex",
                width: 54,
                height: 54,
                borderRadius: 27,
                border: `2px solid ${ACCENT}`,
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                color: ACCENT,
              }}
            >
              高
            </div>
            <div style={{ display: "flex", width: 150, height: 1, background: RULE }} />
          </div>

          <div style={{ display: "flex", fontSize: 25, letterSpacing: 12, marginTop: 22, color: "#7d786c" }}>
            高度育成高等学校
          </div>
          <div style={{ display: "flex", fontSize: 18, letterSpacing: 8, marginTop: 10, color: "#9c968a" }}>
            ADVANCED NURTURING HIGH SCHOOL
          </div>

          <div style={{ display: "flex", fontSize: 72, marginTop: 34, letterSpacing: -1 }}>
            Certificate of Graduation
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              marginTop: 12,
              letterSpacing: 14,
              color: GOLD,
            }}
          >
            卒 業 証 書
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 25,
              marginTop: 46,
              color: "#5f5b51",
            }}
          >
            This is to certify that
          </div>

          {/* The name is the whole document. On a specimen it is the school's
              example student, blurred, and it is not the reader's name in any
              form anywhere in this file. */}
          <div
            style={{
              display: "flex",
              fontSize: 78,
              marginTop: 18,
              letterSpacing: -1,
              ...secret(INK),
            }}
          >
            {credentials.name}
          </div>

          <div
            style={{
              display: "flex",
              width: 720,
              borderBottom: `2px solid ${GOLD}`,
              marginTop: 10,
            }}
          />

          <div
            style={{
              display: "flex",
              fontSize: 25,
              marginTop: 34,
              color: "#5f5b51",
              textAlign: "center",
              maxWidth: 900,
            }}
          >
            has passed every examination set by this school, in order, and is
            released from it.
          </div>

          <div
            style={{
              display: "flex",
              gap: 0,
              marginTop: 44,
              border: `1px solid ${RULE}`,
            }}
          >
            <Stat
              label="STUDENT NO."
              value={credentials.studentNumber}
              style={secret(INK)}
            />
            <Stat
              label="EXAMINATIONS"
              value={`${credentials.passed} / ${credentials.total}`}
              style={secret(INK)}
            />
            <Stat
              label="POINTS EARNED"
              value={credentials.pointsEarned.toLocaleString()}
              style={secret(ACCENT)}
            />
          </div>

          <div style={{ display: "flex", flex: 1 }} />

          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "flex-end",
              fontSize: 20,
              color: "#6b675c",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 17, letterSpacing: 4 }}>CONFERRED</div>
              <div style={{ display: "flex", fontSize: 26, marginTop: 4, color: INK }}>
                {awarded}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", fontSize: 26, color: INK }}>
                Sae Chabashira
              </div>
              <div
                style={{
                  display: "flex",
                  width: 300,
                  borderTop: `1px solid ${RULE}`,
                  marginTop: 8,
                  paddingTop: 8,
                  justifyContent: "center",
                  fontSize: 17,
                  letterSpacing: 4,
                }}
              >
                HOMEROOM TEACHER
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The specimen mark, printed into the image rather than laid over it.
          A corner tag rather than a band across the middle: a band has to cover
          something to be seen, and the thing it covered was the one sentence
          explaining what the document is. The blur already does the withholding;
          this only has to say why. */}
      {blurred && (
        <div
          style={{
            position: "absolute",
            top: 54,
            right: 54,
            display: "flex",
            alignItems: "center",
            background: ACCENT,
            color: PAPER,
            padding: "12px 26px",
            fontSize: 24,
            letterSpacing: 10,
          }}
        >
          見本 SPECIMEN
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  style,
}: {
  label: string;
  value: string;
  style: Record<string, string>;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: 240,
        padding: "18px 0",
        borderRight: `1px solid ${RULE}`,
      }}
    >
      <div style={{ display: "flex", fontSize: 15, letterSpacing: 4, color: "#9c968a" }}>
        {label}
      </div>
      <div style={{ display: "flex", fontSize: 38, marginTop: 8, ...style }}>{value}</div>
    </div>
  );
}
