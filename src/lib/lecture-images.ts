/**
 * Artwork per lecture, and for the standing pages.
 *
 * A map rather than a filename convention, so a lecture without a fitting image
 * simply has none. A convention quietly pressures you into filling every slot,
 * and a wrong picture at the head of an essay is worse than no picture at all
 * which is why several published lectures below are deliberately absent.
 *
 * Alt text describes what is actually in the frame. These run as banners rather
 * than decoration, and "image" tells a screen reader nothing.
 */

export interface LectureImage {
  src: string;
  alt: string;
  /** Focal point for the crop, as a CSS object-position. */
  position?: string;
  /** Art with its own background, which should sit on the page unclipped. */
  contain?: boolean;
}

const LECTURE_IMAGES: Record<string, LectureImage> = {
  "the-white-room-is-a-choice": {
    src: "/images/white_room_landscape_1920_1080.png",
    alt: "A child seated in a bare white room, facing an adult in silhouette",
  },
  "the-space-between-stimulus-and-response": {
    src: "/images/gap4_between_stimulus_ayanokoji_fighting_stance_landscape768x432.png",
    alt: "A figure in half-darkness, hands raised, holding still",
  },
  "the-unreadable-man": {
    src: "/images/theunreadableman_ayanokoji_landscape_purple_bg_1080x1364.png",
    alt: "A close portrait against violet light, the expression giving nothing away",
    position: "center 30%",
  },
  "the-quiet-discipline-of-reading": {
    src: "/images/horikita_reading_square_1200x1200.png",
    alt: "A student reading alone, absorbed in the page",
    position: "center 35%",
  },
  "lust-is-a-leash": {
    src: "/images/lust_is_a_leash_kushida_portrait_whitebg_592x908.png",
    alt: "A student posed and smiling for an audience",
    contain: true,
  },
  "the-long-game": {
    src: "/images/key-visual.jpg",
    alt: "A chess piece held between two fingers, other students behind",
  },
  "the-body-you-think-from": {
    src: "/images/ayanokoji-full.jpg",
    alt: "A student standing at ease against a plain wall",
    position: "center 25%",
  },
  // anger-decoded, sleep-is-the-floor and why-you-should-learn-to-fight have no
  // image on purpose. Nothing in the set fits them, and reusing another
  // lecture's banner would make both of them mean less.
};

export function getLectureImage(slug: string): LectureImage | null {
  return LECTURE_IMAGES[slug] ?? null;
}

/** Standing artwork for pages that are not a single lecture. */
export const SITE_IMAGES = {
  /** The homeroom teacher at the board, point totals beside her. */
  briefing: {
    src: "/images/chabashira-blackboard.jpg",
    alt: "A teacher at a whiteboard, a list of point totals written beside her",
  },
  /** Cut-out, for standing beside text rather than behind it. */
  teacher: {
    src: "/images/chabashira_transparent_bg_portrait360x689.png",
    alt: "The homeroom teacher, arms folded",
  },
  student: {
    src: "/images/ayanokoji_transparent_bg_portrait1100x2000.png",
    alt: "A student in the school's red blazer, hands at his sides",
  },
  classroom: {
    src: "/images/classroom.jpg",
    alt: "An empty classroom, desks in rows under strip lighting",
  },
  campus: {
    src: "/images/campus-aerial.jpg",
    alt: "The school campus seen from above, an island beside the city",
  },
} as const satisfies Record<string, LectureImage>;
