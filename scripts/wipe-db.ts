import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Database Wipe Initialized (Relation-Aware) ---')

  try {
    // 1. Delete dependent models first
    console.log('Cleaning up PipelineMatches...')
    await prisma.pipelineMatch.deleteMany({})

    console.log('Cleaning up Invoices...')
    await prisma.invoice.deleteMany({})

    console.log('Cleaning up Placements...')
    await prisma.placement.deleteMany({})

    console.log('Cleaning up Jobs...')
    await prisma.job.deleteMany({})

    console.log('Cleaning up Candidates...')
    await prisma.candidate.deleteMany({})

    console.log('Cleaning up Recruiters...')
    await prisma.recruiter.deleteMany({})

    console.log('Cleaning up Clients...')
    await prisma.client.deleteMany({})

    console.log('Cleaning up Users...')
    await prisma.user.deleteMany({})

    console.log('--- Wipe Complete. Database is clean. ---')
  } catch (err) {
    console.error('Wipe failed:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
