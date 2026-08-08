import { ImageResponse } from "next/og";
import { getCredentials } from "@/lib/id/credentials";
import { CardArt, CARD_W, CARD_H } from "@/lib/id/card-art";
import { placeOrder } from "@/lib/economy/orders";
import { CATALOGUE } from "@/lib/economy/catalogue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The issued card: no specimen mark, and 50 points.
 *
 * The charge happens here, on the server, before the image is rendered. That
 * placement is the entire anti-cheat story, and it is worth being precise about
 * why nothing on the client can get around it:
 *
 *  - The unmarked card is never rendered anywhere else. The preview route draws
 *    the mark into the pixels, so there is no clean copy sitting in the DOM, in
 *    a cache, or behind a CSS filter to strip.
 *  - The identity comes from the session cookie, not from a parameter, so the
 *    URL cannot be pointed at somebody else's card or edited to claim a balance.
 *  - `placeOrder` is the only path to the render, and it debits atomically. A
 *    reader who spams the endpoint with no points gets 402 every time.
 *
 * The entitlement is bought once. After that a student may take a fresh copy
 * whenever their record changes, free, because they paid for the card and not
 * for a single PNG.
 */
export async function GET() {
  const me = await getCredentials();
  if (!me) return new Response("Not enrolled.", { status: 401 });

  const order = await placeOrder(me.id, "card.download", {
    source: "record",
    once: true,
    meta: { studentNumber: me.studentNumber, classId: me.classId },
  });

  if (!order.ok) {
    return new Response(order.error ?? "Not enough points.", {
      status: 402,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // The balance printed on the card must be the balance *after* the card was
  // paid for. `getCredentials` is memoised per request and was read before the
  // charge, so it still holds the old figure; `placeOrder` reports the new one,
  // and the card is issued against that. Otherwise the very first card a
  // student is handed is wrong by exactly its own price.
  const issued = { ...me, points: order.balance };

  return new ImageResponse(<CardArt me={issued} preview={false} />, {
    width: CARD_W,
    height: CARD_H,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="cote-student-card-${me.studentNumber}.png"`,
      // So the client knows whether this download cost anything just now.
      "X-Card-Charged": String(order.cost),
      "X-Card-Price": String(CATALOGUE["card.download"].price),
    },
  });
}
