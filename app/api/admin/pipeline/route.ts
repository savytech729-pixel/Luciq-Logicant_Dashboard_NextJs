import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const matches = await prisma.pipelineMatch.findMany({
      where: {
        status: {
          in: ['SCREENING', 'SHORTLISTED', 'SELECTED']
        }
      },
      include: {
        job: {
          select: {
            title: true,
            clientName: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // De-duplicate by (jobId, candidateId): keep latest state only.
    const latestByPair = new Map<string, (typeof matches)[number]>()
    for (const match of matches) {
      const key = `${match.jobId}:${match.candidateId}`
      const prev = latestByPair.get(key)
      if (!prev || new Date(match.updatedAt).getTime() >= new Date(prev.updatedAt).getTime()) {
        latestByPair.set(key, match)
      }
    }
    const uniqueMatches = Array.from(latestByPair.values())

    // Fetch candidate details separately or use join if possible
    // Since MongoDB in Prisma doesn't support easy joins across collections without relations
    // and we didn't define a back-relation for Candidate in PipelineMatch yet in schema (let's check)
    
    const pipelineData = await Promise.all(uniqueMatches.map(async (m) => {
      const candidate = await prisma.candidate.findUnique({
        where: { id: m.candidateId }
      })
      return {
        ...m,
        candidate
      }
    }))

    return NextResponse.json({ pipeline: pipelineData })
  } catch (err: any) {
    console.error('[GET /api/admin/pipeline]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
