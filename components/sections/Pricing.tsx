import { Button } from "@/components/ui/Button";

const tiers = [
  {
    name: "Starter",
    blurb: "One template, hand-customised. Logo, copy, photography integration.",
  },
  {
    name: "Standard",
    blurb: "Custom template work. Tailored layout, bespoke sections, deployment.",
  },
  {
    name: "Bespoke",
    blurb: "Wholly custom site. Discovery, design system, build, launch support.",
  },
];

export function Pricing() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32 border-t border-[color:var(--muted)]/30">
      {/* PLACEHOLDER: pricing tiers + real numbers TBD */}
      <div className="flex items-baseline justify-between gap-6 mb-16 md:mb-20">
        <h2
          className="font-[family-name:var(--font-serif)] text-[color:var(--ink)] leading-tight -tracking-[0.01em]"
          style={{ fontSize: "var(--fs-section)" }}
        >
          Pricing
        </h2>
        <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
          In development
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className="bg-[color:var(--paper)] border border-[color:var(--muted)]/30 p-8 flex flex-col gap-6 min-h-[280px]"
          >
            <div className="flex flex-col gap-1">
              <h3 className="font-[family-name:var(--font-serif)] text-2xl text-[color:var(--ink)]">
                {tier.name}
              </h3>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)] mt-2">
                Quote on request
              </p>
            </div>
            <p className="text-[15px] text-[color:var(--ink-soft)] leading-relaxed">
              {tier.blurb}
            </p>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Button href="#contact" variant="ghost">
          Get a quote
        </Button>
      </div>
    </section>
  );
}
