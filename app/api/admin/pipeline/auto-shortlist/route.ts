import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { asTrimmedString, isObjectIdLike } from '@/lib/validators'
import { talentService } from '@/lib/services/talent.service'
import { sendEmail } from '@/lib/email/smtp'
import { candidateShortlistedTemplate } from '@/lib/email/templates'

const AI_AUTO_SHORTLIST_MIN_SCORE = 50

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const jobId = asTrimmedString(body.jobId)
    if (!isObjectIdLike(jobId)) {
      return NextResponse.json({ error: 'Invalid job id' }, { status: 400 })
    }

    const result = await talentService.matchCandidatesForJob(jobId)
    const candidates = Array.isArray(result?.matchedCandidates) ? result.matchedCandidates : []
    const newlyAutoShortlisted = candidates.filter((candidate: any) => {
      const score = Number(candidate?.score ?? 0)
      const status = String(candidate?.pipelineStatus || 'REVEALED').toUpperCase()
      return score >= AI_AUTO_SHORTLIST_MIN_SCORE && (status === 'REVEALED' || status === 'NEW')
    })

    if (newlyAutoShortlisted.length === 0) {
      return NextResponse.json({ success: true, shortlistedCount: 0 })
    }

    const nowIso = new Date().toISOString()
    await Promise.all(
      newlyAutoShortlisted.map((candidate: any) =>
        (prisma as any).$runCommandRaw({
          update: 'PipelineMatch',
          updates: [
            {
              q: { jobId: { $oid: jobId }, candidateId: { $oid: String(candidate.id) } },
              u: {
                $set: {
                  status: 'SHORTLISTED',
                  updatedAt: { $date: nowIso },
                },
                $setOnInsert: {
                  createdAt: { $date: nowIso },
                },
              },
              upsert: true,
            },
          ],
        })
      )
    )

    const candidateRows = await prisma.candidate.findMany({
      where: { id: { in: newlyAutoShortlisted.map((c: any) => String(c.id)) } },
      select: { id: true, name: true, user: { select: { email: true } } },
    })
    const emailMap = new Map(candidateRows.map((row) => [row.id, { name: row.name, email: row.user?.email || '' }]))
    await Promise.all(
      newlyAutoShortlisted.map(async (candidate: any) => {
        const row = emailMap.get(String(candidate.id))
        if (!row?.email) return
        const mail = candidateShortlistedTemplate(row.name || 'Candidate', result?.job?.title || 'the role')
        await sendEmail({ to: row.email, subject: mail.subject, html: mail.html, text: mail.text }).catch(() => null)
      })
    )

    return NextResponse.json({ success: true, shortlistedCount: newlyAutoShortlisted.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

