"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CLASS_ORDER, type ClassId } from "@/lib/curriculum";

/**
 * The reader's record, kept in localStorage.
 *
 * No account, no server, nothing sent anywhere — which is the same promise the
 * rest of the site makes, and it would be strange to break it for a progress
 * bar. The cost is that the record is per-browser; that is stated plainly in
 * the interface rather than hidden.
 */

const STORAGE_KEY = "ba-progress";
const VERSION = 1;

export interface CompletionRecord {
  /** ISO timestamp of the pass. */
  at: string;
  /** Correct answers out of the quiz's length. */
  score: number;
  total: number;
}

interface ProgressState {
  version: number;
  completed: Record<string, CompletionRecord>;
  /** Classes the reader has been promoted into, in order of arrival. */
  promotions: Partial<Record<ClassId, string>>;
}

const EMPTY: ProgressState = { version: VERSION, completed: {}, promotions: {} };

interface ProgressContextValue {
  /** False during the first render pass, before localStorage has been read. */
  ready: boolean;
  completed: Record<string, CompletionRecord>;
  promotions: Partial<Record<ClassId, string>>;
  isComplete: (slug: string) => boolean;
  completeLecture: (slug: string, score: number, total: number) => void;
  /** Records that the reader has been shown the promotion for a class. */
  acknowledgePromotion: (classId: ClassId) => void;
  reset: () => void;
  count: number;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

function read(): ProgressState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    // A record written by an older version is kept rather than discarded —
    // losing someone's reading history to a schema bump would be unforgivable
    // for something this cheap to migrate leniently.
    return {
      version: VERSION,
      completed: parsed.completed ?? {},
      promotions: parsed.promotions ?? {},
    };
  } catch {
    return EMPTY;
  }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(read());
    setReady(true);
  }, []);

  const persist = useCallback((next: ProgressState) => {
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage full or blocked; the session still works, it just won't survive */
    }
  }, []);

  const completeLecture = useCallback(
    (slug: string, score: number, total: number) => {
      setState((prev) => {
        // A re-take never lowers a recorded score, and never rewrites the date
        // of the first pass. The record is of having done it, not of the last
        // time you happened to click through.
        const existing = prev.completed[slug];
        const next: ProgressState = {
          ...prev,
          completed: {
            ...prev.completed,
            [slug]: {
              at: existing?.at ?? new Date().toISOString(),
              score: Math.max(existing?.score ?? 0, score),
              total,
            },
          },
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* see above */
        }
        return next;
      });
    },
    []
  );

  const acknowledgePromotion = useCallback((classId: ClassId) => {
    setState((prev) => {
      if (prev.promotions[classId]) return prev;
      const next: ProgressState = {
        ...prev,
        promotions: { ...prev.promotions, [classId]: new Date().toISOString() },
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* see above */
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    persist(EMPTY);
  }, [persist]);

  const value = useMemo<ProgressContextValue>(
    () => ({
      ready,
      completed: state.completed,
      promotions: state.promotions,
      isComplete: (slug: string) => Boolean(state.completed[slug]),
      completeLecture,
      acknowledgePromotion,
      reset,
      count: Object.keys(state.completed).length,
    }),
    [ready, state, completeLecture, acknowledgePromotion, reset]
  );

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}

/**
 * The class the reader currently sits in: the first one they have not finished.
 *
 * Derived from completions rather than stored, so it can never disagree with
 * the record. `orderedSlugs` is the whole reading order; `sizes` is how many
 * lectures each class holds.
 */
export function deriveCurrentClass(
  orderedSlugs: string[],
  completed: Record<string, CompletionRecord>
): ClassId {
  for (let i = 0; i < CLASS_ORDER.length; i++) {
    const slice = orderedSlugs.slice(i * 10, i * 10 + 10);
    if (slice.length === 0) break;
    if (slice.some((slug) => !completed[slug])) return CLASS_ORDER[i];
  }
  return CLASS_ORDER[CLASS_ORDER.length - 1];
}

/**
 * Whether a lecture is open to the reader.
 *
 * The rule is simply "the one before it is done", which makes the curriculum a
 * line rather than a tree and keeps the explanation to one sentence. The first
 * lecture is always open — a locked front door would be absurd.
 */
export function isUnlocked(
  index: number,
  orderedSlugs: string[],
  completed: Record<string, CompletionRecord>
): boolean {
  if (index <= 0) return true;
  return Boolean(completed[orderedSlugs[index - 1]]);
}
