import { prisma } from '@/lib/prisma'

export const candidateService = {
  async getProfileByUserId(userId: string) {
    try {
      const result = await (prisma as any).$runCommandRaw({
        find: 'Candidate',
        filter: { userId: { $oid: userId } },
        limit: 1
      })
      const docs = (result as any)?.cursor?.firstBatch ?? []
      if (!docs[0]) return null
      
      const candidate = { ...docs[0], id: docs[0]._id?.$oid ?? String(docs[0]._id) }
      
      // Fetch associated job matches for the dashboard feed
      const matchesResult = await (prisma as any).$runCommandRaw({
        find: 'PipelineMatch',
        filter: { candidateId: { $oid: candidate.id } }
      })
      const matches = (matchesResult as any)?.cursor?.firstBatch ?? []
      
      return {
        ...candidate,
        matches: matches.map((m: any) => ({
          jobId: m.jobId?.$oid ?? String(m.jobId),
          status: m.status,
          score: m.score,
          updatedAt: m.updatedAt?.$date ?? m.updatedAt
        }))
      }
    } catch {
      return await prisma.candidate.findFirst({ where: { userId }, include: { user: true } })
    }
  },

  async updateProfile(userId: string, data: any) {
    const candidate = await this.getProfileByUserId(userId)
    const now = new Date().toISOString()
    
    // Flatten data and clean numeric fields
    const updateData = {
      ...data,
      totalExperience: parseFloat(data.totalExperience || data.experienceYears) || 0,
      experienceYears: Math.floor(parseFloat(data.totalExperience || data.experienceYears) || 0),
      updatedAt: { $date: now }
    }

    if (!candidate) {
      const result = await (prisma as any).$runCommandRaw({
        insert: 'Candidate',
        documents: [{
          userId: { $oid: userId },
          name: data.name || 'Unknown',
          currentRole: data.currentRole || 'Talent',
          isReadyToJoin: true,
          createdAt: { $date: now },
          ...updateData
        }]
      })
      return result
    }

    const result = await (prisma as any).$runCommandRaw({
      update: 'Candidate',
      updates: [{
        q: { _id: { $oid: candidate.id } },
        u: { $set: updateData }
      }]
    })
    return result
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
