# Website Assessor — Product Spec

## What This Is

A lead-generation tool embedded in the Laymade agency site. Potential clients enter their current website URL and receive a scored audit report showing exactly how bad their site is — with enough specificity to embarrass and enough warmth to make a new site feel inevitable.

**Conversion goal:** visitor sees score → feels concerned → clicks "Get a free quote" or submits email.

**Target user:** UK small business owner (beauty salon, bodyshop, trades). Not technical. On their phone. May have built their site on Wix or Squarespace years ago and not touched it since.

---

## How It Works (The Pipeline)

```
User enters URL on /assess page
        ↓
POST /api/assess { url }
        ↓
Server-side: fetch(url) → raw HTML string
(no CORS issue — this runs on the server, not the browser)
        ↓
Parse HTML with cheerio (jQuery-like DOM parser for Node.js)
        ↓
Fetch all linked CSS files referenced in <link rel="stylesheet">
        ↓
Run deterministic checks on HTML + CSS + extracted text
        ↓
Call Google PageSpeed Insights API (free, no auth required)
URL: https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=URL&strategy=mobile
        ↓
Assemble AssessmentResult JSON
        ↓
Return to client → render scored report
```

### Why server-side fetch works

Browsers block cross-origin requests (CORS). A Next.js API route runs on the server — it can `fetch()` any public URL freely, parse the HTML, and return results. This is exactly how Lighthouse CI, SEO crawlers, and link checkers work. No headless browser needed for static analysis; PageSpeed Insights handles the rendered/JS layer.

---

## Dependencies to Install

```bash
npm install cheerio        # HTML parsing (jQuery-like, Node.js)
npm install @anthropic-ai/sdk  # for gated AI verdict only
```

No other new dependencies. PageSpeed Insights API needs no authentication for basic use.

---

## File Structure

```
laymade/
  app/
    assess/
      CLAUDE.md          ← this file
      page.tsx           ← UI: URL input form + results display
      _docs/             ← planning artifacts
    api/
      assess/
        route.ts         ← POST handler: fetches URL, runs checks, returns JSON
  lib/
    assess/
      checks.ts          ← all deterministic check functions
      pagespeed.ts       ← PageSpeed Insights API wrapper
      score.ts           ← scoring/weighting logic
      types.ts           ← shared types (AssessmentResult, Check, etc.)
```

---

## Scoring System

### Overall Score

Weighted average of 6 category scores, each 0–100.

| Category | Weight | Rationale |
|---|---|---|
| Conversion | 30% | The money — is the site driving calls/bookings? |
| Performance | 20% | Speed kills conversions; phones on bad signal |
| Mobile | 20% | UK small business customers are overwhelmingly on mobile |
| Technical / Trust | 15% | HTTPS, meta, OG — credibility signals |
| Accessibility | 10% | Important but least "lost revenue" obvious to client |
| Design / AI Slop | 5% | Objective tells; AI verdict adds real weight here |

**Letter grades:**

| Score | Grade | Verdict label |
|---|---|---|
| 80–100 | A | Solid |
| 65–79 | B | Could be better |
| 50–64 | C | Needs work |
| 35–49 | D | Losing you customers |
| 0–34 | F | Critical — actively hurting your business |

### Category Scoring

Each check within a category is pass/fail (or scaled). Failed checks deduct points proportionally from the category score. Category score = 100 − (weighted deductions from failed checks).

### Severity Levels

Each check has a severity used for display priority:

- **Critical** — directly costing conversions or blocking users
- **Warning** — meaningful impact, easy to miss
- **Info** — good-to-know, lower urgency

---

## The Checks

Full specification. Each entry: name, detection method, weight within category, severity, human-readable finding text.

---

### Category 1: Conversion (weight 30%)

> Does the site make it easy to contact, book, or find the business?

| Check | Detection | Weight | Severity | Pass Condition |
|---|---|---|---|---|
| `phone_tap_to_call` | `$('a[href^="tel:"]').length > 0` | 25% | Critical | Phone number is a tappable link |
| `booking_widget` | Search HTML for Fresha, Booksy, Treatwell, Calendly, Square, Acuity URLs or script embeds | 20% | Critical | At least one booking widget detected |
| `cta_above_fold` | Count `<button>` and `<a>` containing keywords: book, call, contact, quote, appointment, reserve, enquire — within first ~3000 chars of `<body>` | 20% | Critical | At least one CTA in the first screen |
| `whatsapp_link` | `$('a[href*="wa.me"], a[href*="whatsapp"]').length > 0` | 15% | Warning | WhatsApp link present |
| `contact_form` | `$('form').length > 0` | 10% | Warning | At least one form present |
| `address_present` | Regex: UK postcode pattern (`[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}`) in page text | 10% | Warning | Address/postcode detectable |

**Booking widget detection strings to search for in HTML:**
`fresha.com`, `booksy.com`, `treatwell.co.uk`, `calendly.com`, `squareup.com`, `acuityscheduling.com`, `timely.com`, `vagaro.com`, `mindbodyonline.com`

---

### Category 2: Performance (weight 20%)

> Pulled from Google PageSpeed Insights API (mobile strategy). Maps directly to Lighthouse.

| Check | Detection | Weight | Severity | Pass Condition |
|---|---|---|---|---|
| `pagespeed_score` | `lighthouseResult.categories.performance.score * 100` | 50% | Critical | Score ≥ 50 (scaled proportionally) |
| `lcp` | `lighthouseResult.audits['largest-contentful-paint'].numericValue` | 15% | Critical | LCP < 2500ms |
| `cls` | `lighthouseResult.audits['cumulative-layout-shift'].numericValue` | 15% | Warning | CLS < 0.1 |
| `page_size` | Sum of `transferSize` from network requests in PageSpeed response, OR `Content-Length` header of fetched HTML + estimated CSS | 10% | Warning | Total < 3MB |
| `image_formats` | PageSpeed `uses-webp-images` audit score | 10% | Warning | No unoptimised images flagged |

**PageSpeed API call:**
```
GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed
  ?url={encodedUrl}
  &strategy=mobile
  &category=performance
  &category=accessibility
  &category=seo
  &category=best-practices
```

No API key needed for low volume. Add `&key={PAGESPEED_API_KEY}` env var for production to avoid rate limits.

---

### Category 3: Mobile (weight 20%)

> Parsed from HTML/CSS directly.

| Check | Detection | Weight | Severity | Pass Condition |
|---|---|---|---|---|
| `viewport_meta` | `$('meta[name="viewport"]').length > 0` | 35% | Critical | Viewport meta tag present |
| `no_horizontal_scroll` | CSS scan: `overflow-x: hidden` on body/html, OR absence of fixed-width elements wider than 100vw — proxy: check for `width: NNNpx` values > 600px on block elements | 25% | Critical | No obvious overflow triggers |
| `touch_targets` | PageSpeed `tap-targets` audit pass/fail | 20% | Warning | No tap target issues flagged |
| `readable_text_size` | CSS scan for `font-size` values < 14px on body/p elements | 10% | Warning | Body text ≥ 14px |
| `responsive_layout` | CSS scan: at least one `@media` query present | 10% | Warning | Media queries detected |

---

### Category 4: Technical / Trust (weight 15%)

> Mix of fetch headers and HTML parsing.

| Check | Detection | Weight | Severity | Pass Condition |
|---|---|---|---|---|
| `https` | URL starts with `https://` AND fetch response has no SSL error | 25% | Critical | HTTPS active |
| `page_title` | `$('title').text().length` between 10–70 chars | 15% | Warning | Title present and reasonable length |
| `meta_description` | `$('meta[name="description"]').attr('content').length` between 50–160 chars | 15% | Warning | Description present and reasonable length |
| `og_tags` | `$('meta[property^="og:"]').length >= 3` | 15% | Warning | Open Graph tags present (controls WhatsApp/Facebook share) |
| `favicon` | `$('link[rel*="icon"]').length > 0` | 10% | Info | Favicon present |
| `stale_copyright` | Regex: copyright year in footer text; flag if year < currentYear - 2 | 10% | Info | Copyright year within last 2 years |
| `broken_links` | Fetch all `<a href>` links that are internal (same domain), HEAD each — flag non-200 responses | 10% | Warning | No 404s on internal links (limit to first 20 links) |

---

### Category 5: Accessibility (weight 10%)

> Mix of HTML parsing and PageSpeed a11y audit.

| Check | Detection | Weight | Severity | Pass Condition |
|---|---|---|---|---|
| `contrast` | PageSpeed `color-contrast` audit pass/fail | 30% | Critical | No contrast failures |
| `image_alt_text` | `$('img:not([alt])').length === 0` AND `$('img[alt=""]').length === 0` | 25% | Warning | All images have alt text |
| `heading_order` | Parse all `<h1>`-`<h6>` tags in order; flag if H1 missing, or if level jumps (e.g. H1 → H3 with no H2) | 20% | Warning | Valid heading hierarchy |
| `form_labels` | For each `<input>` not of type hidden/submit/button: check for associated `<label>` (via `for` attr matching `id`), or `aria-label`, or `aria-labelledby` | 15% | Warning | All inputs have labels |
| `lang_attribute` | `$('html[lang]').length > 0` | 10% | Info | HTML lang attribute set |

---

### Category 6: Design / AI Slop (weight 5%)

> Deterministic pattern detection from HTML + CSS. Each flag deducts from the category score.
> AI verdict (gated) adds qualitative judgment on top.

| Check | Detection | Weight | Severity | Pass Condition |
|---|---|---|---|---|
| `gradient_text` | CSS scan for `background-clip: text` + `background: linear-gradient` or `radial-gradient` on same selector | 20% | Warning | No gradient text found |
| `generic_fonts` | CSS scan: `font-family` values containing `Inter`, `Roboto` (standalone — not as part of a specific brand), `Arial`, `Open Sans`, `Helvetica` as primary/only font | 15% | Info | At least one non-default font choice detected |
| `font_count` | Extract all unique `font-family` values from CSS; count distinct families | 10% | Info | ≤ 3 distinct font families |
| `three_col_grid` | CSS scan: `grid-template-columns: repeat(3, 1fr)` or `1fr 1fr 1fr` or `33.33%` patterns; OR Bootstrap class fingerprint `.col-md-4` | 15% | Info | No obvious three-equal-column grid |
| `em_dashes` | Text scan of `<body>` content: count `—` or `–` characters | 10% | Info | Zero em dashes in visible text |
| `ai_copy_cliches` | Text scan for: "Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize", "Transform your", "Game-changer", "World-class", "Cutting-edge" (case-insensitive) | 15% | Warning | No AI copy clichés detected |
| `placeholder_text` | Text scan: "Lorem ipsum", "Welcome to our website", "Click here to edit" | 10% | Warning | No placeholder text found |
| `builder_fingerprint` | HTML scan for class patterns: `wix-`, `squarespace-`, `gd-` (GoDaddy), `wp-block-` (WordPress default), `divi_`, `elementor-` | 5% | Info | No page-builder fingerprint (or note which one) |

**Note on builder detection:** finding a builder is not automatically bad — it's context for the rest of the report ("your site was built on Wix — here's what that limits"). Don't fail the check if the site is otherwise well-built.

---

## API Contract

### Request
```
POST /api/assess
Content-Type: application/json

{ "url": "https://example.com" }
```

### Response
```typescript
{
  url: string
  scanned_at: string          // ISO timestamp
  overall_score: number       // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  verdict: string             // short human-readable verdict sentence
  categories: {
    conversion:   CategoryResult
    performance:  CategoryResult
    mobile:       CategoryResult
    technical:    CategoryResult
    accessibility: CategoryResult
    design:       CategoryResult
  }
  checks: CheckResult[]       // flat list of all individual check results
  ai_verdict: null            // always null from this endpoint; populated by separate /api/assess/verdict endpoint after email gate
  builder_detected: string | null  // e.g. "Wix", "Squarespace", null
  pagespeed_raw: object | null     // raw PageSpeed response, for debugging
}

type CategoryResult = {
  score: number               // 0-100
  weight: number              // 0-1 (the weighting in overall score)
  checks_passed: number
  checks_total: number
}

type CheckResult = {
  id: string                  // e.g. "phone_tap_to_call"
  category: string
  name: string                // human-readable, e.g. "Tap-to-call phone link"
  passed: boolean
  severity: 'critical' | 'warning' | 'info'
  score_impact: number        // points deducted from category if failed (0-100 scale)
  finding: string             // what was found, e.g. "Phone number found as plain text only — customers can't tap to call"
  recommendation: string      // one-line fix
}
```

### Error Response
```typescript
{
  error: string               // e.g. "Could not reach URL", "Invalid URL", "Private/local URL"
  code: 'UNREACHABLE' | 'INVALID_URL' | 'PRIVATE_URL' | 'TIMEOUT'
}
```

---

## AI Verdict (Gated)

The AI taste verdict is a separate endpoint, only triggered after the user provides their email address (or clicks a "Get full review" CTA).

```
POST /api/assess/verdict
{ url, email, deterministic_results: AssessmentResult }
```

This calls the Claude API (Sonnet 4.6 — good quality, lower cost than Opus) with:
- The raw HTML (truncated to ~8000 chars if very large)
- The deterministic findings summary
- A prompt asking for a taste verdict covering: visual quality, typography, copy persuasiveness, design coherence, and a one-line "bottom line" verdict

The AI verdict is returned as:
```typescript
{
  verdict_short: string       // one punchy sentence, e.g. "Looks like a 2018 Wix site — functional but forgettable"
  observations: string[]      // 3-5 specific qualitative observations
  brand_fit: string           // does the design suit the business type?
  copy_quality: string        // is the copy persuasive?
  overall_feel: string        // premium / generic / outdated / broken
}
```

**Cost:** ~10–20p per call on Sonnet 4.6. Gate behind email to limit to genuine leads only.

---

## UI Spec (page.tsx)

### States
1. **Empty** — URL input form, centred, clean
2. **Loading** — progress indicator with phase labels ("Fetching site...", "Running checks...", "Getting performance data...")
3. **Results** — scored report
4. **Error** — friendly message if URL unreachable or invalid

### Results layout
- Big score + grade at the top (prominent, slightly alarming if bad)
- Verdict sentence in large text
- Category breakdown: 6 cards with score bars
- Individual findings list below — grouped by category, sorted Critical → Warning → Info
- Each finding: icon (pass/fail), check name, finding text, recommendation
- CTA at bottom: "Get a free quote" (links to contact) + "Get your full AI taste review" (email gate → triggers /api/assess/verdict)

### Score colour coding
- 80–100: green
- 65–79: amber
- 50–64: orange  
- 0–49: red

---

## Rate Limiting

- Max 1 request per IP per 30 seconds (in-memory via a simple Map — no Redis needed for MVP)
- Max 10 requests per IP per hour
- Block obvious abuse: localhost, 127.x.x.x, 192.168.x.x, 10.x.x.x — return `PRIVATE_URL` error
- Strip any URL fragment and auth credentials before fetching
- Hard timeout: 15 seconds total (PageSpeed Insights can be slow)

---

## Environment Variables

```
PAGESPEED_API_KEY=          # optional but recommended for production; avoids rate limits
ANTHROPIC_API_KEY=          # for gated AI verdict endpoint only
ASSESS_RATE_LIMIT_SECRET=   # optional: shared secret for bypassing rate limit in testing
```

---

## MVP Scope — Three Phases with Context Breaks

The build is split into three phases. Each ends at a natural `/clear` point to avoid context burn. After each `/clear`, resume with the prompt shown.

---

### Phase A — Foundations (types + check logic)

Install dependency first:
```bash
cd laymade && npm install cheerio && npm install --save-dev @types/cheerio
```

Build in order:
1. `lib/assess/types.ts` — all TypeScript types (AssessmentResult, CheckResult, CategoryResult)
2. `lib/assess/checks.ts` — all deterministic check functions (the big one — 30+ checks across all 6 categories)

When done: both files compile with `npx tsc --noEmit`, no errors.

> **BREAK 1 — `/clear` here**
> Resume prompt: *"Continue building the website assessor. Phase A (types + checks) is done. Read `laymade/app/assess/CLAUDE.md` for the full spec and continue with Phase B: pagespeed.ts, score.ts, and the API route."*

---

### Phase B — Backend (scoring + API route)

Pick up from Phase A files already in place.

Build in order:
3. `lib/assess/pagespeed.ts` — PageSpeed Insights API wrapper
4. `lib/assess/score.ts` — category + overall scoring logic (consumes check results, applies weights, outputs AssessmentResult)
5. `app/api/assess/route.ts` — POST handler: validates URL, runs fetch, runs checks, calls pagespeed, calls score, returns JSON

When done: `curl -X POST http://localhost:3000/api/assess -H "Content-Type: application/json" -d '{"url":"https://example.com"}'` returns a valid AssessmentResult JSON with no errors.

> **BREAK 2 — `/clear` here**
> Resume prompt: *"Continue building the website assessor. Phases A and B are done — the API endpoint works. Read `laymade/app/assess/CLAUDE.md` for the full spec and continue with Phase C: build the UI at `app/assess/page.tsx`."*

---

### Phase C — UI (page.tsx)

Pick up from working API endpoint.

Build:
6. `app/assess/page.tsx` — the full UI: URL input form, loading states, results display

Follow the UI Spec section of this file exactly. The page is a client component (`'use client'`). It POSTs to `/api/assess` and renders the returned AssessmentResult.

---

### Phase 2 (after MVP is verified working)
- `app/api/assess/verdict/route.ts` — gated AI verdict endpoint
- Email capture gate on the UI

---

## Notes on the Fetch Mechanism

When the API route fetches the target URL:
- Set a realistic `User-Agent` header: `"Mozilla/5.0 (compatible; LayMadeAssessor/1.0)"` — some sites block requests with no user-agent
- Follow redirects (default `fetch` behaviour)
- Set `Accept: text/html` header
- Parse `Content-Type` to confirm it's HTML before trying to parse
- If the site returns a non-200 status, return `UNREACHABLE` error
- Extract CSS: `$('link[rel="stylesheet"][href]')` — fetch each href (resolve relative URLs against the base URL)
- Limit CSS fetch to first 5 stylesheets to avoid timeout

### Relative URL resolution
Use the `URL` constructor: `new URL(relativePath, baseUrl).href` to resolve relative CSS paths correctly.
