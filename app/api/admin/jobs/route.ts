import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/jobs
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use raw find to bypass stale client issues with new fields
    const result = await prisma.$runCommandRaw({
      find: 'Job',
      sort: { createdAt: -1 },
      limit: 100,
    })

    const docs = (result as any)?.cursor?.firstBatch ?? []
    const jobs = docs.map((j: any) => ({
       id: j._id?.$oid ?? String(j._id),
       ...j,
       // Normalize MongoDB Extended JSON if needed
       createdAt: j.createdAt?.$date ?? j.createdAt
    }))

    return NextResponse.json({ jobs })
  } catch (err: any) {
    console.error('[GET /api/admin/jobs]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/admin/jobs
export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      title,
      description,
      department,
      clientName,
      openPositions,
      status,
      requiredSkills,
      experienceRequired,
      salaryRange,
      location,
      workSetting,
      positionType,
      interviewMode,
      noticePeriod,
      buyoutAllowed,
      category,
      clientId,
    } = body

    if (!title || !description || !Array.isArray(requiredSkills) || isNaN(experienceRequired)) {
      return NextResponse.json({ error: 'Title, description, skills, and experience are required' }, { status: 400 })
    }

    const now = new Date().toISOString()
    
    // Use raw insert to ensure compatibility with all new recruitment fields
    const result = await prisma.$runCommandRaw({
      insert: 'Job',
      documents: [{
        title,
        description,
        department: department || null,
        clientName: clientName || null,
        openPositions: Number(openPositions) || 1,
        status: status || 'Active',
        requiredSkills,
        experienceRequired: Number(experienceRequired),
        salaryRange: salaryRange || null,
        location: location || null,
        workSetting: workSetting || null,
        positionType: positionType || null,
        category: category || 'IT',
        buyoutAllowed: Boolean(buyoutAllowed),
        clientId: clientId ? { $oid: clientId } : null,
        createdBy: { $oid: session.id },
        createdAt: { $date: now },
      }],
    })

    const n = (result as any)?.n ?? 0
    if (n === 0) throw new Error('Failed to insert job document')

    return NextResponse.json({ message: 'Job created successfully' }, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/admin/jobs]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
