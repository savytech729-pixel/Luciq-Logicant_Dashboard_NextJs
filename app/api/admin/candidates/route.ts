import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/candidates
// Fetch all candidates with full recruitment details using raw MongoDB find
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await prisma.$runCommandRaw({
      find: 'Candidate',
      sort: { createdAt: -1 },
      limit: 500,
    })

    const docs = (result as any)?.cursor?.firstBatch ?? []
    
    // Enrich with user email if needed, but for list view we mainly need profile
    const candidates = docs.map((c: any) => ({
      id: c._id?.$oid ?? String(c._id),
      ...c,
      createdAt: c.createdAt?.$date ?? c.createdAt
    }))

    return NextResponse.json({ candidates })
  } catch (err: any) {
    console.error('[GET /api/admin/candidates]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/admin/candidates
// Create a new candidate profile (links to a shadow user if needed, or just profile)
export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      currentRole,
      totalExperience,
      experienceYears,
      skills,
      currentSalary,
      expectedSalary,
      noticePeriod,
      preferredLocation,
      workSettingPreference,
      isReadyToJoin,
      email // Required to create/link user
    } = body

    if (!name || !email || !currentRole || !skills) {
      return NextResponse.json({ error: 'Name, email, role, and skills are required' }, { status: 400 })
    }

    // 1. Ensure user exists (Candidate must have a User record)
    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Create a placeholder user for the candidate
      user = await prisma.user.create({
        data: {
          email,
          password: 'NOT_SET_' + Math.random().toString(36).slice(-8), // Placeholder
          role: 'CANDIDATE',
        }
      })
    }

    const now = new Date().toISOString()
    
    // 2. Create Candidate profile via raw insert
    const result = await prisma.$runCommandRaw({
      insert: 'Candidate',
      documents: [{
        userId: { $oid: user.id },
        name,
        currentRole,
        totalExperience: parseFloat(totalExperience) || 0,
        experienceYears: parseInt(experienceYears) || Math.floor(parseFloat(totalExperience) || 0),
        skills: Array.isArray(skills) ? skills : skills.split(',').map((s: string) => s.trim()),
        currentSalary: currentSalary || null,
        expectedSalary: expectedSalary || null,
        noticePeriod: noticePeriod || null,
        preferredLocation: preferredLocation || null,
        workSettingPreference: workSettingPreference || null,
        isReadyToJoin: isReadyToJoin ?? true,
        createdAt: { $date: now },
      }],
    })

    return NextResponse.json({ message: 'Candidate added successfully' }, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/admin/candidates]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
