import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const users = await prisma.user.findMany({
      take: 1,
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
    console.log('Success:', JSON.stringify(users, null, 2))
  } catch (err: any) {
    console.error('Error:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
