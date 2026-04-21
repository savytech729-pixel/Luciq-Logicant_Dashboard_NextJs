import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'CANDIDATE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const { 
      name, experienceYears, currentRole, skills, 
      phone, preferredLocation, noticePeriod, 
      expectedSalary, workSettingPreference, linkedInUrl,
      profilePic, salarySlipUrl, offerLetterUrl, terminationLetterUrl
    } = data

    if (!name || !currentRole || !Array.isArray(skills)) {
      return NextResponse.json({ error: 'Missing core profile fields' }, { status: 400 })
    }

    const profileData = {
      name,
      experienceYears: Number(experienceYears),
      totalExperience: Number(experienceYears),
      currentRole,
      skills,
      phone,
      preferredLocation,
      noticePeriod,
      expectedSalary,
      workSettingPreference,
      linkedInUrl,
      profilePic,
      salarySlipUrl,
      offerLetterUrl,
      terminationLetterUrl,
      isReadyToJoin: true
    }

    let candidate = await prisma.candidate.findFirst({ where: { userId: session.id } })

    if (candidate) {
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: profileData
      })
    } else {
      candidate = await prisma.candidate.create({
        data: {
          userId: session.id,
          ...profileData
        }
      })
    }

    return NextResponse.json({ candidate })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
