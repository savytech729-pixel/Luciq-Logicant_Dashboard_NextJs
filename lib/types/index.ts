import { Placement, Invoice, Client, Candidate, Job } from '@prisma/client'

export type { Placement, Invoice, Client, Candidate, Job }

export interface ExtendedCandidate extends Candidate {
  user?: { email: string } // Joined for UI
}

export interface ExtendedJob extends Job {
  matchScore?: number // For candidate job board
}

export type PlacementWithRelations = Placement & {
  invoices?: Invoice[]
  client?: Client
}

export type ClientWithRelations = Client & {
  placements?: Placement[]
}

export type BillingData = {
  placements: Placement[]
  invoices: Invoice[]
}

export type ClientStats = {
  totalTenants: number
  activeUsers: number
  health: string
}
