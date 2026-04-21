import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { evaluateScreening } from '@/lib/ai'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'CANDIDATE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobId, answers } = await req.json()

    if (!jobId || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Missing application data' }, { status: 400 })
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

    // 3. AI Evaluation of pre-screening
    const evaluation = await evaluateScreening(answers, job)

    // 4. Create PipelineMatch
    const match = await prisma.pipelineMatch.create({
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

    return NextResponse.json({ success: true, match })
  } catch (err: any) {
    console.error('[POST /api/candidate/apply]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
