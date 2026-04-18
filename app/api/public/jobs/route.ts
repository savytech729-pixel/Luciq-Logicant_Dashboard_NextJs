import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/public/jobs
export async function GET() {
  try {
    // Fetch only active, public jobs
    const result = await (prisma as any).$runCommandRaw({
      find: 'Job',
      filter: { status: 'Active' },
      sort: { createdAt: -1 },
      limit: 100
    })

    const docs = (result as any)?.cursor?.firstBatch ?? []
    const jobs = docs.map((j: any) => ({
      id: j._id?.$oid ?? String(j._id),
      title: j.title,
      description: j.description,
      department: j.department,
      clientName: j.clientName, // In public, maybe anonymize? User post says "EasyHire makes recruitment efficient", implies direct
      location: j.location,
      workSetting: j.workSetting,
      positionType: j.positionType,
      experienceRequired: j.experienceRequired,
      salaryRange: j.salaryRange,
      requiredSkills: j.requiredSkills,
      createdAt: j.createdAt?.$date ?? j.createdAt
    }))

    return NextResponse.json({ jobs })
  } catch (err: any) {
    console.error('[GET /api/public/jobs]', err)
    return NextResponse.json({ error: 'Failed to fetch job listings' }, { status: 500 })
  }
}
