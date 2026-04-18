import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { commService } from '@/lib/services/comm.service'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { candidateId, jobId, channel } = await req.json()

    if (!candidateId || !jobId || !channel) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const template = await commService.generateInviteTemplate(candidateId, jobId, channel as 'email' | 'whatsapp')
    
    // Log the intent for auditing
    await commService.logInvitation(candidateId, jobId, channel)

    return NextResponse.json({ template })
  } catch (err: any) {
    console.error('[POST /api/admin/invite]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
