"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { templatesByVertical, type Vertical } from "@/app/data/templates";

type Props = {
  vertical: Vertical;
  label: string;
  status: "live" | "coming-soon";
};

export function NavDropdown({ vertical, label, status }: Props) {
  const [open, setOpen] = useState(false);
  const items = templatesByVertical(vertical);
  const empty = status === "coming-soon" || items.length === 0;

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-[color:var(--ink)] hover:text-[color:var(--accent)] transition-colors py-2"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
        {status === "coming-soon" && (
          <span className="text-[color:var(--muted)] normal-case tracking-normal text-[10px]">
            soon
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "top center" }}
            className="absolute left-1/2 top-full -translate-x-1/2 pt-3 z-50"
          >
            <div className="bg-[color:var(--paper)] border border-[color:var(--muted)]/40 min-w-[280px] p-3 shadow-[0_4px_24px_rgba(22,22,22,0.06)]">
              {empty ? (
                <div className="px-3 py-4 text-sm text-[color:var(--ink-soft)]">
                  Coming Q3 2026.
                </div>
              ) : (
                <ul className="flex flex-col gap-1">
                  {items.map((t) => (
                    <li key={t.slug}>
                      <Link
                        href={`/templates/${t.slug}`}
                        className="flex items-center gap-3 px-2 py-2 hover:bg-[color:var(--bg)] transition-colors group"
                      >
                        <div className="relative w-14 h-10 overflow-hidden border border-[color:var(--muted)]/30 bg-[color:var(--bg)] shrink-0">
                          <Image
                            src={t.heroScreenshot}
                            alt={`${t.name} preview`}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-[family-name:var(--font-serif)] text-[15px] text-[color:var(--ink)] group-hover:text-[color:var(--accent)] transition-colors leading-tight">
                            {t.name}
                          </span>
                          <span className="text-[10px] uppercase tracking-[0.12em] text-[color:var(--muted)] mt-0.5">
                            {t.vertical}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
