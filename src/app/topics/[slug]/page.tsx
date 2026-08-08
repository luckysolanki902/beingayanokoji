import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnimatedText, FadeIn } from "@/components/AnimatedText";
import { getLecturesByPillar } from "@/lib/lectures";
import { PILLARS, getPillarBySlug } from "@/lib/pillars";
import {
  SITE_NAME,
  absoluteUrl,
  breadcrumbNode,
  jsonLdGraph,
  publisherNode,
} from "@/lib/site";

/**
 * A page per pillar.
 *
 * The lectures already existed; what did not was a page that says "this site
 * covers self-discipline" in a way anything could find. A search for
 * "self-discipline" does not match a page called "Pillar III", and it will
 * never match a fifty-item index. These pages are the layer between the two:
 * one URL per subject, with the argument stated in prose and every relevant
 * lecture linked from it.
 */

export function generateStaticParams() {
  return PILLARS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pillar = getPillarBySlug(slug);
  if (!pillar) return { title: "Not found" };

  return {
    title: pillar.headline,
    description: pillar.summary,
    alternates: { canonical: `/topics/${pillar.slug}` },
    openGraph: {
      type: "website",
      title: `${pillar.headline} · ${SITE_NAME}`,
      description: pillar.summary,
      url: absoluteUrl(`/topics/${pillar.slug}`),
    },
    twitter: {
      card: "summary_large_image",
      title: `${pillar.headline} · ${SITE_NAME}`,
      description: pillar.summary,
    },
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pillar = getPillarBySlug(slug);
  if (!pillar) notFound();

  const lectures = getLecturesByPillar(pillar.num);
  const published = lectures.filter((l) => l.published);
  const upcoming = lectures.filter((l) => !l.published);
  const related = PILLARS.filter((p) => p.num !== pillar.num).slice(0, 6);

  const jsonLd = jsonLdGraph(
    {
      "@type": "CollectionPage",
      "@id": absoluteUrl(`/topics/${pillar.slug}#page`),
      url: absoluteUrl(`/topics/${pillar.slug}`),
      name: `${pillar.headline} · ${SITE_NAME}`,
      description: pillar.summary,
      about: { "@type": "Thing", name: pillar.headline },
      isPartOf: { "@id": absoluteUrl("/#website") },
      publisher: { "@id": absoluteUrl("/#organization") },
    },
    publisherNode(),
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Topics", path: "/topics" },
      { name: pillar.headline, path: `/topics/${pillar.slug}` },
    ]),
    {
      "@type": "ItemList",
      name: `Lectures on ${pillar.headline.toLowerCase()}`,
      numberOfItems: published.length,
      itemListElement: published.map((lec, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(`/lectures/${lec.slug}`),
        name: lec.title,
      })),
    }
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="px-5 pb-24 pt-12 md:px-8 md:pt-16">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted)] sm:text-xs sm:tracking-[0.25em]">
              <Link href="/topics" className="hover:text-[color:var(--color-fg)] transition-colors">
                Topics
              </Link>
              <span className="text-[color:var(--color-faint)]">/</span>
              <span>Pillar {pillar.num}</span>
            </div>
          </FadeIn>

          <AnimatedText
            as="h1"
            text={pillar.headline}
            className="font-serif text-[clamp(2.5rem,12vw,3.5rem)] font-medium leading-none tracking-tight md:text-7xl"
          />

          <FadeIn delay={0.35}>
            <p className="mt-8 max-w-2xl font-serif italic text-xl md:text-2xl leading-relaxed text-[color:var(--color-accent)]">
              {pillar.note}
            </p>
          </FadeIn>

          <FadeIn delay={0.45}>
            <p className="mt-8 max-w-2xl text-[color:var(--color-muted)] leading-relaxed">
              {pillar.intro}
            </p>
          </FadeIn>

          {published.length > 0 && (
            <section className="mt-20">
              <h2 className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-muted)] mb-8">
                {published.length} lecture{published.length === 1 ? "" : "s"} on{" "}
                {pillar.headline.toLowerCase()}
              </h2>
              <div className="divide-y divide-[color:var(--color-rule)]/40 border-y border-[color:var(--color-rule)]/40">
                {published.map((lec, i) => (
                  <FadeIn key={lec.slug} delay={i * 0.05}>
                    <Link
                      href={`/lectures/${lec.slug}`}
                      className="group block py-8 px-2 hover:bg-[color:var(--color-bg-elevated)]/30 transition-colors"
                    >
                      <div className="grid grid-cols-12 gap-4 items-baseline">
                        <div className="col-span-12 md:col-span-9">
                          <h3 className="font-serif text-2xl md:text-3xl tracking-tight leading-snug group-hover:text-[color:var(--color-accent)] transition-colors">
                            {lec.title}
                          </h3>
                          <p className="mt-2 text-sm text-[color:var(--color-muted)] leading-relaxed">
                            {lec.keyClaim || lec.excerpt}
                          </p>
                        </div>
                        <div className="col-span-12 md:col-span-3 md:text-right text-xs text-[color:var(--color-muted)] mt-2 md:mt-0">
                          {lec.readingTimeMin} min
                        </div>
                      </div>
                    </Link>
                  </FadeIn>
                ))}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section className="mt-16">
              <h2 className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-muted)] mb-6">
                In the workshop
              </h2>
              <ul className="flex flex-wrap gap-2">
                {upcoming.map((lec) => (
                  <li key={lec.slug}>
                    <Link
                      href={`/lectures/${lec.slug}`}
                      className="inline-block border border-[color:var(--color-rule)] px-3 py-1.5 text-xs text-[color:var(--color-muted)] hover:border-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] transition-colors"
                    >
                      {lec.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-24 pt-12 border-t border-[color:var(--color-rule)]/40">
            <h2 className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-muted)] mb-6">
              Related subjects
            </h2>
            <div className="flex flex-wrap gap-2">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/topics/${p.slug}`}
                  className="inline-block border border-[color:var(--color-rule)] px-4 py-2 text-sm text-[color:var(--color-muted)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)] transition-colors"
                >
                  {p.headline}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
