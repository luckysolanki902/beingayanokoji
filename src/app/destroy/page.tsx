import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getStudentRecord } from "@/lib/progress/state";
import { connectToDatabase, databaseConfigured } from "@/lib/db/connect";
import { DestructionOrder as DestructionOrderModel } from "@/lib/db/models";
import { DestructionOrder } from "@/components/progress/DestructionOrder";
import {
  GRADUATION_COST,
  POINTS_PER_USD,
  SITE_DESTRUCTION_COST,
  usdForPoints,
} from "@/lib/economy/prices";

export const metadata: Metadata = {
  title: "The last item",
  description:
    "Two million personal points orders this site taken down. The price is real, the debit is real, and the decision that follows is made by a person.",
  alternates: { canonical: "/destroy" },
  // Not a page to be found by a stranger from a search result. It is the end of
  // the shelf, and it should be reached from inside the school.
  robots: { index: false, follow: false },
};

export default async function DestroyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/enroll?next=/destroy");

  const record = await getStudentRecord();

  // Orders this student has already placed. Someone who has spent two hundred
  // thousand dollars on a request is owed a visible record of having made it.
  let placed: { id: string; at: string; status: string; note: string | null }[] = [];
  if (databaseConfigured()) {
    try {
      await connectToDatabase();
      const rows = await DestructionOrderModel.find({ user: user.id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      placed = rows.map((row) => ({
        id: String(row._id),
        at: new Date((row as { createdAt?: Date }).createdAt ?? Date.now()).toISOString(),
        status: row.status,
        note: row.note ?? null,
      }));
    } catch (err) {
      console.error("[destroy] could not read existing orders:", err);
    }
  }

  const short = Math.max(0, SITE_DESTRUCTION_COST - record.points);

  return (
    <div className="px-5 pb-24 pt-10 md:px-8 md:pt-14">
      <div className="mx-auto max-w-3xl">
        <p className="font-hand text-xs tracking-[0.24em] text-[color:var(--muted)]">
          最終品目
        </p>
        <h1 className="font-serif mt-4 text-4xl leading-[1.05] tracking-tight md:text-5xl">
          The last item on the shelf.
        </h1>

        <p className="mt-8 max-w-2xl border-l-2 border-[color:var(--accent)] pl-6 font-serif text-lg italic leading-relaxed text-[color:var(--muted)] md:text-xl">
          Everything else here is sold to move you forward. This one is sold to
          end it. I am not going to talk you out of it, and I am not going to
          pretend the price is symbolic.
        </p>

        <div className="prose-lecture mt-12">
          <p>
            {SITE_DESTRUCTION_COST.toLocaleString()} personal points orders this
            site taken down. At {POINTS_PER_USD} points to the dollar that is $
            {usdForPoints(SITE_DESTRUCTION_COST).toLocaleString()}, which is
            roughly {Math.round(SITE_DESTRUCTION_COST / GRADUATION_COST)} times
            what it costs to graduate outright. It is priced that way
            deliberately. An item this size has to be expensive enough that
            nobody buys it by accident and real enough that nobody buys it as a
            joke.
          </p>
          <p>
            The points are genuinely debited and the order is genuinely
            recorded. What is not automated is the destruction itself. A single
            request should not be able to delete the thing it was made through,
            and anyone who has spent that much to make the request has earned a
            conversation rather than a cron job. Someone reads these. Someone
            replies.
          </p>
          <p>
            You could also spend the same points on the entire curriculum
            twenty times over. I mention it not as a discouragement but because
            you should know what you are choosing between, which is the only
            thing this school has ever really been teaching.
          </p>
        </div>

        {/* Where the reader actually stands against the price. */}
        <section className="mt-14 grid gap-px border border-[color:var(--rule)] bg-[color:var(--rule)] sm:grid-cols-3">
          <Figure label="The price" value={SITE_DESTRUCTION_COST.toLocaleString()} />
          <Figure label="You hold" value={record.points.toLocaleString()} accent />
          <Figure
            label={short > 0 ? "Short by" : "Surplus"}
            value={
              short > 0
                ? short.toLocaleString()
                : (record.points - SITE_DESTRUCTION_COST).toLocaleString()
            }
          />
        </section>

        <DestructionOrder balance={record.points} />

        {placed.length > 0 && (
          <section className="mt-14">
            <h2 className="font-hand text-xs tracking-[0.24em] text-[color:var(--muted)]">
              提出済み
            </h2>
            <ul className="mt-4 divide-y divide-[color:var(--rule)] border-y border-[color:var(--rule)]">
              {placed.map((order) => (
                <li key={order.id} className="py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <span className="text-sm text-[color:var(--fg)]">
                      Order placed
                    </span>
                    <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--accent)]">
                      {order.status}
                    </span>
                  </div>
                  {order.note && (
                    <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted)]">
                      {order.note}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-14 text-xs text-[color:var(--faint)]">
          <Link
            href="/record"
            className="underline decoration-[color:var(--rule)] underline-offset-4 transition-colors hover:text-[color:var(--muted)]"
          >
            Back to your record
          </Link>
        </p>
      </div>
    </div>
  );
}

function Figure({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[color:var(--bg)] px-5 py-6 text-center">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--faint)]">
        {label}
      </p>
      <p
        className={`font-serif mt-2 text-2xl tabular-nums tracking-tight md:text-3xl ${
          accent ? "text-[color:var(--accent)]" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
