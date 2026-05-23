import Link from "next/link";
import { featuredTemplates } from "@/app/data/templates";
import { TemplateCard } from "@/components/templates/TemplateCard";

export function FeaturedTemplates() {
  const items = featuredTemplates();

  return (
    <section
      id="templates"
      className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32 scroll-mt-24"
    >
      <div className="flex items-baseline justify-between gap-6 mb-12 md:mb-16">
        <h2
          className="font-[family-name:var(--font-serif)] text-[color:var(--ink)] leading-tight -tracking-[0.01em]"
          style={{ fontSize: "var(--fs-section)" }}
        >
          Templates
        </h2>
        <Link
          href="/templates"
          className="text-[11px] uppercase tracking-[0.12em] text-[color:var(--ink-soft)] hover:text-[color:var(--accent)] transition-colors"
        >
          View all →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
        {items.map((t, i) => (
          <TemplateCard key={t.slug} template={t} priority={i < 2} />
        ))}
      </div>
    </section>
  );
}
