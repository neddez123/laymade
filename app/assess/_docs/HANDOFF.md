# Website Assessor — Handoff

## Phase completed
Phase 2 — AI verdict endpoint + email gate UI. All files compile clean; production build succeeds.

## Key decisions locked in
- **Stack:** Next.js API route (server-side fetch) + cheerio for HTML parsing + Google PageSpeed Insights API (free, no auth). No headless browser needed.
- **AI verdict:** gated behind email capture. Separate endpoint `/api/assess/verdict`. Uses Claude Sonnet 4.6 (spec-mandated for cost: ~10-20p per call).
- **6 scoring categories:** Conversion 30%, Performance 20%, Mobile 20%, Technical 15%, Accessibility 10%, Design/AI Slop 5%
- **30+ individual checks** — all implemented in `lib/assess/checks.ts`
- **cheerio** installed at v1.2.0. `@types/cheerio` also installed (legacy, but harmless).
- **tsconfig target ES2017** — avoided `s` (dotAll) regex flag; used `[\s\S]` patterns instead.
- **Rate limiting (main):** in-memory Map; 1 req per 30s per IP, max 10/hour. Bypass via `ASSESS_RATE_LIMIT_SECRET` env + `x-assess-secret` header.
- **Rate limiting (verdict):** 1 verdict per email address per hour (in-memory Map, keyed by lowercased email).
- **Hard timeout (main):** 15s total via `AbortController`.
- **HTML fetch (verdict):** 10s timeout, best-effort; proceeds without HTML if site is slow or blocked.
- **Claude call:** no AbortController — relies on SDK's own timeout/error handling. Model: `claude-sonnet-4-6`, max_tokens: 1200. Strips markdown code fences from response before JSON.parse.
- **Dev server port:** currently on 3001 (3000 has a stale process at PID 1103 — kill it to reclaim 3000).

## Current file state
- `laymade/app/assess/CLAUDE.md` — full product spec
- `laymade/app/assess/_docs/HANDOFF.md` — this file
- `laymade/app/assess/page.tsx` — Phase 2 UI: 4 main states + AI verdict state machine (idle/loading/done/error), email gate form, AiVerdictSection component
- `laymade/lib/assess/types.ts` — all TypeScript types including new `AiVerdict`
- `laymade/lib/assess/checks.ts` — all 35 deterministic check functions + `runAllChecks()` runner
- `laymade/lib/assess/pagespeed.ts` — PageSpeed Insights API wrapper (optional `PAGESPEED_API_KEY` env)
- `laymade/lib/assess/score.ts` — `buildAssessmentResult()`: category scoring + overall score + grade + verdict
- `laymade/app/api/assess/route.ts` — POST handler: rate limit → URL validation → fetch HTML → CSS → PageSpeed (parallel) → run checks → score → return JSON
- `laymade/app/api/assess/verdict/route.ts` — POST handler: email validation → rate limit → re-fetch HTML → build prompt → Claude Sonnet 4.6 call → return AiVerdict JSON

## Verified working
- `npx tsc --noEmit` — clean, no errors
- `npm run build` — clean production build, both API routes registered as Dynamic
- All four UI states: empty, loading, results, error
- AI verdict state machine: idle → loading → done/error
- Email gate: form shows in CTA section; after submission, loading dots animate; on success, AiVerdictSection renders above CTA with dark background, italic verdict quote, feel badge, numbered observations, brand fit + copy quality
- `ANTHROPIC_API_KEY` must be set in `.env.local` for the verdict endpoint to function

## Open questions / TODOs
- `PAGESPEED_API_KEY`: free tier works for testing; set env var for production to avoid rate limits
- `ASSESS_RATE_LIMIT_SECRET`: set in `.env.local` to bypass rate limit during UI development
- `ANTHROPIC_API_KEY`: **required** in `.env.local` for AI verdict endpoint
- Kill stale PID 1103 to reclaim port 3000 if desired: `kill 1103`
- Future: persist leads (email addresses submitted for verdicts) to a DB or webhook
- Future: Phase 3 — polish pass on the results UI, mobile optimization
