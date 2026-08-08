"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { PointsShop } from "@/components/points/PointsShop";

export function SupportButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        data-track="support.open"
        data-track-label="header"
        className="rounded-full border border-[color:var(--accent)]/40 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent)] transition-colors hover:border-[color:var(--accent)] hover:bg-[color:var(--accent)]/10 md:text-xs"
      >
        Buy points
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="overlay"
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/75 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOpen(false)}
              >
                <motion.div
                  key="panel"
                  className="relative w-full max-w-[calc(100%-1rem)] sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto"
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.97 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setOpen(false)}
                    className="sticky top-3 float-right z-10 mr-3 w-8 h-8 flex items-center justify-center rounded-full bg-[color:var(--color-bg)] border border-[color:var(--color-rule)] text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] hover:border-[color:var(--color-muted)] transition-colors text-lg leading-none"
                    aria-label="Close the points counter"
                  >
                    ×
                  </button>
                  <div className="bg-[color:var(--color-bg)]">
                    <PointsShop source="header" />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
