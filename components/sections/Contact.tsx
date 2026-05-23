export function Contact() {
  return (
    <section
      id="contact"
      className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-32 border-t border-[color:var(--muted)]/30 scroll-mt-24"
    >
      <div className="flex flex-col items-center text-center gap-12 md:gap-16">
        <h2
          className="font-[family-name:var(--font-serif)] text-[color:var(--ink)] leading-[0.95] -tracking-[0.02em] italic"
          style={{ fontSize: "var(--fs-section)" }}
        >
          Talk to Ben.
        </h2>

        <div className="flex flex-col items-center gap-6 md:gap-8">
          <a
            href="mailto:hello@laymade.co"
            className="font-[family-name:var(--font-serif)] text-3xl md:text-5xl text-[color:var(--ink)] hover:text-[color:var(--accent)] transition-colors duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] leading-none"
          >
            hello@laymade.co
          </a>
          <a
            href="tel:+440000000000"
            className="font-[family-name:var(--font-serif)] text-3xl md:text-5xl text-[color:var(--ink)] hover:text-[color:var(--accent)] transition-colors duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] leading-none"
          >
            +44 0000 000 000
          </a>
          <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)] mt-4">
            Reply within 24 hours, Monday to Friday.
          </p>
        </div>
      </div>
    </section>
  );
}
