import type { Metadata } from "next";
import Link from "next/link";
import { getAllLectures } from "@/lib/lectures";
import Image from "next/image";
import { FadeIn, AnimatedText } from "@/components/AnimatedText";
import { SITE_IMAGES } from "@/lib/lecture-images";
import { ClassRoster } from "@/components/progress/ClassRoster";
import { getStudentRecord } from "@/lib/progress/state";
import { buildCurriculum } from "@/lib/curriculum";
import {
  SITE_NAME,
  absoluteUrl,
  breadcrumbNode,
  courseNode,
  jsonLdGraph,
  publisherNode,
} from "@/lib/site";
import { CLASS_ORDER } from "@/lib/curriculum";

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

export default async function LecturesIndexPage() {
  const lectures = getAllLectures();
  const published = lectures.filter((l) => l.published);
  const record = await getStudentRecord();

  const jsonLd = jsonLdGraph({
      "@type": "CollectionPage",
      "@id": absoluteUrl("/lectures#page"),
      url: absoluteUrl("/lectures"),
      name: `All lectures · ${SITE_NAME}`,
      description: DESCRIPTION,
      isPartOf: { "@id": absoluteUrl("/#website") },
      publisher: { "@id": absoluteUrl("/#organization") },
    },
    publisherNode(),
    // The curriculum is a Course in the schema.org sense, ordered parts, a
    // provider, an assessment between each. Worth declaring: course results
    // are a distinct surface in search.
    courseNode({ classCount: CLASS_ORDER.length, lectureCount: lectures.length }),
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
    });

  return (<div className="px-5 pb-24 pt-12 md:px-8 md:pt-16">
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
            dimension the lecture is sharpening, or{" "}
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

        {/* The empty classroom: the index is a roster, and this is the room
            it belongs to. */}
        <FadeIn>
          <figure className="relative mt-12 aspect-[21/9] w-full overflow-hidden border border-[color:var(--rule)] bg-[color:var(--bg-elevated)]">
            <Image
              src={SITE_IMAGES.classroom.src}
              alt={SITE_IMAGES.classroom.alt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 896px"
              className="object-cover"
            />
          </figure>
        </FadeIn>

        <ClassRoster curriculum={buildCurriculum(lectures)} record={record} />
      </div>
    </div>);
}
