'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Briefcase,
  MapPin,
  Zap,
  Target,
  Clock,
  ArrowRight,
  Mail,
  Phone,
  Banknote,
  GraduationCap,
  FileText,
  Link2,
  Languages,
  Award,
  FolderKanban,
  Code2,
} from 'lucide-react'
import { PageHero } from '@/components/dashboard/Premium'

import { useCandidate } from '@/lib/hooks/useCandidate'

export default function CandidateDashboard() {
  const { candidate, loading } = useCandidate()

  if (loading) return null

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700 pb-8">
      <PageHero
        eyebrow="Career Command"
        title="My Growth Dashboard"
        description="Track profile quality, active opportunities, and progression in one workspace."
        right={candidate ? (
          <Link href="/candidate/profile">
            <button className="hidden sm:flex px-4 py-2 bg-white/[0.05] border border-white/10 hover:bg-white/10 rounded-lg text-sm text-white transition-colors">
              Edit My Profile
            </button>
          </Link>
        ) : null}
      />

      {candidate && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card border-white/10"><CardContent className="p-5"><p className="text-slate-400 text-sm">Active Applications</p><p className="text-3xl font-bold text-white">{candidate.matches?.length || 0}</p></CardContent></Card>
          <Card className="glass-card border-white/10"><CardContent className="p-5"><p className="text-slate-400 text-sm">Shortlisted</p><p className="text-3xl font-bold text-blue-300">{candidate.matches?.filter((m: any) => m.status === 'SHORTLISTED').length || 0}</p></CardContent></Card>
          <Card className="glass-card border-white/10"><CardContent className="p-5"><p className="text-slate-400 text-sm">Selected</p><p className="text-3xl font-bold text-emerald-300">{candidate.matches?.filter((m: any) => m.status === 'SELECTED' || m.status === 'HIRED').length || 0}</p></CardContent></Card>
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-8">
            <Card className="glass-card h-full border-white/10">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-white">Profile Intelligence</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Info icon={<Mail className="w-3.5 h-3.5 text-blue-400" />} label="Email" value={candidate.user?.email || '—'} />
                  <Info icon={<Phone className="w-3.5 h-3.5 text-emerald-400" />} label="Phone" value={candidate.phone || '—'} />
                  <Info icon={<Briefcase className="w-3.5 h-3.5 text-violet-400" />} label="Current role" value={candidate.currentRole || 'Not set'} />
                  <Info icon={<Clock className="w-3.5 h-3.5 text-amber-400" />} label="Experience" value={`${candidate.experienceYears ?? candidate.totalExperience ?? 0} yrs`} />
                  <Info icon={<MapPin className="w-3.5 h-3.5 text-red-400" />} label="Location" value={candidate.preferredLocation || 'Not set'} />
                  <Info icon={<Banknote className="w-3.5 h-3.5 text-cyan-400" />} label="Expected salary" value={candidate.expectedSalary || '—'} />
                  <Info icon={<Clock className="w-3.5 h-3.5 text-slate-400" />} label="Notice" value={candidate.noticePeriod || '—'} />
                  <Info label="Work mode" value={candidate.workSettingPreference || '—'} />
                  <Info icon={<Link2 className="w-3.5 h-3.5 text-sky-400" />} label="LinkedIn" value={candidate.linkedInUrl || '—'} breakAll />
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5" /> Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(candidate.skills || []).length ? (
                      (candidate.skills || []).map((skill: string) => (
                        <span key={skill} className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/10 text-slate-200 text-xs">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">No skills on file</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5" /> Languages
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(candidate.languages || []).length ? (
                      (candidate.languages || []).map((lang: string) => (
                        <span key={lang} className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-slate-200 text-xs">
                          {lang}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">—</span>
                    )}
                  </div>
                </div>

                <TextBlock
                  icon={<GraduationCap className="w-3.5 h-3.5 text-cyan-400" />}
                  title="Education"
                  text={candidate.education}
                />
                <TextBlock
                  icon={<Briefcase className="w-3.5 h-3.5 text-amber-400" />}
                  title="Work experience (from CV)"
                  text={candidate.employmentHistory}
                />
                <TextBlock
                  icon={<Award className="w-3.5 h-3.5 text-violet-400" />}
                  title="Certifications"
                  text={candidate.certifications}
                />
                <TextBlock
                  icon={<FolderKanban className="w-3.5 h-3.5 text-emerald-400" />}
                  title="Projects"
                  text={candidate.projects}
                />
                <TextBlock
                  icon={<FileText className="w-3.5 h-3.5 text-blue-400" />}
                  title="Professional summary"
                  text={candidate.summary}
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="md:col-span-4">
            <Card className="glass-card h-full border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center text-white text-lg">Progress State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-400 text-sm leading-relaxed">
                  Your profile is active. You are currently being considered for {candidate.matches?.length || 0} open positions.
                </p>
                <Link href="/candidate/profile" className="block w-full">
                  <button className="w-full text-center px-4 py-2 bg-white/[0.03] hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors mt-2">
                    Update My Profile
                  </button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-12">
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
                {(!candidate.matches || candidate.matches.length === 0) ? (
                   <div className="p-12 text-center">
                      <p className="text-slate-500 italic">You haven't applied to any jobs yet.</p>
                   </div>
                ) : (
                   <div className="divide-y divide-white/5">
                      {candidate.matches.map((match: any, idx: number) => (
                        <div key={match.jobId} className="px-8 py-6 flex items-center justify-between hover:bg-white/[0.02] transition-all group">
                           <div className="flex items-center gap-6">
                              <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-600/20 transition-all">
                                 <Briefcase className="w-5 h-5 text-blue-500" />
                              </div>
                              <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-bold text-white">{match.jobTitle}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                      match.status === 'SELECTED' ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]' :
                                      match.status === 'SHORTLISTED' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                                      match.status === 'REJECTED' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                      'bg-white/5 border-white/10 text-slate-400'
                                    }`}>
                                      {match.status}
                                    </span>
                                 </div>
                                 <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <span className="text-slate-300 font-semibold">{match.clientName}</span>
                                    <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-500" /> Match: {match.score}%</span>
                                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(match.updatedAt).toLocaleDateString()}</span>
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

function Info({
  label,
  value,
  icon,
  breakAll,
}: {
  label: string
  value: string
  icon?: ReactNode
  breakAll?: boolean
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 min-w-0">
      <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p className={`text-sm text-slate-200 ${breakAll ? 'break-all' : ''}`}>{value}</p>
    </div>
  )
}

function TextBlock({
  title,
  text,
  icon,
}: {
  title: string
  text?: string | null
  icon?: ReactNode
}) {
  const v = (text || '').trim()
  if (!v) return null
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
        {icon}
        {title}
      </p>
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">{v}</p>
    </div>
  )
}
