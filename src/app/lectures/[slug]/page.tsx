import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllLectureSlugs, getAllLectures, getLectureBySlug } from "@/lib/lectures";
import { Markdown } from "@/components/Markdown";
import { ScrollProgress } from "@/components/ScrollProgress";
import { AnimatedText, FadeIn } from "@/components/AnimatedText";
import { PillarLegend } from "@/components/PillarLegend";
import { getLecturePillars, getPillar } from "@/lib/pillars";
import { curriculumIndex, getClass } from "@/lib/curriculum";
import { getQuiz, publicQuiz } from "@/lib/quizzes";
import { getStudentRecord } from "@/lib/progress/state";
import { GatedArticle } from "@/components/progress/GatedArticle";
import { LectureBanner } from "@/components/LectureBanner";
import { getLectureImage } from "@/lib/lecture-images";
import { LectureExam } from "@/components/progress/LectureExam";
import {
  SITE_NAME,
  absoluteUrl,
  breadcrumbNode,
  jsonLdGraph,
  publisherNode,
} from "@/lib/site";

export async function generateStaticParams() {
  return getAllLectureSlugs().map((slug) => ({ slug }));
}

/**
 * How a lecture describes its own accessibility to a crawler.
 *
 * The first lecture is free to everyone and says so. The rest are behind a
 * hundred points, and say *that*, naming the CSS class the gated body is
 * rendered into, so a crawler indexing the full text knows it is indexing
 * something a reader will be asked to pay for. This is the whole basis on
 * which serving the content to bots and not to readers is honest.
 */
function paywallNodes(free: boolean) {
  if (free) return { isAccessibleForFree: true };
  return {
    isAccessibleForFree: false,
    hasPart: {
      "@type": "WebPageElement",
      isAccessibleForFree: false,
      cssSelector: ".paywall",
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lec = getLectureBySlug(slug);
  if (!lec) return { title: "Not found" };

  const description = lec.keyClaim || lec.excerpt || "";
  const url = absoluteUrl(`/lectures/${slug}`);

  return {
    title: lec.title,
    description,
    keywords: lec.tags,
    alternates: { canonical: `/lectures/${slug}` },
    // An unfinished lecture is a placeholder. Letting it be indexed spends the
    // site's crawl budget on a page that says "come back later" and puts a
    // thin result in front of the first reader who finds it.
    robots: lec.published ? undefined : { index: false, follow: true },
    openGraph: {
      title: lec.title,
      description,
      type: "article",
      url,
      siteName: SITE_NAME,
      tags: lec.tags,
      ...(lec.publishedAt ? { publishedTime: lec.publishedAt } : {}),
      ...(lec.updatedAt ? { modifiedTime: lec.updatedAt } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: lec.title,
      description,
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
  // `all` is sorted by descending order, which is the reading order (top = read first).
  // So the earlier lecture sits at idx-1 and the next lecture to read sits at idx+1.
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  // Where this lecture sits in the curriculum, and where the reader sits in
  // relation to it. Both are resolved here, on the server, before anything is
  // sent, the gate below is the difference between a lecture bought and a
  // lecture not, so it cannot be a decision made after hydration.
  const entry = curriculumIndex(all)[slug];
  const quiz = getQuiz(slug);
  const banner = getLectureImage(slug);
  const record = await getStudentRecord();
  const state = record.bySlug[slug];
  const unlocked = state?.unlocked ?? false;
  const nextUnlocked = next ? (record.bySlug[next.slug]?.unlocked ?? false) : false;
  // Free *to everyone*, not "free to this reader", the structured data
  // describes the lecture, not the session that happened to request it.
  const freeToAll = (entry?.index ?? 0) === 0;

  const nav = (prev || next) && (<nav className="mx-auto mt-20 grid max-w-3xl grid-cols-1 gap-3 border-t border-[color:var(--color-rule)]/40 pt-8 sm:mt-24 sm:grid-cols-2 sm:gap-8 sm:pt-12">
      {prev ? (<Link
          href={`/lectures/${prev.slug}`}
          className="group block p-4 transition-colors hover:bg-[color:var(--color-bg-elevated)]/30 sm:-m-4"
        >
          <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)] mb-2">
            ← Previous
          </div>
          <div className="font-serif text-lg group-hover:text-[color:var(--color-accent)] transition-colors">
            {prev.title}
          </div>
        </Link>) : (<div />)}
      {next ? (<Link
          href={`/lectures/${next.slug}`}
          className="group block p-4 text-left transition-colors hover:bg-[color:var(--color-bg-elevated)]/30 sm:-m-4 sm:text-right"
        >
          <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)] mb-2">
            Next →
          </div>
          <div className="font-serif text-lg group-hover:text-[color:var(--color-accent)] transition-colors">
            {next.title}
          </div>
        </Link>) : (<div />)}
    </nav>);

  if (!lec.published) {
    return (<article className="px-5 pb-24 pt-12 md:px-8 md:pt-16">
        <header className="mx-auto max-w-3xl">
          <FadeIn>
            <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted)] sm:text-xs sm:tracking-[0.25em]">
              <Link href="/lectures" className="hover:text-[color:var(--color-fg)] transition-colors">
                Lectures
              </Link>
              <span className="text-[color:var(--color-faint)]">/</span>
              <span>Pillar {lec.pillar}</span>
            </div>
          </FadeIn>

          <AnimatedText
            as="h1"
            text={lec.title}
            className="font-serif text-[clamp(2.25rem,11vw,3rem)] font-medium leading-[1.05] tracking-tight md:text-6xl"
            stagger={0.035}
          />

          {lec.keyClaim && (<FadeIn delay={0.4}>
              <p className="mt-8 font-serif italic text-xl md:text-2xl leading-relaxed text-[color:var(--color-muted)] border-l-2 border-[color:var(--color-accent)] pl-6">
                {lec.keyClaim}
              </p>
            </FadeIn>)}
        </header>

        <FadeIn delay={0.6}>
          <div className="mx-auto max-w-3xl mt-16 border-t border-b border-[color:var(--color-rule)]/40 py-16 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-accent)] mb-4">
              In the workshop
            </p>
            <p className="font-serif text-2xl md:text-3xl tracking-tight leading-snug">
              This lecture will be published soon.
            </p>
            <p className="mt-4 text-sm text-[color:var(--color-muted)] max-w-md mx-auto">
              It is being written and will appear here once it is finished. The lectures are
              released in order, and finished work is never rushed.
            </p>
          </div>
        </FadeIn>

        {nav}
      </article>);
  }

  const url = absoluteUrl(`/lectures/${slug}`);
  const pillars = getLecturePillars(lec.pillar, lec.secondaryPillars);

  const jsonLd = jsonLdGraph({
      "@type": "Article",
      "@id": `${url}#article`,
      headline: lec.title,
      description: lec.keyClaim || lec.excerpt,
      url,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      author: { "@id": absoluteUrl("/#organization") },
      publisher: { "@id": absoluteUrl("/#organization") },
      isPartOf: { "@id": absoluteUrl("/#website") },
      inLanguage: "en",
      keywords: lec.tags?.join(", "),
      wordCount: lec.wordCount,
      // ISO 8601 duration, the format schema.org expects, not "12 min".
      timeRequired: `PT${lec.readingTimeMin}M`,
      articleSection: getPillar(lec.pillar)?.headline ?? undefined,
      // The subjects the lecture is *about*, linked to their topic pages so the
      // article and the hub reinforce each other rather than competing.
      about: pillars.map((p) => ({
        "@type": "Thing",
        name: p.headline,
        url: absoluteUrl(`/topics/${p.slug}`),
      })),
      // Dates only when the front matter actually carries them. An invented
      // publication date is worse than none.
      ...(lec.publishedAt ? { datePublished: lec.publishedAt } : {}),
      ...(lec.updatedAt ? { dateModified: lec.updatedAt } : {}),
      // The gated lectures are still served in full to crawlers, and this is
      // what makes that legitimate rather than cloaking: the page declares the
      // body paywalled and names the exact element it lives in, which is the
      // arrangement Google documents for subscription content. Removing this
      // while keeping the markup would be the thing that earns a penalty.
      ...paywallNodes(freeToAll),
    },
    publisherNode(),
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Lectures", path: "/lectures" },
      { name: lec.title, path: `/lectures/${slug}` },
    ]),
    // The lecture is a unit of a course, not a loose blog post, and it ends
    // in a real assessment. Both are declared so the curriculum's structure is
    // legible to a crawler and not only to a reader.
    {
      "@type": "LearningResource",
      "@id": `${url}#unit`,
      name: lec.title,
      url,
      learningResourceType: "Lecture",
      educationalLevel: lec.difficulty ?? "introductory",
      timeRequired: `PT${lec.readingTimeMin}M`,
      isPartOf: { "@id": absoluteUrl("/lectures#course") },
      inLanguage: "en",
      isAccessibleForFree: freeToAll,
      provider: { "@id": absoluteUrl("/#organization") },
      ...(entry
        ? { position: entry.index + 1, educationalAlignment: {
            "@type": "AlignmentObject",
            alignmentType: "educationalSubject",
            targetName: getClass(entry.classId).label,
          } }
        : {}),
    },
    ...(quiz
      ? [
          {
            "@type": "Quiz",
            "@id": `${url}#exam`,
            name: `Examination, ${lec.title}`,
            about: { "@id": `${url}#unit` },
            educationalLevel: lec.difficulty ?? "introductory",
            numberOfQuestions: quiz.questions.length,
            isAccessibleForFree: freeToAll,
          },
        ]
      : []));

  return (<>
      <ScrollProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="px-5 pb-24 pt-12 md:px-8 md:pt-16">
        <header className="mx-auto max-w-3xl mb-16">
          <FadeIn>
            <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted)] sm:text-xs sm:tracking-[0.25em]">
              <Link href="/lectures" className="hover:text-[color:var(--color-fg)] transition-colors">
                Lectures
              </Link>
              <span className="text-[color:var(--color-faint)]">/</span>
              {/* Links to the topic page rather than naming a pillar number
                  the number means nothing to a first-time reader, and the link
                  is what ties the essay to its subject hub. */}
              {getPillar(lec.pillar) ? (<Link
                  href={`/topics/${getPillar(lec.pillar)!.slug}`}
                  className="hover:text-[color:var(--color-fg)] transition-colors"
                >
                  {getPillar(lec.pillar)!.headline}
                </Link>) : (<span>Pillar {lec.pillar}</span>)}
              {lec.difficulty && (<>
                  <span className="text-[color:var(--color-faint)]">/</span>
                  <span>{lec.difficulty}</span>
                </>)}
            </div>
          </FadeIn>

          <AnimatedText
            as="h1"
            text={lec.title}
            className="font-serif text-[clamp(2.25rem,11vw,3rem)] font-medium leading-[1.05] tracking-tight md:text-6xl"
            stagger={0.035}
          />

          {lec.keyClaim && (<FadeIn delay={0.4}>
              <p className="mt-8 font-serif italic text-xl md:text-2xl leading-relaxed text-[color:var(--color-muted)] border-l-2 border-[color:var(--color-accent)] pl-6">
                {lec.keyClaim}
              </p>
            </FadeIn>)}

          <FadeIn delay={0.6}>
            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-[color:var(--color-muted)] sm:gap-x-6">
              <span>{lec.readingTimeMin} min</span>
              <span className="text-[color:var(--color-faint)]">·</span>
              <span>{lec.wordCount.toLocaleString()} words</span>
              <span className="text-[color:var(--color-faint)]">·</span>
              <Link
                href={`/lectures/${slug}/print`}
                className="hover:text-[color:var(--color-fg)] transition-colors uppercase tracking-[0.2em]"
              >
                Print
              </Link>
            </div>
          </FadeIn>

          {banner && <LectureBanner image={banner} />}
        </header>

        <div className="mx-auto max-w-3xl">
          <GatedArticle
            slug={slug}
            title={lec.title}
            unlocked={unlocked}
            published={lec.published}
            classId={entry?.classId ?? "D"}
            positionInClass={entry?.positionInClass ?? 1}
            signedIn={record.signedIn}
            balance={record.points}
            // The exam goes through the gate too. Left outside it, a locked
            // lecture's test was still reachable by deep link, which now
            // would mean earning points from a lecture nobody paid for.
            exam={
              quiz ? (<LectureExam
                  slug={slug}
                  quiz={publicQuiz(quiz)}
                  nextSlug={next?.slug ?? null}
                  nextTitle={next?.title ?? null}
                  nextUnlocked={nextUnlocked}
                  signedIn={record.signedIn}
                  alreadyPassed={state?.passed ?? false}
                  bestScore={state?.bestScore ?? 0}
                />) : null
            }
          >
            <Markdown content={lec.content} />
          </GatedArticle>
        </div>

        <div className="mx-auto max-w-3xl">
          <PillarLegend pillar={lec.pillar} secondaryPillars={lec.secondaryPillars} />
        </div>

        {nav}
      </article>
    </>);
}
