import { HeroPreviewCard } from "./HeroPreviewCard";
import { HeroText } from "./HeroText";

export function Hero() {
  return (
    // Full-width section — overflow:hidden here clips cards at the viewport edge
    // so the orbit can extend past the max-width container on the right.
    <section className="relative overflow-hidden bg-[color:var(--bg)]" style={{ minHeight: "700px" }}>

      {/* Text — constrained to max-width, with its own padding */}
      <div className="relative z-10 pointer-events-none mx-auto max-w-[1280px] px-6 md:px-12 pt-16 md:pt-28 pb-12 md:pb-32">
        <HeroText />
      </div>

      {/* 3D orbit — desktop: absolute from section top, right 60% of viewport.
          Mobile: normal flow below text with overflow clipped. */}
      <div className="
        relative md:absolute
        md:top-0 md:right-0 md:bottom-0 md:w-[60%]
        h-[360px] md:h-auto
        mx-4 md:mx-0
        mb-10 md:mb-0
        overflow-hidden md:overflow-visible
      ">
        <HeroPreviewCard />
      </div>
    </section>
  );
}
