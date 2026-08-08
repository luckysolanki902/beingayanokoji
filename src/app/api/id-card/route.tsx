import { ImageResponse } from "next/og";
import { getCredentials } from "@/lib/id/credentials";
import { CardArt, CARD_W, CARD_H } from "@/lib/id/card-art";
import { owns } from "@/lib/economy/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The card as shown on the record page.
 *
 * Marked "not issued" unless the student has actually bought their card. The
 * mark is drawn into the image rather than laid over it in CSS, so saving this
 * preview gets you a marked image; there is no unmarked render reachable from
 * this route at all. The clean one is produced only by `/api/id-card/download`,
 * and only after the charge has gone through.
 */
export async function GET() {
  const me = await getCredentials();
  if (!me) return new Response("Not enrolled.", { status: 401 });

  const issued = await owns(me.id, "card.download");

  return new ImageResponse(<CardArt me={me} preview={!issued} />, {
    width: CARD_W,
    height: CARD_H,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="cote-student-card-${me.studentNumber}.png"`,
    },
  });
}
