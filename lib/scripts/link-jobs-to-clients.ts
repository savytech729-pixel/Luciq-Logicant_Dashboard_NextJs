import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrate() {
  console.log('--- Starting Job-Client Data Alignment ---')

  // 1. Fetch all Clients with their IDs
  const clients = await prisma.client.findMany()
  const clientMap = clients.reduce((acc: any, c) => {
    acc[c.name.toLowerCase()] = c.id
    return acc
  }, {})

  // 2. Fetch all Jobs that missing clientId
  const jobs = await (prisma as any).$runCommandRaw({
    find: 'Job',
    filter: { clientId: { $exists: false } }
  })

  const jobDocs = (jobs as any)?.cursor?.firstBatch ?? []
  console.log(`Found ${jobDocs.length} jobs requiring alignment.`)

  for (const job of jobDocs) {
    const jobId = job._id?.$oid ?? String(job._id)
    const clientName = (job.clientName || '').toLowerCase()
    const clientId = clientMap[clientName]

    if (clientId) {
      console.log(`Linking Job: ${job.title} -> Client: ${job.clientName}`)
      await (prisma as any).$runCommandRaw({
        update: 'Job',
        updates: [{
          q: { _id: { $oid: jobId } },
          u: { $set: { clientId: { $oid: clientId } } }
        }]
      })
    } else {
      console.log(`⚠️ No Client found for: ${job.clientName}. Job: ${job.title}`)
    }
  }

  console.log('--- Migration Complete ---')
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
