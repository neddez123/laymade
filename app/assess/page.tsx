'use client'

import { useState, useEffect, useRef } from 'react'
import type { AssessmentResult, AssessmentError, CheckResult, AiVerdict } from '@/lib/assess/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 65) return '#d97706'
  if (score >= 50) return '#ea580c'
  return '#dc2626'
}

function severityOrder(s: string): number {
  return s === 'critical' ? 0 : s === 'warning' ? 1 : 2
}

function formatHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  conversion:    'Conversion',
  performance:   'Performance',
  mobile:        'Mobile',
  technical:     'Technical & Trust',
  accessibility: 'Accessibility',
  design:        'Design & Copy',
}

const CATEGORY_ORDER: (keyof AssessmentResult['categories'])[] = [
  'conversion', 'performance', 'mobile', 'technical', 'accessibility', 'design',
]

const LOADING_PHASES = [
  'Fetching site...',
  'Running checks...',
  'Getting performance data...',
]

// ── Sub-components ───────────────────────────────────────────────────────────

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const color = scoreColor(score)
  const r = 52
  const circumference = 2 * Math.PI * r
  const dash = (score / 100) * circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: 136, height: 136 }}>
        <svg width={136} height={136} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
          <circle
            cx={68} cy={68} r={r}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={8}
            opacity={0.25}
          />
          <circle
            cx={68} cy={68} r={r}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.23, 1, 0.32, 1)' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 38, fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2, letterSpacing: '0.04em' }}>/ 100</span>
        </div>
      </div>
      <div
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 14px',
          background: color,
          borderRadius: 2,
        }}
      >
        <span style={{ color: 'var(--paper)', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Grade {grade}
        </span>
      </div>
    </div>
  )
}

function CategoryCard({
  catKey,
  cat,
}: {
  catKey: string
  cat: { score: number; weight: number; checks_passed: number; checks_total: number }
}) {
  const color = scoreColor(cat.score)
  return (
    <div
      style={{
        background: 'var(--paper)',
        border: '1px solid var(--muted)',
        borderRadius: 2,
        padding: '18px 20px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
          {CATEGORY_LABELS[catKey]}
        </span>
        <span style={{ fontWeight: 700, fontSize: 20, color }}>{cat.score}</span>
      </div>
      <div style={{ height: 4, background: 'var(--bg)', borderRadius: 2, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${cat.score}%`,
            background: color,
            borderRadius: 2,
            transition: 'width 0.9s cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        />
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
        {cat.checks_passed} of {cat.checks_total} checks passed
        <span style={{ color: 'var(--muted)', margin: '0 6px' }}>·</span>
        {Math.round(cat.weight * 100)}% of score
      </div>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    critical: { bg: '#fef2f2', color: '#dc2626' },
    warning:  { bg: '#fefce8', color: '#b45309' },
    info:     { bg: 'var(--bg)', color: 'var(--ink-soft)' },
  }
  const s = styles[severity] ?? styles.info
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 10, fontWeight: 700,
        padding: '2px 6px',
        borderRadius: 2,
        textTransform: 'uppercase', letterSpacing: '0.07em',
        background: s.bg, color: s.color,
      }}
    >
      {severity}
    </span>
  )
}

function PassIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx={8} cy={8} r={7.5} stroke="#22c55e" strokeWidth={1} />
      <path d="M4.5 8l2.5 2.5 4.5-5" stroke="#22c55e" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FailIcon({ severity }: { severity: string }) {
  const color = severity === 'critical' ? '#dc2626' : severity === 'warning' ? '#d97706' : 'var(--ink-soft)'
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx={8} cy={8} r={7.5} stroke={color} strokeWidth={1} />
      {severity === 'critical' ? (
        <>
          <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </>
      ) : severity === 'warning' ? (
        <>
          <path d="M8 5v4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <circle cx={8} cy={10.5} r={0.75} fill={color} />
        </>
      ) : (
        <circle cx={8} cy={8} r={2} fill={color} />
      )}
    </svg>
  )
}

function FindingRow({ check }: { check: CheckResult }) {
  return (
    <div
      style={{
        display: 'flex', gap: 12, padding: '14px 0',
        borderBottom: '1px solid var(--bg)',
      }}
    >
      {check.passed ? <PassIcon /> : <FailIcon severity={check.severity} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{check.name}</span>
          {!check.passed && <SeverityBadge severity={check.severity} />}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: check.passed ? 0 : 6 }}>
          {check.finding}
        </p>
        {!check.passed && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--accent)', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600 }}>Fix:</span> {check.recommendation}
          </p>
        )}
      </div>
    </div>
  )
}

function LoadingDots() {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 9, height: 9, borderRadius: '50%',
            background: 'var(--accent)',
            animation: `assessDot 1.4s ease-in-out ${i * 0.22}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

function AiVerdictSection({ verdict }: { verdict: AiVerdict }) {
  return (
    <section
      style={{
        background: 'var(--ink)',
        borderRadius: 2,
        padding: 'clamp(36px, 5vw, 60px) clamp(28px, 5vw, 56px)',
        marginBottom: 32,
        color: 'var(--paper)',
      }}
    >
      <p
        style={{
          fontSize: 11, fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'var(--accent)', margin: 0, marginBottom: 24,
        }}
      >
        AI Taste Review
      </p>

      <p
        style={{
          fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
          fontSize: 'clamp(1.35rem, 2.5vw, 1.85rem)',
          fontWeight: 400, lineHeight: 1.35, fontStyle: 'italic',
          color: 'var(--paper)', margin: '0 0 24px',
        }}
      >
        &ldquo;{verdict.verdict_short}&rdquo;
      </p>

      <div style={{ marginBottom: 40 }}>
        <span
          style={{
            display: 'inline-block',
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '5px 14px',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 2,
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          {verdict.overall_feel}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 40,
        }}
      >
        {/* Observations */}
        <div>
          <h3
            style={{
              fontSize: 11, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.4)', margin: 0, marginBottom: 16,
            }}
          >
            Observations
          </h3>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {verdict.observations.map((obs, i) => (
              <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span
                  style={{
                    flexShrink: 0, marginTop: 1,
                    width: 20, height: 20, borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)' }}>
                  {obs}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Brand fit + Copy quality */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div>
            <h3
              style={{
                fontSize: 11, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)', margin: 0, marginBottom: 10,
              }}
            >
              Brand Fit
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.75)', margin: 0 }}>
              {verdict.brand_fit}
            </p>
          </div>
          <div>
            <h3
              style={{
                fontSize: 11, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)', margin: 0, marginBottom: 10,
              }}
            >
              Copy Quality
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.75)', margin: 0 }}>
              {verdict.copy_quality}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AssessPage() {
  const [url, setUrl]             = useState('')
  const [uiState, setUiState]     = useState<'empty' | 'loading' | 'results' | 'error'>('empty')
  const [result, setResult]       = useState<AssessmentResult | null>(null)
  const [apiError, setApiError]   = useState<AssessmentError | null>(null)
  const [loadingPhase, setLoadingPhase] = useState(0)
  const [submittedUrl, setSubmittedUrl] = useState('')
  const phaseTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // AI verdict state
  const [email, setEmail]         = useState('')
  const [aiState, setAiState]     = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [aiVerdict, setAiVerdict] = useState<AiVerdict | null>(null)
  const [aiError, setAiError]     = useState<string | null>(null)

  // Cycle loading phase labels while loading
  useEffect(() => {
    if (uiState === 'loading') {
      setLoadingPhase(0)
      phaseTimer.current = setInterval(() => {
        setLoadingPhase(p => Math.min(p + 1, LOADING_PHASES.length - 1))
      }, 3500)
    } else {
      if (phaseTimer.current) clearInterval(phaseTimer.current)
    }
    return () => { if (phaseTimer.current) clearInterval(phaseTimer.current) }
  }, [uiState])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const raw = url.trim()
    if (!raw) return
    const normalised = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    setSubmittedUrl(normalised)
    setUiState('loading')
    setResult(null)
    setApiError(null)

    try {
      const res = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalised }),
      })
      const data = await res.json()
      if (!res.ok || (data as AssessmentError).error) {
        setApiError(data as AssessmentError)
        setUiState('error')
      } else {
        setResult(data as AssessmentResult)
        setUiState('results')
      }
    } catch {
      setApiError({ error: 'Could not reach the assessment server. Please try again.', code: 'UNREACHABLE' })
      setUiState('error')
    }
  }

  async function handleAiVerdict(e: React.FormEvent) {
    e.preventDefault()
    if (!result || !email.trim()) return
    setAiState('loading')
    setAiError(null)
    try {
      const res = await fetch('/api/assess/verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: result.url, email: email.trim(), deterministic_results: result }),
      })
      const data = await res.json()
      if (!res.ok || (data as { error?: string }).error) {
        setAiError((data as { error?: string }).error ?? 'Failed to generate verdict.')
        setAiState('error')
      } else {
        setAiVerdict(data as AiVerdict)
        setAiState('done')
      }
    } catch {
      setAiError('Could not reach the verdict server. Please try again.')
      setAiState('error')
    }
  }

  function reset(prefillUrl?: string) {
    setUiState('empty')
    setResult(null)
    setApiError(null)
    setAiState('idle')
    setAiVerdict(null)
    setAiError(null)
    if (prefillUrl !== undefined) setUrl(prefillUrl)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
      }}
    >
      {/* Global keyframes for loading dots */}
      <style>{`
        @keyframes assessDot {
          0%, 80%, 100% { transform: scale(0.55); opacity: 0.25; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* ── EMPTY STATE ──────────────────────────────────────────────────── */}
      {uiState === 'empty' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '60px 24px',
          }}
        >
          <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
            <p
              style={{
                fontSize: 12, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--accent)', margin: 0, marginBottom: 20,
              }}
            >
              Free website audit
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
                fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
                fontWeight: 400, lineHeight: 1.1,
                color: 'var(--ink)', margin: 0, marginBottom: 18,
              }}
            >
              How good is your website?
            </h1>
            <p
              style={{
                fontSize: 17, color: 'var(--ink-soft)', lineHeight: 1.65,
                margin: 0, marginBottom: 44,
              }}
            >
              Enter your URL and get a scored report in seconds. We check conversion,
              speed, mobile usability, trust signals, and more.
            </p>

            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: 'flex', gap: 8,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="yoursite.co.uk"
                  autoFocus
                  spellCheck={false}
                  autoCapitalize="none"
                  autoCorrect="off"
                  aria-label="Website URL"
                  style={{
                    flex: '1 1 260px',
                    height: 50,
                    padding: '0 16px',
                    fontSize: 16,
                    border: '1px solid var(--muted)',
                    borderRadius: 2,
                    background: 'var(--paper)',
                    color: 'var(--ink)',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--muted)' }}
                />
                <button
                  type="submit"
                  style={{
                    height: 50, padding: '0 28px',
                    background: 'var(--ink)', color: 'var(--paper)',
                    fontSize: 15, fontWeight: 600,
                    border: 'none', borderRadius: 2, cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >
                  Assess site
                </button>
              </div>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                Free. No login. Takes about 15 seconds.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* ── LOADING STATE ────────────────────────────────────────────────── */}
      {uiState === 'loading' && (
        <div
          style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', padding: '40px 24px',
            gap: 28,
          }}
        >
          <LoadingDots />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 19, fontWeight: 600, color: 'var(--ink)', margin: 0, marginBottom: 8 }}>
              {LOADING_PHASES[loadingPhase]}
            </p>
            <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>
              Checking{' '}
              <span style={{ color: 'var(--ink)', fontWeight: 500 }}>
                {formatHostname(submittedUrl)}
              </span>
            </p>
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
            This can take up to 15 seconds for slow sites.
          </p>
        </div>
      )}

      {/* ── ERROR STATE ──────────────────────────────────────────────────── */}
      {uiState === 'error' && (
        <div
          style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', padding: '40px 24px',
          }}
        >
          <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
            <div
              style={{
                width: 52, height: 52, borderRadius: '50%',
                border: '1px solid #dc2626',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
                color: '#dc2626', fontSize: 22, fontWeight: 700,
              }}
            >
              !
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 400, margin: 0, marginBottom: 14,
              }}
            >
              Could not assess that site
            </h2>
            <p style={{ fontSize: 15, color: 'var(--ink-soft)', margin: 0, marginBottom: 8, lineHeight: 1.6 }}>
              {apiError?.error ?? 'Something went wrong. Please try again.'}
            </p>
            {apiError?.code === 'PRIVATE_URL' && (
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0, marginBottom: 24 }}>
                Local and private network addresses cannot be assessed.
              </p>
            )}
            {(apiError?.code === 'UNREACHABLE' || apiError?.code === 'TIMEOUT') && (
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0, marginBottom: 24 }}>
                Make sure the URL is publicly accessible. Try including <code style={{ fontFamily: 'monospace', background: 'var(--bg)', padding: '1px 4px', borderRadius: 2 }}>https://</code> at the start.
              </p>
            )}
            <button
              onClick={() => reset(submittedUrl)}
              style={{
                height: 46, padding: '0 28px',
                background: 'var(--ink)', color: 'var(--paper)',
                fontSize: 15, fontWeight: 600,
                border: 'none', borderRadius: 2, cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* ── RESULTS STATE ────────────────────────────────────────────────── */}
      {uiState === 'results' && result && (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px 96px' }}>

          {/* Score header */}
          <header
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', textAlign: 'center',
              gap: 28, marginBottom: 72,
            }}
          >
            <ScoreRing score={result.overall_score} grade={result.grade} />

            <div style={{ maxWidth: 600 }}>
              <p
                style={{
                  fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
                  fontSize: 'clamp(1.35rem, 2.5vw, 1.85rem)',
                  fontWeight: 400, lineHeight: 1.35,
                  color: 'var(--ink)', margin: 0, marginBottom: 12,
                }}
              >
                {result.verdict}
              </p>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0 }}>
                Scanned{' '}
                <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>
                  {formatHostname(result.url)}
                </strong>
                {result.builder_detected && (
                  <span>
                    {' '}<span style={{ color: 'var(--muted)' }}>·</span>{' '}
                    Built on {result.builder_detected}
                  </span>
                )}
                <span>
                  {' '}<span style={{ color: 'var(--muted)' }}>·</span>{' '}
                  {new Date(result.scanned_at).toLocaleString('en-GB', {
                    day: 'numeric', month: 'short',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </p>
            </div>

            <button
              onClick={() => reset()}
              style={{
                fontSize: 13, color: 'var(--ink-soft)',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              Assess another site
            </button>
          </header>

          {/* Category grid */}
          <section style={{ marginBottom: 64 }}>
            <h2
              style={{
                fontSize: 11, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--ink-soft)', margin: 0, marginBottom: 16,
              }}
            >
              Category Scores
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 10,
              }}
            >
              {CATEGORY_ORDER.map(key => (
                <CategoryCard key={key} catKey={key} cat={result.categories[key]} />
              ))}
            </div>
          </section>

          {/* Findings */}
          <section style={{ marginBottom: 72 }}>
            <h2
              style={{
                fontSize: 11, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--ink-soft)', margin: 0, marginBottom: 28,
              }}
            >
              Detailed Findings
            </h2>

            {CATEGORY_ORDER.map(catKey => {
              const checks = result.checks
                .filter(c => c.category === catKey)
                .slice()
                .sort((a, b) => {
                  if (a.passed !== b.passed) return a.passed ? 1 : -1
                  return severityOrder(a.severity) - severityOrder(b.severity)
                })
              if (checks.length === 0) return null
              const failCount = checks.filter(c => !c.passed).length
              const criticalCount = checks.filter(c => !c.passed && c.severity === 'critical').length

              return (
                <div key={catKey} style={{ marginBottom: 44 }}>
                  <div
                    style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingBottom: 12,
                      borderBottom: '1px solid var(--muted)',
                      marginBottom: 2,
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
                      {CATEGORY_LABELS[catKey]}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: failCount === 0
                          ? '#22c55e'
                          : criticalCount > 0 ? '#dc2626' : '#d97706',
                        fontWeight: 500,
                      }}
                    >
                      {failCount === 0
                        ? 'All clear'
                        : `${failCount} issue${failCount !== 1 ? 's' : ''}${criticalCount > 0 ? ` (${criticalCount} critical)` : ''}`}
                    </span>
                  </div>

                  <div>
                    {checks.map(check => (
                      <FindingRow key={check.id} check={check} />
                    ))}
                  </div>
                </div>
              )
            })}
          </section>

          {/* AI verdict section — visible after email gate */}
          {aiVerdict && <AiVerdictSection verdict={aiVerdict} />}

          {/* CTA */}
          <section
            style={{
              background: 'var(--paper)',
              border: '1px solid var(--muted)',
              borderRadius: 2,
              padding: 'clamp(28px, 5vw, 52px) clamp(24px, 5vw, 48px)',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: 11, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--accent)', margin: 0, marginBottom: 16,
              }}
            >
              Next steps
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
                fontSize: 'clamp(1.6rem, 3vw, 2.5rem)',
                fontWeight: 400, margin: 0, marginBottom: 14,
              }}
            >
              Ready to fix this?
            </h2>
            <p
              style={{
                fontSize: 16, color: 'var(--ink-soft)', lineHeight: 1.65,
                margin: '0 auto 36px', maxWidth: 500,
              }}
            >
              Laymade builds fast, high-converting websites for UK independent businesses.
              Yours from day one.
            </p>

            {/* Primary CTA */}
            <a
              href="/#contact"
              style={{
                display: 'inline-block',
                height: 50, lineHeight: '50px',
                padding: '0 32px',
                background: 'var(--ink)', color: 'var(--paper)',
                fontSize: 15, fontWeight: 600,
                borderRadius: 2, textDecoration: 'none',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.85' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
            >
              Get a free quote
            </a>

            {/* AI taste review gate */}
            {aiState === 'idle' && (
              <form onSubmit={handleAiVerdict} style={{ marginTop: 32 }}>
                <p
                  style={{
                    fontSize: 11, fontWeight: 600, color: 'var(--ink-soft)',
                    margin: '0 0 12px', textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Get your free AI taste review
                </p>
                <div
                  style={{
                    display: 'flex', gap: 8,
                    justifyContent: 'center', flexWrap: 'wrap',
                  }}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.co.uk"
                    required
                    aria-label="Your email address"
                    style={{
                      flex: '1 1 220px', maxWidth: 280,
                      height: 46, padding: '0 14px',
                      fontSize: 15,
                      border: '1px solid var(--muted)',
                      borderRadius: 2,
                      background: 'var(--bg)',
                      color: 'var(--ink)',
                      outline: 'none',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--muted)' }}
                  />
                  <button
                    type="submit"
                    style={{
                      height: 46, padding: '0 24px',
                      background: 'none',
                      color: 'var(--ink)',
                      fontSize: 14, fontWeight: 600,
                      border: '1px solid var(--ink)',
                      borderRadius: 2, cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.65' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                  >
                    Get AI taste review
                  </button>
                </div>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: '10px 0 0' }}>
                  Free. Honest. Takes 15 seconds.
                </p>
              </form>
            )}

            {aiState === 'loading' && (
              <div
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 12, marginTop: 32,
                }}
              >
                <LoadingDots />
                <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>
                  Generating AI taste review...
                </p>
              </div>
            )}

            {aiState === 'done' && (
              <p
                style={{
                  fontSize: 14, color: 'var(--accent)',
                  margin: '28px 0 0', fontWeight: 600,
                }}
              >
                Taste review generated. See above.
              </p>
            )}

            {aiState === 'error' && (
              <div style={{ marginTop: 28 }}>
                <p style={{ fontSize: 14, color: '#dc2626', margin: '0 0 12px' }}>
                  {aiError}
                </p>
                <button
                  onClick={() => setAiState('idle')}
                  style={{
                    fontSize: 13, color: 'var(--ink-soft)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                  }}
                >
                  Try again
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
