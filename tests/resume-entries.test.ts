import { describe, it, expect } from 'vitest'
import {
  splitResumeEntries,
  parseResumeEntry,
  removeResumeEntryAt,
  sortEntriesForDisplay,
  extractYears,
  inferPlaceFromBlob,
} from '@/lib/resume-entries'

describe('splitResumeEntries', () => {
  it('splits pipe rows on separate lines', () => {
    const t = `A | B | 2020 TO 2021 |
C | D | 2022 |`
    const s = splitResumeEntries(t)
    expect(s).toHaveLength(2)
  })

  it('keeps asterisk project as one block', () => {
    const t = `* HEAD LINE
Client: X
More text
* NEXT`
    const s = splitResumeEntries(t)
    expect(s.length).toBeGreaterThanOrEqual(2)
    expect(s[0]).toContain('Client:')
  })
})

describe('parseResumeEntry', () => {
  it('parses company | title | period', () => {
    const p = parseResumeEntry('WORLD WIDE REALITY GURGAON | Senior Architect | Feb.2025 TO 11th August 2025 |')
    expect(p.designation).toContain('Senior Architect')
    expect(p.yearSort).toBe(2025)
    expect(p.place).toBeTruthy()
  })
})

describe('removeResumeEntryAt', () => {
  it('removes by index after split', () => {
    const t = 'One | A | 2020 |\n\nTwo | B | 2021 |'
    const u = removeResumeEntryAt(t, 0)
    expect(u).toContain('Two')
    expect(u).not.toContain('One')
  })
})

describe('sortEntriesForDisplay', () => {
  it('sorts newer years first', () => {
    const t = 'Old | X | 2018 |\n\nNew | Y | 2024 |'
    const rows = sortEntriesForDisplay(t)
    expect(rows[0].parsed.yearSort).toBeGreaterThanOrEqual(rows[1].parsed.yearSort)
  })

  it('when end year ties, more recent start sorts higher (newest-first)', () => {
    const t = `Long tenure row | Job | Jan 2021 to Jan 2025 |
Short stint row | Job | Feb 2025 to Aug 2025 |`
    const rows = sortEntriesForDisplay(t, 'newest-first')
    expect(rows[0].parsed.project.toLowerCase()).toContain('short')
  })

  it('oldest-first sorts by start year ascending', () => {
    const t = 'A | X | 2020 |\n\nB | Y | 2015 |'
    const rows = sortEntriesForDisplay(t, 'oldest-first')
    expect(rows[0].parsed.yearStartSort).toBeLessThanOrEqual(rows[1].parsed.yearStartSort)
  })
})

describe('role vs place', () => {
  it('does not treat trailing Architect as location', () => {
    const p = parseResumeEntry('ASSOCIATED WITH VASTUMANDAL ARCHITECT | Architect | Feb.2022 TO Jan 2025 |')
    expect(p.place.toLowerCase()).not.toBe('architect')
  })
})

describe('extractYears', () => {
  it('finds feb.2025 style', () => {
    expect(extractYears('Feb.2025 to Aug.2025')).toContain(2025)
  })
})

describe('inferPlaceFromBlob', () => {
  it('detects city tokens in long project strings', () => {
    expect(inferPlaceFromBlob('BELA VISTA HIGH RISE SECTOR 48 GURGAON CENTRAL PARK')).toMatch(/Gurgaon/i)
  })
})
