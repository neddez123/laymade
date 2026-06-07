import type { AssessmentResult, CategoryResult, CheckResult, Grade } from './types'

type CategoryKey = keyof AssessmentResult['categories']

const CATEGORY_WEIGHTS: Record<CategoryKey, number> = {
  conversion: 0.30,
  performance: 0.20,
  mobile: 0.20,
  technical: 0.15,
  accessibility: 0.10,
  design: 0.05,
}

function scoreCategory(checks: CheckResult[], category: string): CategoryResult {
  const categoryChecks = checks.filter(c => c.category === category)
  const deduction = categoryChecks
    .filter(c => !c.passed)
    .reduce((sum, c) => sum + c.score_impact, 0)
  return {
    score: Math.max(0, 100 - deduction),
    weight: CATEGORY_WEIGHTS[category as CategoryKey] ?? 0,
    checks_passed: categoryChecks.filter(c => c.passed).length,
    checks_total: categoryChecks.length,
  }
}

function toGrade(score: number): Grade {
  if (score >= 80) return 'A'
  if (score >= 65) return 'B'
  if (score >= 50) return 'C'
  if (score >= 35) return 'D'
  return 'F'
}

function toVerdict(grade: Grade): string {
  switch (grade) {
    case 'A': return 'Your site is in good shape. A few tweaks could make it excellent.'
    case 'B': return 'Your site is performing reasonably well, but there is room for improvement.'
    case 'C': return 'Your site needs work. You are likely losing customers to avoidable issues.'
    case 'D': return 'Your site is actively costing you customers. Priority fixes needed.'
    case 'F': return 'Critical issues detected. Your site is working against your business.'
  }
}

export function buildAssessmentResult(
  url: string,
  checks: CheckResult[],
  builder: string | null,
  pagespeedRaw: object | null,
): AssessmentResult {
  const categories: AssessmentResult['categories'] = {
    conversion: scoreCategory(checks, 'conversion'),
    performance: scoreCategory(checks, 'performance'),
    mobile: scoreCategory(checks, 'mobile'),
    technical: scoreCategory(checks, 'technical'),
    accessibility: scoreCategory(checks, 'accessibility'),
    design: scoreCategory(checks, 'design'),
  }

  const overall = Math.round(
    (Object.keys(categories) as CategoryKey[]).reduce((sum, key) => {
      return sum + categories[key].score * CATEGORY_WEIGHTS[key]
    }, 0),
  )

  const grade = toGrade(overall)

  return {
    url,
    scanned_at: new Date().toISOString(),
    overall_score: overall,
    grade,
    verdict: toVerdict(grade),
    categories,
    checks,
    ai_verdict: null,
    builder_detected: builder,
    pagespeed_raw: pagespeedRaw,
  }
}
