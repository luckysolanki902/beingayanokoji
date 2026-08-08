/**
 * The five rooms.
 *
 * Each theme is a place in the school rather than a brightness setting, which
 * is why they are named 教室 / 屋上 / ホワイトルーム / 消灯 / 桜 and not
 * light/dark/sepia. A reader picking "White Room" is choosing a mood they
 * already understand from the source material, and the palette has to earn
 * that: sterile and cold, with no warmth anywhere in it.
 *
 * The kanji doubles as the switcher's icon. It reads as a set at a glance,
 * needs no icon library, and is the correct alphabet for the subject.
 */

export const THEMES = [
  {
    id: "classroom",
    /** PayPal draws its own buttons; this is the nearest of its five. */
    paypal: "black",
    glyph: "教",
    label: "Classroom",
    japanese: "教室",
    /** Shown on hover, one line on what the room feels like. */
    note: "Afternoon light, chalk dust, paper",
  },
  {
    id: "rooftop",
    /** PayPal draws its own buttons; this is the nearest of its five. */
    paypal: "white",
    glyph: "空",
    label: "Rooftop",
    japanese: "屋上",
    note: "Dusk, and no one else up here",
  },
  {
    id: "white-room",
    /** PayPal draws its own buttons; this is the nearest of its five. */
    paypal: "black",
    glyph: "白",
    label: "White Room",
    japanese: "ホワイトルーム",
    note: "No warmth. Nothing to look at",
  },
  {
    id: "lights-out",
    /** PayPal draws its own buttons; this is the nearest of its five. */
    paypal: "white",
    glyph: "夜",
    label: "Lights Out",
    japanese: "消灯",
    note: "Past curfew, one desk lamp",
  },
  {
    id: "sakura",
    /** PayPal draws its own buttons; this is the nearest of its five. */
    paypal: "black",
    glyph: "桜",
    label: "Sakura",
    japanese: "桜",
    note: "First term. Everything still ahead",
  },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

/**
 * The white room is where the site starts.
 *
 * It is the least decorated of the five and the one the first lecture is about:
 * no warmth, nothing on the walls, nothing to look at but the words. A reader
 * arriving for the first time should meet the argument before they meet a mood.
 */
export const DEFAULT_THEME: ThemeId = "white-room";

export const THEME_IDS = THEMES.map((t) => t.id) as readonly ThemeId[];

/** PayPal's own palette only has five entries; this picks the least loud. */
export type PaypalColor = (typeof THEMES)[number]["paypal"];

export function paypalColorFor(theme: ThemeId): PaypalColor {
  return THEMES.find((t) => t.id === theme)?.paypal ?? "black";
}

export const STORAGE_KEY = "ba-theme";

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && (THEME_IDS as readonly string[]).includes(value);
}

/**
 * Applied before first paint by an inline script in the document head, and
 * again by the provider on every change. Kept here as a string so the two can
 * never drift apart, a mismatch shows up as a flash of the wrong room.
 */
export const NO_FLASH_SCRIPT = `
(function(){
  try {
    var stored = localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
    var valid = ${JSON.stringify(THEME_IDS)};
    var theme = valid.indexOf(stored) > -1 ? stored : ${JSON.stringify(DEFAULT_THEME)};
    document.documentElement.classList.add('theme-' + theme);
    document.documentElement.dataset.theme = theme;
  } catch (e) {
    document.documentElement.classList.add('theme-${DEFAULT_THEME}');
  }
})();
`.trim();
