import type { Metadata } from "next";
import Link from "next/link";
import { AnimatedText, FadeIn } from "@/components/AnimatedText";
import { BlinkingCursor } from "@/components/Cursor";
import { getAllLectures } from "@/lib/lectures";
import { PILLARS } from "@/lib/pillars";
import Image from "next/image";
import { EnrollmentPanel } from "@/components/progress/EnrollmentPanel";
import { getStudentRecord, type StudentRecord as StudentRecordProp } from "@/lib/progress/state";
import { SITE_IMAGES } from "@/lib/lecture-images";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
  jsonLdGraph,
  publisherNode,
} from "@/lib/site";

export const metadata: Metadata = {
  title:
    "Being Ayanokoji, Long-form lectures on self-discipline and clear thinking",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

/**
 * Questions a reader actually arrives with, answered plainly.
 *
 * These are here because they are worth answering, not because of the markup
 * but the markup follows, and a question-shaped search is the one place a small
 * site can still out-rank a large one.
 */
const FAQ: { q: string; a: string }[] = [
  {
    q: "What is this site?",
    a: "A collection of long-form lectures on self-discipline, clear thinking, emotional regulation, strength, strategy and purpose. Each one is a self-contained essay of four to six thousand words, researched properly and written for someone who has already read the popular version and found it thin.",
  },
  {
    q: "Is it free?",
    a: "The first lecture is, and so is its examination. After that the curriculum runs on personal points: five points for every examination question you answer correctly at the first attempt, and a hundred points to open a lecture. You can earn your way through the whole thing without paying anything, or buy points at ten to the dollar if you would rather not wait. There is no subscription and no newsletter.",
  },
  {
    q: "What are personal points?",
    a: "The school's currency, and the only thing it grades you on. They are earned by answering examination questions correctly the first time you meet them (a retake teaches you something and pays you nothing) and spent on opening lectures, on being promoted into a whole class at half price, or on anything else the school sells.",
  },
  {
    q: "How is this different from ordinary self-improvement writing?",
    a: "Most self-improvement writing optimises for the feeling of insight, which is why so little of it converts into change. These lectures make specific claims, say where the evidence is weak, and end with something you can act on this week. They do not motivate and they do not flatter.",
  },
  {
    q: "Where should I start?",
    a: "The lectures are arranged in a recommended reading order on the index page. If you would rather start from a problem than from the beginning, the topics pages group everything by subject, self-discipline, clear thinking, emotional regulation, sleep, strength, purpose.",
  },
  {
    q: "Why is it named after Ayanokoji?",
    a: "Kiyotaka Ayanokoji is the lens, not the subject. He embodies a particular synthesis (deep observation, restrained action, calculated patience, emotional opacity) that the site is organised around. It is not fan writing, and no knowledge of the source material is needed.",
  },
];

export default async function HomePage() {
  const record = await getStudentRecord();
  const all = getAllLectures();
  const lectures = all.slice(0, 3);

  const jsonLd = jsonLdGraph({
      "@type": "WebPage",
      "@id": absoluteUrl("/#webpage"),
      url: absoluteUrl("/"),
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      isPartOf: { "@id": absoluteUrl("/#website") },
      publisher: { "@id": absoluteUrl("/#organization") },
      about: PILLARS.map((p) => ({
        "@type": "Thing",
        name: p.headline,
        url: absoluteUrl(`/topics/${p.slug}`),
      })),
    },
    publisherNode(),
    {
      "@type": "FAQPage",
      "@id": absoluteUrl("/#faq"),
      mainEntity: FAQ.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    });

  return (<>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero record={record} />
      <Briefing />
      <Manifesto />
      <RecentLectures lectures={lectures} />
      <Pillars />
      <Questions />
    </>);
}

/**
 * The masthead in the site chrome carries the name, so the front page opens on
 * the argument instead of repeating it. The thesis is set as the lead, the
 * most characteristic thing this site has is its sentences, so those go first
 * rather than a hero image or a row of statistics.
 */
function Hero({ record }: { record: StudentRecordProp }) {
  return (<section className="px-5 pt-14 pb-20 md:px-8 md:pt-20 md:pb-24">
      <div className="mx-auto max-w-3xl text-center">
        <FadeIn>
          <p className="font-hand text-xs tracking-[0.24em] text-[color:var(--muted)]">
            入学案内 · Enrolment
          </p>
        </FadeIn>

        {/* The school's actual opening line, and the most persuasive sentence
            available: it puts the reader somewhere, with something to lose. */}
        <div className="mt-6">
          <AnimatedText
            as="h2"
            text="You have been placed"
            className="font-serif text-[2rem] font-medium leading-[1.1] tracking-tight md:text-[3.4rem]"
            stagger={0.05}
            yOffset={28}
          />
          <AnimatedText
            as="div"
            text="in Class D."
            className="font-serif text-[2rem] font-normal italic leading-[1.1] tracking-tight text-[color:var(--accent)] md:text-[3.4rem]"
            stagger={0.05}
            delay={0.34}
            yOffset={28}
          />
        </div>

        <FadeIn delay={1}>
          <p className="mx-auto mt-9 max-w-xl text-[15px] leading-[1.85] text-[color:var(--muted)] md:text-base">
            Fifty lectures on self-discipline, clear thinking, emotional
            regulation, strength, strategy and purpose, arranged into five
            classes. Everyone starts at the bottom. Each lecture ends in an
            examination, and what you score on it is what buys the next one.
            <BlinkingCursor className="ml-1 text-[color:var(--accent)]" />
          </p>
        </FadeIn>

        <EnrollmentPanel record={record} />

        <FadeIn delay={0.2}>
          <p className="mt-7 text-[11px] uppercase tracking-[0.2em] text-[color:var(--faint)]">
            First lecture free · No verification · No newsletter
          </p>
        </FadeIn>
      </div>
    </section>);
}

/**
 * The homeroom teacher's briefing.
 *
 * Written in her register (flat, unflattering, no encouragement) because the
 * ordinary version of this section ("unlock your potential") is the exact thing
 * the reader has already ignored a hundred times. The persuasion here is that
 * it declines to persuade.
 */
function Briefing() {
  const lines = [
    "Let me be direct, since nobody else will be. You have read a hundred essays like the ones on this site. You remember almost none of them, and you changed almost nothing.",
    "That is not a character flaw. It is what happens when writing is consumed instead of worked through. You felt the click of insight, mistook it for the thing itself, and moved on.",
    "So this site will not let you consume it. The lectures are ordered, each one assumes the last, and each ends in an examination you have to pass before the next opens. You will find that slower than scrolling.",
    "That is the entire point. Nobody is going to congratulate you for finishing, and nothing is unlocked at the end but the next piece of work. Begin, or don't.",
  ];

  return (<section className="border-t border-[color:var(--rule)] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-2xl">
        <FadeIn>
          <p className="font-hand mb-8 text-xs tracking-[0.24em] text-[color:var(--muted)]">
            担任より · From your homeroom teacher
          </p>
        </FadeIn>

        {/* Her at the board with the point totals written up, the briefing is
            in her voice, so the picture is of the moment she gives it. */}
        <FadeIn>
          <figure className="relative mb-12 aspect-[21/9] w-full overflow-hidden border border-[color:var(--rule)] bg-[color:var(--bg-elevated)]">
            <Image
              src={SITE_IMAGES.briefing.src}
              alt={SITE_IMAGES.briefing.alt}
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              className="object-cover"
            />
          </figure>
        </FadeIn>

        {lines.map((line, i) => (<FadeIn key={i} delay={i * 0.1}>
            <p
              className={`font-serif leading-[1.7] tracking-tight ${
                i === 0
                  ? "text-xl md:text-2xl"
                  : "mt-6 text-base text-[color:var(--muted)] md:text-lg"
              }`}
            >
              {line}
            </p>
          </FadeIn>))}

        <FadeIn delay={0.5}>
          <p className="mt-10 border-l-2 border-[color:var(--accent)] pl-5 text-sm text-[color:var(--faint)]">
            The lectures are free and always will be. The examinations exist to
            slow you down, not to sell you anything.
          </p>
        </FadeIn>
      </div>
    </section>);
}

function Manifesto() {
  const lines = [
    "Observation over reaction.",
    "Analysis over emotion.",
    "Leverage over force.",
    "Silence over noise.",
    "Results over recognition.",
  ];

  return (<section className="border-t border-[color:var(--rule)] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-3xl">
        <FadeIn>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-muted)] mb-12">
            The five rules of this classroom
          </p>
        </FadeIn>
        <ul className="space-y-6">
          {lines.map((line, i) => (<FadeIn key={line} delay={i * 0.12}>
              <li className="font-serif text-3xl md:text-5xl leading-tight tracking-tight">
                <span className="text-[color:var(--color-faint)] text-base align-middle mr-6 font-sans">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {line}
              </li>
            </FadeIn>))}
        </ul>
      </div>
    </section>);
}

function RecentLectures({ lectures }: { lectures: ReturnType<typeof getAllLectures> }) {
  if (lectures.length === 0) return null;
  return (<section className="border-t border-[color:var(--rule)] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-3xl">
        <FadeIn>
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-muted)] mb-3">
                Begin here
              </p>
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight font-medium">
                Read them in order.
              </h2>
            </div>
            <Link
              href="/lectures"
              className="hidden md:inline text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] transition-colors"
            >
              All lectures →
            </Link>
          </div>
        </FadeIn>

        <div className="divide-y divide-[color:var(--color-rule)]/40 border-y border-[color:var(--color-rule)]/40">
          {lectures.map((lec, i) => (<FadeIn key={lec.slug} delay={i * 0.08}>
              <Link
                href={`/lectures/${lec.slug}`}
                className="group block py-8 hover:bg-[color:var(--color-bg-elevated)]/30 transition-colors"
              >
                <div className="grid grid-cols-12 gap-6 items-baseline px-2">
                  <div className="col-span-12 md:col-span-9">
                    <h3 className="font-serif text-2xl md:text-3xl tracking-tight leading-snug group-hover:text-[color:var(--color-accent)] transition-colors">
                      {lec.title}
                    </h3>
                    <p className="mt-2 text-sm text-[color:var(--color-muted)] line-clamp-2">
                      {lec.keyClaim || lec.excerpt}
                    </p>
                  </div>
                  <div className="hidden md:flex col-span-3 justify-end text-xs text-[color:var(--color-muted)]">
                    {lec.readingTimeMin} min · Pillar {lec.pillar}
                  </div>
                </div>
              </Link>
            </FadeIn>))}
        </div>
      </div>
    </section>);
}

function Pillars() {
  const pillars = PILLARS;

  return (<section className="border-t border-[color:var(--rule)] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-4xl">
        <FadeIn>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-muted)] mb-3">
            The twelve pillars
          </p>
          <h2 className="font-serif text-4xl md:text-5xl tracking-tight font-medium mb-6 max-w-2xl">
            Every lecture lives under one of these.
          </h2>
          <p className="mb-16 max-w-2xl text-[color:var(--color-muted)] leading-relaxed">
            Each pillar has its own page collecting every lecture that touches
            it, start from whichever one names your current bottleneck.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[color:var(--color-rule)]/40">
          {pillars.map((p, i) => (<FadeIn key={p.num} delay={i * 0.03}>
              <Link
                href={`/topics/${p.slug}`}
                className="flex flex-col bg-[color:var(--color-bg)] p-8 h-full min-h-[160px] group hover:bg-[color:var(--color-bg-elevated)] transition-colors"
              >
                <div className="flex items-baseline gap-4 mb-3">
                  <span className="font-serif text-3xl text-[color:var(--color-faint)] group-hover:text-[color:var(--color-accent)] transition-colors">
                    {p.num}
                  </span>
                  <h3 className="text-sm uppercase tracking-wider group-hover:text-[color:var(--color-accent)] transition-colors">
                    {p.headline}
                  </h3>
                </div>
                <p className="font-serif italic text-lg text-[color:var(--color-muted)] leading-snug">
                  {p.note}
                </p>
              </Link>
            </FadeIn>))}
        </div>
      </div>
    </section>);
}

/**
 * The FAQ rendered as real content. Search engines will not surface a
 * FAQPage block whose answers are not visible on the page, and a reader
 * arriving cold deserves the answers anyway.
 */
function Questions() {
  return (<section className="border-t border-[color:var(--rule)] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-3xl">
        <FadeIn>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-muted)] mb-3">
            Before you start
          </p>
          <h2 className="font-serif text-4xl md:text-5xl tracking-tight font-medium mb-16 max-w-2xl">
            The reasonable questions.
          </h2>
        </FadeIn>

        <dl className="divide-y divide-[color:var(--color-rule)]/40 border-y border-[color:var(--color-rule)]/40">
          {FAQ.map(({ q, a }, i) => (<FadeIn key={q} delay={i * 0.05}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 py-8">
                <dt className="md:col-span-5 font-serif text-xl md:text-2xl tracking-tight leading-snug">
                  {q}
                </dt>
                <dd className="md:col-span-7 text-[color:var(--color-muted)] leading-relaxed">
                  {a}
                </dd>
              </div>
            </FadeIn>))}
        </dl>
      </div>
    </section>);
}
