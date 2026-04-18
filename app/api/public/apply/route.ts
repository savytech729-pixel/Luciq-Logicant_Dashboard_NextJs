import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

// POST /api/public/apply
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      jobId,
      name,
      email,
      phone,
      currentRole,
      totalExperience,
      skills,
      expectedSalary,
      noticePeriod,
      preferredLocation,
      workSettingPreference,
      cvUrl,
      linkedInUrl
    } = body

    if (!jobId || !name || !email || !currentRole) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Shadow User Check/Create
    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      const placeholderPassword = 'APPLY_' + uuidv4().slice(0, 8)
      user = await prisma.user.create({
        data: {
          email,
          password: placeholderPassword,
          role: 'CANDIDATE',
        }
      })
    }

    const now = new Date().toISOString()
    
    // 2. Insert Candidate Profile
    const candidateResult = await (prisma as any).$runCommandRaw({
      insert: 'Candidate',
      documents: [{
        userId: { $oid: user.id },
        name,
        email, // For easy access
        phone: phone || null,
        currentRole,
        totalExperience: parseFloat(totalExperience) || 0,
        experienceYears: Math.floor(parseFloat(totalExperience) || 0),
        skills: Array.isArray(skills) ? skills : skills.split(',').map((s: string) => s.trim()),
        expectedSalary: expectedSalary || null,
        noticePeriod: noticePeriod || 'Immediate',
        preferredLocation: preferredLocation || null,
        workSettingPreference: workSettingPreference || 'Remote',
        cvUrl: cvUrl || null,
        linkedInUrl: linkedInUrl || null,
        isReadyToJoin: true,
        createdAt: { $date: now },
      }],
    })

    const n = (candidateResult as any)?.n ?? 0
    if (n === 0) throw new Error('Failed to create application profile')

    // 3. In a real system, we'd create an "Application" join record linking Candidate to Job.
    // However, our current Matcher just looks at all Candidates globally for a Job.
    // So simply creating the Candidate profile with these tags makes them appear in the Job Matcher instantly.

    return NextResponse.json({ 
      success: true, 
      message: 'Application received. Our AI is analyzing your profile now.' 
    }, { status: 201 })

  } catch (err: any) {
    console.error('[POST /api/public/apply]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
