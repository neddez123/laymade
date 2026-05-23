import Link from "next/link";
import type { Template } from "@/app/data/templates";

type Props = { template: Template };

export function TemplatePreviewFrame({ template }: Props) {
  return (
    <div className="flex flex-col h-screen bg-[color:var(--bg)]">
      <div className="sticky top-0 z-50 h-14 bg-[color:var(--bg)] border-b border-[color:var(--muted)]/30">
        <div className="h-full max-w-[1280px] mx-auto px-6 md:px-12 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)] hover:text-[color:var(--ink)] transition-colors"
          >
            ← Back to Laymade
          </Link>

          <div className="flex items-baseline gap-3 min-w-0">
            <span className="font-[family-name:var(--font-serif)] text-base md:text-lg text-[color:var(--ink)] truncate">
              {template.name}
            </span>
            <span className="text-[10px] md:text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)] shrink-0">
              {template.vertical}
            </span>
          </div>

          {template.liveUrl ? (
            <a
              href={template.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)] hover:text-[color:var(--accent)] transition-colors whitespace-nowrap"
            >
              View live ↗
            </a>
          ) : (
            <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)] whitespace-nowrap">
              Preview only
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 bg-[color:var(--paper)] relative">
        {template.liveUrl ? (
          <iframe
            src={template.liveUrl}
            title={`${template.name} live preview`}
            className="w-full h-full border-0 absolute inset-0"
            sandbox="allow-scripts allow-same-origin allow-forms"
            loading="eager"
          />
        ) : (
          <div className="h-full flex items-center justify-center px-6 text-center">
            <div className="max-w-md flex flex-col gap-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Preview pending deployment
              </p>
              <p className="font-[family-name:var(--font-serif)] text-3xl text-[color:var(--ink)] leading-tight">
                {template.name}
              </p>
              <p className="text-[15px] text-[color:var(--ink-soft)] leading-relaxed">
                {template.blurb}
              </p>
              <p className="text-[12px] text-[color:var(--muted)] mt-4">
                Live preview lights up once this template is deployed to Vercel and{" "}
                <code className="font-mono text-[11px] bg-[color:var(--bg)] px-1.5 py-0.5 border border-[color:var(--muted)]/30">
                  liveUrl
                </code>{" "}
                is set in <code className="font-mono text-[11px] bg-[color:var(--bg)] px-1.5 py-0.5 border border-[color:var(--muted)]/30">templates.ts</code>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
