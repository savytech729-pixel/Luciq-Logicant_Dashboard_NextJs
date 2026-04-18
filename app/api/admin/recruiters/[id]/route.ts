import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/admin/recruiters/[id]
// Toggle isActive (activate / deactivate) using raw MongoDB update
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive (boolean) is required' }, { status: 400 })
    }

    const result = await prisma.$runCommandRaw({
      update: 'Recruiter',
      updates: [{
        q: { _id: { $oid: id } },
        u: { $set: { isActive: body.isActive } },
      }],
    })

    const n = (result as any)?.n ?? 0
    if (n === 0) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: `Recruiter ${body.isActive ? 'activated' : 'deactivated'} successfully`,
    })
  } catch (err: any) {
    console.error('[PATCH /api/admin/recruiters/[id]]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/admin/recruiters/[id]
// Removes the Recruiter document, then the linked User document
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // First find the recruiter to get userId
    const findResult = await prisma.$runCommandRaw({
      find: 'Recruiter',
      filter: { _id: { $oid: id } },
      limit: 1,
    })

    const docs = (findResult as any)?.cursor?.firstBatch ?? []
    if (docs.length === 0) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 404 })
    }

    const recruiter = docs[0]
    const userId = recruiter.userId?.$oid ?? String(recruiter.userId)

    // Delete the Recruiter document
    await prisma.$runCommandRaw({
      delete: 'Recruiter',
      deletes: [{ q: { _id: { $oid: id } }, limit: 1 }],
    })

    // Delete the linked User document
    await prisma.$runCommandRaw({
      delete: 'User',
      deletes: [{ q: { _id: { $oid: userId } }, limit: 1 }],
    })

    return NextResponse.json({ message: 'Recruiter deleted successfully' })
  } catch (err: any) {
    console.error('[DELETE /api/admin/recruiters/[id]]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
