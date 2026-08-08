"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { PointsShop } from "@/components/points/PointsShop";

export function SupportButton() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) {
        e.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    const focusFrame = requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      triggerRef.current?.focus();
    };
  }, [open]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(true)}
        data-track="support.open"
        data-track-label="header"
        className="mx-auto flex min-h-11 items-center rounded-full border border-[color:var(--accent)]/40 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-[color:var(--accent)] transition-colors hover:border-[color:var(--accent)] hover:bg-[color:var(--accent)]/10 sm:min-h-0 sm:px-3 sm:text-[11px] sm:tracking-[0.18em] md:text-xs"
      >
        Buy points
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="overlay"
                className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4 md:p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOpen(false)}
              >
                <motion.div
                  ref={panelRef}
                  key="panel"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Buy personal points"
                  tabIndex={-1}
                  className="relative max-h-[94dvh] w-full overflow-y-auto overscroll-contain sm:max-h-[90vh] sm:max-w-2xl lg:max-w-4xl"
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.97 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    ref={closeRef}
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
