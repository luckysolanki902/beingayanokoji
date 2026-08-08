export type Pillar = {
  num: string;
  name: string;
  note: string;
  /**
   * URL segment for the pillar's topic page. Written the way someone searches
   * rather than the way the site names things internally, nobody types
   * "pillar III", they type "self discipline".
   */
  slug: string;
  /** The topic page's H1 and <title>. */
  headline: string;
  /** Meta description for the topic page; also the lead paragraph's substance. */
  summary: string;
  /** The lead paragraph on the topic page. Real prose, not keyword filler. */
  intro: string;
};

export const PILLARS: Pillar[] = [
  {
    num: "I",
    name: "Cognition",
    note: "Clearer reasoning under uncertainty.",
    slug: "clear-thinking",
    headline: "Clear thinking",
    summary:
      "How to think clearly under uncertainty: base rates, second-order effects, probabilistic reasoning, and the specific ways a confident mind misleads itself.",
    intro:
      "Most bad decisions are not made by people who lack information. They are made by people who had the information and reasoned over it badly, anchoring on the vivid case, ignoring the base rate, stopping at the first consequence. These lectures are about the mechanics of that failure and the habits that interrupt it.",
  },
  {
    num: "II",
    name: "Psychology",
    note: "Regulation through granularity, not suppression.",
    slug: "emotional-regulation",
    headline: "Emotional regulation",
    summary:
      "Emotional regulation without suppression: naming states precisely, understanding what anger and anxiety are actually reporting, and widening the gap between stimulus and response.",
    intro:
      "The advice to control your emotions usually means suppress them, which works until it spectacularly doesn't. The more durable route is granularity: the better you can name what you are feeling, the less of your behaviour it silently drives. These lectures treat emotions as information with a signal-to-noise problem, not as noise.",
  },
  {
    num: "III",
    name: "Discipline",
    note: "Habits as architecture, not willpower.",
    slug: "self-discipline",
    headline: "Self-discipline",
    summary:
      "Self-discipline built as architecture rather than willpower: designing cues, friction, and environments so the behaviour you want becomes the path of least resistance.",
    intro:
      "Discipline is usually sold as a character trait you either have or lack, which conveniently makes failure your fault and success unteachable. The evidence points elsewhere. People who look disciplined mostly arrange their lives so that less discipline is required, they build friction against what they don't want and remove it from what they do. These lectures are about that architecture.",
  },
  {
    num: "IV",
    name: "Strategy",
    note: "Leverage compounds. Effort does not.",
    slug: "strategy-and-leverage",
    headline: "Strategy and leverage",
    summary:
      "Why leverage compounds and effort does not: playing long games, choosing the right positions, and designing a life that does not require heroic exertion to hold together.",
    intro:
      "Effort is linear and finite. Leverage (skill that transfers, work that keeps paying, positions that improve on their own) compounds. Most people optimise the first and never touch the second, then wonder why twenty years of hard work produced so little. These lectures are about the difference.",
  },
  {
    num: "V",
    name: "Social",
    note: "Influence as warmth times competence.",
    slug: "influence-and-social-skill",
    headline: "Influence and social skill",
    summary:
      "Influence without manipulation: charisma as warmth times competence, reading a room accurately, negotiating honestly, and the economy of speech.",
    intro:
      "Charisma is not a mystery and it is not a performance. It reads, reliably, as the product of two things people assess within seconds: whether you mean them well, and whether you are any good. Neither can be faked for long. These lectures are about developing both, and about the social reading skill that tells you which one is currently missing.",
  },
  {
    num: "VI",
    name: "Strength",
    note: "Insurance against the future self.",
    slug: "strength-training",
    headline: "Strength",
    summary:
      "Strength training as insurance against your future self: why muscle and force production predict how the next forty years go, and how to train without it consuming your life.",
    intro:
      "Strength is the least glamorous and most load-bearing investment available. It is not about appearance and it is barely about performance. It is about the fact that muscle mass and force production are among the better predictors of how independent and how alive you are decades from now. These lectures treat it as insurance you buy in advance.",
  },
  {
    num: "VII",
    name: "Athleticism",
    note: "Skill, not just force.",
    slug: "athleticism",
    headline: "Athleticism",
    summary:
      "Athletic capacity beyond raw strength: conditioning, coordination, movement skill, and why the ability to fight belongs in a serious education.",
    intro:
      "A strong body that cannot move well is a half-built one. Athleticism is coordination, conditioning, and skill under pressure, capacities that decay quietly and are far easier to keep than to rebuild. These lectures are about the parts of physical development that a barbell alone will not give you.",
  },
  {
    num: "VIII",
    name: "Recovery",
    note: "Sleep first. Then everything else.",
    slug: "sleep-and-recovery",
    headline: "Sleep and recovery",
    summary:
      "Sleep as the floor everything else stands on: circadian light, recovery debt, and why no amount of discipline compensates for chronic under-sleeping.",
    intro:
      "Sleep is the one input that degrades everything else when it is short, judgement, mood, appetite regulation, training adaptation, the willingness to do hard things at all. It is also the input people trade away first, because the cost is invisible for about a week. These lectures make the cost visible.",
  },
  {
    num: "IX",
    name: "Nutrition",
    note: "Energy balance survives every war.",
    slug: "nutrition",
    headline: "Nutrition",
    summary:
      "What survives every nutrition argument: energy balance, protein, and the discipline of the plate, without ideology, supplements, or a diet to join.",
    intro:
      "Nutrition discourse is unusually loud relative to how much is actually contested. A small number of things are well established and boring; almost everything being argued about sits several decimal places further out. These lectures stay with the part that holds.",
  },
  {
    num: "X",
    name: "Purpose",
    note: "Found through action, not declaration.",
    slug: "purpose-and-meaning",
    headline: "Purpose and meaning",
    summary:
      "Purpose found through action rather than declaration: work as a source of meaning, eudaimonia over happiness, and why searching for your passion is the wrong instruction.",
    intro:
      "The instruction to find your purpose implies it is somewhere waiting, fully formed, and that the task is search. In practice purpose accretes from work you have already done; it is built, noticed afterwards, and rarely announced in advance. These lectures are about the building.",
  },
  {
    num: "XI",
    name: "Philosophy",
    note: "Stoa, Dhamma, Junzi, read slowly.",
    slug: "practical-philosophy",
    headline: "Practical philosophy",
    summary:
      "Stoicism, Buddhism and Confucian thought read as operating instructions rather than aesthetics: craving, mortality, virtue, and the examined life.",
    intro:
      "Stoicism has been flattened into a wallpaper aesthetic and a quote account. Read properly it is a demanding, specific technology for living, as is what the Buddhists worked out about craving, and what the Confucians worked out about becoming a cultivated person. These lectures read them slowly, as instructions.",
  },
  {
    num: "XII",
    name: "Self-knowledge",
    note: "Observe yourself before directing yourself.",
    slug: "self-knowledge",
    headline: "Self-knowledge",
    summary:
      "Observing yourself accurately before trying to direct yourself: the patterns you repeat, the stories you tell, and the ability to be alone with your own mind.",
    intro:
      "Every plan for self-improvement rests on a model of the person being improved, and most people's model of themselves is a flattering fiction assembled after the fact. Accuracy comes first. These lectures are about seeing the patterns you actually run before deciding which ones to change.",
  },
];

const PILLAR_MAP = new Map(PILLARS.map((p) => [p.num, p]));
const SLUG_MAP = new Map(PILLARS.map((p) => [p.slug, p]));

export function getPillar(num: string): Pillar | undefined {
  return PILLAR_MAP.get(num);
}

export function getPillarBySlug(slug: string): Pillar | undefined {
  return SLUG_MAP.get(slug);
}

/**
 * Given a lecture's primary pillar and any secondary pillars, return the full
 * pillar records (deduped, in canonical order) that the lecture draws on.
 */
export function getLecturePillars(primary: string,
  secondary: string[] = []): Pillar[] {
  const wanted = new Set<string>([primary, ...secondary]);
  return PILLARS.filter((p) => wanted.has(p.num));
}
