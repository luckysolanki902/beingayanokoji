"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_THEME,
  STORAGE_KEY,
  THEME_IDS,
  isThemeId,
  type ThemeId,
} from "@/lib/themes";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  /** False until the stored choice has been read, so the switcher can wait. */
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Owns the theme class on `<html>`.
 *
 * It has to be `<html>` and not `<body>`: the token layer declares
 * `--color-bg: var(--bg)` on `:root`, and a custom property that references
 * another is substituted once, on the element where it is declared. Put the
 * theme class one level lower and every token would resolve against the
 * default room no matter what the reader picked.
 *
 * The initial class is written by the inline script in the head, before first
 * paint. This provider only takes over from there.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);
  const [ready, setReady] = useState(false);

  // Read back what the inline script already applied rather than reading
  // localStorage again — the DOM is the thing that is actually true, and
  // trusting it keeps the two paths from disagreeing.
  useEffect(() => {
    const applied = document.documentElement.dataset.theme;
    if (isThemeId(applied)) setThemeState(applied);
    setReady(true);
  }, []);

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next);
    const root = document.documentElement;
    for (const id of THEME_IDS) root.classList.remove(`theme-${id}`);
    root.classList.add(`theme-${next}`);
    root.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode; the choice just won't survive a reload */
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, ready }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
