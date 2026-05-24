@AGENTS.md

# Laymade

Public-facing marketing site for **Laymade**, Ben Dezelsky's freelance web design
service for UK independent businesses across three verticals: **Beauty**, **Trades**,
**Lettings**.

Business model: hand-off, not lock-in. Clients own everything (codebase, deploy,
domain). Sold as bespoke websites at three rough tiers (Starter / Standard / Bespoke),
with the templates in the WebStealth repo as the starting points.

This site is the *shop window*. It is not a template itself.

## Stack

- **Next.js 16** App Router (Turbopack on dev + build). See `AGENTS.md`.
- **React 19**
- **TypeScript** (strict)
- **Tailwind CSS v4**. Config lives inside `app/globals.css` via `@theme inline { … }`,
  not in a separate `tailwind.config.ts`.
- **Framer Motion 12** (imported but no longer used in the hero — kept as a dep for future use)
- **Fonts** via `next/font/google`: `Instrument_Serif` for display + `Geist` for UI

Don't reach for a state library, CMS, or DB. The whole content model is one
TypeScript file (`app/data/templates.ts`).

## Visual system

CSS variables live in `:root` in `app/globals.css`. Always reference via the variable,
never re-declare a hex inline.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#FAFAF7` | Page background (warm cream) |
| `--ink` | `#161616` | Primary text |
| `--ink-soft` | `#5C5A56` | Body text, secondary |
| `--muted` | `#A6A29B` | Borders, captions, disabled |
| `--paper` | `#FFFFFF` | Cards over `--bg` |
| `--accent` | `#6F7A4A` | Sage. Used **sparingly**: hover, focus rings, active nav dot |

Type tokens (`--fs-hero`, `--fs-section`, …) are `clamp()`-based for fluid scaling.

Geometry rules:

- **Sharp corners**, max 2px radius on form elements.
- **1px hairlines** in `--muted` over `--paper`. No drop shadows except the
  hero preview card (`0 1px 2px rgba(22,22,22,0.04)`).
- 12-col grid, 1280px max-width, 24px gutter mobile / 80px desktop.

## Hero orbit

The hero is a 3D orbital card carousel, NOT a Framer Motion carousel. Key facts:

- **`components/hero/Hero.tsx`**: full-viewport-width `<section overflow:hidden>`. Text is in a normal `max-w-[1280px]` div. The orbit is `absolute top-0 right-0 bottom-0 w-[60%]` so it starts from the very top of the section and cards can flow off the right viewport edge naturally.
- **`components/hero/HeroPreviewCard.tsx`**: no React state updates in the animation loop — all card positions are written directly to DOM via refs in a `requestAnimationFrame` loop (avoids re-render overhead). `Framer Motion` is not used here.
- **Orbit path**: defined by `ORBIT` keyframes array (t, x%, y%, z, scale, opacity) sourced from tasteskill.dev DOM inspection. Cards travel anticlockwise: emerge from top-left, grow to front-center, exit right.
- **Speed**: `SPEED = 0.000018` rotations/ms ≈ 55 s per revolution.
- **Card size**: `w-[48%]` of the orbit container, `rounded-[18px]`, aspect-ratio 3:2.
- **Drag**: pointer events on the wrap div — `onPointerDown/Move/Up` + `setPointerCapture`. Rotation pauses only during drag (not hover).
- **Pointer-events gotcha**: the text container in `Hero.tsx` must be `pointer-events-none` (with `pointer-events-auto` restored on the inner content div). Without this, the full-width transparent z-10 text wrapper silently swallows all drag events over the orbit, leaving only the far-right margin draggable.
- **Mouse tilt**: `targetTiltX/Y` refs updated in `onMouseMove`, lerped toward in the RAF loop and applied to the wrap div's `transform`.
- **Adding more templates**: just append to `app/data/templates.ts` with `featured: true`. The carousel pads to 8 slots automatically.

## Architecture

Everything is data-driven from `app/data/templates.ts`. To add a new template:

1. Drop its hero screenshot in `public/screenshots/<slug>-hero.jpg`.
2. Append an entry to `templates` in `app/data/templates.ts`:
   ```ts
   {
     slug: "trades-template-1",          // URL slug
     name: "The Trades Template",
     vertical: "trades",
     blurb: "One-sentence description, ~12 words.",
     heroScreenshot: "/screenshots/trades-template-1-hero.jpg",
     liveUrl: "https://trades-template-1.vercel.app", // once deployed
     featured: true,                      // shows in hero carousel + homepage section
     status: "live",                      // or "coming-soon"
   }
   ```
3. Commit + push. Vercel auto-deploys. Nav dropdowns, hero carousel, homepage
   featured grid, templates index, and the dynamic preview route all pick it up
   without any further code changes.

Routes:

- `/`: homepage (`app/page.tsx`)
- `/templates`: filterable index (`app/templates/page.tsx`)
- `/templates/[slug]`: dynamic preview, iframes the template's `liveUrl`
  (`app/templates/[slug]/page.tsx`)

Components are grouped by responsibility under `components/`: `nav/`, `hero/`,
`sections/`, `templates/`, `ui/`. Sections in `components/sections/` correspond
1:1 to homepage scroll sections.

## Conventions

These are non-negotiable for any future edits:

- **No em dashes** (`—`) anywhere in user-facing copy or metadata titles.
  Use commas, colons, periods, parentheses, or `·` (middle dot). The site
  was audited end-to-end for this; don't reintroduce them.
- **No emojis** in code or copy.
- **No `#000` / `#fff`** in styles. Use the warm `--ink` / `--paper` variables.
- **Custom easing** for motion: `cubic-bezier(0.23, 1, 0.32, 1)` for ease-out.
  Don't ship the default browser easings; they feel weak.
- **Animate `transform` and `opacity` only.** Never animate layout properties
  (width, height, padding, margin, etc.).
- **Hero orbit pauses on drag only** — hover intentionally does NOT pause it. Do not add hover-pause back.
- **`prefers-reduced-motion`** is respected globally in `globals.css`. If you
  add motion, make sure it falls back gracefully.
- **Use Next.js `Image` with `fill`** for any image inside a card; parent
  must be `position: relative` (or `absolute`) with explicit dimensions.

## Brand voice

- **H1**: "Premium websites for independent businesses."
- **Subhead**: "Built fast, and yours from day one."
- Tone: confident understatement, considered, UK-flavoured. Anti-pitch, pro-craft.
- "British independents" / "independent businesses" are the canonical terms for
  the audience. Avoid "small business" (loaded), "SMB" (corporate), "client" (cold).
- Copy is in *British English*: "colour", "favourite", "personalised".

## Open placeholders

These are intentionally TBD until Ben supplies real info. Search for the
`PLACEHOLDER:` JSX comments to find them quickly.

- **Email + phone**: currently `hello@laymade.co` and `+44 0000 000 000` in
  `Nav.tsx`, `MobileNav.tsx`, `Footer.tsx`, `Contact.tsx`. Search-and-replace.
- **Why Laymade copy**: three value props in `components/sections/WhyLaymade.tsx`,
  draft copy that should be refined with real proof points / numbers.
- **Pricing**: three tier cards in `components/sections/Pricing.tsx` say
  "Quote on request". Real numbers go in once Ben decides strategy.
- **Testimonials**: `components/sections/SocialProof.tsx` is a single muted
  placeholder card. Replace with real quotes when clients are onboarded.

## Deployment

- Hosted on **Vercel** via GitHub integration. Auto-deploys on push to `main`.
- Project name on Vercel: `laymade`.
- Sister projects (also auto-deployed from `neddez123/WebStealth`):
  - `maison-elite`: root `Beauty/beauty-template/` → `https://maison-elite-nine.vercel.app`
  - `bloom-room`: root `Beauty/beauty-template-2/` → `https://bloom-room-gamma.vercel.app`
- Both liveUrls are set in `app/data/templates.ts`. When adding future templates, deploy via
  `vercel --yes --name <project-name>` from the template directory, then set the aliased URL.

## Local dev

```bash
npm run dev    # http://localhost:3000 (Turbopack)
npm run build  # production build (Turbopack)
npm run lint   # ESLint via Next 16's flat config
npx tsc --noEmit  # type check (no build artefacts)
```

## Reference docs

Design spec + implementation plan live in the **WebStealth** repo (not this one),
since they were written before the laymade repo split off:

- `WebStealth/docs/superpowers/specs/2026-05-23-laymade-marketing-site-design.md`
- `WebStealth/docs/superpowers/plans/2026-05-23-laymade-marketing-site.md`

If you make a structural change here that contradicts those docs, update them too.
