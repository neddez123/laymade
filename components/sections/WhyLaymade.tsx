const items = [
  {
    numeral: "01",
    title: "Yours, not rented",
    body: "Every site is handed off complete: codebase, deploy, and domain. No subscriptions, no lock-in, no hostage situations when you want to make changes.",
  },
  {
    numeral: "02",
    title: "Built in a week",
    body: "Templates are designed for fast turnaround. Start Monday, live by Friday. We spend the time you save on the parts that actually need bespoke thought.",
  },
  {
    numeral: "03",
    title: "No agency markup",
    body: "Most agencies charge five figures for what's essentially a templated build. We do the same work, properly, without the inflated overheads.",
  },
];

export function WhyLaymade() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32 border-t border-[color:var(--muted)]/30">
      {/* PLACEHOLDER: refine copy with real numbers/proof once available */}
      <h2
        className="font-[family-name:var(--font-serif)] text-[color:var(--ink)] leading-tight -tracking-[0.01em] mb-16 md:mb-20"
        style={{ fontSize: "var(--fs-section)" }}
      >
        Why Laymade
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-14">
        {items.map((item) => (
          <div key={item.numeral} className="flex flex-col gap-5">
            <span className="font-[family-name:var(--font-serif)] text-[80px] leading-none text-[color:var(--muted)]/80">
              {item.numeral}
            </span>
            <h3 className="text-[22px] font-medium text-[color:var(--ink)] leading-tight">
              {item.title}
            </h3>
            <p className="text-[15px] text-[color:var(--ink-soft)] leading-relaxed">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
