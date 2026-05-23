export function TrustStrip() {
  const items = [
    "Built with Next.js + Tailwind",
    "Yours from day one",
    "UK-based",
  ];

  return (
    <section
      aria-label="At a glance"
      className="border-y border-[color:var(--muted)]/30 bg-[color:var(--paper)]"
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-5 flex flex-wrap justify-center items-center gap-x-10 gap-y-2 text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
        {items.map((item, i) => (
          <span key={item} className="flex items-center gap-10">
            {item}
            {i < items.length - 1 && (
              <span className="text-[color:var(--muted)] hidden sm:inline" aria-hidden="true">·</span>
            )}
          </span>
        ))}
      </div>
    </section>
  );
}
