"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { featuredTemplates } from "@/app/data/templates";
import { TemplateCard } from "@/components/templates/TemplateCard";

const PARALLAX_STRENGTH = 22; // px — image shifts at most ±22px; image scale(1.1) gives ~34px buffer at 340px card width

export function FeaturedTemplates() {
  const items = featuredTemplates();
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const applyParallax = () => {
    const el = containerRef.current;
    if (!el) return;
    const { left: cLeft, width: cWidth } = el.getBoundingClientRect();
    const containerCenter = cLeft + cWidth / 2;

    el.querySelectorAll<HTMLElement>("[data-card]").forEach((card) => {
      const { left, width } = card.getBoundingClientRect();
      const cardCenter = left + width / 2;
      // Negative: card right of center → image shifts left (lagging behind scroll)
      const offset = -((cardCenter - containerCenter) / cWidth) * PARALLAX_STRENGTH;
      const img = card.querySelector<HTMLElement>("[data-parallax]");
      if (img) img.style.transform = `scale(1.1) translateX(${offset}px)`;
    });
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const max = el.scrollWidth - el.offsetWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 0);
      applyParallax();
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    applyParallax();

    const onResize = () => applyParallax();
    window.addEventListener("resize", onResize, { passive: true });

    // --- Image fade with directional spring ---
    const imageContainers = el.querySelectorAll<HTMLElement>("[data-image-container]");

    // Cards already in view on mount: show immediately, no animation
    const containerRect = el.getBoundingClientRect();
    imageContainers.forEach((img) => {
      const r = img.getBoundingClientRect();
      const visible = r.left < containerRect.right && r.right > containerRect.left;
      img.style.opacity = visible ? "1" : "0";
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          const rootBounds = entry.rootBounds;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.08) {
            const cardCx = entry.boundingClientRect.left + entry.boundingClientRect.width / 2;
            const rootCx = rootBounds ? rootBounds.left + rootBounds.width / 2 : cardCx;
            const xStart = cardCx > rootCx ? 14 : -14;

            // Snap to start state, then animate to rest
            target.style.transition = "none";
            target.style.opacity = "0";
            target.style.transform = `scale(0.96) translateX(${xStart}px)`;
            target.getBoundingClientRect(); // force reflow

            target.style.transition =
              "opacity 420ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)";
            target.style.opacity = "1";
            target.style.transform = "scale(1) translateX(0)";
          } else if (!entry.isIntersecting) {
            target.style.transition = "opacity 160ms linear";
            target.style.opacity = "0";
          }
        });
      },
      { root: el, threshold: [0, 0.08] }
    );

    imageContainers.forEach((img) => observer.observe(img));

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      observer.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <div className="relative -mx-6 md:-mx-12">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-4 md:w-6 z-10 bg-gradient-to-r from-[color:var(--bg)] to-transparent opacity-60" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-4 md:w-6 z-10 bg-gradient-to-l from-[color:var(--bg)] to-transparent opacity-60" />

        <div
          ref={containerRef}
          className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: "x mandatory" }}
        >
          <div className="flex gap-6 md:gap-8 px-6 md:px-12 pb-2">
            {items.map((t, i) => (
              <div
                key={t.slug}
                data-card
                className="shrink-0 w-[260px] md:w-[340px]"
                style={{ scrollSnapAlign: "start" }}
              >
                <TemplateCard template={t} priority={i < 2} />
              </div>
            ))}
            <div className="shrink-0 w-6 md:w-12" aria-hidden />
          </div>
        </div>
      </div>

      {/* Scroll progress bar */}
      <div className="mt-8 h-[1px] bg-[color:var(--muted)]/25 relative overflow-hidden">
        <div
          className="absolute left-0 top-0 bottom-0 w-full bg-[color:var(--ink)] origin-left"
          style={{
            transform: `scaleX(${progress})`,
            transition: "transform 80ms linear",
          }}
        />
      </div>
    </section>
  );
}
