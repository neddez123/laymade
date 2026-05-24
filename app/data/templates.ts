export type Vertical = "beauty" | "trades" | "lettings";
export type TemplateStatus = "live" | "coming-soon";

export interface Template {
  slug: string;
  name: string;
  vertical: Vertical;
  blurb: string;
  heroScreenshot: string;
  liveUrl: string | null;
  featured: boolean;
  status: TemplateStatus;
}

export const verticals: { id: Vertical; label: string; status: "live" | "coming-soon" }[] = [
  { id: "beauty",   label: "Beauty",   status: "live" },
  { id: "trades",   label: "Trades",   status: "coming-soon" },
  { id: "lettings", label: "Lettings", status: "coming-soon" },
];

export const templates: Template[] = [
  {
    slug: "maison-elite",
    name: "Maison Élite",
    vertical: "beauty",
    blurb: "Luxury editorial salon site. Black and taupe, Libre Baskerville on Mulish, sharp.",
    heroScreenshot: "/screenshots/maison-elite-hero.jpg",
    liveUrl: "https://maison-elite-nine.vercel.app",
    featured: true,
    status: "live",
  },
  {
    slug: "the-bloom-room",
    name: "The Bloom Room",
    vertical: "beauty",
    blurb: "Warm boutique salon site. Cream and terracotta, Cormorant on DM Sans, rounded.",
    heroScreenshot: "/screenshots/bloom-room-hero.jpg",
    liveUrl: "https://bloom-room-gamma.vercel.app",
    featured: true,
    status: "live",
  },
];

export const featuredTemplates = (): Template[] =>
  templates.filter((t) => t.featured && t.status === "live");

export const templatesByVertical = (vertical: Vertical): Template[] =>
  templates.filter((t) => t.vertical === vertical);

export const templateBySlug = (slug: string): Template | undefined =>
  templates.find((t) => t.slug === slug);
