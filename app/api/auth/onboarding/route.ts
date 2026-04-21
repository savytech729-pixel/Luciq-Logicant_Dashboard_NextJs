import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, login } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, phone, address, designation, department, isFresher, role } = body

    // 1. Update User
    await prisma.user.update({
      where: { id: session.id },
      data: {
        name,
        phone,
        jobTitle: designation || (isFresher ? 'Fresher' : null),
        department,
        isOnboarded: true
      }
    })

    // 2. Create/Update Profile (Candidate or Recruiter)
    if (role === 'CANDIDATE') {
      const candidate = await prisma.candidate.findFirst({ where: { userId: session.id } })
      const candidateData = {
        name,
        phone,
        currentRole: designation || (isFresher ? 'Student/Fresher' : 'N/A'),
        preferredLocation: address,
        experienceYears: isFresher ? 0 : 1,
        skills: []
      }

      if (candidate) {
        await prisma.candidate.update({
          where: { id: candidate.id },
          data: candidateData
        })
      } else {
        await prisma.candidate.create({
          data: {
            userId: session.id,
            ...candidateData
          }
        })
      }
    } else if (role === 'ADMIN') {
      const recruiter = await prisma.recruiter.findFirst({ where: { userId: session.id } })
      const recruiterData = {
        name,
        jobTitle: designation || 'Talent Partner',
        scope: 'Global Admin'
      }

      if (recruiter) {
        await prisma.recruiter.update({
          where: { id: recruiter.id },
          data: recruiterData
        })
      } else {
        await prisma.recruiter.create({
          data: {
            userId: session.id,
            ...recruiterData
          }
        })
      }
    }

    // 3. Refresh Session
    await login({ 
      ...session,
      isOnboarded: true 
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[POST /api/auth/onboarding]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
