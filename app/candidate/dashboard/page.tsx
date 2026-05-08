'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Briefcase,
  Zap,
  Target,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { PageHero } from '@/components/dashboard/Premium'

import { useCandidate } from '@/lib/hooks/useCandidate'

export default function CandidateDashboard() {
  const { candidate, loading, getJobs } = useCandidate()
  const [availableJobs, setAvailableJobs] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    const loadJobs = async () => {
      const jobs = await getJobs()
      if (mounted) setAvailableJobs(jobs || [])
    }
    loadJobs()
    return () => {
      mounted = false
    }
  }, [])

  if (loading) return null

  const appliedFromJobs = (availableJobs || [])
    .filter((j: any) => Boolean(j?.hasApplied))
    .map((j: any) => ({
      id: j.id,
      title: j.title || 'Untitled Role',
      clientName: j.clientName || 'Private Client',
      pipelineStatus: j.pipelineStatus || 'SCREENING',
      score: j.matchScore ?? 0,
      updatedAt: j.updatedAt || j.createdAt || new Date().toISOString(),
    }))

  const appliedFromMatches = (candidate?.matches || []).map((m: any) => ({
    id: m.jobId || m.id,
    title: m.jobTitle || 'Untitled Role',
    clientName: m.clientName || 'Private Client',
    pipelineStatus: m.status || 'SCREENING',
    score: m.score ?? 0,
    updatedAt: m.updatedAt || new Date().toISOString(),
  }))

  const appliedJobsMap = new Map<string, any>()
  for (const item of [...appliedFromMatches, ...appliedFromJobs]) {
    if (item?.id) appliedJobsMap.set(String(item.id), item)
  }
  const appliedJobs = Array.from(appliedJobsMap.values())
  const appliedCount = appliedJobs.length
  const openVacancyCount = (availableJobs || []).filter((j: any) => !j?.hasApplied).length

  const profileChecks = candidate
    ? [
        { label: 'Name', ok: Boolean(candidate.name?.trim()) },
        { label: 'Current Role', ok: Boolean(candidate.currentRole?.trim()) },
        { label: 'Experience', ok: Number(candidate.experienceYears ?? candidate.totalExperience ?? 0) > 0 },
        { label: 'Phone', ok: Boolean(candidate.phone?.trim()) },
        { label: 'Location', ok: Boolean(candidate.preferredLocation?.trim()) },
        { label: 'Notice Period', ok: Boolean(candidate.noticePeriod?.trim()) },
        { label: 'Expected Salary', ok: Boolean(candidate.expectedSalary?.trim()) },
        { label: 'Skills', ok: Array.isArray(candidate.skills) && candidate.skills.length >= 3 },
        { label: 'Education', ok: Boolean(candidate.education?.trim()) },
        { label: 'Summary', ok: Boolean(candidate.summary?.trim()) },
        { label: 'Projects', ok: Boolean(candidate.projects?.trim()) },
        { label: 'CV', ok: Boolean(candidate.cvUrl?.trim()) },
      ]
    : []
  const profileScore = profileChecks.length
    ? Math.round((profileChecks.filter((x) => x.ok).length / profileChecks.length) * 100)
    : 0
  const missingProfileItems = profileChecks.filter((x) => !x.ok).map((x) => x.label).slice(0, 6)

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700 pb-8">
      <PageHero
        eyebrow="Career Command"
        title="My Growth Dashboard"
        description="Track profile quality, active opportunities, and progression in one workspace."
      />

      {candidate && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card border-white/10"><CardContent className="p-5"><p className="text-slate-400 text-sm">Open Vacancies</p><p className="text-3xl font-bold text-white">{openVacancyCount}</p></CardContent></Card>
          <Card className="glass-card border-white/10"><CardContent className="p-5"><p className="text-slate-400 text-sm">Applied Jobs</p><p className="text-3xl font-bold text-blue-300">{appliedCount}</p></CardContent></Card>
          <Card className="glass-card border-white/10"><CardContent className="p-5"><p className="text-slate-400 text-sm">Profile Progress</p><p className="text-3xl font-bold text-emerald-300">{profileScore}%</p></CardContent></Card>
        </div>
      )}

      {!candidate ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="glass-card overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl text-white">Profile Setup Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-400">
                You must complete your profile setup to become visible to recruiters and companies.
              </p>
              <Link href="/candidate/profile" className="inline-block mt-2">
                <button className="btn-primary">
                  Start Profile Setup
                </button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-12">
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="md:col-span-12">
            <Card className="glass-card h-full border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center text-white text-lg">Progress State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-400 text-sm leading-relaxed">
                  Your profile completion score is <strong className="text-white">{profileScore}%</strong>. You are currently being considered for {appliedCount} position(s).
                </p>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${profileScore}%` }} />
                </div>
                {missingProfileItems.length > 0 ? (
                  <p className="text-xs text-slate-500">
                    Missing: {missingProfileItems.join(', ')}
                  </p>
                ) : (
                  <p className="text-xs text-emerald-400">Profile complete. Great visibility for recruiters.</p>
                )}
                <p className="text-[11px] text-slate-500">Edit profile details from <strong className="text-slate-300">My Profile</strong>.</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div id="tracker" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-12">
            <Card className="glass-card overflow-hidden bg-transparent border-white/10">
              <CardHeader className="border-b border-white/5 px-8 py-6">
                <div className="flex items-center justify-between">
                   <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                      <Target className="w-5 h-5 text-blue-500" /> Application Timeline
                   </CardTitle>
                  <span className="text-xs font-semibold text-slate-500">Latest updates</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {appliedCount === 0 ? (
                   <div className="p-12 text-center">
                      <p className="text-slate-500 italic">You haven't applied to any jobs yet.</p>
                   </div>
                ) : (
                   <div className="divide-y divide-white/5">
                      {appliedJobs.map((match: any) => (
                        <div key={String(match.id)} className="px-8 py-6 flex items-center justify-between hover:bg-white/[0.02] transition-all group">
                           <div className="flex items-center gap-6">
                              <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-600/20 transition-all">
                                 <Briefcase className="w-5 h-5 text-blue-500" />
                              </div>
                              <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-bold text-white">{match.title || match.jobTitle}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                      match.pipelineStatus === 'SELECTED' || match.pipelineStatus === 'HIRED' ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]' :
                                      match.pipelineStatus === 'SHORTLISTED' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                                      match.pipelineStatus === 'REJECTED' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                      'bg-white/5 border-white/10 text-slate-400'
                                    }`}>
                                      {match.pipelineStatus || 'SCREENING'}
                                    </span>
                                 </div>
                                 <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <span className="text-slate-300 font-semibold">{match.clientName || 'Private Client'}</span>
                                    <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-500" /> Match: {match.matchScore ?? match.score ?? 0}%</span>
                                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(match.updatedAt || Date.now()).toLocaleDateString()}</span>
                                 </div>
                              </div>

                           </div>
                           <Link href="/candidate/jobs">
                              <button className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-all">
                                 View Opportunity <ArrowRight className="w-3 h-3" />
                              </button>
                           </Link>
                        </div>
                      ))}
                   </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  )
}
