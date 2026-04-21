import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateScreeningQuestions } from '@/lib/ai'

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
