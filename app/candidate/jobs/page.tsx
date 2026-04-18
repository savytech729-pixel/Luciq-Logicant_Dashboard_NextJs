'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { BrainCircuit, Briefcase, Zap, CheckCircle2 } from 'lucide-react'

import { useCandidate } from '@/lib/hooks/useCandidate'

export default function CandidateJobsPage() {
  const { getJobs, loading: initialLoading } = useCandidate()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({})

  const handleApply = (jobId: string) => {
    setAppliedJobs(prev => ({...prev, [jobId]: true}))
    // In a real system, POST to /api/candidate/jobs/apply
  }

  useEffect(() => {
    const fetchJobs = async () => {
      const data = await getJobs()
      setJobs(data)
      setLoading(false)
    }
    fetchJobs()
  }, [getJobs])

  if (loading || initialLoading) return null

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Job Market Explorer</h1>
        <p className="text-slate-400">View live requisitions and your AI-calculated compatibility score.</p>
      </div>

      {jobs.length === 0 ? (
        <Card className="glass-card bg-transparent shadow-none text-center py-16 border-dashed border-white/20">
          <p className="text-slate-500">No active job requisitions found in the system.</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {jobs.map((job) => {
             let parsedSkills = []
             if (Array.isArray(job.requiredSkills)) parsedSkills = job.requiredSkills
             else if (typeof job.requiredSkills === 'string') {
                try { parsedSkills = JSON.parse(job.requiredSkills) } 
                catch(e) { parsedSkills = [job.requiredSkills] }
             }

             return (
              <Card key={job.id} className="glass-card flex flex-col h-full hover:border-blue-500/50 transition-colors">
                <CardHeader className="pb-4 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-white">{job.title}</CardTitle>
                      <CardDescription className="text-slate-400 mt-1 flex items-center">
                        <Briefcase className="w-3 h-3 mr-1" /> {job.location || 'Remote'} • {job.experienceRequired}+ Yrs
                      </CardDescription>
                    </div>
                    {job.matchScore !== null && (
                      <div className="flex flex-col items-end">
                         <div className="flex flex-col items-center justify-center bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 min-w-[70px] mb-2">
                           <span className="text-xs text-blue-400 font-semibold mb-1">Match</span>
                           <span className="text-xl font-bold text-white leading-none">{job.matchScore}%</span>
                         </div>
                         {appliedJobs[job.id] ? (
                           <button className="flex items-center text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full cursor-default">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Applied
                           </button>
                         ) : (
                           <button 
                             onClick={() => handleApply(job.id)}
                             className="flex items-center text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-full transition-colors shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                           >
                              <Zap className="w-3 h-3 mr-1" /> 1-Click Apply
                           </button>
                         )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4 pt-4">
                  <p className="text-sm text-slate-300 line-clamp-3">{job.description}</p>
                  <div>
                    <p className="text-xs text-slate-500 mb-2 uppercase font-medium tracking-wider">Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {parsedSkills.map((s: string) => (
                        <span key={s} className="px-2 py-1 rounded-md bg-white/[0.05] border border-white/10 text-slate-300 text-xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
             )
          })}
        </div>
      )}
    </div>
  )
}
