import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { templates, templateBySlug } from "@/app/data/templates";
import { TemplatePreviewFrame } from "@/components/templates/TemplatePreviewFrame";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return templates
    .filter((t) => t.status === "live")
    .map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const template = templateBySlug(slug);
  if (!template) return { title: "Template not found · Laymade" };
  return {
    title: `${template.name} · Laymade`,
    description: template.blurb,
  };
}

export default async function TemplatePreviewPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const template = templateBySlug(slug);
  if (!template) notFound();
  return <TemplatePreviewFrame template={template} />;
}
