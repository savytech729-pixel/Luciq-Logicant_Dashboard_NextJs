import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/pipeline/update
// Update the recruitment stage/status for a candidate-job match
export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobId, candidateId, status } = await req.json()

    if (!jobId || !candidateId || !status) {
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

    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    console.error('[POST /api/admin/pipeline/update]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
