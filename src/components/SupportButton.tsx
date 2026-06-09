"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SupportBlock } from "./Support";

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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-accent)] transition-colors"
      >
        Support
      </button>

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
              className="relative max-w-2xl w-full"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute -top-3 -right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-[color:var(--color-bg)] border border-[color:var(--color-rule)] text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] hover:border-[color:var(--color-muted)] transition-colors text-lg leading-none"
                aria-label="Close support panel"
              >
                ×
              </button>
              <div className="bg-[color:var(--color-bg)]">
                <SupportBlock />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
