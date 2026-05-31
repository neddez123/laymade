import Link from "next/link";
import Image from "next/image";
import placeholderSvg from "./images/placeholder.svg";

const rows = [
  {
    stat: "0.05s",
    headline: "That's how long it takes a visitor to judge your website",
    body: "Before they've read your business name, seen your services, or checked your prices, they've already formed an opinion. Research from Carleton University found that visual judgments happen in just 50 milliseconds. First impressions are made entirely on how your site looks.",
    citation: {
      text: "Lindgaard et al. (2006) · Behaviour & Information Technology, Carleton University",
      url: "https://www.tandfonline.com/doi/abs/10.1080/01449290500330448",
    },
    imageRight: true,
  },
  {
    stat: "94%",
    headline: "Of the reasons people distrust a website, almost all are design-related",
    body: "When researchers analysed why people rejected websites, 94% of reasons were visual: cluttered layouts, poor navigation, uninspiring design. Just 6% were about the actual content. Your words and services matter, but visitors won't read them if the design puts them off first.",
    citation: {
      text: "Sillence et al. (2004) · CHI Conference on Human Factors, Northumbria University",
      url: "https://dl.acm.org/doi/10.1145/985692.985776",
    },
    imageRight: false,
  },
  {
    stat: "#1",
    headline: "Professional design is the biggest trust signal online",
    body: "Stanford's Web Credibility Study of 1,481 people found that a professionally designed website ranked as a stronger trust signal than having a privacy policy, appearing at the top of Google, or being personally recommended. Design isn't cosmetic, it's the thing that makes people decide whether to trust you.",
    citation: {
      text: "Fogg et al. (2002) · Stanford Web Credibility Study, Stanford University",
      url: "https://credibility.stanford.edu/pdf/Stanford-MakovskyWebCredStudy2002-prelim.pdf",
    },
    imageRight: true,
  },
] as const;

function ImagePlaceholder() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio: "4/3", minHeight: "280px" }}>
      <Image
        src={placeholderSvg}
        alt="Image placeholder"
        fill
        className="object-cover"
      />
    </div>
  );
}

export function WhyDesignMatters() {
  return (
    <section className="bg-[color:var(--paper)] border-t border-b border-[color:var(--muted)]/25">
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 py-24 md:py-36">

        {/* Section header */}
        <div className="mb-20 md:mb-28">
          <h2
            className="font-[family-name:var(--font-serif)] text-[color:var(--ink)] leading-tight -tracking-[0.01em] mb-4"
            style={{ fontSize: "var(--fs-section)" }}
          >
            Why design matters
          </h2>
          <p className="text-[17px] text-[color:var(--ink-soft)] leading-relaxed">
            Your website is your first impression. Make it count.
          </p>
        </div>

        {/* Feature rows */}
        <div className="flex flex-col">
          {rows.map((row, i) => (
            <div
              key={row.stat}
              className={[
                "grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center",
                i < rows.length - 1
                  ? "pb-20 md:pb-28 mb-20 md:mb-28 border-b border-[color:var(--muted)]/25"
                  : "",
              ].join(" ")}
            >
              {/* Content — always first in DOM so it stacks above image on mobile */}
              <div className={`flex flex-col gap-5 ${!row.imageRight ? "md:order-last" : ""}`}>
                <span
                  className="font-[family-name:var(--font-serif)] italic text-[color:var(--ink)] leading-none -tracking-[0.02em] select-none"
                  style={{ fontSize: "clamp(4.5rem, 10vw, 8.5rem)" }}
                >
                  {row.stat}
                </span>

                <h3 className="text-[21px] md:text-[25px] font-semibold text-[color:var(--ink)] leading-snug max-w-[44ch]">
                  {row.headline}
                </h3>

                <p className="text-[15px] md:text-[16px] text-[color:var(--ink-soft)] leading-relaxed max-w-[52ch]">
                  {row.body}
                </p>

                <Link
                  href={row.citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[color:var(--muted)] underline underline-offset-2 decoration-[color:var(--muted)]/40 hover:text-[color:var(--ink-soft)] hover:decoration-[color:var(--ink-soft)]/50 transition-colors mt-1 leading-relaxed inline-block"
                >
                  {row.citation.text}
                </Link>
              </div>

              {/* Image */}
              <div className={!row.imageRight ? "md:order-first" : ""}>
                <ImagePlaceholder />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
