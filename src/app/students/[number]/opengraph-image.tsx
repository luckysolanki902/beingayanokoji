import { ImageResponse } from "next/og";
import { getPublicProfile } from "@/lib/profile/public";

export const alt = "A student of the Advanced Nurturing High School";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * What a shared profile link unfurls into.
 *
 * Drawn from the same public projection as the page, so a photograph nobody
 * opted in to cannot appear here either. Worth stating because this is the one
 * surface that gets pasted into group chats: an OG image built from a different
 * query than the page is exactly how a private photo ends up on Twitter.
 */
export default async function ProfileOG({
  params,
}: {
  params: { number: string };
}) {
  const student = await getPublicProfile(params.number);

  if (!student) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f7f5ee",
            color: "#16181c",
            fontSize: 52,
            fontFamily: "serif",
          }}
        >
          No such student.
        </div>
      ),
      size
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#f7f5ee",
          color: "#16181c",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#8c1c2b",
            color: "#fff",
            padding: "20px 0",
            fontSize: 30,
            letterSpacing: 14,
          }}
        >
          学生証
        </div>

        <div style={{ display: "flex", flex: 1, alignItems: "center", padding: "0 70px" }}>
          <div
            style={{
              display: "flex",
              width: 240,
              height: 300,
              border: "4px solid #9b1c2e",
              alignItems: "center",
              justifyContent: "center",
              background: "#eceae4",
              overflow: "hidden",
            }}
          >
            {student.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={student.photo}
                width={240}
                height={300}
                style={{ objectFit: "cover", width: 240, height: 300 }}
                alt=""
              />
            ) : (
              <div style={{ display: "flex", fontSize: 96, color: "#b4b0a6" }}>
                {student.classId === "GRAD" ? "卒" : student.classId}
              </div>
            )}
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", paddingLeft: 52, flex: 1 }}
          >
            <div style={{ display: "flex", fontSize: 64, letterSpacing: -1 }}>
              {student.name}
            </div>
            <div
              style={{ display: "flex", fontSize: 30, marginTop: 14, color: "#6f6b64" }}
            >
              {student.className} · S01T{student.studentNumber}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 14,
                marginTop: 30,
                color: "#9b1c2e",
              }}
            >
              <div style={{ display: "flex", fontSize: 80 }}>
                {student.lifetimePoints.toLocaleString()}
              </div>
              <div style={{ display: "flex", fontSize: 26, letterSpacing: 4 }}>
                PRIVATE POINTS
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 26, marginTop: 18, color: "#6f6b64" }}>
              {student.passed} of {student.total} examinations passed
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "0 70px 34px 70px",
            fontSize: 22,
            letterSpacing: 4,
            color: "#9c968a",
          }}
        >
          <div style={{ display: "flex" }}>高度育成高等学校</div>
          <div style={{ display: "flex" }}>BEINGAYANOKOJI.DAILICLE.COM</div>
        </div>
      </div>
    ),
    size
  );
}
