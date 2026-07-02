import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";

const tiers = [
  {
    name: "Starter",
    price: "£300",
    blurb: "One template, hand-customised to your brand.",
    inherits: null,
    features: [
      "Single-page scrolling site",
      "Template customised to your brand",
      "Logo, colours, and copy applied",
      "Photos and booking embed integrated",
      "Smooth entrance animations",
      "Mobile-first, deployed to your domain",
      "1 discovery call",
      "1 round of revisions",
    ],
  },
  {
    name: "Standard",
    price: "£500",
    blurb: "Custom layout across multiple pages, with advanced motion.",
    inherits: "Starter",
    features: [
      "3-5 pages",
      "Custom layout, not template-constrained",
      "Advanced micro-interactions",
      "Gallery and testimonials section",
      "Performance and image optimisation",
      "2 calls",
      "2 rounds of revisions",
    ],
  },
  {
    name: "Bespoke",
    price: "POA",
    blurb: "Wholly custom site built around your business from the ground up.",
    inherits: "Standard",
    features: [
      "Full discovery process",
      "Custom graphics and illustrations",
      "Video content, e.g. timelapses",
      "Cinematic scroll-driven animations",
      "Dedicated comms throughout",
    ],
  },
];

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className="shrink-0 mt-[2px]"
    >
      <path
        d="M2.5 7L5.5 10L11.5 4"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Pricing() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32 border-t border-[color:var(--muted)]/30">
      <div className="flex items-baseline justify-between gap-6 mb-16 md:mb-20">
        <h2
          className="font-[family-name:var(--font-serif)] text-[color:var(--ink)] leading-tight -tracking-[0.01em]"
          style={{ fontSize: "var(--fs-section)" }}
        >
          Pricing
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
        {tiers.map((tier, i) => (
          <FadeIn key={tier.name} delay={i * 100}>
          <div
            className="bg-[color:var(--paper)] border border-[color:var(--muted)]/30 p-8 flex flex-col gap-8 h-full"
          >
            <div className="flex flex-col gap-2">
              <h3 className="font-[family-name:var(--font-serif)] text-2xl text-[color:var(--ink)]">
                {tier.name}
              </h3>
              <p className="text-[13px] text-[color:var(--ink-soft)] leading-relaxed">
                {tier.blurb}
              </p>
              <p
                className="font-[family-name:var(--font-serif)] text-[color:var(--ink)] mt-1"
                style={{ fontSize: "var(--fs-xl, 1.75rem)" }}
              >
                {tier.price}
              </p>
            </div>

            <div className="flex flex-col gap-3 flex-1">
              {tier.inherits && (
                <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)] pb-1 border-b border-[color:var(--muted)]/20">
                  Everything in {tier.inherits}, plus:
                </p>
              )}
              <ul className="flex flex-col gap-2.5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <CheckIcon />
                    <span className="text-[13px] text-[color:var(--ink-soft)] leading-snug">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          </FadeIn>
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
