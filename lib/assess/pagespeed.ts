import type { PageSpeedResult } from './types'

const PAGESPEED_BASE = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

export async function fetchPageSpeed(
  url: string,
  signal?: AbortSignal,
): Promise<PageSpeedResult | null> {
  const params = new URLSearchParams({ url, strategy: 'mobile' })
  params.append('category', 'performance')
  params.append('category', 'accessibility')
  params.append('category', 'seo')
  params.append('category', 'best-practices')

  const apiKey = process.env.PAGESPEED_API_KEY
  if (apiKey) params.set('key', apiKey)

  try {
    const res = await fetch(`${PAGESPEED_BASE}?${params.toString()}`, { signal })
    if (!res.ok) return null
    const data = await res.json() as PageSpeedResult
    return data
  } catch {
    return null
  }
}
