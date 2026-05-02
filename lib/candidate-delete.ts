import { prisma } from '@/lib/prisma'
import { isLikelyObjectId } from '@/lib/mongodb-id'

export class CandidateNotFoundError extends Error {
  readonly statusCode = 404
  constructor() {
    super('Candidate not found')
    this.name = 'CandidateNotFoundError'
  }
}

/**
 * Deletes pipeline rows and the candidate. Prefer Prisma so deletes stay consistent
 * with matching queries (findMany). Raw Mongo fallback handles legacy _id shapes.
 */
export async function adminDeleteCandidate(candidateId: string): Promise<{ pipelineMatchesDeleted: number }> {
  if (!isLikelyObjectId(candidateId)) {
    throw new Error('Invalid candidate id')
  }

  const existing = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { id: true },
  })
  if (!existing) {
    throw new CandidateNotFoundError()
  }

  const pipelineMatchesDeleted = await prisma.pipelineMatch.deleteMany({
    where: { candidateId },
  })

  const removed = await prisma.candidate.deleteMany({ where: { id: candidateId } })
  if (removed.count > 0) {
    return { pipelineMatchesDeleted: pipelineMatchesDeleted.count }
  }

  await (prisma as any).$runCommandRaw({
    delete: 'Candidate',
    deletes: [{ q: { _id: { $oid: candidateId } }, limit: 1 }],
  })

  let still = await prisma.candidate.findUnique({ where: { id: candidateId }, select: { id: true } })
  if (still) {
    await (prisma as any).$runCommandRaw({
      delete: 'Candidate',
      deletes: [{ q: { _id: candidateId }, limit: 1 }],
    })
    still = await prisma.candidate.findUnique({ where: { id: candidateId }, select: { id: true } })
  }
  if (still) {
    throw new Error('Could not delete candidate')
  }
  return { pipelineMatchesDeleted: pipelineMatchesDeleted.count }
}
