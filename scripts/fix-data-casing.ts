import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Fixing data casing to match Prisma enums...')

  // 1. Fix Placement statuses
  const placements = await prisma.placement.findMany()
  for (const p of placements) {
    let newStatus = p.status as string
    if (newStatus === 'Paid') newStatus = 'PAID'
    if (newStatus === 'Pending') newStatus = 'PENDING'
    if (newStatus === 'Unbilled') newStatus = 'UNBILLED'
    
    if (newStatus !== p.status) {
      await prisma.placement.update({
        where: { id: p.id },
        data: { status: newStatus as any }
      })
      console.log(`Updated Placement ${p.id}: ${p.status} -> ${newStatus}`)
    }
  }

  // 2. Fix Invoice statuses
  const invoices = await prisma.invoice.findMany()
  for (const inv of invoices) {
    let newStatus = inv.status as string
    if (newStatus === 'Paid') newStatus = 'PAID'
    if (newStatus === 'Pending') newStatus = 'PENDING'
    
    if (newStatus !== inv.status) {
      await prisma.invoice.update({
        where: { id: inv.id },
        data: { status: newStatus as any }
      })
      console.log(`Updated Invoice ${inv.id}: ${inv.status} -> ${newStatus}`)
    }
  }

  console.log('Cleanup completed.')
}

main()
  .catch((e) => {
    // If findMany fails due to enum error, we might need a raw query
    console.log('findMany failed, attempting raw update...')
    runRawUpdate().catch(console.error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

async function runRawUpdate() {
  console.log('Running raw MongoDB updates...')
  
  // Update Placement collection
  await (prisma as any).$runCommandRaw({
    update: 'Placement',
    updates: [
      { q: { status: 'Paid' }, u: { $set: { status: 'PAID' } }, multi: true },
      { q: { status: 'Pending' }, u: { $set: { status: 'PENDING' } }, multi: true },
      { q: { status: 'Unbilled' }, u: { $set: { status: 'UNBILLED' } }, multi: true }
    ]
  })

  // Update Invoice collection
  await (prisma as any).$runCommandRaw({
    update: 'Invoice',
    updates: [
      { q: { status: 'Paid' }, u: { $set: { status: 'PAID' } }, multi: true },
      { q: { status: 'Pending' }, u: { $set: { status: 'PENDING' } }, multi: true }
    ]
  })

  console.log('Raw updates completed.')
}
