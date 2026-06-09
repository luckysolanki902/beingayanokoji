"use client";

import { motion, useReducedMotion } from "motion/react";
import { ReactNode } from "react";

type Props = {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  delay?: number;
  stagger?: number;
  yOffset?: number;
  once?: boolean;
};

export function AnimatedText({
  text,
  className,
  as = "p",
  delay = 0,
  stagger = 0.045,
  yOffset = 24,
  once = true,
}: Props) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  const container = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduce ? 0 : stagger,
        delayChildren: reduce ? 0 : delay,
      },
    },
  };

  const child = {
    hidden: { y: reduce ? 0 : yOffset, opacity: 0, filter: "blur(8px)" },
    visible: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring" as const,
        damping: 18,
        stiffness: 140,
        mass: 0.6,
      },
    },
  };

  const Component = motion[as] as typeof motion.p;

  return (
    <Component
      className={className}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.4 }}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          variants={child}
          style={{ display: "inline-block", whiteSpace: "pre" }}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </Component>
  );
}

export function FadeIn({
  children,
  delay = 0,
  className,
  y = 18,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.7,
        delay: reduce ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
