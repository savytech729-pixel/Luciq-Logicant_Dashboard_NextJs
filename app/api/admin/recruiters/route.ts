import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

// GET /api/admin/recruiters
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find all recruiter documents, sorted by createdAt desc
    const result = await prisma.$runCommandRaw({
      find: 'Recruiter',
      sort: { createdAt: -1 },
      limit: 200,
    })

    const docs = (result as any)?.cursor?.firstBatch ?? []

    // For each recruiter, fetch the linked user's email
    const enriched = await Promise.all(
      docs.map(async (r: any) => {
        // userId is stored as ObjectId — fetch the user
        let userEmail = 'unknown@'
        let userCreatedAt = r.createdAt?.$date ?? r.createdAt
        try {
          const userResult = await prisma.$runCommandRaw({
            find: 'User',
            filter: { _id: r.userId },
            limit: 1,
          })
          const users = (userResult as any)?.cursor?.firstBatch ?? []
          if (users[0]) {
            userEmail = users[0].email
            userCreatedAt = users[0].createdAt?.$date ?? users[0].createdAt
          }
        } catch { /* skip if lookup fails */ }

        return {
          id: r._id?.$oid ?? String(r._id),
          userId: r.userId?.$oid ?? String(r.userId),
          name: r.name,
          jobTitle: r.jobTitle,
          scope: r.scope,
          isActive: r.isActive ?? true,
          createdAt: r.createdAt?.$date ?? r.createdAt,
          user: {
            id: r.userId?.$oid ?? String(r.userId),
            email: userEmail,
            createdAt: userCreatedAt,
          },
        }
      })
    )

    return NextResponse.json({ recruiters: enriched })
  } catch (err: any) {
    console.error('[GET /api/admin/recruiters]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/admin/recruiters
// Super Admin only — creates a User (role=RECRUITER) + Recruiter document
export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized – Super Admin only' }, { status: 401 })
    }

    const body = await req.json()
    const { email, password, name, jobTitle, scope } = body

    if (!email || !password || !name || !jobTitle || !scope) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Check email uniqueness using typed client (User model is in generated client)
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 })
    }

    const hashedPassword = await hash(password, 10)
    const now = new Date().toISOString()

    // Generate a random hex ObjectId (24-char hex string)
    const genOid = () => Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    const userId = genOid()
    const recruiterId = genOid()

    // Insert User document with RECRUITER role via raw command (RECRUITER not in generated enum)
    await prisma.$runCommandRaw({
      insert: 'User',
      documents: [{
        _id: { $oid: userId },
        email,
        password: hashedPassword,
        role: 'RECRUITER',
        createdAt: { $date: now },
      }],
    })

    // Insert Recruiter document
    await prisma.$runCommandRaw({
      insert: 'Recruiter',
      documents: [{
        _id: { $oid: recruiterId },
        userId: { $oid: userId },
        name,
        jobTitle,
        scope,
        isActive: true,
        createdAt: { $date: now },
      }],
    })

    return NextResponse.json({
      message: 'Recruiter created successfully',
      recruiter: {
        id: recruiterId,
        userId,
        name,
        jobTitle,
        scope,
        isActive: true,
        createdAt: now,
        user: { id: userId, email, createdAt: now },
      },
    }, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/admin/recruiters]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
