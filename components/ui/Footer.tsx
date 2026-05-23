import Link from "next/link";
import { verticals } from "@/app/data/templates";

export function Footer() {
  return (
    <footer className="border-t border-[color:var(--muted)]/30 mt-24">
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <Link
          href="/"
          className="font-[family-name:var(--font-serif)] text-2xl text-[color:var(--ink)] leading-none"
        >
          laymade
        </Link>

        <nav className="flex flex-wrap gap-x-8 gap-y-3 text-[11px] uppercase tracking-[0.1em] text-[color:var(--ink-soft)]">
          {verticals.map((v) => (
            <Link
              key={v.id}
              href={`/templates?vertical=${v.id}`}
              className="hover:text-[color:var(--ink)] transition-colors"
            >
              {v.label}
            </Link>
          ))}
        </nav>

        <p className="text-[11px] uppercase tracking-[0.1em] text-[color:var(--muted)]">
          © Laymade {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
