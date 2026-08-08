import type { ReactElement } from "react";
import type { Credentials } from "@/lib/id/credentials";
import { SITE_URL } from "@/lib/site";

/** Credit-card proportions at print resolution, so a download crops properly. */
export const CARD_W = 1012;
export const CARD_H = 638;

/* The card's own palette, fixed. It is a printed object, not a page: it looks
   the same in every room the reader might be viewing the site from. */
const BAND = "#8c1c2b";
const INK = "#16181c";
const PAPER = "#ffffff";
const STOCK = "#f7f7f5";
const RULE = "#d9d6cf";
const CRIMSON = "#9b1c2e";
const LABEL = "#6f6b64";

/**
 * The student card.
 *
 * Modelled on the card the school issues in the story: a deep band across the
 * top with 学生証 centred in it, the photograph inset on the left behind a red
 * rule, and the particulars stacked to the right as labelled rows in Japanese
 * with the English underneath. The bottom carries the certification line, the
 * way a real identity document does.
 *
 * `preview` is what makes the paid download worth paying for. The free preview
 * is the same card with a specimen band printed *into* it, so saving the
 * preview image gets you an image with a specimen band on it. There is no
 * unmarked version anywhere the browser can reach without paying: the clean
 * render only ever happens inside the download route, after the charge.
 */
export function CardArt({
  me,
  preview,
}: {
  me: Credentials;
  preview: boolean;
}): ReactElement {
  const enrolled = me.enrolledAt.toISOString().slice(0, 10).replace(/-/g, ".");
  const host = SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: STOCK,
        color: INK,
        fontFamily: "serif",
        padding: 14,
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          background: PAPER,
          border: `1px solid ${RULE}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            background: BAND,
            color: PAPER,
            padding: "22px 0",
          }}
        >
          <div style={{ display: "flex", fontSize: 40, letterSpacing: 16 }}>学生証</div>
          <div
            style={{
              position: "absolute",
              right: 26,
              display: "flex",
              fontSize: 16,
              letterSpacing: 5,
              color: "#e8c4c9",
            }}
          >
            C.O.T.E.
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, padding: "26px 30px 0 30px" }}>
          <div
            style={{
              display: "flex",
              width: 224,
              height: 288,
              border: `3px solid ${CRIMSON}`,
              alignItems: "center",
              justifyContent: "center",
              background: "#eceae4",
              overflow: "hidden",
            }}
          >
            {me.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={me.photo}
                width={224}
                height={288}
                style={{ objectFit: "cover", width: 224, height: 288 }}
                alt=""
              />
            ) : (
              <div style={{ display: "flex", fontSize: 20, letterSpacing: 4, color: "#a5a199" }}>
                写真なし
              </div>
            )}
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", flex: 1, paddingLeft: 34 }}
          >
            <Row label="氏 名" sub="NAME">
              <div style={{ display: "flex", fontSize: 44, letterSpacing: -1 }}>
                {me.name}
              </div>
            </Row>

            <Row label="学籍番号" sub="STUDENT NO.">
              <div style={{ display: "flex", fontSize: 32, letterSpacing: 2 }}>
                S01T{me.studentNumber}
              </div>
            </Row>

            <Row label="クラス" sub="CLASS">
              <div style={{ display: "flex", fontSize: 32 }}>{me.className}</div>
            </Row>

            {/* Private points. In the story this is the number that decides
                what a student can actually do, so it is the one thing on the
                card set in the school's red. */}
            <Row label="個人ポイント" sub="PRIVATE POINTS" last>
              <div
                style={{ display: "flex", alignItems: "baseline", gap: 12, color: CRIMSON }}
              >
                <div style={{ display: "flex", fontSize: 46, letterSpacing: -1 }}>
                  {me.points.toLocaleString()}
                </div>
                <div style={{ display: "flex", fontSize: 18, letterSpacing: 3 }}>pt</div>
              </div>
            </Row>
          </div>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", padding: "0 30px 20px 30px" }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 19,
              color: LABEL,
              borderTop: `1px solid ${RULE}`,
              paddingTop: 14,
            }}
          >
            上記の者は当校の生徒であることを証明する。
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 12,
              fontSize: 16,
              color: LABEL,
            }}
          >
            <div style={{ display: "flex", letterSpacing: 2 }}>
              入学 {enrolled} · {me.passed}/{me.total} 合格
            </div>
            {/* The issuer's mark is the address and nothing else. The card
                belongs to the school; the site is only where it was printed,
                and a second title next to 学生証 was one name too many. */}
            <div style={{ display: "flex", letterSpacing: 3, color: CRIMSON }}>
              {host}
            </div>
          </div>
        </div>
      </div>

      {/* The specimen band, printed into the pixels of the free preview. */}
      {preview && (
        <div
          style={{
            position: "absolute",
            top: 268,
            left: 0,
            width: CARD_W,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(140, 28, 43, 0.92)",
            color: PAPER,
            padding: "14px 0",
            fontSize: 26,
            letterSpacing: 16,
          }}
        >
          見本 · NOT ISSUED · 見本
        </div>
      )}
    </div>
  );
}

/** One labelled row of the card: Japanese label, English beneath, value right. */
function Row({
  label,
  sub,
  children,
  last,
}: {
  label: string;
  sub: string;
  children: ReactElement;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 22,
        paddingBottom: 12,
        marginBottom: 12,
        borderBottom: last ? "none" : `1px solid ${RULE}`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: 150 }}>
        <div style={{ display: "flex", fontSize: 21, letterSpacing: 3, color: INK }}>
          {label}
        </div>
        <div style={{ display: "flex", fontSize: 12, letterSpacing: 3, color: LABEL }}>
          {sub}
        </div>
      </div>
      {children}
    </div>
  );
}
