import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProfile } from "@/lib/profile/public";
import { FadeIn } from "@/components/AnimatedText";
import {
  SITE_NAME,
  absoluteUrl,
  breadcrumbNode,
  jsonLdGraph,
  publisherNode,
} from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ number: string }>;
}): Promise<Metadata> {
  const { number } = await params;
  const student = await getPublicProfile(number);
  if (!student) return { title: "No such student", robots: { index: false } };

  const description = `${student.name} · ${student.className} · ${student.lifetimePoints.toLocaleString()} private points · ${student.passed} of ${student.total} examinations passed.`;

  return {
    title: `${student.name} · ${student.className}`,
    description,
    alternates: { canonical: `/students/${number}` },
    openGraph: {
      type: "profile",
      title: `${student.name} · ${student.className}`,
      description,
      url: absoluteUrl(`/students/${number}`),
      siteName: SITE_NAME,
    },
    twitter: { card: "summary_large_image", title: student.name, description },
  };
}

/**
 * A student's public page.
 *
 * No session is read and none is needed: everything here is what the student
 * agreed to publish, assembled by `getPublicProfile`, which never selects an
 * address or a photograph nobody opted in to. That is what makes the page safe
 * to hand to a stranger, which is the entire point of it being shareable.
 */
export default async function StudentPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const student = await getPublicProfile(number);
  if (!student) notFound();

  const jsonLd = jsonLdGraph(
    {
      "@type": "ProfilePage",
      "@id": absoluteUrl(`/students/${number}#page`),
      url: absoluteUrl(`/students/${number}`),
      name: `${student.name} · ${student.className}`,
      isPartOf: { "@id": absoluteUrl("/#website") },
      mainEntity: {
        "@type": "Person",
        name: student.name,
        identifier: student.studentNumber,
      },
    },
    publisherNode(),
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: student.name, path: `/students/${number}` },
    ])
  );

  return (
    <div className="px-5 pb-24 pt-10 md:px-8 md:pt-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // A chosen card name is user-controlled. Escaping '<' prevents a
          // literal </script> inside it from terminating this script element.
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <div className="mx-auto max-w-2xl">
        <FadeIn>
          <p className="font-hand text-center text-xs tracking-[0.24em] text-[color:var(--muted)]">
            生徒名簿
          </p>
        </FadeIn>

        {/* The card, in HTML rather than the paid PNG. The image on the record
            is a document the student bought; this is a page about them. */}
        <FadeIn delay={0.1}>
          <div className="mt-8 border border-[color:var(--rule)] bg-[color:var(--bg-elevated)]/40">
            <div className="flex items-center justify-center border-b border-[color:var(--rule)] bg-[color:var(--accent)] py-4">
              <span className="font-jp text-lg tracking-[0.35em] text-[color:var(--bg)] sm:tracking-[0.5em]">
                学生証
              </span>
            </div>

            <div className="flex flex-col items-center gap-6 p-5 sm:flex-row sm:items-start sm:p-7 md:p-9">
              <div className="flex h-40 w-32 shrink-0 items-center justify-center overflow-hidden border-2 border-[color:var(--accent)] bg-[color:var(--bg)]">
                {student.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={student.photo}
                    alt={student.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-serif text-3xl text-[color:var(--faint)]">
                    {student.classId === "GRAD" ? "卒" : student.classId}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--faint)]">
                  氏名 · Name
                </p>
                <h1 className="font-serif mt-1 break-words text-[clamp(1.75rem,9vw,2.25rem)] tracking-tight md:text-4xl">
                  {student.name}
                </h1>

                <div className="mt-5 flex flex-wrap justify-center gap-x-8 gap-y-3 sm:justify-start">
                  <Figure label="Class" value={student.className} />
                  <Figure label="Student no." value={`S01T${student.studentNumber}`} />
                </div>

                <div className="mt-6 inline-block border border-[color:var(--accent)] px-5 py-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--accent)]">
                    個人ポイント · Private points
                  </p>
                  <p className="font-serif mt-1 text-3xl tabular-nums text-[color:var(--accent)]">
                    {student.lifetimePoints.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px border-t border-[color:var(--rule)] bg-[color:var(--rule)]">
              <Cell label="Passed" value={`${student.passed} / ${student.total}`} />
              <Cell label="Enrolled" value={student.enrolledAt} />
            </div>
          </div>
        </FadeIn>

        {student.graduated && (
          <FadeIn delay={0.2}>
            <p className="mt-6 border border-[color:var(--accent)]/40 bg-[color:var(--accent)]/5 p-5 text-center text-sm leading-relaxed text-[color:var(--muted)]">
              This student has passed every examination the school sets. There is
              nothing above this and nothing waiting on the other side of it.
            </p>
          </FadeIn>
        )}

        <FadeIn delay={0.25}>
          <div className="mt-12 border-t border-[color:var(--rule)] pt-8 text-center">
            <p className="text-sm leading-relaxed text-[color:var(--muted)]">
              Private points record a student&apos;s lifetime total. Everyone
              starts in Class D.
            </p>
            <Link
              href="/enroll"
              className="mt-6 inline-block border border-[color:var(--accent)] bg-[color:var(--accent)] px-7 py-3 text-[11px] uppercase tracking-[0.2em] text-[color:var(--bg)] transition-opacity hover:opacity-85"
            >
              Take your own seat
            </Link>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--faint)]">
        {label}
      </p>
      <p className="font-serif mt-1 text-lg tracking-tight">{value}</p>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[color:var(--bg)] px-4 py-5 text-center">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--faint)]">
        {label}
      </p>
      <p className="font-serif mt-1.5 text-lg tabular-nums tracking-tight">{value}</p>
    </div>
  );
}
