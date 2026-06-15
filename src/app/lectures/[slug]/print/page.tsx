import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedLectureSlugs, getLectureBySlug } from "@/lib/lectures";
import { Markdown } from "@/components/Markdown";
import { PillarLegend } from "@/components/PillarLegend";

export async function generateStaticParams() {
  return getPublishedLectureSlugs().map((slug) => ({ slug }));
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
    title: `${lec.title} — Print`,
    description: lec.keyClaim || lec.excerpt,
    robots: { index: false, follow: false },
    alternates: { canonical: `/lectures/${slug}` },
  };
}

export default async function LecturePrintPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lec = getLectureBySlug(slug);
  if (!lec || !lec.published) notFound();

  return (
    <article className="a4-sheet">
      <header className="mb-12">
        <h1 className="font-serif text-4xl md:text-6xl tracking-tight font-medium leading-[1.05]">
          {lec.title}
        </h1>

        {lec.keyClaim && (
          <p className="mt-6 font-serif italic text-xl leading-relaxed text-[color:var(--color-muted)] border-l-2 border-[color:var(--color-accent)] pl-6">
            {lec.keyClaim}
          </p>
        )}

        <div className="mt-6 flex items-center gap-4 text-xs text-[color:var(--color-muted)] font-mono">
          <span>Pillar {lec.pillar}</span>
          <span className="text-[color:var(--color-faint)]">·</span>
          <span>{lec.readingTimeMin} min</span>
          <span className="text-[color:var(--color-faint)]">·</span>
          <span>{lec.wordCount.toLocaleString()} words</span>
          <span className="text-[color:var(--color-faint)]">·</span>
          <span>beingayanokoji.vercel.app</span>
        </div>
      </header>

      <Markdown content={lec.content} />

      <PillarLegend pillar={lec.pillar} secondaryPillars={lec.secondaryPillars} />
    </article>
  );
}
