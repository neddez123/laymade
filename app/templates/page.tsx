import { Suspense } from "react";
import type { Metadata } from "next";
import { Nav } from "@/components/nav/Nav";
import { Footer } from "@/components/ui/Footer";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { TemplateFilterStrip } from "@/components/templates/TemplateFilterStrip";
import {
  templates,
  verticals,
  type Vertical,
  type Template,
} from "@/app/data/templates";

export const metadata: Metadata = {
  title: "All templates · Laymade",
  description:
    "Production-ready website templates for beauty studios and trades. Each one is yours to own.",
};

type SearchParams = Promise<{ vertical?: string }>;

export default async function TemplatesIndexPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const filterValue = params.vertical as Vertical | undefined;
  const validFilter = filterValue && verticals.some((v) => v.id === filterValue)
    ? filterValue
    : undefined;

  const filtered = validFilter
    ? templates.filter((t) => t.vertical === validFilter)
    : templates;

  const placeholderVerticals = validFilter
    ? verticals.filter((v) => v.id === validFilter && v.status === "coming-soon")
    : verticals.filter((v) => v.status === "coming-soon");

  const placeholders: Template[] = placeholderVerticals.flatMap((v) =>
    [0, 1].map((idx) => ({
      slug: `${v.id}-coming-soon-${idx}`,
      name: `${v.label} Template ${idx + 1}`,
      vertical: v.id,
      tier: "starter" as const,
      blurb: "Coming Q3 2026. Want early access? Get in touch.",
      heroScreenshot: "",
      liveUrl: null,
      featured: false,
      status: "coming-soon" as const,
    }))
  );

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px] px-6 md:px-12 py-16 md:py-24">
        <div className="flex flex-col gap-4 mb-16 md:mb-20 max-w-[640px]">
          <h1
            className="font-[family-name:var(--font-serif)] text-[color:var(--ink)] leading-[0.95] -tracking-[0.02em]"
            style={{ fontSize: "var(--fs-section)" }}
          >
            All templates
          </h1>
          <p className="text-lg text-[color:var(--ink-soft)] leading-relaxed">
            Production-ready starting points for independent businesses across beauty
            and trades. Each one is yours to own.
          </p>
        </div>

        <Suspense fallback={null}>
          <TemplateFilterStrip />
        </Suspense>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
          {filtered.map((t, i) => (
            <TemplateCard key={t.slug} template={t} priority={i < 2} />
          ))}
          {placeholders.map((t) => (
            <TemplateCard key={t.slug} template={t} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
