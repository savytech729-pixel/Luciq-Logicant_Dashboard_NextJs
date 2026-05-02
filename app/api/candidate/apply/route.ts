import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { evaluateScreening } from '@/lib/ai'
import { isNonEmptyString, isObjectIdLike } from '@/lib/validators'
import { checkRateLimit } from '@/lib/rate-limit'
import { getRequestId, logError, logInfo } from '@/lib/logger'
import { sendEmail } from '@/lib/email/smtp'
import { candidateAppliedAdminTemplate, candidateAppliedTemplate } from '@/lib/email/templates'

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const session = await getSession()
    if (!session || session.role !== 'CANDIDATE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const limiter = checkRateLimit({ key: `candidate-apply:${session.id}`, limit: 10, windowMs: 60_000 })
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many apply attempts. Try again shortly.' }, { status: 429 })
    }

    const { jobId, answers } = await req.json()

    if (!isObjectIdLike(jobId) || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: 'Missing application data' }, { status: 400 })
    }

    const hasInvalidAnswer = answers.some(
      (answer: { question?: unknown; answer?: unknown }) =>
        !isNonEmptyString(answer?.question) || !isNonEmptyString(answer?.answer)
    )

    if (hasInvalidAnswer) {
      return NextResponse.json({ error: 'Invalid screening answers format' }, { status: 400 })
    }

    // 1. Fetch Candidate
    const candidate = await prisma.candidate.findUnique({
      where: { userId: session.id }
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate profile not found. Please complete your profile first.' }, { status: 404 })
    }

    // 2. Fetch Job for AI context
    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    const user = await prisma.user.findUnique({ where: { id: session.id } })

    // 3. AI Evaluation of pre-screening
    const evaluation = await evaluateScreening(answers, job)

    // 4. Upsert PipelineMatch (avoid duplicate rows and preserve advanced admin stages)
    const existingMatch = await prisma.pipelineMatch.findFirst({
      where: { jobId, candidateId: candidate.id },
      orderBy: { updatedAt: 'desc' },
    })
    const preserveStatus = existingMatch?.status === 'SELECTED' || existingMatch?.status === 'SHORTLISTED'
    const nextStatus = preserveStatus ? existingMatch!.status : 'SCREENING'

    const match = existingMatch
      ? await prisma.pipelineMatch.update({
          where: { id: existingMatch.id },
          data: {
            status: nextStatus,
            score: evaluation?.score || existingMatch.score || 50,
            screeningAnswers: answers as any,
            screeningScore: evaluation?.score || 50,
            screeningSummary: evaluation?.summary || 'Candidate completed AI pre-screening.',
            isAIUsageDetected: evaluation?.isAI || false,
            aiConfidenceScore: evaluation?.aiUsageScore || 0
          }
        })
      : await prisma.pipelineMatch.create({
          data: {
            jobId,
            candidateId: candidate.id,
            status: 'SCREENING',
            score: evaluation?.score || 50,
            screeningAnswers: answers as any,
            screeningScore: evaluation?.score || 50,
            screeningSummary: evaluation?.summary || 'Candidate completed AI pre-screening.',
            isAIUsageDetected: evaluation?.isAI || false,
            aiConfidenceScore: evaluation?.aiUsageScore || 0
          }
        })

    logInfo('Candidate application submitted', { route: '/api/candidate/apply', requestId, userId: session.id, meta: { jobId } })

    if (user?.email) {
      const candidateEmail = candidateAppliedTemplate(candidate.name, job.title)
      await sendEmail({ to: user.email, subject: candidateEmail.subject, html: candidateEmail.html, text: candidateEmail.text }).catch(() => null)

      const adminUsers = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true } })
      const adminRecipients = adminUsers.map((u) => u.email).filter(Boolean)
      if (adminRecipients.length > 0) {
        const adminEmail = candidateAppliedAdminTemplate(candidate.name, user.email, job.title)
        await sendEmail({ to: adminRecipients, subject: adminEmail.subject, html: adminEmail.html, text: adminEmail.text }).catch(() => null)
      }
    }

    return NextResponse.json({ success: true, match, requestId })
  } catch (err: any) {
    logError('Candidate apply failed', { route: '/api/candidate/apply', requestId }, err)
    return NextResponse.json({ error: err.message, requestId }, { status: 500 })
  }
}
