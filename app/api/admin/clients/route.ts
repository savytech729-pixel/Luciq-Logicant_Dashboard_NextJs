import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { clientService } from '@/lib/services/client.service'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clients = await clientService.getAllClients()
    return NextResponse.json({ clients })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, region, plan } = await req.json()

    if (!name || !region || !plan) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const client = await clientService.createClient({ name, region, plan })
    return NextResponse.json({ client })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
