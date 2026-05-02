import { prisma } from '@/lib/prisma'

export const candidateService = {
  async getProfileByUserId(userId: string) {
    try {
      // 1. Fetch Candidate
      const candidate = await prisma.candidate.findUnique({
        where: { userId },
        include: { user: true }
      })
      
      if (!candidate) return null

      // 2. Fetch associated job matches with Job details
      const matches = await prisma.pipelineMatch.findMany({
        where: { candidateId: candidate.id },
        include: {
          job: {
            select: {
              title: true,
              clientName: true,
              location: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      
      return {
        ...candidate,
        matches: matches.map((m: any) => ({
          id: m.id,
          jobId: m.jobId,
          jobTitle: m.job?.title || 'Unknown Role',
          clientName: m.job?.clientName || 'Private Client',
          status: m.status,
          score: m.score,
          updatedAt: m.updatedAt
        }))
      }
    } catch (err) {
      console.error('getProfileByUserId Error:', err)
      return null
    }
  },

  async updateProfile(userId: string, data: any) {
    const candidate = await this.getProfileByUserId(userId)
    const now = new Date().toISOString()

    const exp = parseFloat(String(data.totalExperience ?? data.experienceYears ?? 0)) || 0
    const skillsArr = Array.isArray(data.skills)
      ? data.skills.map((s: string) => String(s).trim()).filter(Boolean)
      : String(data.skills || '')
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)

    const langArr = Array.isArray(data.languages)
      ? data.languages.map((s: string) => String(s).trim()).filter(Boolean)
      : typeof data.languages === 'string'
        ? data.languages.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean)
        : undefined

    const $set: Record<string, unknown> = {
      totalExperience: exp,
      experienceYears: Math.floor(exp),
      skills: skillsArr,
      updatedAt: { $date: now },
    }

    const put = (key: string, val: unknown) => {
      if (val === undefined) return
      $set[key] = val
    }

    put('name', data.name)
    put('currentRole', data.currentRole)
    put('phone', data.phone)
    put('education', data.education)
    put('summary', data.summary)
    put('currentSalary', data.currentSalary)
    put('expectedSalary', data.expectedSalary)
    put('noticePeriod', data.noticePeriod)
    put('preferredLocation', data.preferredLocation)
    put('workSettingPreference', data.workSettingPreference)
    put('isReadyToJoin', data.isReadyToJoin)
    put('linkedInUrl', data.linkedInUrl)
    put('profilePic', data.profilePic)
    put('cvUrl', data.cvUrl)
    put('salarySlipUrl', data.salarySlipUrl)
    put('offerLetterUrl', data.offerLetterUrl)
    put('terminationLetterUrl', data.terminationLetterUrl)
    put('certifications', data.certifications)
    put('employmentHistory', data.employmentHistory)
    put('projects', data.projects)
    if (langArr !== undefined) $set.languages = langArr

    if (!candidate) {
      await (prisma as any).$runCommandRaw({
        insert: 'Candidate',
        documents: [
          {
            userId: { $oid: userId },
            name: data.name || 'Unknown',
            currentRole: data.currentRole || 'Talent',
            isReadyToJoin: data.isReadyToJoin ?? true,
            createdAt: { $date: now },
            ...$set,
          },
        ],
      })
      return { ok: true }
    }

    await (prisma as any).$runCommandRaw({
      update: 'Candidate',
      updates: [
        {
          q: { _id: { $oid: candidate.id } },
          u: { $set },
        },
      ],
    })
    return { ok: true }
  },

  async getAvailableJobs(userId: string) {
    // 1. Fetch Candidate & Jobs via raw commands for stability
    const [candidate, jobsResult] = await Promise.all([
      this.getProfileByUserId(userId),
      (prisma as any).$runCommandRaw({ find: 'Job', filter: { status: 'Active' }, sort: { createdAt: -1 } })
    ])

    const jobs = (jobsResult as any)?.cursor?.firstBatch ?? []
    const formattedJobs = jobs.map((j: any) => ({
      id: j._id?.$oid ?? String(j._id),
      ...j,
      createdAt: j.createdAt?.$date ?? j.createdAt
    }))

    if (!candidate) return { jobs: formattedJobs }

    // 2. Real Logic Implementation (Multidimensional Matching variant)
    const enriched = formattedJobs.map((job: any) => {
      let skillScore = 0
      const reqSkills = (job.requiredSkills || []).map((s: string) => s.toLowerCase())
      const canSkills = (candidate.skills || []).map((s: string) => s.toLowerCase())
      
      if (reqSkills.length > 0) {
        const overlap = canSkills.filter((s: string) => reqSkills.includes(s)).length
        skillScore = (overlap / reqSkills.length) * 100
      } else {
        skillScore = 80
      }

      // Logistics alignment check
      const jobNotice = (job.noticePeriod || '').toLowerCase()
      const canNotice = (candidate.noticePeriod || '').toLowerCase()
      const logisticsScore = (jobNotice === canNotice || canNotice === 'immediate') ? 100 : 70

      const score = Math.round((skillScore * 0.7) + (logisticsScore * 0.3))
      return { ...job, matchScore: score }
    })

    return { jobs: enriched }
  }
}
