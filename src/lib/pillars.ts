export type Pillar = {
  num: string;
  name: string;
  note: string;
};

export const PILLARS: Pillar[] = [
  { num: "I", name: "Cognition", note: "Clearer reasoning under uncertainty." },
  { num: "II", name: "Psychology", note: "Regulation through granularity, not suppression." },
  { num: "III", name: "Discipline", note: "Habits as architecture, not willpower." },
  { num: "IV", name: "Strategy", note: "Leverage compounds. Effort does not." },
  { num: "V", name: "Social", note: "Influence as warmth times competence." },
  { num: "VI", name: "Strength", note: "Insurance against the future self." },
  { num: "VII", name: "Athleticism", note: "Skill, not just force." },
  { num: "VIII", name: "Recovery", note: "Sleep first. Then everything else." },
  { num: "IX", name: "Nutrition", note: "Energy balance survives every war." },
  { num: "X", name: "Purpose", note: "Found through action, not declaration." },
  { num: "XI", name: "Philosophy", note: "Stoa, Dhamma, Junzi — read slowly." },
  { num: "XII", name: "Self-knowledge", note: "Observe yourself before directing yourself." },
];

const PILLAR_MAP = new Map(PILLARS.map((p) => [p.num, p]));

export function getPillar(num: string): Pillar | undefined {
  return PILLAR_MAP.get(num);
}

/**
 * Given a lecture's primary pillar and any secondary pillars, return the full
 * pillar records (deduped, in canonical order) that the lecture draws on.
 */
export function getLecturePillars(
  primary: string,
  secondary: string[] = [],
): Pillar[] {
  const wanted = new Set<string>([primary, ...secondary]);
  return PILLARS.filter((p) => wanted.has(p.num));
}
