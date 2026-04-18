import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'CANDIDATE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const candidate = await prisma.candidate.findFirst({
      where: { userId: session.id }
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Must establish identity matrix first.' }, { status: 400 })
    }

    // SIMULATED AI DELAY
    await new Promise(r => setTimeout(r, 2000))

    let skillsString = ''
    if (Array.isArray(candidate.skills)) {
      skillsString = candidate.skills.join(', ')
    } else if (typeof candidate.skills === 'string') {
       try {
         skillsString = JSON.parse(candidate.skills).join(', ')
       } catch (e) {
         skillsString = candidate.skills
       }
    }

    // Simulated AI Advice Generator
    const prompts = [
      `To optimize for ${candidate.currentRole} roles, you should deeply integrate AWS cloud networking with your existing baseline of ${skillsString}.`,
      `Your ${candidate.experienceYears} years of experience provides a strong vector. However, expanding your matrix to include modern asynchronous paradigms would boost match scores by ~15%.`,
      `For highest index ranking against enterprise algorithms, we detect a missing parameter: Docker/Kubernetes exposure. Adding this to your skill array pairs excellently with your current setup.`,
      `Your current skill array (${skillsString}) is robust, but system analytics suggest a 40% surge in demand for strict typed languages. Integrating TypeScript or Rust could yield immediate ROI in the match queues.`
    ]

    const pseudoRandomAdvice = prompts[Math.floor(Math.random() * prompts.length)]

    return NextResponse.json({ advice: pseudoRandomAdvice })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
