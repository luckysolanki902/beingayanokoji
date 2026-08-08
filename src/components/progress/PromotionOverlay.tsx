"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useProgress, deriveCurrentClass } from "@/components/progress/ProgressProvider";
import { CLASS_ORDER, getClass, type ClassId } from "@/lib/curriculum";

/**
 * The promotion.
 *
 * Fires once, the first time the reader's derived class is higher than the one
 * their record has already acknowledged — so it cannot re-trigger on a refresh,
 * and it survives finishing the last lecture in a tab that then gets closed.
 *
 * The animation is the old class letter being replaced by the new one, held
 * long enough to register and then dismissed by any click. It is the one
 * genuinely theatrical moment on the site, which is why nothing else is.
 */
export function PromotionOverlay({ orderedSlugs }: { orderedSlugs: string[] }) {
  const { ready, completed, promotions, acknowledgePromotion } = useProgress();
  const [mounted, setMounted] = useState(false);
  const [showing, setShowing] = useState<ClassId | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!ready) return;
    const current = deriveCurrentClass(orderedSlugs, completed);
    // Class D is where everyone starts; arriving there is not an achievement
    // and announcing it would cheapen the ones that are.
    if (current === "D") return;
    if (promotions[current]) return;
    setShowing(current);
  }, [ready, completed, promotions, orderedSlugs]);

  function dismiss() {
    if (showing) acknowledgePromotion(showing);
    setShowing(null);
  }

  useEffect(() => {
    if (!showing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") dismiss();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  });

  if (!mounted) return null;

  const from = showing
    ? CLASS_ORDER[Math.max(0, CLASS_ORDER.indexOf(showing) - 1)]
    : null;

  return createPortal(
    <AnimatePresence>
      {showing && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[color:var(--bg)] px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onClick={dismiss}
          role="dialog"
          aria-modal="true"
          aria-label={getClass(showing).promotion}
        >
          <div
            className="genkou-grid genkou-fade pointer-events-none absolute inset-0"
            aria-hidden="true"
          />

          <motion.p
            className="font-hand relative text-xs tracking-[0.3em] text-[color:var(--muted)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            クラス替え
          </motion.p>

          {/* The old letter leaves, the new one arrives in its place. */}
          <div className="relative mt-8 flex h-40 items-center justify-center gap-8 md:h-52">
            {from && from !== showing && (
              <motion.span
                className="font-serif text-[5rem] text-[color:var(--faint)] md:text-[7rem]"
                initial={{ opacity: 0.9, scale: 1 }}
                animate={
                  reduce
                    ? { opacity: 0.25 }
                    : { opacity: 0.15, scale: 0.72, filter: "blur(3px)" }
                }
                transition={{ delay: 0.7, duration: 1 }}
              >
                {from === "GRAD" ? "卒" : from}
              </motion.span>
            )}

            <motion.span
              className="font-serif text-[6rem] text-[color:var(--accent)] md:text-[9rem]"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 1, type: "spring", stiffness: 160, damping: 18 }}
            >
              {showing === "GRAD" ? "卒" : showing}
            </motion.span>
          </div>

          <motion.h2
            className="font-serif relative mt-4 max-w-lg text-center text-2xl tracking-tight md:text-4xl"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
          >
            {getClass(showing).promotion}
          </motion.h2>

          <motion.p
            className="relative mx-auto mt-5 max-w-md text-center text-sm leading-relaxed text-[color:var(--muted)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.9, duration: 0.6 }}
          >
            {getClass(showing).brief}
          </motion.p>

          <motion.p
            className="relative mt-10 text-[10px] uppercase tracking-[0.28em] text-[color:var(--faint)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
          >
            Click anywhere to continue
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
