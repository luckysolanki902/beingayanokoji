import type { Metadata } from "next";
import Link from "next/link";
import { AnimatedText, FadeIn } from "@/components/AnimatedText";
import {
  FIRST_CORRECT_AWARD,
  LECTURE_UNLOCK_COST,
  POINTS_PER_USD,
  classUnlockCost,
} from "@/lib/economy/prices";
import {
  SITE_NAME,
  absoluteUrl,
  breadcrumbNode,
  jsonLdGraph,
  publisherNode,
} from "@/lib/site";

const DESCRIPTION =
  "Why this school exists, who it is for, and what it refuses to be. Long-form lectures with no motivational filler, an examination at the end of each, and a currency you earn by passing them.";

export const metadata: Metadata = {
  title: "The school",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    title: `The school · ${SITE_NAME}`,
    description: DESCRIPTION,
    url: absoluteUrl("/about"),
  },
};

const jsonLd = jsonLdGraph(
  {
    "@type": "AboutPage",
    "@id": absoluteUrl("/about#page"),
    url: absoluteUrl("/about"),
    name: `The school · ${SITE_NAME}`,
    description: DESCRIPTION,
    isPartOf: { "@id": absoluteUrl("/#website") },
    publisher: { "@id": absoluteUrl("/#organization") },
    mainEntity: { "@id": absoluteUrl("/#organization") },
  },
  publisherNode(),
  breadcrumbNode([
    { name: "Home", path: "/" },
    { name: "The school", path: "/about" },
  ])
);

/** The rules, stated as rules. A prospectus, not a pitch. */
const RULES: { n: string; head: string; body: string }[] = [
  {
    n: "01",
    head: "You are treated as an adult.",
    body: "Nothing here is simplified because it might be difficult. Nothing is hedged into uselessness to avoid an argument. Where the evidence is thin you will be told it is thin, which is the only reason to trust the places where you are told it is strong.",
  },
  {
    n: "02",
    head: "Nothing is padded.",
    body: "A lecture runs four to six thousand words because the argument takes that long, not because length signals effort. If a point can be made in a paragraph it is made in a paragraph, and the lecture ends.",
  },
  {
    n: "03",
    head: "Every lecture ends in an examination.",
    body: "Three questions about the argument, not the text. Every wrong option is a position a reasonable person actually holds, usually the popular version of the idea the lecture spent four thousand words dismantling. Someone who skimmed will choose one of those. That is the entire mechanism.",
  },
  {
    n: "04",
    head: "You are not congratulated.",
    body: "Passing moves you along the curriculum and nothing else happens. Finishing a class promotes you and nothing else happens. There is no certificate at the end, because the point was never the end.",
  },
];

export default function AboutPage() {
  return (
    <div className="px-5 pb-24 pt-12 md:px-8 md:pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl">
        <FadeIn>
          <p className="font-hand mb-6 text-xs tracking-[0.24em] text-[color:var(--muted)]">
            職員室より
          </p>
        </FadeIn>

        <AnimatedText
          as="h1"
          text="Let me explain where you are."
          className="font-serif text-4xl font-medium leading-[1.05] tracking-tight md:text-6xl"
          stagger={0.03}
        />

        <FadeIn delay={0.4}>
          <p className="mt-8 border-l-2 border-[color:var(--accent)] pl-6 font-serif text-xl italic leading-relaxed text-[color:var(--muted)] md:text-2xl">
            You have read a hundred essays like these. You remember almost none
            of them, and you changed almost nothing. I am not going to pretend
            that is unusual.
          </p>
        </FadeIn>

        <div className="prose-lecture mt-16">
          <FadeIn>
            <p>
              It is not a character flaw, either. It is what happens when writing
              is consumed rather than worked through. You felt the click of
              insight, mistook it for the thing itself, and moved on. The
              feeling was real. It simply was not the change, and nothing in the
              way that essay was delivered to you was ever going to make it one.
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <p>
              So this site does not let you consume it. The lectures are
              ordered. Each assumes the one before. Each ends in an examination,
              and the examinations are the only thing that pays. That is slower
              than scrolling, considerably less pleasant, and the entire reason
              it is built this way.
            </p>
          </FadeIn>

          <FadeIn delay={0.15}>
            <h2>Who is admitted</h2>
            <p>
              Someone intelligent and underdeveloped, whose capacity exceeds
              their output and who knows it. Someone suspicious of motivational
              writing, who closes the tab the moment they smell it. If you are
              looking to be told you are already doing well, there are sites for
              that and this is not one, and I would rather you found out now
              than on lecture nine.
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h2>Why the name</h2>
            <p>
              Kiyotaka Ayanokoji embodies a specific synthesis: deep
              observation, restrained action, calculated patience, emotional
              opacity. He is the lens, not the subject. This is not fan writing,
              no knowledge of the source material is required, and nobody here
              is going to ask you what you thought of the anime.
            </p>
          </FadeIn>
        </div>

        {/* The rules, as a numbered sheet rather than more prose. */}
        <section className="mt-20">
          <FadeIn>
            <h2 className="font-hand text-xs tracking-[0.24em] text-[color:var(--muted)]">
              校則
            </h2>
          </FadeIn>
          <ol className="mt-6 divide-y divide-[color:var(--rule)] border-y border-[color:var(--rule)]">
            {RULES.map((rule, i) => (
              <FadeIn key={rule.n} delay={0.05 * i}>
                <li className="grid grid-cols-12 gap-x-5 py-7">
                  <span
                    className="col-span-2 font-mono text-[11px] tabular-nums text-[color:var(--faint)] md:col-span-1"
                    aria-hidden="true"
                  >
                    {rule.n}
                  </span>
                  <div className="col-span-10 md:col-span-11">
                    <h3 className="font-serif text-xl leading-snug tracking-tight md:text-2xl">
                      {rule.head}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">
                      {rule.body}
                    </p>
                  </div>
                </li>
              </FadeIn>
            ))}
          </ol>
        </section>

        {/* The economy, stated plainly, because a currency nobody explains is
            a trick and this one is not meant to be. */}
        <section className="mt-20">
          <FadeIn>
            <h2 className="font-hand text-xs tracking-[0.24em] text-[color:var(--muted)]">
              個人ポイント
            </h2>
            <h3 className="font-serif mt-4 text-2xl tracking-tight md:text-3xl">
              The school runs on personal points.
            </h3>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[color:var(--muted)]">
              The first lecture is open to anyone and so is its examination.
              Everything after it is bought. There are two ways to hold points
              and the school is genuinely indifferent between them, which is not
              the same as saying they are the same thing.
            </p>
          </FadeIn>

          <dl className="mt-7 grid gap-px border border-[color:var(--rule)] bg-[color:var(--rule)] sm:grid-cols-2">
            {[
              [
                `${FIRST_CORRECT_AWARD} points`,
                "For every examination question answered correctly at the first attempt. First attempt only, per question, permanently. A retake teaches you something and pays you nothing.",
              ],
              [
                `${LECTURE_UNLOCK_COST} points`,
                "Opens one lecture. Twenty first-pass answers, which is a real amount of reading and exactly the amount intended.",
              ],
              [
                `${classUnlockCost(10)} points`,
                "Promotion into a whole class, at half the per-lecture price. Lectures published into that class later open with it.",
              ],
              [
                `${POINTS_PER_USD} to the dollar`,
                "If you would rather buy time than spend it. Permitted, priced, and not considered equivalent by anyone here.",
              ],
            ].map(([term, note]) => (
              <div key={term} className="bg-[color:var(--bg)] px-5 py-6">
                <dt className="font-mono text-sm tabular-nums text-[color:var(--accent)]">
                  {term}
                </dt>
                <dd className="mt-2.5 text-sm leading-relaxed text-[color:var(--muted)]">
                  {note}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-20">
          <FadeIn>
            <h2 className="font-hand text-xs tracking-[0.24em] text-[color:var(--muted)]">
              対象外
            </h2>
            <h3 className="font-serif mt-4 text-2xl tracking-tight md:text-3xl">
              What this is not.
            </h3>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[color:var(--muted)]">
              Not a blog of motivational quotations. Not a productivity site
              selling a system. Not a stoicism-aesthetic brand. Not a
              hustle-culture pipeline. Not religious, political or ideological.
              It promises no transformation and it will not flatter you, and if
              either of those was what you came for you have my sincere
              recommendation to leave.
            </p>
          </FadeIn>
        </section>

        <FadeIn delay={0.2}>
          <div className="mt-20 border-t border-[color:var(--rule)] pt-10 text-center">
            <p className="font-serif text-xl italic leading-relaxed text-[color:var(--muted)] md:text-2xl">
              Calm in tone. Heavy in substance. Quiet in delivery. Compounding
              in effect.
            </p>
            <p className="mt-8 text-sm text-[color:var(--muted)]">
              You have been placed in Class D. Everyone is.
            </p>
            <Link
              href="/lectures"
              className="mt-7 inline-block border border-[color:var(--fg)] px-7 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)]"
            >
              See the roster
            </Link>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
