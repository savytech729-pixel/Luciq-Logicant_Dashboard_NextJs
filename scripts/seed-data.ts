import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding data...')

  // 1. Create an Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aitalent.com' },
    update: {},
    create: {
      email: 'admin@aitalent.com',
      password: 'adminpassword', // In real life, use hashing
      role: 'ADMIN'
    }
  })

  // 2. Create Clients
  const acme = await prisma.client.create({
    data: {
      name: 'Acme Corp',
      region: 'US-East (N. Virginia)',
      plan: 'Enterprise',
      status: 'Active'
    }
  })

  const globex = await prisma.client.create({
    data: {
      name: 'Globex Corp',
      region: 'EU-Central (Frankfurt)',
      plan: 'Pro',
      status: 'Active'
    }
  })

  // 3. Create Candidates
  const john = await prisma.user.create({
    data: {
      email: 'john@doe.com',
      password: 'password123',
      role: 'CANDIDATE',
      candidate: {
        create: {
          name: 'John Doe',
          experienceYears: 5,
          currentRole: 'Senior Frontend Engineer',
          skills: ['React', 'Next.js', 'TypeScript']
        }
      }
    }
  })

  const jane = await prisma.user.create({
    data: {
      email: 'jane@smith.com',
      password: 'password123',
      role: 'CANDIDATE',
      candidate: {
        create: {
          name: 'Jane Smith',
          experienceYears: 8,
          currentRole: 'Backend Architect',
          skills: ['Node.js', 'MongoDB', 'Go']
        }
      }
    }
  })

  // 4. Create Jobs
  const job1 = await prisma.job.create({
    data: {
      title: 'Senior React Developer',
      description: 'Looking for a React expert to build modern AI dashboards.',
      requiredSkills: ['React', 'Next.js'],
      experienceRequired: 4,
      location: 'Remote',
      createdBy: admin.id
    }
  })

  // 5. Create Placements
  const placement1 = await prisma.placement.create({
    data: {
      candidateId: john.id,
      jobId: job1.id,
      clientId: acme.id,
      candidateName: 'John Doe',
      jobTitle: 'Senior React Developer',
      clientName: 'Acme Corp',
      hireDate: new Date(),
      baseSalary: 145000,
      feePercentage: 15,
      status: 'UNBILLED'
    }
  })

  const placement2 = await prisma.placement.create({
    data: {
      candidateId: jane.id,
      jobId: job1.id,
      clientId: globex.id,
      candidateName: 'Jane Smith',
      jobTitle: 'Lead Architect',
      clientName: 'Globex Corp',
      hireDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      baseSalary: 180000,
      feePercentage: 20,
      status: 'PAID'
    }
  })

  // 6. Create Invoice for placement2
  await prisma.invoice.create({
    data: {
      placementId: placement2.id,
      amount: 180000 * 0.20,
      status: 'PAID'
    }
  })

  console.log('Seeding completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
