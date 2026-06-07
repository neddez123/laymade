import * as cheerio from 'cheerio'
import type { CheckResult, CheckInput } from './types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function pass(
  id: string,
  category: string,
  name: string,
  severity: CheckResult['severity'],
  score_impact: number,
  finding: string,
  recommendation: string,
): CheckResult {
  return { id, category, name, passed: true, severity, score_impact, finding, recommendation }
}

function fail(
  id: string,
  category: string,
  name: string,
  severity: CheckResult['severity'],
  score_impact: number,
  finding: string,
  recommendation: string,
): CheckResult {
  return { id, category, name, passed: false, severity, score_impact, finding, recommendation }
}

function getPageSpeedAudit(pagespeed: CheckInput['pagespeed'], auditId: string) {
  if (!pagespeed) return null
  const audits = pagespeed.lighthouseResult?.audits ?? pagespeed.audits ?? {}
  return audits[auditId] ?? null
}

function getPageSpeedScore(pagespeed: CheckInput['pagespeed']): number | null {
  if (!pagespeed) return null
  const raw =
    pagespeed.lighthouseResult?.categories?.performance?.score ??
    pagespeed.categories?.performance?.score ??
    null
  return raw !== null ? Math.round(raw * 100) : null
}

// ─── Category 1: Conversion ──────────────────────────────────────────────────

export function checkPhoneTapToCall(html: string): CheckResult {
  const $ = cheerio.load(html)
  const found = $('a[href^="tel:"]').length > 0
  return found
    ? pass(
        'phone_tap_to_call', 'conversion', 'Tap-to-call phone link', 'critical', 25,
        'Phone number is linked with tel: — customers can tap to call directly.',
        'Keep the tap-to-call link prominent on every page.',
      )
    : fail(
        'phone_tap_to_call', 'conversion', 'Tap-to-call phone link', 'critical', 25,
        'No tap-to-call phone link found. Phone numbers shown as plain text cannot be tapped on mobile.',
        'Wrap your phone number in <a href="tel:+44XXXXXXXXXX">.',
      )
}

export function checkBookingWidget(html: string): CheckResult {
  const bookingDomains = [
    'fresha.com', 'booksy.com', 'treatwell.co.uk', 'calendly.com',
    'squareup.com', 'acuityscheduling.com', 'timely.com', 'vagaro.com',
    'mindbodyonline.com',
  ]
  const lower = html.toLowerCase()
  const found = bookingDomains.some(d => lower.includes(d))
  return found
    ? pass(
        'booking_widget', 'conversion', 'Online booking widget', 'critical', 20,
        'A booking widget or integration was detected — customers can book without calling.',
        'Make the booking widget highly visible, ideally above the fold.',
      )
    : fail(
        'booking_widget', 'conversion', 'Online booking widget', 'critical', 20,
        'No booking widget detected. Customers must call or email to book — many will not bother.',
        'Add a Fresha, Booksy, or Calendly booking embed. Most are free.',
      )
}

export function checkCtaAboveFold(html: string): CheckResult {
  const $ = cheerio.load(html)
  const bodyHtml = $('body').html() ?? html
  const firstChunk = bodyHtml.slice(0, 3000).toLowerCase()
  const keywords = ['book', 'call', 'contact', 'quote', 'appointment', 'reserve', 'enquire']
  const buttons = Array.from($('button, a')).filter(el => {
    const text = $(el).text().toLowerCase()
    const href = $(el).attr('href') ?? ''
    const combined = text + ' ' + href
    return keywords.some(k => combined.includes(k))
  })
  const hasCtaInFold = buttons.some(el => {
    const outerHtml = $.html(el)
    return firstChunk.includes(outerHtml.toLowerCase().slice(0, 40))
  })
  // Fallback: check if any keyword appears in the first chunk
  const keywordInFold = keywords.some(k => firstChunk.includes(k))
  const found = hasCtaInFold || keywordInFold
  return found
    ? pass(
        'cta_above_fold', 'conversion', 'CTA above the fold', 'critical', 20,
        'A call-to-action (book, call, contact) is visible in the first screen.',
        'Keep the primary CTA prominent — test on a real phone.',
      )
    : fail(
        'cta_above_fold', 'conversion', 'CTA above the fold', 'critical', 20,
        'No booking or contact CTA found in the first screenful of content.',
        'Add a "Book now" or "Call us" button in the hero section.',
      )
}

export function checkWhatsappLink(html: string): CheckResult {
  const $ = cheerio.load(html)
  const found = $('a[href*="wa.me"], a[href*="whatsapp"]').length > 0
  return found
    ? pass(
        'whatsapp_link', 'conversion', 'WhatsApp link', 'warning', 15,
        'WhatsApp link found — a popular contact method for UK customers.',
        'Good. Keep it visible.',
      )
    : fail(
        'whatsapp_link', 'conversion', 'WhatsApp link', 'warning', 15,
        'No WhatsApp link found. Many UK customers prefer WhatsApp over phone calls.',
        'Add a wa.me link: <a href="https://wa.me/44XXXXXXXXXX">WhatsApp us</a>.',
      )
}

export function checkContactForm(html: string): CheckResult {
  const $ = cheerio.load(html)
  const found = $('form').length > 0
  return found
    ? pass(
        'contact_form', 'conversion', 'Contact form', 'warning', 10,
        'A contact form is present on the page.',
        'Keep the form short — name, email, and message is enough.',
      )
    : fail(
        'contact_form', 'conversion', 'Contact form', 'warning', 10,
        'No contact form found. Customers who prefer email have no easy way to reach you.',
        'Add a simple contact form with name, email, and message fields.',
      )
}

export function checkAddressPresent(html: string): CheckResult {
  const $ = cheerio.load(html)
  const bodyText = $('body').text()
  const ukPostcode = /[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}/i
  const found = ukPostcode.test(bodyText)
  return found
    ? pass(
        'address_present', 'conversion', 'Address / postcode visible', 'warning', 10,
        'A UK postcode or address was found — customers can verify your location easily.',
        'Ensure the address appears on every page, ideally in the footer.',
      )
    : fail(
        'address_present', 'conversion', 'Address / postcode visible', 'warning', 10,
        'No UK address or postcode detected on the page.',
        'Add your full address including postcode. Local trust is a conversion signal.',
      )
}

// ─── Category 2: Performance ─────────────────────────────────────────────────

export function checkPagespeedScore(pagespeed: CheckInput['pagespeed']): CheckResult {
  const score = getPageSpeedScore(pagespeed)
  if (score === null) {
    return fail(
      'pagespeed_score', 'performance', 'PageSpeed score (mobile)', 'critical', 50,
      'PageSpeed data unavailable — could not retrieve performance score.',
      'Run Google PageSpeed Insights on your site to check mobile performance.',
    )
  }
  // Scaled: score / 100 * 100 — deduction if below 50
  const passed = score >= 50
  return passed
    ? pass(
        'pagespeed_score', 'performance', 'PageSpeed score (mobile)', 'critical', 50,
        `Mobile PageSpeed score: ${score}/100.`,
        'Keep optimising — aim for 80+.',
      )
    : fail(
        'pagespeed_score', 'performance', 'PageSpeed score (mobile)', 'critical', 50,
        `Mobile PageSpeed score: ${score}/100 — below 50. This site loads slowly on mobile.`,
        'Compress images, remove unused scripts, and enable caching.',
      )
}

export function checkLcp(pagespeed: CheckInput['pagespeed']): CheckResult {
  const audit = getPageSpeedAudit(pagespeed, 'largest-contentful-paint')
  const lcp = audit?.numericValue ?? null
  if (lcp === null) {
    return fail(
      'lcp', 'performance', 'Largest Contentful Paint', 'critical', 15,
      'LCP data unavailable.',
      'Check Google PageSpeed Insights for LCP details.',
    )
  }
  const passed = lcp < 2500
  const lcpSecs = (lcp / 1000).toFixed(1)
  return passed
    ? pass(
        'lcp', 'performance', 'Largest Contentful Paint', 'critical', 15,
        `LCP is ${lcpSecs}s — within the good threshold (< 2.5s).`,
        'Keep it under 2.5s. Optimise hero images to maintain this.',
      )
    : fail(
        'lcp', 'performance', 'Largest Contentful Paint', 'critical', 15,
        `LCP is ${lcpSecs}s — too slow. The main content takes too long to appear on screen.`,
        'Preload the hero image and reduce render-blocking resources.',
      )
}

export function checkCls(pagespeed: CheckInput['pagespeed']): CheckResult {
  const audit = getPageSpeedAudit(pagespeed, 'cumulative-layout-shift')
  const cls = audit?.numericValue ?? null
  if (cls === null) {
    return fail(
      'cls', 'performance', 'Cumulative Layout Shift', 'warning', 15,
      'CLS data unavailable.',
      'Check Google PageSpeed Insights for layout shift details.',
    )
  }
  const passed = cls < 0.1
  return passed
    ? pass(
        'cls', 'performance', 'Cumulative Layout Shift', 'warning', 15,
        `CLS is ${cls.toFixed(3)} — no significant layout instability.`,
        'Good. Set explicit width/height on images to keep this low.',
      )
    : fail(
        'cls', 'performance', 'Cumulative Layout Shift', 'warning', 15,
        `CLS is ${cls.toFixed(3)} — content is jumping around as the page loads.`,
        'Add explicit width and height attributes to all images and embeds.',
      )
}

export function checkPageSize(pagespeed: CheckInput['pagespeed']): CheckResult {
  const audits = pagespeed?.lighthouseResult?.audits ?? pagespeed?.audits ?? {}
  // Try to get total byte weight from PageSpeed
  const byteAudit = audits['total-byte-weight']
  const bytes = byteAudit?.numericValue ?? null
  if (bytes === null) {
    return pass(
      'page_size', 'performance', 'Page total size', 'warning', 10,
      'Page size data unavailable from PageSpeed. Could not verify.',
      'Keep total page size under 3MB for good mobile load times.',
    )
  }
  const mb = bytes / (1024 * 1024)
  const passed = bytes < 3 * 1024 * 1024
  return passed
    ? pass(
        'page_size', 'performance', 'Page total size', 'warning', 10,
        `Total page size is ${mb.toFixed(1)}MB — within the 3MB budget.`,
        'Good. Compress images further to keep load times fast on poor signal.',
      )
    : fail(
        'page_size', 'performance', 'Page total size', 'warning', 10,
        `Total page size is ${mb.toFixed(1)}MB — over 3MB. Heavy pages lose mobile visitors quickly.`,
        'Compress and resize images. Remove unused CSS and scripts.',
      )
}

export function checkImageFormats(pagespeed: CheckInput['pagespeed']): CheckResult {
  const audit = getPageSpeedAudit(pagespeed, 'uses-webp-images')
  if (audit === null) {
    return pass(
      'image_formats', 'performance', 'Modern image formats', 'warning', 10,
      'Image format data unavailable from PageSpeed.',
      'Use WebP or AVIF format for images to reduce file size by ~30%.',
    )
  }
  const passed = (audit.score ?? 1) >= 0.9
  return passed
    ? pass(
        'image_formats', 'performance', 'Modern image formats', 'warning', 10,
        'Images are using modern formats (WebP/AVIF) — no significant savings flagged.',
        'Good. Stick with WebP for new images.',
      )
    : fail(
        'image_formats', 'performance', 'Modern image formats', 'warning', 10,
        'Images are not using modern formats. Switching to WebP could save 25-35% file size.',
        'Convert images to WebP format. Tools like Squoosh make this easy.',
      )
}

// ─── Category 3: Mobile ───────────────────────────────────────────────────────

export function checkViewportMeta(html: string): CheckResult {
  const $ = cheerio.load(html)
  const found = $('meta[name="viewport"]').length > 0
  return found
    ? pass(
        'viewport_meta', 'mobile', 'Viewport meta tag', 'critical', 35,
        'Viewport meta tag is present — the page will scale correctly on mobile.',
        'Keep it as-is: <meta name="viewport" content="width=device-width, initial-scale=1">.',
      )
    : fail(
        'viewport_meta', 'mobile', 'Viewport meta tag', 'critical', 35,
        'No viewport meta tag found. The site will render as a shrunken desktop page on mobile.',
        'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to <head>.',
      )
}

export function checkNoHorizontalScroll(css: string): CheckResult {
  // Look for fixed-width elements that could cause overflow
  const wideFixedWidth = /width\s*:\s*([6-9]\d\d|\d{4,})px/g
  const overflowHidden = /overflow-x\s*:\s*hidden/i
  const hasOverflowGuard = overflowHidden.test(css)
  const wideMatches: string[] = []
  let m: RegExpExecArray | null
  while ((m = wideFixedWidth.exec(css)) !== null) {
    wideMatches.push(m[0])
  }
  const passed = hasOverflowGuard || wideMatches.length === 0
  return passed
    ? pass(
        'no_horizontal_scroll', 'mobile', 'No horizontal scroll', 'critical', 25,
        hasOverflowGuard
          ? 'Overflow-x is controlled — horizontal scroll is guarded.'
          : 'No obvious fixed-width overflows detected in CSS.',
        'Test on a real phone by scrolling side-to-side.',
      )
    : fail(
        'no_horizontal_scroll', 'mobile', 'No horizontal scroll', 'critical', 25,
        `Fixed-width elements detected: ${wideMatches.slice(0, 3).join(', ')}. These may cause horizontal scrolling on mobile.`,
        'Replace fixed pixel widths with max-width, %, or vw units.',
      )
}

export function checkTouchTargets(pagespeed: CheckInput['pagespeed']): CheckResult {
  const audit = getPageSpeedAudit(pagespeed, 'tap-targets')
  if (audit === null) {
    return pass(
      'touch_targets', 'mobile', 'Touch target sizes', 'warning', 20,
      'Touch target data unavailable from PageSpeed.',
      'Ensure all buttons and links are at least 44x44px for easy tapping.',
    )
  }
  const passed = (audit.score ?? 1) >= 0.9
  return passed
    ? pass(
        'touch_targets', 'mobile', 'Touch target sizes', 'warning', 20,
        'Touch targets are appropriately sized — no tap issues flagged.',
        'Good. Keep buttons at least 44px tall.',
      )
    : fail(
        'touch_targets', 'mobile', 'Touch target sizes', 'warning', 20,
        'Some tap targets are too small or too close together — easy to mis-tap on mobile.',
        'Make all clickable elements at least 44x44px with adequate spacing.',
      )
}

export function checkReadableTextSize(css: string): CheckResult {
  // Flag font-size values below 14px on body/paragraph elements
  const smallFontPattern = /(?:body|p|li|span)[^{]*\{[^}]*font-size\s*:\s*([0-9.]+)(px)/gi
  const tooSmall: string[] = []
  let m: RegExpExecArray | null
  while ((m = smallFontPattern.exec(css)) !== null) {
    const size = parseFloat(m[1])
    if (size < 14) tooSmall.push(`${m[0].split('{')[0].trim()}: ${size}px`)
  }
  const passed = tooSmall.length === 0
  return passed
    ? pass(
        'readable_text_size', 'mobile', 'Readable text size', 'warning', 10,
        'No body text smaller than 14px detected in CSS.',
        'Good. Keep body text at 16px or larger for comfortable mobile reading.',
      )
    : fail(
        'readable_text_size', 'mobile', 'Readable text size', 'warning', 10,
        `Small text detected (< 14px): ${tooSmall.slice(0, 3).join('; ')}. Hard to read on mobile.`,
        'Set body text to at least 16px. Never use font-size below 14px for readable content.',
      )
}

export function checkResponsiveLayout(css: string): CheckResult {
  const hasMediaQuery = /@media\s/i.test(css)
  return hasMediaQuery
    ? pass(
        'responsive_layout', 'mobile', 'Responsive layout (media queries)', 'warning', 10,
        'CSS media queries detected — the layout adapts for different screen sizes.',
        'Good. Test at 320px, 375px, and 768px widths.',
      )
    : fail(
        'responsive_layout', 'mobile', 'Responsive layout (media queries)', 'warning', 10,
        'No CSS media queries found. The layout may not adapt to mobile screen sizes.',
        'Add @media (max-width: 768px) breakpoints to adjust layout for phones.',
      )
}

// ─── Category 4: Technical / Trust ───────────────────────────────────────────

export function checkHttps(url: string): CheckResult {
  const isHttps = url.startsWith('https://')
  return isHttps
    ? pass(
        'https', 'technical', 'HTTPS / SSL', 'critical', 25,
        'The site uses HTTPS — data is encrypted and the padlock shows in browsers.',
        'Good. Renew the SSL certificate before it expires.',
      )
    : fail(
        'https', 'technical', 'HTTPS / SSL', 'critical', 25,
        'The site is not using HTTPS. Browsers show a "Not secure" warning that destroys trust.',
        'Enable HTTPS via your hosting provider. Most offer free Let\'s Encrypt certificates.',
      )
}

export function checkPageTitle(html: string): CheckResult {
  const $ = cheerio.load(html)
  const title = $('title').text().trim()
  const len = title.length
  const passed = len >= 10 && len <= 70
  return passed
    ? pass(
        'page_title', 'technical', 'Page title', 'warning', 15,
        `Page title is ${len} characters: "${title.slice(0, 60)}${len > 60 ? '…' : ''}"`,
        'Keep the title between 50-60 characters for best display in search results.',
      )
    : fail(
        'page_title', 'technical', 'Page title', 'warning', 15,
        len === 0
          ? 'No page title found — browsers and search engines show a blank or the URL.'
          : len < 10
          ? `Page title is too short (${len} chars): "${title}". Unlikely to rank for relevant searches.`
          : `Page title is too long (${len} chars) — search engines will truncate it.`,
        'Write a descriptive title 50-60 characters long: "[Business Name] — [Service] in [Town]".',
      )
}

export function checkMetaDescription(html: string): CheckResult {
  const $ = cheerio.load(html)
  const desc = $('meta[name="description"]').attr('content')?.trim() ?? ''
  const len = desc.length
  const passed = len >= 50 && len <= 160
  return passed
    ? pass(
        'meta_description', 'technical', 'Meta description', 'warning', 15,
        `Meta description is ${len} characters.`,
        'Good. Keep it between 120-155 characters to avoid truncation in search results.',
      )
    : fail(
        'meta_description', 'technical', 'Meta description', 'warning', 15,
        len === 0
          ? 'No meta description found. Google will pick random text from the page — usually badly.'
          : len < 50
          ? `Meta description is too short (${len} chars). Not enough to influence clicks from search.`
          : `Meta description is too long (${len} chars) — Google will cut it off mid-sentence.`,
        'Write a 120-155 character description: what you do, where, and why customers choose you.',
      )
}

export function checkOgTags(html: string): CheckResult {
  const $ = cheerio.load(html)
  const ogCount = $('meta[property^="og:"]').length
  const passed = ogCount >= 3
  return passed
    ? pass(
        'og_tags', 'technical', 'Open Graph tags', 'warning', 15,
        `${ogCount} Open Graph tags found — links shared on WhatsApp and Facebook will preview correctly.`,
        'Good. Ensure og:image is at least 1200x630px.',
      )
    : fail(
        'og_tags', 'technical', 'Open Graph tags', 'warning', 15,
        ogCount === 0
          ? 'No Open Graph tags found. Links shared on WhatsApp, Facebook, and iMessage will look broken.'
          : `Only ${ogCount} Open Graph tag(s) found — incomplete. Links may not preview correctly.`,
        'Add og:title, og:description, og:image, and og:url to your <head>.',
      )
}

export function checkFavicon(html: string): CheckResult {
  const $ = cheerio.load(html)
  const found = $('link[rel*="icon"]').length > 0
  return found
    ? pass(
        'favicon', 'technical', 'Favicon', 'info', 10,
        'A favicon is set — the site has a branded tab icon.',
        'Good.',
      )
    : fail(
        'favicon', 'technical', 'Favicon', 'info', 10,
        'No favicon found. The browser tab shows a blank page icon — low professionalism signal.',
        'Add a favicon. A 32x32 PNG with <link rel="icon" href="/favicon.ico"> is enough.',
      )
}

export function checkStaleCopyright(html: string): CheckResult {
  const $ = cheerio.load(html)
  const footerText = $('footer').text() || $('body').text()
  const currentYear = new Date().getFullYear()
  const yearMatch = footerText.match(/©\s*(\d{4})|\bCopyright\s+(\d{4})/i)
  if (!yearMatch) {
    return pass(
      'stale_copyright', 'technical', 'Copyright year', 'info', 10,
      'No copyright year found in the footer.',
      'Consider adding a copyright notice with the current year.',
    )
  }
  const year = parseInt(yearMatch[1] || yearMatch[2], 10)
  const passed = year >= currentYear - 2
  return passed
    ? pass(
        'stale_copyright', 'technical', 'Copyright year', 'info', 10,
        `Copyright year is ${year} — recent enough.`,
        'Good.',
      )
    : fail(
        'stale_copyright', 'technical', 'Copyright year', 'info', 10,
        `Copyright year is ${year} — ${currentYear - year} years out of date. Signals a neglected site.`,
        `Update the copyright to © ${currentYear}.`,
      )
}

export function checkBrokenLinks(
  html: string,
  url: string,
  brokenUrls: string[],
): CheckResult {
  const passed = brokenUrls.length === 0
  return passed
    ? pass(
        'broken_links', 'technical', 'Internal links', 'warning', 10,
        'No broken internal links detected.',
        'Good. Run a link checker periodically.',
      )
    : fail(
        'broken_links', 'technical', 'Internal links', 'warning', 10,
        `${brokenUrls.length} broken link(s) found: ${brokenUrls.slice(0, 3).join(', ')}${brokenUrls.length > 3 ? '…' : ''}.`,
        'Fix or remove broken links — they frustrate visitors and hurt search rankings.',
      )
}

// ─── Category 5: Accessibility ───────────────────────────────────────────────

export function checkContrast(pagespeed: CheckInput['pagespeed']): CheckResult {
  const audit = getPageSpeedAudit(pagespeed, 'color-contrast')
  if (audit === null) {
    return pass(
      'contrast', 'accessibility', 'Colour contrast', 'critical', 30,
      'Contrast data unavailable from PageSpeed.',
      'Use a contrast checker to verify text meets WCAG AA (4.5:1 ratio).',
    )
  }
  const passed = (audit.score ?? 1) >= 0.9
  return passed
    ? pass(
        'contrast', 'accessibility', 'Colour contrast', 'critical', 30,
        'Colour contrast passes — text is readable for low-vision users.',
        'Good.',
      )
    : fail(
        'contrast', 'accessibility', 'Colour contrast', 'critical', 30,
        'Colour contrast failures detected. Some text is hard to read, especially for older users.',
        'Ensure text-to-background contrast is at least 4.5:1. Use WebAIM Contrast Checker.',
      )
}

export function checkImageAltText(html: string): CheckResult {
  const $ = cheerio.load(html)
  const imagesWithoutAlt = $('img:not([alt])').length
  const imagesWithEmptyAlt = $('img[alt=""]').length
  const passed = imagesWithoutAlt === 0 && imagesWithEmptyAlt === 0
  const total = $('img').length
  return passed
    ? pass(
        'image_alt_text', 'accessibility', 'Image alt text', 'warning', 25,
        total === 0
          ? 'No images found on the page.'
          : `All ${total} image(s) have descriptive alt text.`,
        'Good. Keep alt text descriptive, not "image1.jpg".',
      )
    : fail(
        'image_alt_text', 'accessibility', 'Image alt text', 'warning', 25,
        `${imagesWithoutAlt + imagesWithEmptyAlt} image(s) missing alt text out of ${total}. Screen readers will skip these.`,
        'Add descriptive alt attributes to every <img>: what the image shows, not just "photo".',
      )
}

export function checkHeadingOrder(html: string): CheckResult {
  const $ = cheerio.load(html)
  const headings: number[] = []
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    if ('tagName' in el) headings.push(parseInt((el as { tagName: string }).tagName.replace('h', ''), 10))
  })
  if (headings.length === 0) {
    return fail(
      'heading_order', 'accessibility', 'Heading hierarchy', 'warning', 20,
      'No headings found on the page. Search engines and screen readers rely on headings for structure.',
      'Add an H1 for the page title, then H2s for main sections.',
    )
  }
  const hasH1 = headings.includes(1)
  const issues: string[] = []
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] - headings[i - 1] > 1) {
      issues.push(`H${headings[i - 1]} → H${headings[i]}`)
    }
  }
  const passed = hasH1 && issues.length === 0
  return passed
    ? pass(
        'heading_order', 'accessibility', 'Heading hierarchy', 'warning', 20,
        `Heading structure is valid: ${headings.map(h => `H${h}`).join(', ')}.`,
        'Good. Keep one H1 per page.',
      )
    : fail(
        'heading_order', 'accessibility', 'Heading hierarchy', 'warning', 20,
        !hasH1
          ? 'No H1 heading found. Every page should have exactly one H1.'
          : `Heading levels skip: ${issues.join(', ')}. This confuses screen readers.`,
        'Fix heading order: H1 → H2 → H3 with no skipped levels.',
      )
}

export function checkFormLabels(html: string): CheckResult {
  const $ = cheerio.load(html)
  const unlabelledInputs: string[] = []
  $('input:not([type="hidden"]):not([type="submit"]):not([type="button"])').each((_, el) => {
    const id = $(el).attr('id')
    const ariaLabel = $(el).attr('aria-label')
    const ariaLabelledBy = $(el).attr('aria-labelledby')
    const hasLabel = id ? $(`label[for="${id}"]`).length > 0 : false
    if (!hasLabel && !ariaLabel && !ariaLabelledBy) {
      unlabelledInputs.push($(el).attr('type') ?? 'input')
    }
  })
  const passed = unlabelledInputs.length === 0
  return passed
    ? pass(
        'form_labels', 'accessibility', 'Form field labels', 'warning', 15,
        'All form inputs have associated labels.',
        'Good.',
      )
    : fail(
        'form_labels', 'accessibility', 'Form field labels', 'warning', 15,
        `${unlabelledInputs.length} form input(s) lack a label: ${unlabelledInputs.join(', ')}. Screen readers and voice control cannot identify these fields.`,
        'Add a <label for="fieldId"> or aria-label attribute to every input.',
      )
}

export function checkLangAttribute(html: string): CheckResult {
  const $ = cheerio.load(html)
  const found = $('html[lang]').length > 0
  return found
    ? pass(
        'lang_attribute', 'accessibility', 'HTML lang attribute', 'info', 10,
        `HTML lang attribute is set to "${$('html').attr('lang')}".`,
        'Good.',
      )
    : fail(
        'lang_attribute', 'accessibility', 'HTML lang attribute', 'info', 10,
        'No lang attribute on the <html> element. Screen readers may use the wrong language for text-to-speech.',
        'Add lang="en" to your <html> tag.',
      )
}

// ─── Category 6: Design / AI Slop ─────────────────────────────────────────────

export function checkGradientText(css: string): CheckResult {
  const hasGradientText =
    /background(?:-image)?\s*:\s*(?:linear|radial)-gradient[^;]+;[^}]*(?:background-clip|webkit-background-clip)\s*:\s*text/i.test(
      css,
    ) ||
    /(?:background-clip|webkit-background-clip)\s*:\s*text[\s\S]*?background(?:-image)?\s*:\s*(?:linear|radial)-gradient/i.test(
      css,
    )
  return hasGradientText
    ? fail(
        'gradient_text', 'design', 'Gradient text', 'warning', 20,
        'Gradient text effect detected. This has become a stock AI-generated design cliche.',
        'Replace gradient text with solid, well-chosen type colour.',
      )
    : pass(
        'gradient_text', 'design', 'Gradient text', 'warning', 20,
        'No gradient text detected.',
        'Good.',
      )
}

export function checkGenericFonts(css: string): CheckResult {
  const genericFonts = ['inter', 'roboto', 'arial', 'open sans', 'helvetica']
  const lowerCss = css.toLowerCase()
  // Check if any font-family declaration contains only generic fonts
  const fontFamilyPattern = /font-family\s*:\s*([^;]+)/gi
  let m: RegExpExecArray | null
  const usedFonts: string[] = []
  while ((m = fontFamilyPattern.exec(lowerCss)) !== null) {
    usedFonts.push(m[1].trim())
  }
  if (usedFonts.length === 0) {
    return pass(
      'generic_fonts', 'design', 'Font choice', 'info', 15,
      'No explicit font choices found in CSS — using browser defaults.',
      'Set a distinctive font to establish brand identity.',
    )
  }
  const hasDistinctiveFont = usedFonts.some(f =>
    !genericFonts.some(g => f.toLowerCase() === g || f.toLowerCase() === `"${g}"` || f.toLowerCase() === `'${g}'`),
  )
  return hasDistinctiveFont
    ? pass(
        'generic_fonts', 'design', 'Font choice', 'info', 15,
        'At least one non-default font is in use — the site has a distinct typographic identity.',
        'Good.',
      )
    : fail(
        'generic_fonts', 'design', 'Font choice', 'info', 15,
        'Only generic system fonts (Arial, Roboto, etc.) detected. The site has no typographic personality.',
        'Add one distinctive font from Google Fonts for headings — even one change lifts the design.',
      )
}

export function checkFontCount(css: string): CheckResult {
  const fontFamilyPattern = /font-family\s*:\s*([^;,}]+)/gi
  const families = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = fontFamilyPattern.exec(css)) !== null) {
    // Extract first family name
    const first = m[1].trim().split(',')[0].replace(/['"]/g, '').trim().toLowerCase()
    if (first && !['inherit', 'initial', 'unset', 'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy'].includes(first)) {
      families.add(first)
    }
  }
  const count = families.size
  const passed = count <= 3
  return passed
    ? pass(
        'font_count', 'design', 'Font count', 'info', 10,
        count === 0
          ? 'No font families detected — using browser defaults.'
          : `${count} font family/families in use — within the 3-font limit.`,
        'Good. Fewer fonts = faster loading and more cohesive design.',
      )
    : fail(
        'font_count', 'design', 'Font count', 'info', 10,
        `${count} different font families detected — too many. The design will feel inconsistent.`,
        'Reduce to 2 fonts maximum: one for headings, one for body text.',
      )
}

export function checkThreeColGrid(css: string): CheckResult {
  const $ = cheerio.load('')
  const patterns = [
    /grid-template-columns\s*:\s*repeat\s*\(\s*3\s*,\s*1fr\s*\)/i,
    /grid-template-columns\s*:\s*1fr\s+1fr\s+1fr/i,
    /grid-template-columns\s*:\s*33\.3/i,
  ]
  const hasGridPattern = patterns.some(p => p.test(css))
  const hasBootstrapCols = /col-md-4/.test(css)
  const found = hasGridPattern || hasBootstrapCols
  return found
    ? fail(
        'three_col_grid', 'design', 'Three-column equal grid', 'info', 15,
        'A three-equal-column grid is detected — a common template layout that can feel generic.',
        'Consider an asymmetric layout or varying column widths to create visual interest.',
      )
    : pass(
        'three_col_grid', 'design', 'Three-column equal grid', 'info', 15,
        'No generic three-equal-column grid pattern detected.',
        'Good.',
      )
}

export function checkEmDashes(html: string): CheckResult {
  const $ = cheerio.load(html)
  const bodyText = $('body').text()
  const emDashes = (bodyText.match(/[—–]/g) ?? []).length
  const passed = emDashes === 0
  return passed
    ? pass(
        'em_dashes', 'design', 'Em dashes in copy', 'info', 10,
        'No em dashes found in page text.',
        'Good.',
      )
    : fail(
        'em_dashes', 'design', 'Em dashes in copy', 'info', 10,
        `${emDashes} em dash(es) found in copy. Em dashes are a signature tell of AI-generated text.`,
        'Replace em dashes with commas, colons, or separate sentences.',
      )
}

export function checkAiCopyCliches(html: string): CheckResult {
  const $ = cheerio.load(html)
  const bodyText = $('body').text()
  const cliches = [
    'elevate', 'seamless', 'unleash', 'next-gen', 'revolutionize',
    'transform your', 'game-changer', 'world-class', 'cutting-edge',
  ]
  const found = cliches.filter(c => bodyText.toLowerCase().includes(c))
  const passed = found.length === 0
  return passed
    ? pass(
        'ai_copy_cliches', 'design', 'AI copy cliches', 'warning', 15,
        'No AI copy cliches detected in page text.',
        'Good. Keep copy specific and human.',
      )
    : fail(
        'ai_copy_cliches', 'design', 'AI copy cliches', 'warning', 15,
        `Cliche phrases detected: "${found.slice(0, 3).join('", "')}". These are hallmarks of AI-generated copy that no one believes.`,
        'Replace with specific, honest language about what you do and who you serve.',
      )
}

export function checkPlaceholderText(html: string): CheckResult {
  const $ = cheerio.load(html)
  const bodyText = $('body').text().toLowerCase()
  const placeholders = ['lorem ipsum', 'welcome to our website', 'click here to edit']
  const found = placeholders.filter(p => bodyText.includes(p))
  const passed = found.length === 0
  return passed
    ? pass(
        'placeholder_text', 'design', 'Placeholder text', 'warning', 10,
        'No placeholder text detected.',
        'Good.',
      )
    : fail(
        'placeholder_text', 'design', 'Placeholder text', 'warning', 10,
        `Placeholder text found: "${found.join('", "')}". This was never replaced after building the site.`,
        'Replace all placeholder text with real content immediately.',
      )
}

export function checkBuilderFingerprint(html: string): { check: CheckResult; builder: string | null } {
  const builderPatterns: Array<{ name: string; pattern: RegExp }> = [
    { name: 'Wix', pattern: /class="[^"]*wix-/i },
    { name: 'Squarespace', pattern: /class="[^"]*squarespace-/i },
    { name: 'GoDaddy', pattern: /class="[^"]*\bgd-/i },
    { name: 'WordPress (Gutenberg)', pattern: /class="[^"]*wp-block-/i },
    { name: 'Divi', pattern: /class="[^"]*\bdivi_/i },
    { name: 'Elementor', pattern: /class="[^"]*elementor-/i },
  ]
  const detected = builderPatterns.find(b => b.pattern.test(html))
  const builder = detected?.name ?? null
  const check: CheckResult = {
    id: 'builder_fingerprint',
    category: 'design',
    name: 'Page builder detected',
    passed: true, // not a failure — just context
    severity: 'info',
    score_impact: 5,
    finding: builder
      ? `Built with ${builder}. This limits design flexibility and can add page weight.`
      : 'No page builder fingerprint detected — likely a custom-built or hand-coded site.',
    recommendation: builder
      ? `A custom-built site would give you more control over design and performance.`
      : 'Good.',
  }
  return { check, builder }
}

// ─── Main runner ─────────────────────────────────────────────────────────────

export function runAllChecks(
  input: CheckInput,
  brokenLinks: string[] = [],
): { checks: CheckResult[]; builder: string | null } {
  const { html, css, url, pagespeed } = input
  const { check: builderCheck, builder } = checkBuilderFingerprint(html)

  const checks: CheckResult[] = [
    // Conversion
    checkPhoneTapToCall(html),
    checkBookingWidget(html),
    checkCtaAboveFold(html),
    checkWhatsappLink(html),
    checkContactForm(html),
    checkAddressPresent(html),
    // Performance
    checkPagespeedScore(pagespeed),
    checkLcp(pagespeed),
    checkCls(pagespeed),
    checkPageSize(pagespeed),
    checkImageFormats(pagespeed),
    // Mobile
    checkViewportMeta(html),
    checkNoHorizontalScroll(css),
    checkTouchTargets(pagespeed),
    checkReadableTextSize(css),
    checkResponsiveLayout(css),
    // Technical
    checkHttps(url),
    checkPageTitle(html),
    checkMetaDescription(html),
    checkOgTags(html),
    checkFavicon(html),
    checkStaleCopyright(html),
    checkBrokenLinks(html, url, brokenLinks),
    // Accessibility
    checkContrast(pagespeed),
    checkImageAltText(html),
    checkHeadingOrder(html),
    checkFormLabels(html),
    checkLangAttribute(html),
    // Design
    checkGradientText(css),
    checkGenericFonts(css),
    checkFontCount(css),
    checkThreeColGrid(css),
    checkEmDashes(html),
    checkAiCopyCliches(html),
    checkPlaceholderText(html),
    builderCheck,
  ]

  return { checks, builder }
}
