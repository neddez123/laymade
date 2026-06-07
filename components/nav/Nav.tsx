import Link from "next/link";
import { verticals } from "@/app/data/templates";
import { NavDropdown } from "./NavDropdown";
import { MobileNav } from "./MobileNav";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-[color:var(--bg)]/85 backdrop-blur-md border-b border-[color:var(--muted)]/20">
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 h-16 flex items-center justify-between gap-8">
        <Link
          href="/"
          className="font-[family-name:var(--font-serif)] text-2xl text-[color:var(--ink)] leading-none"
        >
          laymade
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {verticals.map((v) => (
            <NavDropdown
              key={v.id}
              vertical={v.id}
              label={v.label}
              status={v.status}
            />
          ))}
          <Link
            href="/assess"
            className="text-[11px] uppercase tracking-[0.12em] text-[color:var(--accent)] hover:opacity-70 transition-opacity py-2"
          >
            Assess
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-6 text-[11px] uppercase tracking-[0.12em] text-[color:var(--ink-soft)]">
          <a href="mailto:hello@laymade.co" className="hover:text-[color:var(--ink)] transition-colors">
            Email
          </a>
          <a href="tel:+440000000000" className="hover:text-[color:var(--ink)] transition-colors">
            Call
          </a>
        </div>

        <MobileNav />
      </div>
    </header>
  );
}
