"use client";

import { motion } from "motion/react";

export function BlinkingCursor({ className }: { className?: string }) {
  return (
    <motion.span
      className={`inline-block align-baseline ${className ?? ""}`}
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
      aria-hidden
    >
      ▍
    </motion.span>
  );
}
