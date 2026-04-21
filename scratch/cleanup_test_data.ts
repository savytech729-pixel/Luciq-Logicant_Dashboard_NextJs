import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning up test data...')
  
  // 1. Find test users
  const testUsers = await prisma.user.findMany({
    where: {
      email: {
        contains: 'test',
        mode: 'insensitive'
      }
    }
  })

  const testUserIds = testUsers.map(u => u.id)

  // 2. Delete Candidates associated with these users
  await prisma.candidate.deleteMany({
    where: {
      userId: { in: testUserIds }
    }
  })

  // 3. Delete the users themselves
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: { in: testUserIds }
    }
  })
  
  console.log(`Deleted ${deletedUsers.count} test users and their associated candidates.`)

  console.log('Cleanup complete! ✅')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
