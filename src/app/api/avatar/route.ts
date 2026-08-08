import { connectToDatabase, databaseConfigured } from "@/lib/db/connect";
import { User } from "@/lib/db/models";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The card photograph, on its own, for the header.
 *
 * A separate route rather than a field on the session because of how the photo
 * is stored: it is a ~25KB base64 string on the user document, marked
 * `select: false`, and putting it into the layout's props would mean shipping
 * those bytes inside the RSC payload of every single page render to draw a
 * 28-pixel circle. Here the browser fetches it once and caches it for the tab.
 *
 * 404 when there is no photo, so the header's `onError` can fall back to the
 * class letter without a placeholder image round trip.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !databaseConfigured()) {
    return new Response(null, { status: 404 });
  }

  try {
    await connectToDatabase();
    const row = await User.findById(user.id, { photo: 1 }).select("+photo").lean();
    const photo = row?.photo;
    if (!photo) return new Response(null, { status: 404 });

    const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(photo);
    if (!match) return new Response(null, { status: 404 });

    return new Response(Buffer.from(match[2], "base64"), {
      headers: {
        "Content-Type": match[1],
        // Someone's face, tied to a session. Cacheable in their own browser for
        // a few minutes so the header does not refetch on every navigation,
        // and by nothing in between.
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    console.error("[avatar] could not read the photo:", err);
    return new Response(null, { status: 404 });
  }
}
