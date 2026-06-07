import * as cheerio from 'cheerio'
import type { NextRequest } from 'next/server'
import { runAllChecks } from '@/lib/assess/checks'
import { fetchPageSpeed } from '@/lib/assess/pagespeed'
import { buildAssessmentResult } from '@/lib/assess/score'
import type { AssessmentError, CheckInput } from '@/lib/assess/types'

// ─── Rate limiting ────────────────────────────────────────────────────────────

type RateLimitEntry = {
  windowStart: number
  count: number
  lastRequest: number
}
const rateLimitMap = new Map<string, RateLimitEntry>()
const HOUR_MS = 60 * 60 * 1000
const MIN_INTERVAL_MS = 30 * 1000
const MAX_PER_HOUR = 10

function checkRateLimit(ip: string): { allowed: boolean; reason?: string } {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry) {
    rateLimitMap.set(ip, { windowStart: now, count: 1, lastRequest: now })
    return { allowed: true }
  }

  if (now - entry.lastRequest < MIN_INTERVAL_MS) {
    return { allowed: false, reason: 'Please wait 30 seconds between checks.' }
  }

  if (now - entry.windowStart > HOUR_MS) {
    rateLimitMap.set(ip, { windowStart: now, count: 1, lastRequest: now })
    return { allowed: true }
  }

  if (entry.count >= MAX_PER_HOUR) {
    return { allowed: false, reason: 'Hourly check limit reached. Please try again later.' }
  }

  entry.count++
  entry.lastRequest = now
  return { allowed: true }
}

// ─── URL validation ───────────────────────────────────────────────────────────

function isPrivateHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '::1' || hostname === '0.0.0.0') return true
  const parts = hostname.split('.').map(Number)
  if (parts.length !== 4 || parts.some(isNaN)) return false
  const [a, b] = parts
  return (
    a === 127 ||
    a === 10 ||
    (a === 192 && b === 168) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 169 && b === 254)
  )
}

function sanitizeUrl(
  raw: string,
): { url: URL; error?: never } | { url?: never; error: AssessmentError } {
  let parsed: URL
  try {
    parsed = new URL(raw.trim())
  } catch {
    return {
      error: {
        error: 'Invalid URL. Please enter a full URL including https://',
        code: 'INVALID_URL',
      },
    }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      error: { error: 'Only http and https URLs are supported.', code: 'INVALID_URL' },
    }
  }

  if (isPrivateHost(parsed.hostname)) {
    return {
      error: { error: 'Private or local URLs cannot be assessed.', code: 'PRIVATE_URL' },
    }
  }

  parsed.hash = ''
  parsed.username = ''
  parsed.password = ''
  return { url: parsed }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const UA = 'Mozilla/5.0 (compatible; LayMadeAssessor/1.0)'

async function fetchCss(hrefs: string[], baseUrl: string, signal: AbortSignal): Promise<string> {
  const results = await Promise.allSettled(
    hrefs.slice(0, 5).map(href => {
      const resolved = new URL(href, baseUrl).href
      return fetch(resolved, {
        signal,
        headers: { 'User-Agent': UA },
      }).then(r => (r.ok ? r.text() : ''))
    }),
  )
  return results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
    .map(r => r.value)
    .join('\n')
}

async function findBrokenInternalLinks(
  html: string,
  baseUrl: string,
  signal: AbortSignal,
): Promise<string[]> {
  const $ = cheerio.load(html)
  const base = new URL(baseUrl)
  const seen = new Set<string>()

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
    try {
      const resolved = new URL(href, baseUrl)
      if (resolved.hostname === base.hostname) seen.add(resolved.href)
    } catch {
      // ignore unparseable hrefs
    }
  })

  const links = [...seen].slice(0, 20)
  const broken: string[] = []

  await Promise.allSettled(
    links.map(async link => {
      try {
        const res = await fetch(link, {
          method: 'HEAD',
          signal,
          headers: { 'User-Agent': UA },
          redirect: 'follow',
        })
        if (!res.ok) broken.push(link)
      } catch {
        // network error — don't count as broken
      }
    }),
  )

  return broken
}

// ─── POST handler ─────────────────────────────────────────────────────────────

const TIMEOUT_MS = 15_000

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const bypassSecret = process.env.ASSESS_RATE_LIMIT_SECRET
  const providedSecret = request.headers.get('x-assess-secret')
  if (!bypassSecret || providedSecret !== bypassSecret) {
    const { allowed, reason } = checkRateLimit(ip)
    if (!allowed) {
      return Response.json(
        { error: reason ?? 'Rate limit exceeded.', code: 'RATE_LIMITED' },
        { status: 429 },
      )
    }
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: 'Invalid request body.', code: 'INVALID_URL' } satisfies AssessmentError,
      { status: 400 },
    )
  }

  const rawUrl = (body as Record<string, unknown>)?.url
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return Response.json(
      { error: 'A URL is required.', code: 'INVALID_URL' } satisfies AssessmentError,
      { status: 400 },
    )
  }

  const urlResult = sanitizeUrl(rawUrl)
  if (urlResult.error) {
    return Response.json(urlResult.error satisfies AssessmentError, { status: 400 })
  }
  const targetUrl = urlResult.url.href

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    let htmlRes: Response
    try {
      htmlRes = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
      })
    } catch {
      const timedOut = controller.signal.aborted
      return Response.json(
        {
          error: timedOut
            ? 'The site took too long to respond.'
            : 'Could not reach the URL. Check it is publicly accessible.',
          code: timedOut ? 'TIMEOUT' : 'UNREACHABLE',
        } satisfies AssessmentError,
        { status: 422 },
      )
    }

    if (!htmlRes.ok) {
      return Response.json(
        {
          error: `The site returned HTTP ${htmlRes.status}. Could not assess.`,
          code: 'UNREACHABLE',
        } satisfies AssessmentError,
        { status: 422 },
      )
    }

    const contentType = htmlRes.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return Response.json(
        {
          error: 'The URL does not point to an HTML page.',
          code: 'UNREACHABLE',
        } satisfies AssessmentError,
        { status: 422 },
      )
    }

    const html = await htmlRes.text()
    const $ = cheerio.load(html)

    const cssHrefs: string[] = []
    $('link[rel="stylesheet"][href]').each((_, el) => {
      const href = $(el).attr('href')
      if (href) cssHrefs.push(href)
    })

    const [css, brokenLinks, pagespeedRaw] = await Promise.all([
      fetchCss(cssHrefs, targetUrl, controller.signal),
      findBrokenInternalLinks(html, targetUrl, controller.signal),
      fetchPageSpeed(targetUrl, controller.signal),
    ])

    const input: CheckInput = { html, css, url: targetUrl, pagespeed: pagespeedRaw }
    const { checks, builder } = runAllChecks(input, brokenLinks)

    const result = buildAssessmentResult(targetUrl, checks, builder, pagespeedRaw)
    return Response.json(result)
  } finally {
    clearTimeout(timeoutId)
  }
}
