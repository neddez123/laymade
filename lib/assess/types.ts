export type Severity = 'critical' | 'warning' | 'info'

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F'

export type CheckResult = {
  id: string
  category: string
  name: string
  passed: boolean
  severity: Severity
  score_impact: number
  finding: string
  recommendation: string
}

export type CategoryResult = {
  score: number
  weight: number
  checks_passed: number
  checks_total: number
}

export type AiVerdict = {
  verdict_short: string
  observations: string[]
  brand_fit: string
  copy_quality: string
  overall_feel: string
}

export type AssessmentResult = {
  url: string
  scanned_at: string
  overall_score: number
  grade: Grade
  verdict: string
  categories: {
    conversion: CategoryResult
    performance: CategoryResult
    mobile: CategoryResult
    technical: CategoryResult
    accessibility: CategoryResult
    design: CategoryResult
  }
  checks: CheckResult[]
  ai_verdict: AiVerdict | null
  builder_detected: string | null
  pagespeed_raw: object | null
}

export type AssessmentError = {
  error: string
  code: 'UNREACHABLE' | 'INVALID_URL' | 'PRIVATE_URL' | 'TIMEOUT'
}

export type PageSpeedAudit = {
  score: number | null
  numericValue?: number
  displayValue?: string
}

export type PageSpeedResult = {
  categories: {
    performance?: { score: number | null }
    accessibility?: { score: number | null }
    seo?: { score: number | null }
    'best-practices'?: { score: number | null }
  }
  audits: Record<string, PageSpeedAudit>
  lighthouseResult?: {
    categories: {
      performance?: { score: number | null }
    }
    audits: Record<string, PageSpeedAudit>
  }
}

export type CheckInput = {
  html: string
  css: string
  url: string
  pagespeed: PageSpeedResult | null
}
