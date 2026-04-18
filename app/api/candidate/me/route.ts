import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { candidateService } from '@/lib/services/candidate.service'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'CANDIDATE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const candidate = await candidateService.getProfileByUserId(session.id)
    return NextResponse.json({ candidate })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'CANDIDATE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const candidate = await candidateService.updateProfile(session.id, data)
    
    return NextResponse.json({ candidate })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
