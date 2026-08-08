import type { Metadata } from "next";
import Link from "next/link";
import { AnimatedText, FadeIn } from "@/components/AnimatedText";
import { BlinkingCursor } from "@/components/Cursor";
import { getAllLectures } from "@/lib/lectures";
import { PILLARS } from "@/lib/pillars";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
  jsonLdGraph,
  publisherNode,
} from "@/lib/site";

export const metadata: Metadata = {
  title:
    "Being Ayanokoji — Long-form lectures on self-discipline and clear thinking",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

/**
 * Questions a reader actually arrives with, answered plainly.
 *
 * These are here because they are worth answering, not because of the markup —
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
    a: "Entirely. There is no paywall, no account, no newsletter and no upsell. Readers can contribute through PayPal if a lecture was worth something to them, and nothing changes if they don't.",
  },
  {
    q: "How is this different from ordinary self-improvement writing?",
    a: "Most self-improvement writing optimises for the feeling of insight, which is why so little of it converts into change. These lectures make specific claims, say where the evidence is weak, and end with something you can act on this week. They do not motivate and they do not flatter.",
  },
  {
    q: "Where should I start?",
    a: "The lectures are arranged in a recommended reading order on the index page. If you would rather start from a problem than from the beginning, the topics pages group everything by subject — self-discipline, clear thinking, emotional regulation, sleep, strength, purpose.",
  },
  {
    q: "Why is it named after Ayanokoji?",
    a: "Kiyotaka Ayanokoji is the lens, not the subject. He embodies a particular synthesis — deep observation, restrained action, calculated patience, emotional opacity — that the site is organised around. It is not fan writing, and no knowledge of the source material is needed.",
  },
];

export default function HomePage() {
  const lectures = getAllLectures().slice(0, 3);

  const jsonLd = jsonLdGraph(
    {
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
    }
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <Manifesto />
      <RecentLectures lectures={lectures} />
      <Pillars />
      <Questions />
    </>
  );
}

/**
 * The masthead in the site chrome carries the name, so the front page opens on
 * the argument instead of repeating it. The thesis is set as the lead — the
 * most characteristic thing this site has is its sentences, so those go first
 * rather than a hero image or a row of statistics.
 */
function Hero() {
  return (
    <section className="px-5 pt-14 pb-20 md:px-8 md:pt-20 md:pb-28">
      <div className="mx-auto max-w-3xl text-center">
        {/* Set as three deliberate lines rather than one wrapping block. The
            tagline is three beats, and letting the browser choose the breaks
            put them in the middle of a sentence. */}
        <AnimatedText
          as="h2"
          text="Calm in tone."
          className="font-serif text-[2rem] font-medium leading-[1.1] tracking-tight md:text-[3.4rem]"
          stagger={0.05}
          yOffset={28}
        />
        <AnimatedText
          as="div"
          text="Heavy in substance."
          className="font-serif text-[2rem] font-medium leading-[1.1] tracking-tight md:text-[3.4rem]"
          stagger={0.05}
          delay={0.3}
          yOffset={28}
        />
        <AnimatedText
          as="div"
          text="Compounding in effect."
          className="font-serif text-[2rem] font-normal italic leading-[1.1] tracking-tight text-[color:var(--accent)] md:text-[3.4rem]"
          stagger={0.05}
          delay={0.62}
          yOffset={28}
        />

        <FadeIn delay={1.35}>
          <p className="mx-auto mt-9 max-w-xl text-[15px] leading-[1.85] text-[color:var(--muted)] md:text-base">
            Deeply-researched lectures on self-discipline, clear thinking,
            emotional regulation, strength, strategy, and purpose. Written for
            the reader who has consumed a hundred self-improvement essays and
            converted almost none of them into change.
            <BlinkingCursor className="ml-1 text-[color:var(--accent)]" />
          </p>
        </FadeIn>

        <FadeIn delay={1.55}>
          <p className="font-hand mt-6 text-sm text-[color:var(--faint)]">
            Free to read. No account, no newsletter.
          </p>
        </FadeIn>

        <FadeIn delay={1.7}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
            <Link
              href="/lectures"
              className="group inline-flex items-center gap-3 border border-[color:var(--fg)] px-7 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors duration-300 hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)]"
            >
              <span>Start reading</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/about"
              className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)] transition-colors hover:text-[color:var(--fg)]"
            >
              The philosophy
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function Manifesto() {
  const lines = [
    "Observation over reaction.",
    "Analysis over emotion.",
    "Leverage over force.",
    "Silence over noise.",
    "Results over recognition.",
  ];

  return (
    <section className="border-t border-[color:var(--rule)] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-3xl">
        <FadeIn>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-muted)] mb-12">
            The five lines
          </p>
        </FadeIn>
        <ul className="space-y-6">
          {lines.map((line, i) => (
            <FadeIn key={line} delay={i * 0.12}>
              <li className="font-serif text-3xl md:text-5xl leading-tight tracking-tight">
                <span className="text-[color:var(--color-faint)] text-base align-middle mr-6 font-sans">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {line}
              </li>
            </FadeIn>
          ))}
        </ul>
      </div>
    </section>
  );
}

function RecentLectures({ lectures }: { lectures: ReturnType<typeof getAllLectures> }) {
  if (lectures.length === 0) return null;
  return (
    <section className="border-t border-[color:var(--rule)] px-5 py-20 md:px-8 md:py-28">
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
          {lectures.map((lec, i) => (
            <FadeIn key={lec.slug} delay={i * 0.08}>
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
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pillars() {
  const pillars = PILLARS;

  return (
    <section className="border-t border-[color:var(--rule)] px-5 py-20 md:px-8 md:py-28">
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
            it — start from whichever one names your current bottleneck.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[color:var(--color-rule)]/40">
          {pillars.map((p, i) => (
            <FadeIn key={p.num} delay={i * 0.03}>
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
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * The FAQ rendered as real content. Search engines will not surface a
 * FAQPage block whose answers are not visible on the page, and a reader
 * arriving cold deserves the answers anyway.
 */
function Questions() {
  return (
    <section className="border-t border-[color:var(--rule)] px-5 py-20 md:px-8 md:py-28">
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
          {FAQ.map(({ q, a }, i) => (
            <FadeIn key={q} delay={i * 0.05}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 py-8">
                <dt className="md:col-span-5 font-serif text-xl md:text-2xl tracking-tight leading-snug">
                  {q}
                </dt>
                <dd className="md:col-span-7 text-[color:var(--color-muted)] leading-relaxed">
                  {a}
                </dd>
              </div>
            </FadeIn>
          ))}
        </dl>
      </div>
    </section>
  );
}
