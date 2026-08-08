import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { EnrolForm } from "@/components/progress/EnrolForm";
import { FIRST_CORRECT_AWARD, LECTURE_UNLOCK_COST, POINTS_PER_USD } from "@/lib/economy/prices";

export const metadata: Metadata = {
  title: "Enrolment",
  description:
    "Enrol to keep your place in the curriculum. Email and a password, no verification, nothing sent to you.",
  alternates: { canonical: "/enroll" },
  // A sign-in form has nothing to offer a search result, and indexing it puts
  // a login page in front of someone who searched for an essay.
  robots: { index: false, follow: true },
};

export default async function EnrolPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  const { next } = await searchParams;

  // Already enrolled. Sending them to a sign-in form they do not need is the
  // kind of small stupidity that makes a site feel unattended.
  if (user) redirect("/record");

  return (<div className="px-5 pb-28 pt-10 md:px-8 md:pt-14">
      <div className="mx-auto max-w-md text-center">
        <p className="font-hand text-xs tracking-[0.24em] text-[color:var(--muted)]">
          入学手続き
        </p>
        <h1 className="font-serif mt-4 text-3xl tracking-tight md:text-4xl">
          Take your seat.
        </h1>
        <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-[color:var(--muted)]">
          The first lecture is open to anyone. Everything after it is kept
          against a name, because a curriculum you can lose by clearing a
          browser is not a curriculum.
        </p>

        <EnrolForm next={next} />

        <div className="mt-14 border-t border-[color:var(--rule)] pt-8 text-left">
          <p className="font-hand text-xs tracking-[0.2em] text-[color:var(--muted)]">
            校則
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[color:var(--muted)]">
            <li>
              <span className="text-[color:var(--fg)]">
                {FIRST_CORRECT_AWARD} points
              </span>{" "}
              for every examination question answered correctly at the first
              attempt. First attempt only, per question, forever, a retake
              teaches you something and pays you nothing.
            </li>
            <li>
              <span className="text-[color:var(--fg)]">
                {LECTURE_UNLOCK_COST} points
              </span>{" "}
              opens a lecture. A whole class costs half that per lecture.
            </li>
            <li>
              <span className="text-[color:var(--fg)]">
                {POINTS_PER_USD} points
              </span>{" "}
              to the dollar, if you would rather buy your way forward than earn
              it. Both are permitted. The school does not consider them
              equivalent.
            </li>
          </ul>
          <p className="mt-6 text-xs leading-relaxed text-[color:var(--faint)]">
            Read the{" "}
            <Link
              href="/lectures"
              className="underline decoration-[color:var(--rule)] underline-offset-4 hover:text-[color:var(--muted)]"
            >
              full roster
            </Link>{" "}
            first if you would rather see what you are signing up to.
          </p>
        </div>
      </div>
    </div>);
}
