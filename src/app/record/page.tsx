import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getStudentRecord } from "@/lib/progress/state";
import { connectToDatabase, databaseConfigured } from "@/lib/db/connect";
import { PointEntry } from "@/lib/db/models";
import { ClassUnlockButton } from "@/components/progress/ClassUnlockButton";
import { DestructionOrder } from "@/components/progress/DestructionOrder";
import { SignOutButton } from "@/components/progress/SignOutButton";
import { SupportBlock } from "@/components/Support";
import {
  FIRST_CORRECT_AWARD,
  LECTURE_UNLOCK_COST,
  POINTS_PER_USD,
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

  const current = record.classes.find((c) => c.id === record.currentClass);

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
          <SupportBlock source="reader" />
        </section>

        <DestructionOrder balance={record.points} />
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
