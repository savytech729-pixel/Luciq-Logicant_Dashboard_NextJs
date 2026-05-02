import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { asTrimmedString, isObjectIdLike } from '@/lib/validators'
import { sendEmail } from '@/lib/email/smtp'
import {
  candidateRejectedTemplate,
  candidateScreeningTemplate,
  candidateSelectedTemplate,
  candidateShortlistedTemplate,
  candidateStatusTemplate
} from '@/lib/email/templates'

const ALLOWED_PIPELINE_STATUSES = new Set(['REVEALED', 'SCREENING', 'SHORTLISTED', 'SELECTED', 'REJECTED'])

// POST /api/admin/pipeline/update
// Update the recruitment stage/status for a candidate-job match
export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const jobId = asTrimmedString(body.jobId)
    const candidateId = asTrimmedString(body.candidateId)
    const status = asTrimmedString(body.status).toUpperCase()

    if (!isObjectIdLike(jobId) || !isObjectIdLike(candidateId) || !ALLOWED_PIPELINE_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Using raw mongo for stability
    const result = await (prisma as any).$runCommandRaw({
      update: 'PipelineMatch',
      updates: [
        {
          q: { jobId: { $oid: jobId }, candidateId: { $oid: candidateId } },
          u: {
            $set: {
              status,
              updatedAt: { $date: new Date().toISOString() }
            },
            $setOnInsert: {
              createdAt: { $date: new Date().toISOString() }
            }
          },
          upsert: true
        }
      ]
    })

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { user: { select: { email: true } } },
    })
    const job = await prisma.job.findUnique({ where: { id: jobId }, select: { title: true } })

    if (candidate?.user?.email && job?.title) {
      const statusEmail =
        status === 'SHORTLISTED'
          ? candidateShortlistedTemplate(candidate.name, job.title)
          : status === 'REJECTED'
            ? candidateRejectedTemplate(candidate.name, job.title)
            : status === 'SELECTED'
              ? candidateSelectedTemplate(candidate.name, job.title)
              : status === 'SCREENING'
                ? candidateScreeningTemplate(candidate.name, job.title)
                : candidateStatusTemplate(candidate.name, job.title, status)
      await sendEmail({
        to: candidate.user.email,
        subject: statusEmail.subject,
        html: statusEmail.html,
        text: statusEmail.text,
      }).catch(() => null)
    }

    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    console.error('[POST /api/admin/pipeline/update]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
