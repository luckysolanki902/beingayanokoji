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
              <span className="text-sm uppercase tracking-wider">{p.name}</span>
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
