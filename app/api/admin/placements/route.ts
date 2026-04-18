import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/placements
// Records a successful hire by creating a Placement document
export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      candidateId,
      jobId,
      clientId,
      baseSalary,
      feePercentage,
      hireDate,
      candidateName,
      jobTitle,
      clientName
    } = body

    if (!candidateId || !jobId || !baseSalary || !candidateName) {
      return NextResponse.json({ error: 'Missing required placement data' }, { status: 400 })
    }

    const now = new Date().toISOString()
    
    // 1. Create the Placement record using raw MongoDB insert
    const result = await prisma.$runCommandRaw({
      insert: 'Placement',
      documents: [{
        candidateId: { $oid: candidateId },
        jobId: { $oid: jobId },
        clientId: clientId ? { $oid: clientId } : null,
        candidateName,
        jobTitle,
        clientName: clientName || 'Unknown Client',
        baseSalary: parseFloat(baseSalary),
        feePercentage: parseFloat(feePercentage) || 15,
        hireDate: hireDate ? { $date: new Date(hireDate).toISOString() } : { $date: now },
        status: 'UNBILLED',
        createdAt: { $date: now },
      }],
    })

    const n = (result as any)?.n ?? 0
    if (n === 0) throw new Error('Failed to record placement')

    // 2. Update Job status to 'Closed' (or handle multiple positions)
    // We'll keep it simple: just decrement positions or mark closed if 1
    await prisma.$runCommandRaw({
       update: 'Job',
       updates: [{
          q: { _id: { $oid: jobId } },
          u: { $set: { status: 'Closed' } }
       }]
    })

    return NextResponse.json({ message: 'Placement recorded successfully' }, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/admin/placements]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
