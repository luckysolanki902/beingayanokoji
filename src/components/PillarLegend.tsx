import Link from "next/link";
import { getLecturePillars } from "@/lib/pillars";

/**
 * Renders the full descriptions of every pillar a lecture draws on.
 * Shown in the footer region of both the normal article page and the /print page.
 */
export function PillarLegend({
  pillar,
  secondaryPillars = [],
}: {
  pillar: string;
  secondaryPillars?: string[];
}) {
  const pillars = getLecturePillars(pillar, secondaryPillars);
  if (pillars.length === 0) return null;

  return (
    <section className="mt-20 pt-12 border-t border-[color:var(--color-rule)]/40">
      <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-muted)] mb-8">
        The pillars this lecture draws on
      </p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[color:var(--color-rule)]/40">
        {pillars.map((p) => (
          <div key={p.num} className="bg-[color:var(--color-bg)] p-6">
            <dt className="flex items-baseline gap-4 mb-2">
              <span className="font-serif text-2xl text-[color:var(--color-faint)]">
                {p.num}
              </span>
              {/* Every lecture footer links onward to its subject hubs, which
                  is most of the site's internal linking. */}
              <Link
                href={`/topics/${p.slug}`}
                className="text-sm uppercase tracking-wider hover:text-[color:var(--color-accent)] transition-colors"
              >
                {p.name}
              </Link>
            </dt>
            <dd className="font-serif italic text-base text-[color:var(--color-muted)] leading-snug">
              {p.note}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
