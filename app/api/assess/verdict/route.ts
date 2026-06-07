import Anthropic from '@anthropic-ai/sdk'
import type { NextRequest } from 'next/server'
import type { AssessmentResult, AiVerdict } from '@/lib/assess/types'

const client = new Anthropic()

const UA = 'Mozilla/5.0 (compatible; LayMadeAssessor/1.0)'
const HTML_TIMEOUT_MS = 10_000

// Rate limiting: 1 verdict per email per hour
const verdictMap = new Map<string, number>()

function checkRateLimit(email: string): boolean {
  const key = email.toLowerCase().trim()
  const now = Date.now()
  const last = verdictMap.get(key)
  if (last && now - last < 60 * 60 * 1000) return false
  verdictMap.set(key, now)
  return true
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { url, email, deterministic_results } = (body as Record<string, unknown>)

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return Response.json({ error: 'A valid email address is required.' }, { status: 400 })
  }

  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    return Response.json({ error: 'A valid URL is required.' }, { status: 400 })
  }

  if (!deterministic_results || typeof deterministic_results !== 'object') {
    return Response.json({ error: 'Assessment results are required.' }, { status: 400 })
  }

  if (!checkRateLimit(email)) {
    return Response.json(
      { error: 'You have already requested an AI verdict recently. Please try again in an hour.' },
      { status: 429 },
    )
  }

  const results = deterministic_results as AssessmentResult

  // Fetch HTML (best-effort — proceed without it if the site is slow or blocked)
  let html = ''
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), HTML_TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
      })
      if (res.ok) html = (await res.text()).slice(0, 8000)
    } finally {
      clearTimeout(timer)
    }
  } catch {
    // Continue without HTML
  }

  // Build findings summary for the prompt
  const failedCritical = results.checks.filter(c => !c.passed && c.severity === 'critical')
  const failedWarning = results.checks.filter(c => !c.passed && c.severity === 'warning')
  const issueLines = [
    ...failedCritical.map(c => `[CRITICAL] ${c.name}: ${c.finding}`),
    ...failedWarning.slice(0, 5).map(c => `[WARNING] ${c.name}: ${c.finding}`),
  ]

  const prompt = [
    `You are a web design critic reviewing a UK small business website. Be direct and honest. Give specific, useful observations — not generic ones. Avoid phrases like "overall" or "it's clear that".`,
    ``,
    `URL: ${url}`,
    results.builder_detected
      ? `Built on: ${results.builder_detected}`
      : `No page builder fingerprint detected`,
    ``,
    `Audit score: ${results.overall_score}/100 (Grade ${results.grade}) — "${results.verdict}"`,
    issueLines.length > 0
      ? `\nKey issues:\n${issueLines.join('\n')}`
      : `\nNo critical or warning issues found.`,
    html
      ? `\nHTML (first 8000 chars):\n\`\`\`html\n${html}\n\`\`\``
      : `\nHTML was not available.`,
    ``,
    `Respond with ONLY a valid JSON object — no preamble, no markdown fences — using this exact shape:`,
    `{`,
    `  "verdict_short": "one punchy honest sentence about the site (no em dashes — use commas or colons instead)",`,
    `  "observations": ["3-5 specific observations about visual design, typography, copy, or layout"],`,
    `  "brand_fit": "1-2 sentences on whether the design suits the business type and target audience",`,
    `  "copy_quality": "1-2 sentences on whether the copy is persuasive and clear for a UK small business audience",`,
    `  "overall_feel": "one word or short phrase: generic / dated / cluttered / clean / premium / functional / etc."`,
    `}`,
  ].join('\n')

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return Response.json({ error: 'AI verdict generation failed.' }, { status: 500 })
    }

    // Strip markdown code fences if the model wrapped the JSON
    let raw = textBlock.text.trim()
    if (raw.startsWith('```')) {
      raw = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    }

    let verdict: AiVerdict
    try {
      verdict = JSON.parse(raw) as AiVerdict
    } catch {
      return Response.json({ error: 'AI returned an unexpected format. Please try again.' }, { status: 500 })
    }

    if (!verdict.verdict_short || !Array.isArray(verdict.observations)) {
      return Response.json({ error: 'AI returned incomplete data. Please try again.' }, { status: 500 })
    }

    return Response.json(verdict)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    if (msg.includes('401') || msg.includes('authentication')) {
      return Response.json({ error: 'AI service is not configured. Contact us for a manual review.' }, { status: 503 })
    }
    return Response.json({ error: 'AI verdict generation failed. Please try again.' }, { status: 500 })
  }
}
