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
      "Self-discipline, clear thinking, emotional regulation, strategy, strength, purpose — the twelve subjects these lectures work through.",
    url: absoluteUrl("/topics"),
  },
};

export default function TopicsPage() {
  const pillars = PILLARS.map((p) => ({
    ...p,
    count: getLecturesByPillar(p.num).filter((l) => l.published).length,
  }));

  const jsonLd = jsonLdGraph(
    {
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
    }
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="pt-32 pb-24 px-6">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-muted)] mb-6">
              The twelve pillars
            </p>
          </FadeIn>

          <AnimatedText
            as="h1"
            text="Every subject, one page each."
            className="font-serif text-5xl md:text-7xl tracking-tight font-medium leading-none"
          />

          <FadeIn delay={0.5}>
            <p className="mt-8 max-w-2xl text-[color:var(--color-muted)] leading-relaxed">
              The lectures are not a stream of unrelated essays. Each one sits
              under a pillar, and each pillar is a claim about what actually
              moves a person forward. Start wherever your current bottleneck is.
            </p>
          </FadeIn>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-px bg-[color:var(--color-rule)]/40 border border-[color:var(--color-rule)]/40">
            {pillars.map((p, i) => (
              <FadeIn key={p.slug} delay={i * 0.04}>
                <Link
                  href={`/topics/${p.slug}`}
                  className="group flex h-full flex-col bg-[color:var(--color-bg)] p-8 hover:bg-[color:var(--color-bg-elevated)] transition-colors"
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
                  <p className="mt-5 text-xs text-[color:var(--color-faint)]">
                    {p.count} published lecture{p.count === 1 ? "" : "s"} →
                  </p>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
