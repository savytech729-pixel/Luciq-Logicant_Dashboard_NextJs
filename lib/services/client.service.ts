import { prisma } from '@/lib/prisma'

export const clientService = {
  async getAllClients() {
    try {
      const result = await (prisma as any).$runCommandRaw({
        find: 'Client',
        sort: { name: 1 },
        limit: 100
      })
      const docs = (result as any)?.cursor?.firstBatch ?? []
      
      // Get user & requisition counts per client
      const clientsWithMeta = await Promise.all(docs.map(async (c: any) => {
        const id = c._id?.$oid ?? String(c._id)
        const name = c.name
        
        const [userCount, jobsResult, placementsResult] = await Promise.all([
          (prisma as any).$runCommandRaw({ count: 'User', query: { clientId: { $oid: id } } }),
          (prisma as any).$runCommandRaw({ find: 'Job', filter: { clientId: { $oid: id } } }),
          (prisma as any).$runCommandRaw({ find: 'Placement', filter: { clientId: { $oid: id } } })
        ])

        const jobs = (jobsResult as any)?.cursor?.firstBatch ?? []
        const jobIds = jobs.map((j: any) => j._id)
        const placements = (placementsResult as any)?.cursor?.firstBatch ?? []
        
        // Calculate total revenue from placements
        const revenue = placements.reduce((sum: number, p: any) => {
          const fee = (p.baseSalary || 0) * ((p.feePercentage || 15) / 100)
          return sum + fee
        }, 0)
        
        let shortlisted = 0
        if (jobIds.length > 0) {
          const matchResult = await (prisma as any).$runCommandRaw({
            count: 'PipelineMatch',
            query: { 
              jobId: { $in: jobIds },
              status: { $in: ['SHORTLISTED', 'SELECTED', 'HIRED'] }
            }
          })
          shortlisted = (matchResult as any)?.n ?? 0
        }

        return {
          id,
          ...c,
          users: (userCount as any)?.n ?? 0,
          activeJobs: jobs.length,
          shortlisted,
          revenue,
          createdAt: c.createdAt?.$date ?? c.createdAt
        }
      }))
      
      return clientsWithMeta
    } catch {
      return await prisma.client.findMany({ 
        orderBy: { name: 'asc' },
        include: { _count: { select: { users: true } } }
      })
    }
  },

  async createClient(data: { name: string; region: string; plan: string }) {
    const now = new Date().toISOString()
    const result = await (prisma as any).$runCommandRaw({
      insert: 'Client',
      documents: [{
        ...data,
        status: 'Active',
        createdAt: { $date: now }
      }]
    })
    return result
  },

  async getClientStats() {
    try {
      const clientsCount = await (prisma as any).$runCommandRaw({
        count: 'Client'
      })
      const usersCount = await (prisma as any).$runCommandRaw({
        count: 'User',
        query: { clientId: { $ne: null } }
      })
      
      return {
        totalTenants: (clientsCount as any)?.n ?? 0,
        activeUsers: (usersCount as any)?.n ?? 0,
        health: '99.98%'
      }
    } catch {
      const [clients, userCount] = await Promise.all([
        prisma.client.count(),
        prisma.user.count({ where: { clientId: { not: null } } })
      ])
      return { totalTenants: clients, activeUsers: userCount, health: '99.98%' }
    }
  }
}
