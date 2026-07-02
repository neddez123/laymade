"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

const h1Words = ["Premium", "websites", "for", "independent", "businesses."];

const wordVariant = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring" as const, duration: 0.7, bounce: 0.15 },
  },
};

export function HeroText() {
  return (
    <div className="pointer-events-auto md:w-5/12 flex flex-col gap-8 md:gap-10">
      <motion.h1
        className="font-[family-name:var(--font-serif)] text-[color:var(--ink)] leading-[0.95] -tracking-[0.02em]"
        style={{ fontSize: "var(--fs-hero)" }}
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.045 }}
        aria-label="Premium websites for independent businesses."
      >
        {h1Words.map((word, i) => (
          <Fragment key={i}>
            <motion.span className="inline-block" variants={wordVariant}>
              {word}
            </motion.span>
            {i < h1Words.length - 1 && " "}
          </Fragment>
        ))}
      </motion.h1>

      <motion.p
        className="text-lg md:text-xl text-[color:var(--ink-soft)] max-w-[34ch] leading-relaxed"
        initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ type: "spring", duration: 0.8, bounce: 0.1, delay: 0.3 }}
      >
        Built fast, and yours from day one.
      </motion.p>

      <motion.div
        className="flex flex-wrap items-center gap-4"
        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ type: "spring", duration: 0.8, bounce: 0.05, delay: 0.48 }}
      >
        <Button href="#templates" variant="primary">View templates</Button>
        <Button href="#contact" variant="ghost">Talk to Ben</Button>
      </motion.div>
    </div>
  );
}
