import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { asTrimmedString, isObjectIdLike } from '@/lib/validators'
import { sendEmail } from '@/lib/email/smtp'
import { vacancyCreatedTemplate } from '@/lib/email/templates'

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

    const normalizedTitle = asTrimmedString(title)
    const normalizedDescription = asTrimmedString(description)
    const normalizedSkills = Array.isArray(requiredSkills)
      ? requiredSkills.map((s) => asTrimmedString(s)).filter(Boolean)
      : []
    const numericExperience = Number(experienceRequired)

    if (!normalizedTitle || !normalizedDescription || normalizedSkills.length === 0 || Number.isNaN(numericExperience)) {
      return NextResponse.json({ error: 'Title, description, skills, and experience are required' }, { status: 400 })
    }

    if (clientId && !isObjectIdLike(clientId)) {
      return NextResponse.json({ error: 'Invalid client id format' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const jobId = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    
    // Use raw insert to ensure compatibility with all new recruitment fields
    const result = await prisma.$runCommandRaw({
      insert: 'Job',
      documents: [{
        _id: { $oid: jobId },
        title: normalizedTitle,
        description: normalizedDescription,
        department: department || null,
        clientName: clientName || null,
        openPositions: Number(openPositions) || 1,
        status: status || 'Active',
        requiredSkills: normalizedSkills,
        experienceRequired: numericExperience,
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

    // Notify operations users about new vacancy.
    const recipients = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'RECRUITER'] as any } },
      select: { email: true },
    })
    const to = recipients.map((u) => u.email).filter(Boolean)
    if (to.length > 0) {
      const createdByEmail = session.email || 'admin'
      const vacancyEmail = vacancyCreatedTemplate(normalizedTitle, createdByEmail)
      await sendEmail({
        to,
        subject: vacancyEmail.subject,
        html: vacancyEmail.html,
        text: vacancyEmail.text,
      }).catch(() => null)
    }

    return NextResponse.json({ message: 'Job created successfully', jobId }, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/admin/jobs]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
