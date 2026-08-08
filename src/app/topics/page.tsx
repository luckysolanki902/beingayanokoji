import type { Metadata } from "next";
import Link from "next/link";
import { AnimatedText, FadeIn } from "@/components/AnimatedText";
import { getLecturesByPillar } from "@/lib/lectures";
import { PILLARS } from "@/lib/pillars";
import {
  SITE_NAME,
  absoluteUrl,
  breadcrumbNode,
  jsonLdGraph,
  publisherNode,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Topics",
  description:
    "Every subject the lectures cover, one page each: self-discipline, clear thinking, emotional regulation, strategy and leverage, influence, strength, sleep, nutrition, purpose, practical philosophy, and self-knowledge.",
  alternates: { canonical: "/topics" },
  openGraph: {
    type: "website",
    title: `Topics · ${SITE_NAME}`,
    description:
      "Self-discipline, clear thinking, emotional regulation, strategy, strength and purpose. The twelve subjects this curriculum works through, one page each.",
    url: absoluteUrl("/topics"),
  },
};

export default function TopicsPage() {
  const pillars = PILLARS.map((p) => ({
    ...p,
    count: getLecturesByPillar(p.num).filter((l) => l.published).length,
  }));

  const jsonLd = jsonLdGraph({
      "@type": "CollectionPage",
      "@id": absoluteUrl("/topics#page"),
      url: absoluteUrl("/topics"),
      name: `Topics · ${SITE_NAME}`,
      description: metadata.description as string,
      isPartOf: { "@id": absoluteUrl("/#website") },
      publisher: { "@id": absoluteUrl("/#organization") },
    },
    publisherNode(),
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Topics", path: "/topics" },
    ]),
    {
      "@type": "ItemList",
      name: "Subjects covered",
      numberOfItems: pillars.length,
      itemListElement: pillars.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(`/topics/${p.slug}`),
        name: p.headline,
      })),
    });

  return (<>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="px-5 pb-24 pt-12 md:px-8 md:pt-16">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <p className="font-hand mb-6 text-xs tracking-[0.24em] text-[color:var(--muted)]">
              科目一覧
            </p>
          </FadeIn>

          <AnimatedText
            as="h1"
            text="Twelve subjects. Pick your weakest."
            className="font-serif text-[clamp(2.5rem,12vw,3.5rem)] font-medium leading-[0.98] tracking-tight md:text-7xl"
          />

          <FadeIn delay={0.5}>
            <p className="mt-8 max-w-2xl text-[color:var(--color-muted)] leading-relaxed">
              These are not categories invented to tidy an archive. Each one is
              a claim about what actually limits a person, and every lecture on
              this site sits under one of them. Most people browse this page
              looking for the subject they are already good at. I would suggest
              the opposite, though I am aware that suggesting it rarely changes
              anyone&apos;s mind.
            </p>
          </FadeIn>

          <div className="mt-14 grid grid-cols-1 gap-px border border-[color:var(--color-rule)]/40 bg-[color:var(--color-rule)]/40 md:mt-20 md:grid-cols-2">
            {pillars.map((p, i) => (<FadeIn key={p.slug} delay={i * 0.04}>
                <Link
                  href={`/topics/${p.slug}`}
                  className="group flex h-full flex-col bg-[color:var(--color-bg)] p-6 transition-colors hover:bg-[color:var(--color-bg-elevated)] sm:p-8"
                >
                  <div className="flex items-baseline gap-4 mb-3">
                    <span className="font-serif text-3xl text-[color:var(--color-faint)] group-hover:text-[color:var(--color-accent)] transition-colors">
                      {p.num}
                    </span>
                    <h2 className="font-serif text-2xl tracking-tight group-hover:text-[color:var(--color-accent)] transition-colors">
                      {p.headline}
                    </h2>
                  </div>
                  <p className="text-sm text-[color:var(--color-muted)] leading-relaxed flex-1">
                    {p.summary}
                  </p>
                  <p className="mt-5 text-xs text-[color:var(--faint)]">
                    {p.count > 0
                      ? `${p.count} lecture${p.count === 1 ? "" : "s"} written →`
                      : "Still being written →"}
                  </p>
                </Link>
              </FadeIn>))}
          </div>
        </div>
      </div>
    </>);
}
