import { prisma } from '@/lib/prisma'
import { analyzeMatch } from '@/lib/ai'

export const talentService = {
  async getAllCandidates() {
    // Falls back to raw find to handle extended fields without client crash
    try {
      const result = await (prisma as any).$runCommandRaw({
        find: 'Candidate',
        sort: { createdAt: -1 }
      })
      const docs = (result as any)?.cursor?.firstBatch ?? []
      
      // Fetch users to map emails
      const users = await prisma.user.findMany({
        select: { id: true, email: true }
      })
      const emailMap = users.reduce((acc: any, u: any) => {
        acc[u.id] = u.email
        return acc
      }, {})

      return docs.map((c: any) => ({
        id: c._id?.$oid ?? String(c._id),
        ...c,
        email: emailMap[c.userId?.$oid ?? String(c.userId)],
        createdAt: c.createdAt?.$date ?? c.createdAt
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
      statusMap = pipelineDocs.reduce((acc: any, doc: any) => {
        acc[doc.candidateId?.$oid ?? String(doc.candidateId)] = doc.status
        return acc
      }, {})
    } catch (err) {
      console.warn('[matchCandidatesForJob] PipelineMatch collection missing or error:', err)
      // Graceful fallback: no statuses yet
    }

    // 2. Fetch all Candidates
    const candidates = await this.getAllCandidates()

    // 3. Multidimensional Scoring
    const scoredCandidates = candidates.map((candidate: any) => {
      let skillScore = 0
      let logisticsScore = 0
      let locationScore = 0
      let experienceScore = 0

      // A. Skill Match (50%)
      const reqSkills = (job.requiredSkills || []).map((s: string) => s.toLowerCase())
      const canSkills = (candidate.skills || []).map((s: string) => s.toLowerCase())
      if (reqSkills.length > 0) {
        const overlap = canSkills.filter((s: string) => reqSkills.includes(s)).length
        skillScore = (overlap / reqSkills.length) * 100
      } else {
        skillScore = 100
      }

      // B. Logistics / Notice Period (20%)
      const notice = (candidate.noticePeriod || '').toLowerCase()
      const jobUrgency = (job.noticePeriod || '').toLowerCase()
      
      if (notice === 'immediate') logisticsScore = 100
      else if (notice.includes('15')) logisticsScore = 80
      else if (notice === jobUrgency) logisticsScore = 70
      else if (notice.includes('30')) logisticsScore = 60
      else logisticsScore = 40

      // C. Location & Work Setting (15%)
      const jobLoc = (job.location || '').toLowerCase()
      const canLoc = (candidate.preferredLocation || '').toLowerCase()
      const jobSetting = (job.workSetting || '').toLowerCase()
      const canSetting = (candidate.workSettingPreference || '').toLowerCase()

      if (jobSetting === 'remote' && canSetting === 'remote') locationScore = 100
      else if (jobLoc && canLoc && jobLoc.includes(canLoc)) locationScore = 100
      else if (jobSetting === canSetting) locationScore = 80
      else locationScore = 50

      // D. Experience (15%)
      const reqExp = job.experienceRequired || 0
      const canExp = candidate.totalExperience || candidate.experienceYears || 0
      if (canExp >= reqExp) {
        experienceScore = 100
      } else {
        experienceScore = (canExp / reqExp) * 100
      }

      // Weighted Total
      const score = (skillScore * 0.5) + (logisticsScore * 0.2) + (locationScore * 0.15) + (experienceScore * 0.15)

      return {
        ...candidate,
        score: Math.round(score),
        pipelineStatus: statusMap[candidate.id] || 'REVEALED',
        matchBreakdown: {
          skills: Math.round(skillScore),
          logistics: Math.round(logisticsScore),
          location: Math.round(locationScore),
          experience: Math.round(experienceScore)
        }
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
    try {
      const result = await (prisma as any).$runCommandRaw({
        find: 'Candidate',
        filter: { _id: { $oid: id } },
        limit: 1
      })
      const docs = (result as any)?.cursor?.firstBatch ?? []
      return docs[0] ? { ...docs[0], id: docs[0]._id?.$oid ?? String(docs[0]._id) } : null
    } catch {
      return await prisma.candidate.findUnique({ where: { id } })
    }
  },

  async getCandidateDetail(id: string) {
    try {
      const result = await (prisma as any).$runCommandRaw({
        find: 'Candidate',
        filter: { _id: { $oid: id } },
        limit: 1
      })
      const docs = (result as any)?.cursor?.firstBatch ?? []
      const candidate = docs[0]

      if (!candidate) return null

      // Get user email
      const userResult = await (prisma as any).$runCommandRaw({
        find: 'User',
        filter: { _id: candidate.userId },
        limit: 1
      })
      const user = (userResult as any)?.cursor?.firstBatch?.[0]

      const candidateData = {
        ...candidate,
        id: candidate._id?.$oid ?? String(candidate._id),
        user: { email: user?.email || 'Unknown' }
      }

      // Proactive Intelligence via AI
      const skillsArr = Array.isArray(candidate.skills) ? candidate.skills : (typeof candidate.skills === 'string' ? candidate.skills.split(',').map((s: string) => s.trim()) : []);
      const analysis = await analyzeMatch(candidateData, { title: candidateData.currentRole, requiredSkills: skillsArr })
      
      const aiSummary = analysis ? [
        `AI Verified trajectory: ${analysis.reasoning}`,
        `Strengths: ${analysis.strengths.join(', ')}`,
        `Gaps to address: ${analysis.gaps.join(', ')}`,
        `Technical depth: High confidence in ${skillsArr.slice(0, 3).join(', ')}.`
      ] : [
        `Experience: ${candidate.totalExperience || 'N/A'} Years.`,
        `Primary Role: ${candidate.currentRole}.`
      ]

      return { candidate: candidateData, aiSummary }
    } catch (err: any) {
      console.error('[getCandidateDetail]', err)
      return null
    }
  }
}
