import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { dashboardService } from '@/lib/services/dashboard.service'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await dashboardService.getAdminStats()
    return NextResponse.json(stats)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
