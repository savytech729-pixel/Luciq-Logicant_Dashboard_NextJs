'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Briefcase, Clock, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHero, SurfaceCard } from '@/components/dashboard/Premium'
import { useCandidate } from '@/lib/hooks/useCandidate'

export default function CandidateAppliedJobsPage() {
  const { getJobs, loading: initialLoading } = useCandidate()
  const [appliedJobs, setAppliedJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const jobs = await getJobs()
      const applied = (jobs || []).filter((j: any) => Boolean(j?.hasApplied))
      setAppliedJobs(applied)
      setLoading(false)
    }
    load()
  }, [getJobs])

  if (loading || initialLoading) return null

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <PageHero
        eyebrow="Opportunity Center"
        title="Applied Jobs"
        description="Track every vacancy you have already applied for."
      />

      {appliedJobs.length === 0 ? (
        <SurfaceCard className="text-center py-16 border-dashed border-white/20">
          <p className="text-slate-500">You have not applied to any vacancy yet.</p>
          <Link href="/candidate/jobs" className="inline-block mt-4">
            <button className="btn-primary">Explore Vacancies</button>
          </Link>
        </SurfaceCard>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {appliedJobs.map((job: any) => (
            <Card key={String(job.id)} className="glass-card flex flex-col h-full border-white/10">
              <CardHeader className="pb-4 border-b border-white/5 bg-white/[0.02]">
                <CardTitle className="text-xl text-white">{job.title || 'Untitled Role'}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm text-slate-300 line-clamp-3">{job.description || 'No description available.'}</p>
                <div className="text-xs text-slate-400 flex items-center gap-4">
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {job.clientName || 'Private Client'}</span>
                  <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {job.pipelineStatus || 'SCREENING'}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(job.updatedAt || job.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
                <div>
                  <Link href="/candidate/jobs">
                    <button className="text-xs px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/10 text-white transition-colors">
                      View All Vacancies
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
