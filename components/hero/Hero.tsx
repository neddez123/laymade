import { HeroPreviewCard } from "./HeroPreviewCard";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 md:px-12 pt-12 md:pt-24 pb-16 md:pb-32 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-center">
      <div className="md:col-span-5 flex flex-col gap-8 md:gap-10">
        <h1
          className="font-[family-name:var(--font-serif)] text-[color:var(--ink)] leading-[0.95] -tracking-[0.02em]"
          style={{ fontSize: "var(--fs-hero)" }}
        >
          Premium websites for independent businesses.
        </h1>

        <p className="text-lg md:text-xl text-[color:var(--ink-soft)] max-w-[34ch] leading-relaxed">
          Built fast, and yours from day one.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Button href="#templates" variant="primary">
            View templates
          </Button>
          <Button href="#contact" variant="ghost">
            Talk to Ben
          </Button>
        </div>
      </div>

      <div className="md:col-span-7 md:pl-6">
        <HeroPreviewCard />
      </div>
    </section>
  );
}
