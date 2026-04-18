import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { billingService } from '@/lib/services/billing.service'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [placements, invoices] = await Promise.all([
      billingService.getAllPlacements(),
      billingService.getAllInvoices()
    ])

    return NextResponse.json({ placements, invoices })
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

    const { placementId, type } = await req.json()

    if (type === 'MARK_PAID') {
        const placement = await billingService.markPaid(placementId)
        return NextResponse.json({ placement })
    }

    if (type === 'GENERATE_INVOICE') {
        const result = await billingService.generateInvoice(placementId)
        return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
