"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Template } from "@/app/data/templates";

type Props = {
  template: Template;
  priority?: boolean;
};

export function TemplateCard({ template, priority = false }: Props) {
  const isComingSoon = template.status === "coming-soon";

  return (
    <Link
      href={isComingSoon ? "#" : `/templates/${template.slug}`}
      className={`group block ${isComingSoon ? "pointer-events-none" : ""}`}
      aria-disabled={isComingSoon}
      tabIndex={isComingSoon ? -1 : undefined}
    >
      <motion.article
        whileHover={isComingSoon ? undefined : { y: -3 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className={`flex flex-col gap-5 ${isComingSoon ? "opacity-55" : ""}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-[color:var(--paper)] border border-[color:var(--muted)]/30">
          <span className={`absolute top-3 left-3 z-10 text-[9px] uppercase tracking-[0.14em] px-2 py-1 border backdrop-blur-sm ${
            template.tier === "standard"
              ? "bg-[color:var(--accent)] text-[color:var(--paper)] border-[color:var(--accent)]"
              : "bg-[color:var(--paper)]/90 text-[color:var(--ink-soft)] border-[color:var(--muted)]/40"
          }`}>
            {template.tier}
          </span>
          {isComingSoon || !template.heroScreenshot ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)] p-4 text-center">
              <span className="font-[family-name:var(--font-serif)] text-3xl tracking-normal normal-case text-[color:var(--muted)]">
                Coming Q3
              </span>
              <span>2026</span>
            </div>
          ) : (
            <Image
              src={template.heroScreenshot}
              alt={`${template.name} hero preview`}
              fill
              priority={priority}
              sizes="(max-width: 768px) 300px, 400px"
              className="object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.015]"
            />
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-[family-name:var(--font-serif)] text-2xl md:text-3xl text-[color:var(--ink)] leading-tight">
              {template.name}
            </h3>
            <span className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted)] shrink-0">
              {template.vertical}
            </span>
          </div>
          <p className="text-[15px] text-[color:var(--ink-soft)] leading-relaxed max-w-[44ch]">
            {template.blurb}
          </p>
        </div>
      </motion.article>
    </Link>
  );
}
