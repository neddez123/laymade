export function SocialProof() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32 border-t border-[color:var(--muted)]/30">
      {/* PLACEHOLDER: testimonials live here once first clients are onboarded */}
      <h2
        className="font-[family-name:var(--font-serif)] text-[color:var(--ink)] leading-tight -tracking-[0.01em] mb-12 md:mb-16"
        style={{ fontSize: "var(--fs-section)" }}
      >
        What clients say
      </h2>

      <div className="bg-[color:var(--paper)] border border-[color:var(--muted)]/30 p-10 md:p-16 max-w-[720px] mx-auto text-center">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)] mb-5">
          Coming soon
        </p>
        <p className="font-[family-name:var(--font-serif)] text-2xl md:text-3xl text-[color:var(--ink-soft)] leading-snug italic">
          &ldquo;First clients onboarding now. Testimonials will live here once
          they&rsquo;re ready.&rdquo;
        </p>
      </div>
    </section>
  );
}
