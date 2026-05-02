import { prisma } from '@/lib/prisma'
import { summarizeCandidateProfile } from '@/lib/ai'
import { isLikelyObjectId, normalizeDocumentId } from '@/lib/mongodb-id'
import { computeWeightedMatchScore, type MatchBreakdownRow } from '@/lib/match-score'

type MatchBreakdown = MatchBreakdownRow

/** Human-readable why / why-not from the same signals used for scoring (no extra LLM call). */
export function explainCandidateJobMatch(opts: {
  job: { title?: string; description?: string; requiredSkills?: string[]; experienceRequired?: number; location?: string; workSetting?: string; noticePeriod?: string }
  candidate: { currentRole?: string; summary?: string; education?: string; preferredLocation?: string; workSettingPreference?: string; noticePeriod?: string }
  breakdown: MatchBreakdown
  matchedRequiredSkills: string[]
  missingRequiredSkills: string[]
  reqExp: number
  canExp: number
}): { strengths: string[]; gaps: string[] } {
  const strengths: string[] = []
  const gaps: string[] = []

  const {
    job,
    candidate,
    breakdown,
    matchedRequiredSkills,
    missingRequiredSkills,
    reqExp,
    canExp,
  } = opts

  const reqCount = (job.requiredSkills || []).length

  if (reqCount > 0) {
    if (matchedRequiredSkills.length > 0) {
      strengths.push(
        `Skills: matches ${matchedRequiredSkills.length}/${reqCount} required (${matchedRequiredSkills.slice(0, 8).join(', ')}${matchedRequiredSkills.length > 8 ? '…' : ''}).`
      )
    }
    if (missingRequiredSkills.length > 0) {
      gaps.push(
        `Skills gap: missing or unclear vs job list — ${missingRequiredSkills.slice(0, 8).join(', ')}${missingRequiredSkills.length > 8 ? '…' : ''}.`
      )
    }
  } else {
    strengths.push('Job has no explicit skill list; score assumes general fit.')
  }

  if (reqExp > 0) {
    if (canExp >= reqExp) {
      strengths.push(`Experience: ${canExp} yrs meets the ${reqExp}+ yrs requirement.`)
    } else if (canExp > 0) {
      gaps.push(`Experience: profile shows ${canExp} yrs vs ${reqExp}+ yrs asked — may still fit seniority with adjacent roles.`)
    } else {
      gaps.push(`Experience: years not set on profile — compare CV to the ${reqExp}+ yrs bar manually.`)
    }
  } else {
    strengths.push('No fixed experience floor on this vacancy.')
  }

  if (breakdown.roleAlignment >= 72) {
    strengths.push('Role fit: current title/summary overlaps keywords from the job title.')
  } else if (breakdown.roleAlignment < 48) {
    gaps.push('Role fit: weak keyword overlap with the vacancy title — confirm domain fit in screening.')
  }

  if (breakdown.education >= 82) {
    strengths.push('Education: aligns with degree hints in the job description.')
  } else if (breakdown.education < 52) {
    if (!(candidate.education || '').trim()) {
      gaps.push('Education: not stored on profile — add if the role is qualification-sensitive.')
    } else {
      gaps.push('Education: may not match what the posting emphasizes — verify with hiring manager.')
    }
  }

  if (breakdown.location >= 82) {
    strengths.push('Location / work mode: compatible with the opening (site or remote/hybrid).')
  } else if (breakdown.location < 52) {
    gaps.push('Location / work setting: partial match — confirm relocation or hybrid expectations.')
  }

  if (breakdown.logistics >= 78) {
    strengths.push('Joining: notice period looks workable for typical hiring timelines.')
  } else if (breakdown.logistics < 55) {
    gaps.push('Joining: notice unknown or long vs role urgency — validate dates early.')
  }

  if (strengths.length === 0) {
    strengths.push('Baseline fit from weighted dimensions — review profile before deciding.')
  }
  if (gaps.length === 0) {
    gaps.push('No major automated negatives; still validate culture and depth in interview.')
  }

  return { strengths, gaps }
}

export const talentService = {
  async getAllCandidates() {
    // Use Prisma so the list matches deletes and returns every candidate (raw find only returned firstBatch).
    try {
      const docs = await prisma.candidate.findMany({ orderBy: { createdAt: 'desc' } })
      const users = await prisma.user.findMany({
        select: { id: true, email: true },
      })
      const emailMap = users.reduce((acc: Record<string, string>, u) => {
        acc[u.id] = u.email
        return acc
      }, {})

      return docs.map((c) => ({
        ...c,
        email: emailMap[c.userId] ?? '',
      }))
    } catch {
      return await prisma.candidate.findMany({ orderBy: { createdAt: 'desc' } })
    }
  },

  async getAllJobs() {
    try {
      const result = await (prisma as any).$runCommandRaw({
        find: 'Job',
        sort: { createdAt: -1 }
      })
      const docs = (result as any)?.cursor?.firstBatch ?? []
      return docs.map((j: any) => ({
        id: j._id?.$oid ?? String(j._id),
        ...j,
        createdAt: j.createdAt?.$date ?? j.createdAt
      }))
    } catch {
      return await prisma.job.findMany({ orderBy: { createdAt: 'desc' } })
    }
  },

  async matchCandidatesForJob(jobId: string) {
    // 1. Fetch Job with all new fields
    const jobResult = await (prisma as any).$runCommandRaw({
      find: 'Job',
      filter: { _id: { $oid: jobId } },
      limit: 1
    })
    const jobDocs = (jobResult as any)?.cursor?.firstBatch ?? []
    const job = jobDocs[0]
    if (!job) throw new Error('Job not found')

    // 1b. Fetch Persisted Pipeline Statuses
    let statusMap: any = {}
    try {
      const pipelineResult = await (prisma as any).$runCommandRaw({
        find: 'PipelineMatch',
        filter: { jobId: { $oid: jobId } }
      })
      const pipelineDocs = (pipelineResult as any)?.cursor?.firstBatch ?? []
      const latestByCandidate = pipelineDocs.reduce((acc: any, doc: any) => {
        const candidateKey = doc.candidateId?.$oid ?? String(doc.candidateId)
        const rawUpdated = doc.updatedAt?.$date ?? doc.updatedAt ?? doc.createdAt?.$date ?? doc.createdAt
        const updatedAtMs = rawUpdated ? new Date(rawUpdated).getTime() : 0
        const prev = acc[candidateKey]
        if (!prev || updatedAtMs >= prev.updatedAtMs) {
          acc[candidateKey] = { status: doc.status, updatedAtMs }
        }
        return acc
      }, {})
      statusMap = Object.fromEntries(
        Object.entries(latestByCandidate).map(([candidateId, value]: [string, any]) => [candidateId, value.status])
      )
    } catch (err) {
      console.warn('[matchCandidatesForJob] PipelineMatch collection missing or error:', err)
      // Graceful fallback: no statuses yet
    }

    // 2. Fetch all Candidates
    const candidates = await this.getAllCandidates()

    const scoredCandidates = candidates.map((candidate: any) => {
      const {
        score,
        breakdown: matchBreakdown,
        matchedRequiredSkills,
        missingRequiredSkills,
        reqExp,
        canExp,
      } = computeWeightedMatchScore(job, candidate)

      const matchReasons = explainCandidateJobMatch({
        job,
        candidate,
        breakdown: matchBreakdown,
        matchedRequiredSkills,
        missingRequiredSkills,
        reqExp,
        canExp,
      })

      return {
        ...candidate,
        score,
        pipelineStatus: statusMap[candidate.id] || 'REVEALED',
        matchBreakdown,
        matchReasons,
      }
    })

    // Sort descending
    scoredCandidates.sort((a: any, b: any) => b.score - a.score)

    return { 
      job: { ...job, id: jobId }, 
      matchedCandidates: scoredCandidates 
    }
  },

  async getCandidateById(id: string) {
    if (!isLikelyObjectId(id)) return null
    try {
      let result = await (prisma as any).$runCommandRaw({
        find: 'Candidate',
        filter: { _id: { $oid: id } },
        limit: 1
      })
      let docs = (result as any)?.cursor?.firstBatch ?? []
      if (!docs[0]) {
        result = await (prisma as any).$runCommandRaw({
          find: 'Candidate',
          filter: { _id: id },
          limit: 1
        })
        docs = (result as any)?.cursor?.firstBatch ?? []
      }
      const row = docs[0]
      return row ? { ...row, id: normalizeDocumentId(row._id) } : null
    } catch {
      return await prisma.candidate.findUnique({ where: { id } })
    }
  },

  async getCandidateDetail(id: string) {
    if (!isLikelyObjectId(id)) return null
    try {
      let result = await (prisma as any).$runCommandRaw({
        find: 'Candidate',
        filter: { _id: { $oid: id } },
        limit: 1
      })
      let docs = (result as any)?.cursor?.firstBatch ?? []
      if (!docs[0]) {
        result = await (prisma as any).$runCommandRaw({
          find: 'Candidate',
          filter: { _id: id },
          limit: 1
        })
        docs = (result as any)?.cursor?.firstBatch ?? []
      }
      const candidate = docs[0]

      if (!candidate) return null

      const userIdStr = normalizeDocumentId(candidate.userId)
      let user: { email?: string } | null = null
      if (userIdStr && isLikelyObjectId(userIdStr)) {
        const userResult = await (prisma as any).$runCommandRaw({
          find: 'User',
          filter: { _id: { $oid: userIdStr } },
          limit: 1
        })
        user = (userResult as any)?.cursor?.firstBatch?.[0] ?? null
      }
      if (!user?.email && userIdStr) {
        try {
          user = await prisma.user.findUnique({
            where: { id: userIdStr },
            select: { email: true },
          })
        } catch {
          /* ignore */
        }
      }

      const contactEmail = (user?.email || '').trim()
      const candidateData = {
        ...candidate,
        id: normalizeDocumentId(candidate._id),
        email: contactEmail,
        user: { email: contactEmail || 'Not linked' },
      }

      const skillsArr = Array.isArray(candidate.skills)
        ? candidate.skills
        : typeof candidate.skills === 'string'
          ? candidate.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
          : []

      let aiSummary: string[] = []
      try {
        aiSummary = await summarizeCandidateProfile({
          name: candidateData.name,
          currentRole: candidateData.currentRole,
          totalExperience: candidateData.totalExperience,
          experienceYears: candidateData.experienceYears,
          skills: skillsArr,
          education: candidateData.education,
          summary: candidateData.summary,
          preferredLocation: candidateData.preferredLocation,
          expectedSalary: candidateData.expectedSalary,
          noticePeriod: candidateData.noticePeriod,
          phone: candidateData.phone,
        })
      } catch (summarizeErr) {
        console.warn('[getCandidateDetail] summarizeCandidateProfile failed', summarizeErr)
        aiSummary = [
          `${candidateData.name || 'Candidate'} · ${candidateData.currentRole || 'Role unknown'}`,
          skillsArr.length ? `Skills: ${skillsArr.slice(0, 12).join(', ')}` : 'Skills not captured.',
          `${candidateData.education || 'Education N/A'} · ${candidateData.preferredLocation || 'Location N/A'}`,
          candidateData.summary ? String(candidateData.summary).slice(0, 320) : 'Open CV Data tab for parsed fields.',
        ]
      }

      return { candidate: candidateData, aiSummary }
    } catch (err: any) {
      console.error('[getCandidateDetail]', err)
      return null
    }
  }
}
