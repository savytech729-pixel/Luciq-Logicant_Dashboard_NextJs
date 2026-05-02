import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeWeightedMatchScore } from '@/lib/match-score'
import { talentService } from '@/lib/services/talent.service'
import { isObjectIdLike } from '@/lib/validators'

/** Rank all vacancies vs this candidate using the same weighted score as Matching Studio. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!isObjectIdLike(id)) {
      return NextResponse.json({ error: 'Invalid candidate id' }, { status: 400 })
    }

    const detail = await talentService.getCandidateDetail(id)
    if (!detail?.candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    const c = detail.candidate as Record<string, unknown>
    const skillsArr = Array.isArray(c.skills)
      ? (c.skills as string[])
      : typeof c.skills === 'string'
        ? String(c.skills)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : []

    const candidateForScore = {
      skills: skillsArr,
      totalExperience: c.totalExperience as number | undefined,
      experienceYears: c.experienceYears as number | undefined,
      currentRole: c.currentRole ? String(c.currentRole) : undefined,
      summary: c.summary ? String(c.summary) : undefined,
      education: c.education ? String(c.education) : undefined,
      preferredLocation: c.preferredLocation ? String(c.preferredLocation) : undefined,
      workSettingPreference: c.workSettingPreference ? String(c.workSettingPreference) : undefined,
      noticePeriod: c.noticePeriod ? String(c.noticePeriod) : undefined,
    }

    const result = await prisma.$runCommandRaw({
      find: 'Job',
      sort: { createdAt: -1 },
      limit: 150,
    })
    const docs = (result as { cursor?: { firstBatch?: unknown[] } })?.cursor?.firstBatch ?? []

    const fits = (docs as Record<string, unknown>[]).map((j) => {
      const jobId = j._id && typeof j._id === 'object' && '$oid' in (j._id as object)
        ? String((j._id as { $oid: string }).$oid)
        : String(j._id)

      const requiredSkills = Array.isArray(j.requiredSkills)
        ? (j.requiredSkills as string[])
        : typeof j.requiredSkills === 'string'
          ? String(j.requiredSkills)
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : []

      const job = {
        title: String(j.title || ''),
        description: String(j.description || ''),
        requiredSkills,
        experienceRequired: Number(j.experienceRequired) || 0,
        location: j.location ? String(j.location) : undefined,
        workSetting: j.workSetting ? String(j.workSetting) : undefined,
        noticePeriod: j.noticePeriod ? String(j.noticePeriod) : undefined,
      }

      const { score } = computeWeightedMatchScore(job, candidateForScore)

      return {
        jobId,
        title: job.title,
        status: j.status ? String(j.status) : 'Active',
        clientName: j.clientName ? String(j.clientName) : null,
        location: j.location ? String(j.location) : null,
        score,
      }
    })

    fits.sort((a, b) => b.score - a.score)

    return NextResponse.json({ fits })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to compute fits'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
