import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getStudentRecord } from "@/lib/progress/state";
import { connectToDatabase, databaseConfigured } from "@/lib/db/connect";
import { Order, PointEntry } from "@/lib/db/models";
import { ClassUnlockButton } from "@/components/progress/ClassUnlockButton";
import { AdvancementPanel, type AdvancementOption } from "@/components/progress/AdvancementPanel";
import { IdCard } from "@/components/progress/IdCard";
import { CertificatePanel } from "@/components/progress/CertificatePanel";
import { hasGraduated } from "@/lib/id/credentials";
import { owns, timesBought } from "@/lib/economy/orders";
import { CATALOGUE } from "@/lib/economy/catalogue";
import { SignOutButton } from "@/components/progress/SignOutButton";
import { PointsShop } from "@/components/points/PointsShop";
import {
  FIRST_CORRECT_AWARD,
  LECTURE_UNLOCK_COST,
  POINTS_PER_USD,
  SITE_DESTRUCTION_COST,
  CLASS_UNLOCK_COST,
} from "@/lib/economy/prices";

export const metadata: Metadata = {
  title: "Your record",
  description: "Your standing, your personal points, and every point you have moved.",
  alternates: { canonical: "/record" },
  robots: { index: false, follow: false },
};

/** Newest first, and capped, nobody audits a ledger past its first screen. */
const LEDGER_LIMIT = 40;

export default async function RecordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/enroll?next=/record");

  const record = await getStudentRecord();

  // Both decided on the server: whether the card has been paid for, and what
  // the next name change costs. The component only renders these; it cannot
  // grant itself either.
  const [cardIssued, nameChanges] = await Promise.all([
    owns(user.id, "card.download"),
    timesBought(user.id, "name.change"),
  ]);
  const nameCost =
    nameChanges < CATALOGUE["name.change"].freeUses ? 0 : CATALOGUE["name.change"].price;

  let ledger: {
    id: string;
    delta: number;
    balanceAfter: number;
    description: string;
    at: string;
  }[] = [];

  if (databaseConfigured()) {
    try {
      await connectToDatabase();
      const rows = await PointEntry.find({ user: user.id })
        .sort({ createdAt: -1 })
        .limit(LEDGER_LIMIT)
        .lean();
      ledger = rows.map((row) => ({
        id: String(row._id),
        delta: row.delta,
        balanceAfter: row.balanceAfter,
        description: row.description,
        at: new Date((row as { createdAt?: Date }).createdAt ?? Date.now()).toISOString(),
      }));
    } catch (err) {
      console.error("[record] could not read the ledger:", err);
    }
  }

  // The receipts: what was bought rather than what the balance did.
  let receipts: {
    id: string; title: string; cost: number; wasFree: boolean;
    repeatIndex: number; source: string | null; at: string;
  }[] = [];
  if (databaseConfigured()) {
    try {
      const rows = await Order.find({ user: user.id }).sort({ createdAt: -1 }).limit(20).lean();
      receipts = rows.map((row) => ({
        id: String(row._id),
        title: row.title,
        cost: row.cost,
        wasFree: row.wasFree,
        repeatIndex: row.repeatIndex,
        source: row.source ?? null,
        at: new Date((row as { createdAt?: Date }).createdAt ?? Date.now()).toISOString().slice(0, 10),
      }));
    } catch (err) {
      console.error("[record] could not read receipts:", err);
    }
  }
  const totalSpentOnOrders = receipts.reduce((n, r) => n + r.cost, 0);

  const current = record.classes.find((c) => c.id === record.currentClass);

  // The promotion ladder, priced exactly as `promoteTo` charges: 500 for each
  // class the purchase would clear that the student does not already own. Only
  // classes above the one they are in are offered, since promotion is upward.
  const currentIndex = record.classes.findIndex((c) => c.id === record.currentClass);
  const advancement: AdvancementOption[] = record.classes
    .map((cls, i) => {
      const below = record.classes.slice(0, i);
      const unowned = below.filter((c) => !c.fullyUnlocked);
      return {
        classId: cls.id,
        label: `Promotion to ${cls.label}`,
        detail:
          unowned.length === 0
            ? "Nothing left to clear"
            : `Opens ${unowned.map((c) => c.label).join(", ")}`,
        lockedCount: unowned.reduce((n, c) => n + (c.size - c.unlockedCount), 0),
        cost: unowned.length * CLASS_UNLOCK_COST,
      };
    })
    // Promotion into the class you are already in, or one below it, is not a
    // promotion. Index 0 is Class D, which nobody is promoted into.
    .filter((option, i) => i > 0 && i > currentIndex);

  const unownedAll = record.classes.filter((c) => !c.fullyUnlocked);
  advancement.push({
    classId: null,
    label: "Graduate outright",
    detail: `Opens every class in the school`,
    lockedCount: record.totalCount - record.unlockedCount,
    cost: unownedAll.length * CLASS_UNLOCK_COST,
  });

  return (<div className="px-5 pb-24 pt-10 md:px-8 md:pt-14">
      <div className="mx-auto max-w-3xl">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[color:var(--rule)] pb-6">
          <div>
            <p className="font-hand text-xs tracking-[0.24em] text-[color:var(--muted)]">
              個人成績表
            </p>
            <h1 className="font-serif mt-3 text-3xl tracking-tight md:text-4xl">
              {user.name}
            </h1>
            <p className="mt-2 text-xs text-[color:var(--faint)]">{user.email}</p>
          </div>
          <SignOutButton />
        </header>

        <IdCard
          name={user.name}
          issued={cardIssued}
          price={CATALOGUE["card.download"].price}
          nameChangePrice={nameCost}
          balance={record.points}
        />

        {/* Standing: the balance, the class, and the two counts. Nothing here
            is a progress bar, the numbers are the point, and rounding them
            into a percentage would hide the only thing worth knowing. */}
        <section className="mt-10 grid gap-px border border-[color:var(--rule)] bg-[color:var(--rule)] sm:grid-cols-4">
          <Figure label="Personal points" value={record.points.toLocaleString()} accent />
          <Figure
            label="Class"
            value={record.currentClass === "GRAD" ? "卒" : record.currentClass}
          />
          <Figure label="Open" value={`${record.unlockedCount} / ${record.totalCount}`} />
          <Figure label="Passed" value={`${record.passedCount} / ${record.totalCount}`} />
        </section>

        <p className="mt-5 text-xs leading-relaxed text-[color:var(--faint)]">
          Earned {user.pointsEarned.toLocaleString()} · bought{" "}
          {user.pointsPurchased.toLocaleString()} · spent{" "}
          {user.pointsSpent.toLocaleString()}. {FIRST_CORRECT_AWARD} points per
          examination question answered right at the first attempt, {" "}
          {LECTURE_UNLOCK_COST} to open a lecture, {POINTS_PER_USD} to the dollar
          if you buy them.
        </p>

        {record.resume && (<Link
            href={`/lectures/${record.resume.slug}`}
            className="mt-8 inline-block border border-[color:var(--fg)] px-7 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)]"
          >
            Continue → {record.resume.title}
          </Link>)}

        {/* The class the student is actually in, with the block purchase for it. */}
        {current && (<section className="mt-14">
            <h2 className="font-serif text-2xl tracking-tight">{current.label}</h2>
            <p className="font-jp mt-1 text-[11px] tracking-[0.2em] text-[color:var(--faint)]">
              {current.japanese}
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[color:var(--muted)]">
              {current.brief}
            </p>
            <p className="mt-4 text-xs text-[color:var(--faint)]">
              {current.unlockedCount} of {current.size} open ·{" "}
              {current.passedCount} passed
            </p>

            {current.publishedCount > 0 && (<ClassUnlockButton
                classId={current.id}
                label={current.label}
                cost={current.cost}
                size={current.size}
                publishedCount={current.publishedCount}
                remaining={current.size - current.unlockedCount}
                balance={record.points}
              />)}
          </section>)}

        <AdvancementPanel options={advancement} balance={record.points} />

        {/* Every class, so the shape of what is being bought is visible. */}
        <section className="mt-14">
          <h2 className="font-hand text-xs tracking-[0.2em] text-[color:var(--muted)]">
            全クラス
          </h2>
          <ul className="mt-4 divide-y divide-[color:var(--rule)] border-y border-[color:var(--rule)]">
            {record.classes.map((cls) => (<li
                key={cls.id}
                className="flex flex-wrap items-baseline justify-between gap-3 py-4"
              >
                <span className="flex items-baseline gap-3">
                  <span className="font-serif text-lg">{cls.label}</span>
                  <span className="text-xs text-[color:var(--faint)]">
                    {cls.publishedCount > 0
                      ? `${cls.publishedCount} of ${cls.size} written`
                      : "Being written"}
                  </span>
                </span>
                <span className="text-xs text-[color:var(--muted)]">
                  {cls.fullyUnlocked ? (<span className="text-[color:var(--accent)]">All open</span>) : (<>
                      {cls.unlockedCount}/{cls.size} open · {cls.cost} points for
                      the class
                    </>)}
                </span>
              </li>))}
          </ul>
        </section>

        {/* Receipts. The ledger says a number moved; this says what for. */}
        {receipts.length > 0 && (
          <section className="mt-14">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-hand text-xs tracking-[0.24em] text-[color:var(--muted)]">
                購入履歴
              </h2>
              <span className="text-xs text-[color:var(--faint)]">
                {receipts.length} order{receipts.length === 1 ? "" : "s"} ·{" "}
                {totalSpentOnOrders.toLocaleString()} points
              </span>
            </div>
            <ul className="mt-4 divide-y divide-[color:var(--rule)] border-y border-[color:var(--rule)]">
              {receipts.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 text-sm"
                >
                  <span className="min-w-0 flex-1 text-[color:var(--muted)]">
                    {r.title}
                    {r.repeatIndex > 1 && (
                      <span className="ml-2 text-xs text-[color:var(--faint)]">
                        repeat #{r.repeatIndex}
                      </span>
                    )}
                    {r.source && (
                      <span className="ml-2 text-xs text-[color:var(--faint)]">
                        via {r.source}
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-[color:var(--faint)]">
                    {r.at}
                  </span>
                  <span
                    className={`w-20 text-right font-mono text-xs tabular-nums ${
                      r.wasFree
                        ? "text-[color:var(--faint)]"
                        : "text-[color:var(--muted)]"
                    }`}
                  >
                    {r.wasFree ? "free" : `-${r.cost.toLocaleString()}`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* The ledger. Every point in and out, with the balance it left. */}
        <section className="mt-14">
          <h2 className="font-hand text-xs tracking-[0.2em] text-[color:var(--muted)]">
            出納帳
          </h2>
          {ledger.length === 0 ? (<p className="mt-4 text-sm text-[color:var(--muted)]">
              Nothing has moved yet. Pass an examination and the first line
              appears here.
            </p>) : (<ul className="mt-4 divide-y divide-[color:var(--rule)] border-y border-[color:var(--rule)] font-mono text-xs">
              {ledger.map((entry) => (<li
                  key={entry.id}
                  className="flex items-baseline justify-between gap-4 py-3"
                >
                  <span className="min-w-0 flex-1 truncate font-sans text-[color:var(--muted)]">
                    {entry.description}
                  </span>
                  <span
                    className={`tabular-nums ${
                      entry.delta > 0
                        ? "text-[color:var(--accent)]"
                        : "text-[color:var(--muted)]"
                    }`}
                  >
                    {entry.delta > 0 ? "+" : ""}
                    {entry.delta.toLocaleString()}
                  </span>
                  <span className="w-16 text-right tabular-nums text-[color:var(--faint)]">
                    {entry.balanceAfter.toLocaleString()}
                  </span>
                </li>))}
            </ul>)}
        </section>

        {/* Buying points is the same PayPal flow as before; what is new is that
            a signed-in reader's payment now lands in this balance. */}
        <section className="mt-16">
          <PointsShop source="reader" />
        </section>

        <CertificatePanel
          graduated={hasGraduated(record.passedCount, record.totalCount)}
          passed={record.passedCount}
          total={record.totalCount}
        />

        <section className="mt-16 border border-[color:var(--rule)] p-7">
          <p className="font-hand text-xs tracking-[0.24em] text-[color:var(--muted)]">
            最終品目
          </p>
          <h2 className="font-serif mt-3 text-2xl tracking-tight">
            There is one more thing for sale.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-[color:var(--muted)]">
            It costs {SITE_DESTRUCTION_COST.toLocaleString()} points and it ends
            this site rather than advancing you through it. The price is not a
            joke and neither is the item.
          </p>
          <Link
            href="/destroy"
            className="mt-6 inline-block border border-[color:var(--fg)] px-6 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)]"
          >
            Read the terms
          </Link>
        </section>
      </div>
    </div>);
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
  return (<div className="bg-[color:var(--bg)] px-5 py-6 text-center">
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
    </div>);
}
