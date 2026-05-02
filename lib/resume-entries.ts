/**
 * Split free-text employment / projects CV fields into discrete entries and parse
 * common pipe-separated rows (Company | Role | Dates | …) for admin UI.
 */

export type ParsedResumeRow = {
  raw: string
  project: string
  place: string
  designation: string
  period: string
  detail: string
  years: number[]
  /** Highest year in the entry (approx. end of tenure) — primary sort */
  yearSort: number
  /** Lowest year in the entry (approx. start of tenure) — tie-breaker */
  yearStartSort: number
  yearLabel: string
}

export type ResumeSortOrder = 'newest-first' | 'oldest-first'

/** Words that look like locations but are usually role titles — never use as “place” from the last token of a headline. */
const NOT_PLACE_LAST_WORD = new Set(
  [
    'architect',
    'engineer',
    'manager',
    'lead',
    'developer',
    'designer',
    'consultant',
    'specialist',
    'associate',
    'executive',
    'director',
    'officer',
    'analyst',
    'partner',
    'administrator',
    'coordinator',
    'supervisor',
    'technician',
    'scientist',
    'intern',
    'trainee',
    'assistant',
    'head',
    'chief',
    'president',
    'founder',
    'staff',
    'sr',
    'jr',
    'senior',
    'junior',
  ].map((w) => w.toLowerCase())
)

const MONTH_YEAR =
  /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*[,'\-]?\s*((?:19|20)\d{2})\b/gi

export function extractYears(text: string): number[] {
  const out = new Set<number>()
  const s = text
  for (const m of s.matchAll(/\b(19|20)\d{2}\b/g)) {
    const y = parseInt(m[0], 10)
    if (y >= 1960 && y <= 2100) out.add(y)
  }
  for (const m of s.matchAll(MONTH_YEAR)) {
    const y = parseInt(m[1], 10)
    if (y >= 1960 && y <= 2100) out.add(y)
  }
  return [...out].sort((a, b) => a - b)
}

/** Cities / regions often embedded in project titles (Indian + Gulf CVs). */
const PLACE_HINTS = [
  'NEW DELHI',
  'GREATER NOIDA',
  'SOHNA ROAD',
  'SOHNA',
  'GURUGRAM',
  'GURGAON',
  'NOIDA',
  'DELHI',
  'ROHINI',
  'MUMBAI',
  'PUNE',
  'HYDERABAD',
  'BENGALURU',
  'BANGALORE',
  'CHENNAI',
  'KOLKATA',
  'DOHA',
  'QATAR',
  'DUBAI',
  'ABU DHABI',
  'SHARJAH',
  'RIYADH',
  'KUWAIT',
  'MUSCAT',
  'CHANAPATTNA',
  'CHANNAPATTNA',
  'CHANNAPATNA',
  'CENTRAL PARK',
] as const

export function inferPlaceFromBlob(blob: string): string {
  const t = blob.trim()
  if (!t) return ''
  for (const hint of PLACE_HINTS) {
    const re = new RegExp(`\\b${hint.replace(/\s+/g, '\\s+')}\\b`, 'i')
    if (re.test(t)) {
      return hint
        .split(/\s+/)
        .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
        .join(' ')
    }
  }
  const paren = t.match(/\(\s*([A-Z][A-Za-z]+(?:\s+[A-Za-z]+){0,6})\s*\)/)
  if (paren && paren[1].length >= 3 && paren[1].length <= 48) {
    const inner = paren[1].trim()
    if (/^[A-Za-z\s]+$/.test(inner)) return inner
  }
  return ''
}

/** Single column label: prefer readable period text when present, else numeric year span from any segment. */
function buildTimelineLabel(p: ParsedResumeRow, yearsFromBlob: number[]): string {
  const pt = p.period.trim()
  if (pt && /(19|20)\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(pt)) {
    return pt.length > 120 ? `${pt.slice(0, 117)}…` : pt
  }
  if (yearsFromBlob.length > 0) return formatYearLabel(yearsFromBlob)
  const yd = extractYears(p.detail)
  if (yd.length > 0) return formatYearLabel(yd)
  if (pt) return pt.length > 120 ? `${pt.slice(0, 117)}…` : pt
  const yr = extractYears(p.raw)
  if (yr.length > 0) return formatYearLabel(yr)
  return '—'
}

function enrichParsedRow(p: ParsedResumeRow): ParsedResumeRow {
  const blob = [p.raw, p.period, p.detail].join('\n')
  let years = extractYears(blob)
  const yearSort = years.length ? Math.max(...years) : 0
  const yearStartSort = years.length ? Math.min(...years) : 0

  let place = p.place?.trim() || ''
  if (!place || place === '—') {
    const inferred = inferPlaceFromBlob(blob)
    if (inferred) place = inferred
  }

  const yearLabel = buildTimelineLabel(p, years)

  return {
    ...p,
    years,
    yearSort,
    yearStartSort,
    yearLabel,
    place,
  }
}

function formatYearLabel(years: number[]): string {
  if (years.length === 0) return '—'
  if (years.length === 1) return String(years[0])
  return `${years[0]}–${years[years.length - 1]}`
}

function looksLikePeriodSeg(p: string): boolean {
  return /(19|20)\d{2}|jan\.?|feb\.?|mar\.?|apr\.?|may\.?|jun\.?|jul\.?|aug\.?|sep\.?|oct\.?|nov\.?|dec\.?|\bto\b|\bTO\b|present|current|january|february|march|april|june|july|august|september|october|november|december/i.test(
    p
  )
}

function pickPeriodSegment(parts: string[]): string {
  for (const p of parts) {
    if (looksLikePeriodSeg(p)) return p
  }
  if (parts.length >= 3) return parts[2]
  return ''
}

function splitPlaceFromHead(head: string): { project: string; place: string } {
  const t = head.trim()
  if (!t) return { project: '', place: '' }
  const comma = t.lastIndexOf(',')
  if (comma > 0 && comma < t.length - 1) {
    const left = t.slice(0, comma).trim()
    const right = t.slice(comma + 1).trim()
    if (right.length >= 2 && right.length < 60) {
      return { project: left, place: right }
    }
  }
  const words = t.split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    const last = words[words.length - 1]
    if (
      /^[A-Za-z]{3,}$/.test(last) &&
      last.length <= 24 &&
      !NOT_PLACE_LAST_WORD.has(last.toLowerCase())
    ) {
      return {
        project: words.slice(0, -1).join(' '),
        place: last,
      }
    }
  }
  return { project: t, place: '' }
}

function extractPlaceFromTitle(title: string): string {
  const { place } = splitPlaceFromHead(title)
  return place
}

/**
 * Split stored CV text into individual entries (pipe rows, *-headed blocks, prose blocks).
 */
export function splitResumeEntries(text: string): string[] {
  const t = text.trim()
  if (!t) return []
  const lines = t.split(/\r?\n/)
  const entries: string[] = []
  let proseBuf: string[] = []

  const flushProse = () => {
    if (proseBuf.length) {
      const block = proseBuf.join('\n').trim()
      if (block) entries.push(block)
      proseBuf = []
    }
  }

  for (const line of lines) {
    const tr = line.trim()
    if (!tr) {
      flushProse()
      continue
    }

    if (/^\*\s+\S/.test(tr)) {
      flushProse()
      proseBuf.push(line)
      continue
    }

    const segs = tr.split('|').map((s) => s.trim()).filter(Boolean)
    const compactPipe = segs.length >= 2 && tr.includes('|') && tr.length < 900
    if (compactPipe) {
      flushProse()
      entries.push(tr)
    } else {
      proseBuf.push(line)
    }
  }
  flushProse()
  return entries
}

export function parseResumeEntry(raw: string): ParsedResumeRow {
  const pipeParts = raw.split('|').map((s) => s.trim()).filter(Boolean)
  if (pipeParts.length >= 2) {
    const first = pipeParts[0]
    const second = pipeParts[1]
    let period = ''
    let detail = ''
    if (pipeParts.length >= 3) {
      const third = pipeParts[2]
      if (looksLikePeriodSeg(third)) {
        period = third
        detail = pipeParts.slice(3).join(' · ')
      } else {
        period = pickPeriodSegment(pipeParts.slice(2)) || ''
        detail = period ? pipeParts.slice(3).join(' · ') : pipeParts.slice(2).join(' · ')
      }
    }
    const { project, place } = splitPlaceFromHead(first)

    const base: ParsedResumeRow = {
      raw,
      project: project || first,
      place,
      designation: second,
      period,
      detail,
      years: [],
      yearSort: 0,
      yearStartSort: 0,
      yearLabel: '—',
    }
    return enrichParsedRow(base)
  }

  const withoutStar = raw.replace(/^\*\s*/, '').trim()
  const lines = withoutStar.split(/\n/)
  const firstLine = lines[0]?.trim() || withoutStar.slice(0, 160)
  const restLines = lines.slice(1).join('\n').trim()
  const clientMatch = raw.match(/Client:\s*([^\n]+)/i)
  const placeFromTitle = extractPlaceFromTitle(firstLine)

  const base: ParsedResumeRow = {
    raw,
    project: firstLine,
    place: placeFromTitle || '',
    designation: clientMatch ? clientMatch[1].trim() : 'Portfolio project',
    period: '',
    detail: restLines,
    years: [],
    yearSort: 0,
    yearStartSort: 0,
    yearLabel: '—',
  }
  return enrichParsedRow(base)
}

export function removeResumeEntryAt(fullText: string, index: number): string {
  const entries = splitResumeEntries(fullText)
  if (index < 0 || index >= entries.length) return fullText
  const next = entries.filter((_, i) => i !== index)
  return next.join('\n\n')
}

/**
 * Stable indices (original entry order) preserved on each row for future actions.
 * Default newest-first: highest year (typ. end of role), then highest start year when tied (more recent stint).
 * Oldest-first: earliest start year, then earliest end year.
 */
export function sortEntriesForDisplay(
  text: string,
  order: ResumeSortOrder = 'newest-first'
): { parsed: ParsedResumeRow; originalIndex: number }[] {
  const entries = splitResumeEntries(text)
  const mapped = entries.map((raw, originalIndex) => ({
    parsed: parseResumeEntry(raw),
    originalIndex,
  }))
  mapped.sort((a, b) => {
    const pa = a.parsed
    const pb = b.parsed

    if (order === 'newest-first') {
      if (pb.yearSort !== pa.yearSort) return pb.yearSort - pa.yearSort
      if (pb.yearStartSort !== pa.yearStartSort) return pb.yearStartSort - pa.yearStartSort
    } else {
      if (pa.yearStartSort !== pb.yearStartSort) return pa.yearStartSort - pb.yearStartSort
      if (pa.yearSort !== pb.yearSort) return pa.yearSort - pb.yearSort
    }

    const pla = pa.place.toLowerCase()
    const plb = pb.place.toLowerCase()
    if (pla !== plb) return pla.localeCompare(plb)
    return pa.project.localeCompare(pb.project)
  })
  return mapped
}
