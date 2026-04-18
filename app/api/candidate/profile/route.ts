import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'CANDIDATE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, experienceYears, currentRole, skills } = await req.json()

    if (!name || isNaN(experienceYears) || !currentRole || !Array.isArray(skills)) {
      return NextResponse.json({ error: 'Invalid fields' }, { status: 400 })
    }

    let candidate = await prisma.candidate.findFirst({ where: { userId: session.id } })

    if (candidate) {
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          name,
          experienceYears: Number(experienceYears),
          currentRole,
          skills
        }
      })
    } else {
      candidate = await prisma.candidate.create({
        data: {
          userId: session.id,
          name,
          experienceYears: Number(experienceYears),
          currentRole,
          skills
        }
      })
    }

    return NextResponse.json({ candidate })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
