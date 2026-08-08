import type { Metadata } from "next";
import Link from "next/link";
import { getAllLectures } from "@/lib/lectures";
import { FadeIn, AnimatedText } from "@/components/AnimatedText";
import {
  SITE_NAME,
  absoluteUrl,
  breadcrumbNode,
  jsonLdGraph,
  publisherNode,
} from "@/lib/site";

const DESCRIPTION =
  "The full index of long-form lectures on self-discipline, clear thinking, emotional regulation, focus, strength, strategy and purpose. Self-contained essays, arranged in recommended reading order, free to read.";

export const metadata: Metadata = {
  title: "All lectures",
  description: DESCRIPTION,
  alternates: { canonical: "/lectures" },
  openGraph: {
    type: "website",
    title: `All lectures · ${SITE_NAME}`,
    description: DESCRIPTION,
    url: absoluteUrl("/lectures"),
  },
};

export default function LecturesIndexPage() {
  const lectures = getAllLectures();
  const published = lectures.filter((l) => l.published);

  const jsonLd = jsonLdGraph(
    {
      "@type": "CollectionPage",
      "@id": absoluteUrl("/lectures#page"),
      url: absoluteUrl("/lectures"),
      name: `All lectures · ${SITE_NAME}`,
      description: DESCRIPTION,
      isPartOf: { "@id": absoluteUrl("/#website") },
      publisher: { "@id": absoluteUrl("/#organization") },
    },
    publisherNode(),
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Lectures", path: "/lectures" },
    ]),
    {
      "@type": "ItemList",
      name: "Lectures in reading order",
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
    <div className="px-5 pb-24 pt-12 md:px-8 md:pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-4xl">
        <FadeIn>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-muted)] mb-6">
            The index
          </p>
        </FadeIn>
        <AnimatedText
          as="h1"
          text="All lectures."
          className="font-serif text-5xl md:text-7xl tracking-tight font-medium leading-none"
        />
        <FadeIn delay={0.5}>
          <p className="mt-8 max-w-2xl text-[color:var(--color-muted)] leading-relaxed">
            Each entry below is a self-contained essay of four to six thousand
            words. Start from the first lecture. The pillar tag tells you which
            dimension the lecture is sharpening — or{" "}
            <Link
              href="/topics"
              className="text-[color:var(--color-fg)] underline decoration-[color:var(--color-rule)] underline-offset-4 hover:decoration-[color:var(--color-accent)] transition-colors"
            >
              browse by subject
            </Link>{" "}
            if you would rather start from a problem than from the beginning.
            New lectures are added as they are finished.
          </p>
        </FadeIn>

        <div className="mt-20 divide-y divide-[color:var(--color-rule)]/40 border-y border-[color:var(--color-rule)]/40">
          {lectures.length === 0 && (
            <p className="py-12 text-center text-[color:var(--color-muted)] italic font-serif">
              The first lecture is being drafted. Return shortly.
            </p>
          )}
          {lectures.map((lec, i) => {
            const number = String(i + 1).padStart(3, "0");
            return (
              <FadeIn key={lec.slug} delay={i * 0.05}>
                <Link
                  href={`/lectures/${lec.slug}`}
                  className="group block py-10 hover:bg-[color:var(--color-bg-elevated)]/30 transition-colors"
                >
                  <div className="grid grid-cols-12 gap-4 items-baseline px-2">
                    <div className="col-span-12 md:col-span-9">
                      <div className="flex items-baseline gap-4">
                        <span className="font-mono text-xs text-[color:var(--color-faint)] tabular-nums shrink-0 pt-1">
                          {number}
                        </span>
                        <h2
                          className={`font-serif text-2xl md:text-3xl tracking-tight leading-snug transition-colors ${
                            lec.published
                              ? "group-hover:text-[color:var(--color-accent)]"
                              : "text-[color:var(--color-muted)]"
                          }`}
                        >
                          {lec.title}
                        </h2>
                      </div>
                      <p className="mt-3 pl-10 text-sm text-[color:var(--color-muted)] leading-relaxed">
                        {lec.keyClaim || lec.excerpt}
                      </p>
                      <div className="mt-4 pl-10 flex flex-wrap gap-2">
                        {lec.tags?.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="text-xs px-2 py-0.5 border border-[color:var(--color-rule)] text-[color:var(--color-muted)]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-3 md:text-right text-xs text-[color:var(--color-muted)] mt-3 md:mt-0 pl-10 md:pl-0">
                      <div>Pillar {lec.pillar}</div>
                      {lec.published ? (
                        <div className="text-[color:var(--color-faint)] mt-1">
                          {lec.readingTimeMin} min · {lec.wordCount.toLocaleString()} words
                        </div>
                      ) : (
                        <div className="mt-1 inline-block text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-accent)] border border-[color:var(--color-accent)]/40 px-2 py-0.5">
                          Coming soon
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </div>
  );
}
