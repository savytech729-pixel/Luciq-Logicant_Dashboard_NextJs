import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { talentService } from '@/lib/services/talent.service'
import { prisma } from '@/lib/prisma'
import { isLikelyObjectId } from '@/lib/mongodb-id'
import { adminDeleteCandidate, CandidateNotFoundError } from '@/lib/candidate-delete'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await talentService.getCandidateDetail(id)

    if (!data) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/** Patch candidate fields (admin). Supports updating employment / projects text after structured edits. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!isLikelyObjectId(id)) {
      return NextResponse.json({ error: 'Invalid candidate id' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const employmentHistory = body.employmentHistory
    const projects = body.projects

    if (employmentHistory === undefined && projects === undefined) {
      return NextResponse.json({ error: 'Provide employmentHistory and/or projects' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const $set: Record<string, unknown> = { updatedAt: { $date: now } }
    if (typeof employmentHistory === 'string') $set.employmentHistory = employmentHistory.trim() ? employmentHistory : null
    if (typeof projects === 'string') $set.projects = projects.trim() ? projects : null

    await (prisma as any).$runCommandRaw({
      update: 'Candidate',
      updates: [
        {
          q: { _id: { $oid: id } },
          u: { $set },
        },
      ],
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await adminDeleteCandidate(id)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    if (err instanceof CandidateNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    const message = err instanceof Error ? err.message : 'Delete failed'
    const status = message === 'Invalid candidate id' ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
