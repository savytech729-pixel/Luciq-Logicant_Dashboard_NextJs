import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePersonalizedScreeningQuestions, generateScreeningQuestions } from '@/lib/ai'

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const job = await prisma.job.findUnique({ where: { id: params.id } })
    console.log('[DEBUG] Fetching questions for job:', params.id, job?.title)
    
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    // If admin has set specific questions, use them
    if (job.screeningQuestions && job.screeningQuestions.length > 0) {
      console.log('[DEBUG] Using pre-set questions:', job.screeningQuestions)
      return NextResponse.json({ questions: job.screeningQuestions })
    }

    // Otherwise, generate them using AI based on job requirements
    console.log('[DEBUG] Generating AI questions...')
    const questions = await generateScreeningQuestions(job)
    console.log('[DEBUG] AI Questions:', questions)
    return NextResponse.json({ questions })
  } catch (err: any) {
    console.error('[ERROR] Questions API:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const body = await req.json().catch(() => ({}))
    const email = String(body?.email || '').trim().toLowerCase()
    const candidateProfile = {
      name: String(body?.name || '').trim(),
      currentRole: String(body?.currentRole || '').trim(),
      totalExperience: String(body?.totalExperience || '').trim(),
      skills: Array.isArray(body?.skills) ? body.skills : String(body?.skills || ''),
      preferredLocation: String(body?.preferredLocation || '').trim(),
    }

    const job = await prisma.job.findUnique({ where: { id: params.id } })
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    // If admin-set fixed questions exist, still use them.
    if (job.screeningQuestions && job.screeningQuestions.length > 0) {
      return NextResponse.json({ questions: job.screeningQuestions })
    }

    const prevResult = await (prisma as any).$runCommandRaw({
      find: 'ScreeningQuestionHistory',
      filter: email
        ? { jobId: { $oid: params.id }, email }
        : { jobId: { $oid: params.id } },
      sort: { createdAt: -1 },
      limit: 25,
    })
    const prevDocs = (prevResult as any)?.cursor?.firstBatch ?? []
    const previouslyAsked = prevDocs.flatMap((d: any) =>
      Array.isArray(d?.questions) ? d.questions.map((q: unknown) => String(q)) : []
    )

    const generated = await generatePersonalizedScreeningQuestions({
      job,
      candidateProfile,
      previouslyAsked,
    })
    const questions = Array.isArray(generated) && generated.length > 0
      ? generated
      : await generateScreeningQuestions(job)

    if (email) {
      const now = new Date().toISOString()
      await (prisma as any).$runCommandRaw({
        insert: 'ScreeningQuestionHistory',
        documents: [
          {
            jobId: { $oid: params.id },
            email,
            questions,
            answers: [],
            createdAt: { $date: now },
            source: 'pre-apply',
          },
        ],
      })
    }

    return NextResponse.json({ questions })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
