import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const testId = "69e201d7140022787b856cb9"
  try {
    const user = await prisma.user.findUnique({
      where: { id: testId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        phone: true,
        jobTitle: true,
        department: true,
        createdAt: true,
      }
    })
    console.log('Result for ID', testId, ':', JSON.stringify(user, null, 2))
  } catch (err: any) {
    console.error('Error:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
