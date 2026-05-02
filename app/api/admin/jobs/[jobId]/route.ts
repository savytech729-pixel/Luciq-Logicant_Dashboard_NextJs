import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { asTrimmedString, isObjectIdLike } from '@/lib/validators'

export async function GET(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { jobId } = await params
    if (!isObjectIdLike(jobId)) {
      return NextResponse.json({ error: 'Invalid job id' }, { status: 400 })
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } }).catch(() => null)
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({ job })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load job'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { jobId } = await params
    if (!isObjectIdLike(jobId)) {
      return NextResponse.json({ error: 'Invalid job id' }, { status: 400 })
    }

    const body = await req.json()
    const data: Record<string, unknown> = {}

    if (body.title != null) data.title = asTrimmedString(body.title)
    if (body.description != null) data.description = asTrimmedString(body.description)
    if (body.department != null) data.department = asTrimmedString(body.department) || null
    if (body.clientName != null) data.clientName = asTrimmedString(body.clientName) || null
    if (body.openPositions != null) data.openPositions = Math.max(1, Number(body.openPositions) || 1)
    if (body.status != null) {
      const s = asTrimmedString(body.status)
      if (['Active', 'On Hold', 'Closed'].includes(s)) data.status = s
    }
    if (Array.isArray(body.requiredSkills)) {
      data.requiredSkills = body.requiredSkills.map((x: unknown) => asTrimmedString(String(x))).filter(Boolean)
    } else if (typeof body.requiredSkills === 'string') {
      data.requiredSkills = body.requiredSkills.split(',').map((x: string) => asTrimmedString(x)).filter(Boolean)
    }
    if (body.experienceRequired != null) {
      const n = Number(body.experienceRequired)
      if (!Number.isNaN(n)) data.experienceRequired = Math.max(0, Math.floor(n))
    }
    if (body.salaryRange != null) data.salaryRange = asTrimmedString(body.salaryRange) || null
    if (body.location != null) data.location = asTrimmedString(body.location) || null
    if (body.workSetting != null) data.workSetting = asTrimmedString(body.workSetting) || null
    if (body.positionType != null) data.positionType = asTrimmedString(body.positionType) || null
    if (body.interviewMode != null) data.interviewMode = asTrimmedString(body.interviewMode) || null
    if (body.noticePeriod != null) data.noticePeriod = asTrimmedString(body.noticePeriod) || null
    if (body.category != null) data.category = asTrimmedString(body.category) || null
    if (typeof body.buyoutAllowed === 'boolean') data.buyoutAllowed = body.buyoutAllowed

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const job = await prisma.job.update({
      where: { id: jobId },
      data: data as Parameters<typeof prisma.job.update>[0]['data'],
    })

    return NextResponse.json({ job })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update job'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** Permanently remove a vacancy and its pipeline matches. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { jobId } = await params
    if (!isObjectIdLike(jobId)) {
      return NextResponse.json({ error: 'Invalid job id' }, { status: 400 })
    }

    const existing = await prisma.job.findUnique({ where: { id: jobId } }).catch(() => null)
    if (!existing) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    await prisma.pipelineMatch.deleteMany({ where: { jobId } })
    await prisma.job.delete({ where: { id: jobId } })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete job'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
