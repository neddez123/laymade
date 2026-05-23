"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { verticals, templatesByVertical } from "@/app/data/templates";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="md:hidden flex flex-col gap-1.5 p-2 -mr-2"
      >
        <span className="block w-5 h-[1px] bg-[color:var(--ink)]" />
        <span className="block w-5 h-[1px] bg-[color:var(--ink)]" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-[color:var(--bg)] flex flex-col md:hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[color:var(--muted)]/30">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="font-[family-name:var(--font-serif)] text-2xl text-[color:var(--ink)] leading-none"
              >
                laymade
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="text-[11px] uppercase tracking-[0.12em] text-[color:var(--ink-soft)] p-2 -mr-2"
              >
                Close
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-10">
              {verticals.map((v) => {
                const items = templatesByVertical(v.id);
                return (
                  <div key={v.id} className="flex flex-col gap-3">
                    <h3 className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                      {v.label}
                      {v.status === "coming-soon" && " · soon"}
                    </h3>
                    {items.length === 0 ? (
                      <p className="text-sm text-[color:var(--ink-soft)]">
                        Coming Q3 2026.
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-3">
                        {items.map((t) => (
                          <li key={t.slug}>
                            <Link
                              href={`/templates/${t.slug}`}
                              onClick={() => setOpen(false)}
                              className="font-[family-name:var(--font-serif)] text-3xl text-[color:var(--ink)] leading-tight"
                            >
                              {t.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="px-6 py-6 border-t border-[color:var(--muted)]/30 flex flex-col gap-2 text-sm text-[color:var(--ink-soft)]">
              <a href="mailto:hello@laymade.co" className="hover:text-[color:var(--ink)] transition-colors">
                hello@laymade.co
              </a>
              <a href="tel:+440000000000" className="hover:text-[color:var(--ink)] transition-colors">
                +44 0000 000 000
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
