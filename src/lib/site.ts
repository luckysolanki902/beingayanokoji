/**
 * One place for the facts every page's metadata repeats.
 *
 * The canonical origin lives here rather than being pasted into the layout, the
 * sitemap, robots and half a dozen JSON-LD blocks. Search engines treat two
 * origins serving identical content as duplicates and split the ranking between
 * them, so when the domain changes there must be exactly one line to edit.
 */

/**
 * The canonical origin. `NEXT_PUBLIC_SITE_URL` overrides it so preview
 * deployments can point at themselves, but production resolves to the custom
 * domain — never the .vercel.app alias, which stays reachable but must not be
 * the address search engines index.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://beingayanokoji.dailicle.com"
).replace(/\/$/, "");

export const SITE_NAME = "Being Ayanokoji";

export const SITE_TAGLINE = "Calm in tone. Heavy in substance.";

/**
 * The default description. Written for a human first — it is the snippet under
 * the result, and a snippet that reads like a keyword list gets skipped — but it
 * carries the terms the site should actually be found for: self-discipline,
 * focus, habits, clear thinking.
 */
export const SITE_DESCRIPTION =
  "Long-form lectures on self-discipline, clear thinking, focus, and self-improvement that respects your intelligence. Deeply researched essays on habits, emotional regulation, strategy, strength, and purpose — no platitudes, no paywall, no newsletter.";

export const SITE_SHORT_DESCRIPTION =
  "Long-form lectures on self-discipline, clear thinking, and deliberate living.";

export const AUTHOR_EMAIL = "luckysolanki902@gmail.com";

/**
 * Keywords are close to worthless as a ranking signal now, but they cost
 * nothing and some smaller engines and site-search tools still read them. The
 * real targeting is done by the copy and by the topic pages.
 */
export const SITE_KEYWORDS = [
  "self discipline",
  "self improvement",
  "how to be more disciplined",
  "focus and attention",
  "building better habits",
  "deep work",
  "emotional regulation",
  "clear thinking",
  "mental models",
  "decision making",
  "stoicism",
  "philosophy of self improvement",
  "strength training for longevity",
  "self mastery",
  "personal development essays",
  "long form essays",
  "ayanokoji",
  "kiyotaka ayanokoji philosophy",
];

/** Absolute URL for a site-relative path. JSON-LD and OG tags require these. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * The publisher, referenced by `@id` from every other JSON-LD block so that
 * search engines see one entity across the site rather than a fresh, unrelated
 * organisation on each page.
 */
export function publisherNode() {
  return {
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_SHORT_DESCRIPTION,
    email: AUTHOR_EMAIL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/opengraph-image"),
      width: 1200,
      height: 630,
    },
  };
}

/** Breadcrumbs, which is what turns a bare URL in a result into a path. */
export function breadcrumbNode(trail: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/** Wrap nodes in a single @graph — one script tag per page, not five. */
export function jsonLdGraph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}

/**
 * The whole site as a Course.
 *
 * This became true rather than aspirational the moment the lectures were
 * arranged into classes with examinations between them — which is exactly the
 * shape `Course` describes. Search engines treat course markup as a distinct
 * result type, so a curriculum that genuinely is one should say so.
 */
export function courseNode(params: {
  classCount: number;
  lectureCount: number;
}) {
  return {
    "@type": "Course",
    "@id": absoluteUrl("/lectures#course"),
    name: `${SITE_NAME} — the curriculum`,
    description: `A ${params.lectureCount}-lecture curriculum on self-discipline, clear thinking, emotional regulation, strength, strategy and purpose, arranged into ${params.classCount} classes. Each lecture ends in an examination that opens the next.`,
    url: absoluteUrl("/lectures"),
    provider: { "@id": absoluteUrl("/#organization") },
    inLanguage: "en",
    isAccessibleForFree: true,
    educationalLevel: "Adult education",
    teaches: [
      "Self-discipline",
      "Clear thinking",
      "Emotional regulation",
      "Focus and attention",
      "Strategy and leverage",
      "Purpose",
    ],
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: `PT${params.lectureCount * 15}M`,
      instructor: { "@id": absoluteUrl("/#organization") },
    },
  };
}
