import { PrismaClient } from '@prisma/client'
import { assertRequiredEnv } from '@/lib/env'

assertRequiredEnv()

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
