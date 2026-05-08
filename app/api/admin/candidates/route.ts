import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeDocumentId } from '@/lib/mongodb-id'
import { deriveImportFallbackEmail } from '@/lib/cv-contact'
import { hash } from 'bcryptjs'

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
    const users = await prisma.user.findMany({ select: { id: true, email: true } })
    const emailByUserId = new Map(users.map((u) => [u.id, u.email]))
    
    // Enrich with user email if needed, but for list view we mainly need profile
    const candidates = docs.map((c: any) => {
      const uid = normalizeDocumentId(c.userId)
      return {
        id: normalizeDocumentId(c._id),
        ...c,
        email: c.email || emailByUserId.get(uid) || '',
        createdAt: c.createdAt?.$date ?? c.createdAt
      }
    })

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
      phone,
      education,
      summary,
      currentSalary,
      expectedSalary,
      noticePeriod,
      preferredLocation,
      workSettingPreference,
      isReadyToJoin,
      email, // Required to create/link user
      parseConfidence,
      parseNeedsReview,
      parseIssues,
      parseSourceFile,
      linkedInUrl,
      languages,
      certifications,
      employmentHistory,
      projects,
      intakeJobId,
    } = body

    const deriveNameFromEmail = (rawEmail: string) => {
      const local = (rawEmail || '').split('@')[0] || ''
      const parts = local
        .replace(/[0-9]+/g, ' ')
        .split(/[._-]+/)
        .map((p: string) => p.trim())
        .filter(Boolean)
      if (parts.length < 2) return ''
      return parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
    }
    const deriveNameFromSourceFile = (sourceFile: string) => {
      const base = String(sourceFile || '')
        .replace(/\.[a-z0-9]+$/i, '')
        .replace(/\[[^\]]*\]/g, ' ')
        .replace(/\b(naukri|resume|cv|profile|candidate)\b/gi, ' ')
      const token = base.split(/[_-]+/).map((t) => t.trim()).filter(Boolean).pop() || ''
      const spaced = token
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[^A-Za-z\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (!spaced || !spaced.includes(' ')) return ''
      return spaced
        .split(' ')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ')
    }

    let safeName = String(name || '').trim() || 'Candidate'
    const safeCurrentRole = String(currentRole || '').trim() || 'Candidate'
    const safeSkills = Array.isArray(skills)
      ? skills.map((s: string) => String(s).trim()).filter(Boolean)
      : String(skills || '')
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)

    const normalizedEmail = (email || '').trim().toLowerCase()
    if (!safeName.includes(' ')) {
      const derived = deriveNameFromEmail(normalizedEmail) || deriveNameFromSourceFile(parseSourceFile || '')
      if (derived) safeName = derived
    }
    const safeNameSlug = safeName.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/(^\.|\.$)/g, '')
    const candidateEmail = deriveImportFallbackEmail({
      parsedEmail: normalizedEmail,
      phone: String(phone || ''),
      nameSlug: safeNameSlug || 'candidate',
    })

    // 1. Ensure user exists (Candidate must have a User record)
    let user = await prisma.user.findUnique({ where: { email: candidateEmail } })
    if (!user) {
      // Create a placeholder user for the candidate
      const placeholderPassword = 'NOT_SET_' + Math.random().toString(36).slice(-8)
      const hashedPassword = await hash(placeholderPassword, 10)
      user = await prisma.user.create({
        data: {
          email: candidateEmail,
          password: hashedPassword,
          role: 'CANDIDATE',
        }
      })
    }

    // 1b. Duplicate protection:
    // - same linked user already has candidate profile
    // - same parsed source file already indexed
    const existingByUser = await prisma.$runCommandRaw({
      find: 'Candidate',
      filter: { userId: { $oid: user.id } },
      limit: 1,
    })
    const userDup = (existingByUser as any)?.cursor?.firstBatch?.[0]
    if (userDup) {
      return NextResponse.json(
        { error: 'Candidate already exists for this email/user.' },
        { status: 409 }
      )
    }

    const normalizedSource = String(parseSourceFile || '').trim()
    if (normalizedSource) {
      const existingBySource = await prisma.$runCommandRaw({
        find: 'Candidate',
        filter: { parseSourceFile: normalizedSource },
        limit: 1,
      })
      const sourceDup = (existingBySource as any)?.cursor?.firstBatch?.[0]
      if (sourceDup) {
        return NextResponse.json(
          { error: 'This CV/source file has already been indexed.' },
          { status: 409 }
        )
      }
    }

    const now = new Date().toISOString()
    
    // 2. Create Candidate profile via raw insert
    const result = await prisma.$runCommandRaw({
      insert: 'Candidate',
      documents: [{
        userId: { $oid: user.id },
        name: safeName,
        currentRole: safeCurrentRole,
        totalExperience: parseFloat(totalExperience) || 0,
        experienceYears: parseInt(experienceYears) || Math.floor(parseFloat(totalExperience) || 0),
        skills: safeSkills,
        phone: phone || null,
        education: education || null,
        summary: summary || null,
        currentSalary: currentSalary || null,
        expectedSalary: expectedSalary || null,
        noticePeriod: noticePeriod || null,
        preferredLocation: preferredLocation || null,
        workSettingPreference: workSettingPreference || null,
        isReadyToJoin: isReadyToJoin ?? true,
        parseConfidence: Number(parseConfidence) || 0,
        parseNeedsReview: Boolean(parseNeedsReview),
        parseIssues: Array.isArray(parseIssues) ? parseIssues : [],
        parseSourceFile: parseSourceFile || null,
        linkedInUrl: linkedInUrl || null,
        languages: Array.isArray(languages)
          ? languages.map((s: string) => String(s).trim()).filter(Boolean)
          : typeof languages === 'string'
            ? languages.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
        certifications: certifications || null,
        employmentHistory: employmentHistory || null,
        projects: projects || null,
        intakeJobId: typeof intakeJobId === 'string' && intakeJobId.trim() ? intakeJobId.trim() : null,
        createdAt: { $date: now },
      }],
    })

    return NextResponse.json({ message: 'Candidate added successfully' }, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/admin/candidates]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
