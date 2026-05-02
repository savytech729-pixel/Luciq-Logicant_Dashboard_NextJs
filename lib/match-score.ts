/**
 * Single source for weighted job↔candidate fit % (same formula as Matching Studio API).
 * Safe for client + server — no I/O.
 */

export type MatchBreakdownRow = {
  skills: number
  experience: number
  roleAlignment: number
  education: number
  location: number
  logistics: number
}

export function computeWeightedMatchScore(job: {
  title?: string
  description?: string
  requiredSkills?: string[]
  experienceRequired?: number
  location?: string
  workSetting?: string
  noticePeriod?: string
}, candidate: {
  skills?: string[]
  totalExperience?: number | string
  experienceYears?: number | string
  currentRole?: string
  summary?: string
  education?: string
  preferredLocation?: string
  workSettingPreference?: string
  noticePeriod?: string
}): {
  score: number
  breakdown: MatchBreakdownRow
  matchedRequiredSkills: string[]
  missingRequiredSkills: string[]
  reqExp: number
  canExp: number
} {
  let skillScore = 0
  let logisticsScore = 0
  let locationScore = 0
  let experienceScore = 0
  let roleScore = 0
  let educationScore = 70

  const normalize = (value: string) =>
    String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

  const titleTokens =
    String(job.title || '')
      .toLowerCase()
      .match(/[a-z0-9+#]{3,}/g)
      ?.filter((w) => !['the', 'and', 'for', 'with', 'from', 'role', 'opening'].includes(w)) ?? []

  const rawReq = (job.requiredSkills || []) as string[]
  const canSkills = (candidate.skills || []).map((s: string) => normalize(s)).filter(Boolean)
  const matchedRequiredSkills: string[] = []
  const missingRequiredSkills: string[] = []
  const reqTokens: string[] = []
  for (const raw of rawReq) {
    const req = normalize(String(raw || ''))
    if (!req) continue
    reqTokens.push(req)
    const label = String(raw).trim() || req
    const hit = canSkills.some((can: string) => can === req || can.includes(req) || req.includes(can))
    if (hit) matchedRequiredSkills.push(label)
    else missingRequiredSkills.push(label)
  }
  if (reqTokens.length > 0) {
    skillScore = (matchedRequiredSkills.length / reqTokens.length) * 100
  } else {
    skillScore = 85
  }

  const notice = (candidate.noticePeriod || '').toLowerCase()
  const jobUrgency = (job.noticePeriod || '').toLowerCase()

  if (!notice) logisticsScore = 55
  else if (notice.includes('immediate')) logisticsScore = 100
  else if (notice.includes('15')) logisticsScore = 85
  else if (jobUrgency && notice === jobUrgency) logisticsScore = 80
  else if (notice.includes('30')) logisticsScore = 68
  else logisticsScore = 50

  const jobLoc = (job.location || '').toLowerCase()
  const canLoc = (candidate.preferredLocation || '').toLowerCase()
  const jobSetting = (job.workSetting || '').toLowerCase()
  const canSetting = (candidate.workSettingPreference || '').toLowerCase()

  if (jobSetting === 'remote' && (canSetting === 'remote' || canLoc.includes('remote'))) locationScore = 100
  else if (jobLoc && canLoc && (jobLoc.includes(canLoc.split('/')[0].trim()) || canLoc.includes(jobLoc.slice(0, 12))))
    locationScore = 95
  else if (jobSetting && canSetting && jobSetting === canSetting) locationScore = 82
  else if (!canLoc && !canSetting) locationScore = 45
  else locationScore = 58

  const reqExp = Number(job.experienceRequired) || 0
  const canExp = Number(candidate.totalExperience ?? candidate.experienceYears ?? 0)
  if (reqExp <= 0) experienceScore = 90
  else if (canExp >= reqExp) experienceScore = 100
  else experienceScore = Math.min(100, (canExp / reqExp) * 100)

  const roleBlob = `${candidate.currentRole || ''} ${candidate.summary || ''}`.toLowerCase()
  if (titleTokens.length === 0) roleScore = 70
  else {
    const hits = titleTokens.filter((t) => roleBlob.includes(t)).length
    roleScore = Math.min(100, (hits / titleTokens.length) * 100)
  }

  const edu = String(candidate.education || '').toLowerCase()
  const desc = String(job.description || '').toLowerCase()
  const degreeHints = ['b.tech', 'b.e', 'b.e.', 'm.tech', 'mba', 'ms ', 'bachelor', 'master', 'phd', 'ph.d', 'diploma', 'bca', 'mca']
  const asked = degreeHints.filter((d) => desc.includes(d))
  if (asked.length === 0) educationScore = 88
  else if (!edu) educationScore = 42
  else educationScore = asked.some((d) => edu.includes(d.replace(/\s/g, '')) || edu.includes(d.trim())) ? 100 : 48

  const score =
    skillScore * 0.38 +
    experienceScore * 0.18 +
    roleScore * 0.14 +
    educationScore * 0.1 +
    locationScore * 0.1 +
    logisticsScore * 0.1

  const breakdown: MatchBreakdownRow = {
    skills: Math.round(skillScore),
    experience: Math.round(experienceScore),
    roleAlignment: Math.round(roleScore),
    education: Math.round(educationScore),
    location: Math.round(locationScore),
    logistics: Math.round(logisticsScore),
  }

  return {
    score: Math.round(score),
    breakdown,
    matchedRequiredSkills,
    missingRequiredSkills,
    reqExp,
    canExp,
  }
}
