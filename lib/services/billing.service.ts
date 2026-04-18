import { prisma } from '@/lib/prisma'

export const billingService = {
  async getAllPlacements() {
    try {
      const result = await (prisma as any).$runCommandRaw({
        find: 'Placement',
        sort: { hireDate: -1 },
        limit: 100
      })
      const docs = (result as any)?.cursor?.firstBatch ?? []
      return docs.map((d: any) => ({
        id: d._id?.$oid ?? String(d._id),
        ...d,
        hireDate: d.hireDate?.$date ?? d.hireDate,
        createdAt: d.createdAt?.$date ?? d.createdAt
      }))
    } catch {
      return await prisma.placement.findMany({ orderBy: { hireDate: 'desc' } })
    }
  },

  async getAllInvoices() {
    try {
      const result = await (prisma as any).$runCommandRaw({
        find: 'Invoice',
        sort: { createdAt: -1 },
        limit: 200
      })
      const docs = (result as any)?.cursor?.firstBatch ?? []
      return docs.map((d: any) => ({
        id: d._id?.$oid ?? String(d._id),
        ...d,
        createdAt: d.createdAt?.$date ?? d.createdAt
      }))
    } catch {
      return await prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } })
    }
  },

  async generateInvoice(placementId: string) {
    // 1. Get Placement Details
    const placementResult = await (prisma as any).$runCommandRaw({
      find: 'Placement',
      filter: { _id: { $oid: placementId } },
      limit: 1
    })
    const placement = (placementResult as any)?.cursor?.firstBatch?.[0]
    if (!placement) throw new Error('Placement not found')

    // 2. Update Placement Status via raw command
    await (prisma as any).$runCommandRaw({
      update: 'Placement',
      updates: [{
        q: { _id: { $oid: placementId } },
        u: { $set: { status: 'PENDING' } }
      }]
    })

    const feeAmount = (placement.baseSalary || 0) * ((placement.feePercentage || 15) / 100)
    const now = new Date().toISOString()

    // 3. Create Invoice via raw command
    await (prisma as any).$runCommandRaw({
      insert: 'Invoice',
      documents: [{
        placementId: { $oid: placementId },
        amount: feeAmount,
        status: 'PENDING',
        createdAt: { $date: now }
      }]
    })

    return { success: true }
  },

  async markPaid(placementId: string) {
    // 1. Update Placement Status
    await (prisma as any).$runCommandRaw({
      update: 'Placement',
      updates: [{
        q: { _id: { $oid: placementId } },
        u: { $set: { status: 'PAID' } }
      }]
    })

    // 2. Update all associated Invoices to PAID
    await (prisma as any).$runCommandRaw({
      update: 'Invoice',
      updates: [{
        q: { placementId: { $oid: placementId } },
        u: { $set: { status: 'PAID' } },
        multi: true
      }]
    })

    return { success: true }
  }
}
