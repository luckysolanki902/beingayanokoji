import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllLectureSlugs, getAllLectures, getLectureBySlug } from "@/lib/lectures";
import { Markdown } from "@/components/Markdown";
import { ScrollProgress } from "@/components/ScrollProgress";
import { AnimatedText, FadeIn } from "@/components/AnimatedText";

export async function generateStaticParams() {
  return getAllLectureSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lec = getLectureBySlug(slug);
  if (!lec) return { title: "Not found" };

  return {
    title: lec.title,
    description: lec.keyClaim || lec.excerpt,
    alternates: { canonical: `/lectures/${slug}` },
    openGraph: {
      title: lec.title,
      description: lec.keyClaim || lec.excerpt,
      type: "article",
      tags: lec.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: lec.title,
      description: lec.keyClaim || lec.excerpt,
    },
  };
}

export default async function LecturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lec = getLectureBySlug(slug);
  if (!lec) notFound();

  const all = getAllLectures();
  const idx = all.findIndex((l) => l.slug === slug);
  const prev = idx >= 0 ? all[idx + 1] : null;
  const next = idx > 0 ? all[idx - 1] : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: lec.title,
    description: lec.keyClaim || lec.excerpt,
    author: { "@type": "Organization", name: "Being Ayanokoji" },
    publisher: {
      "@type": "Organization",
      name: "Being Ayanokoji",
      url: "https://beingayanokoji.vercel.app",
    },
    keywords: lec.tags?.join(", "),
    wordCount: lec.wordCount,
  };

  return (
    <>
      <ScrollProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="pt-32 pb-24 px-6">
        <header className="mx-auto max-w-3xl mb-16">
          <FadeIn>
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-[color:var(--color-muted)] mb-8">
              <Link href="/lectures" className="hover:text-[color:var(--color-fg)] transition-colors">
                Lectures
              </Link>
              <span className="text-[color:var(--color-faint)]">/</span>
              <span>Pillar {lec.pillar}</span>
              {lec.difficulty && (
                <>
                  <span className="text-[color:var(--color-faint)]">/</span>
                  <span>{lec.difficulty}</span>
                </>
              )}
            </div>
          </FadeIn>

          <AnimatedText
            as="h1"
            text={lec.title}
            className="font-serif text-4xl md:text-6xl tracking-tight font-medium leading-[1.05]"
            stagger={0.035}
          />

          {lec.keyClaim && (
            <FadeIn delay={0.4}>
              <p className="mt-8 font-serif italic text-xl md:text-2xl leading-relaxed text-[color:var(--color-muted)] border-l-2 border-[color:var(--color-accent)] pl-6">
                {lec.keyClaim}
              </p>
            </FadeIn>
          )}

          <FadeIn delay={0.6}>
            <div className="mt-8 flex items-center gap-6 text-xs text-[color:var(--color-muted)] font-mono">
              <span>{lec.readingTimeMin} min</span>
              <span className="text-[color:var(--color-faint)]">·</span>
              <span>{lec.wordCount.toLocaleString()} words</span>
            </div>
          </FadeIn>
        </header>

        <div className="mx-auto max-w-3xl">
          <Markdown content={lec.content} />
        </div>

        {(prev || next) && (
          <nav className="mx-auto max-w-3xl mt-24 pt-12 border-t border-[color:var(--color-rule)]/40 grid grid-cols-2 gap-8">
            {prev ? (
              <Link
                href={`/lectures/${prev.slug}`}
                className="group block hover:bg-[color:var(--color-bg-elevated)]/30 p-4 -m-4 transition-colors"
              >
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)] mb-2">
                  ← Previous
                </div>
                <div className="font-serif text-lg group-hover:text-[color:var(--color-accent)] transition-colors">
                  {prev.title}
                </div>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                href={`/lectures/${next.slug}`}
                className="group block text-right hover:bg-[color:var(--color-bg-elevated)]/30 p-4 -m-4 transition-colors"
              >
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)] mb-2">
                  Next →
                </div>
                <div className="font-serif text-lg group-hover:text-[color:var(--color-accent)] transition-colors">
                  {next.title}
                </div>
              </Link>
            ) : (
              <div />
            )}
          </nav>
        )}
      </article>
    </>
  );
}
