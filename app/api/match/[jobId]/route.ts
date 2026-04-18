import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { talentService } from '@/lib/services/talent.service'

export async function GET(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { jobId } = await params
    const result = await talentService.matchCandidatesForJob(jobId)

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
