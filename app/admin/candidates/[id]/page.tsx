'use client'

import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  ArrowLeft,
  BrainCircuit,
  Mail,
  MapPin,
  Briefcase,
  Phone,
  Clock,
  Banknote,
  FileText,
  AlertTriangle,
  GraduationCap,
  FolderKanban,
  Award,
  Languages as LanguagesIcon,
  Link2,
  User,
  Layers,
  MessageCircle,
  Sparkles,
  ExternalLink,
  Calendar,
  MapPinned,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
} from 'lucide-react'

import { useTalent } from '@/lib/hooks/useTalent'
import { sortEntriesForDisplay, type ResumeSortOrder } from '@/lib/resume-entries'

function sanitizeReturnUrl(raw: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null
  try {
    const decoded = decodeURIComponent(raw.trim())
    if (!decoded.startsWith('/')) return null
    if (!decoded.startsWith('/admin/')) return null
    if (decoded.includes('//')) return null
    return decoded
  } catch {
    return null
  }
}

export default function CandidateDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <BrainCircuit className="h-8 w-8 text-blue-500 animate-pulse" />
          <p className="text-slate-400">Loading candidate…</p>
        </div>
      }
    >
      <CandidateDetailContent />
    </Suspense>
  )
}

type VacancyFit = {
  jobId: string
  title: string
  score: number
  status: string
  clientName: string | null
  location: string | null
}

function CandidateDetailContent() {
  const { id } = useParams()
  const candidateId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''
  const searchParams = useSearchParams()
  const returnUrl = sanitizeReturnUrl(searchParams.get('returnUrl'))
  const backHref = returnUrl ?? '/admin/candidates'
  const backFromVacancy = Boolean(returnUrl?.includes('/admin/matches/'))

  const { getCandidateById, loading: initialLoading } = useTalent()
  const [candidate, setCandidate] = useState<any>(null)
  const [aiSummary, setAiSummary] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'profile' | 'cv' | 'ai'>('profile')
  const [loading, setLoading] = useState(true)
  const [vacancyFits, setVacancyFits] = useState<VacancyFit[]>([])
  const [fitsLoading, setFitsLoading] = useState(false)
  const [fitsError, setFitsError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCandidate = async () => {
      if (!id) return
      const data = await getCandidateById(id as string)
      if (data) {
        setCandidate(data.candidate)
        setAiSummary(data.aiSummary || [])
      }
      setLoading(false)
    }
    fetchCandidate()
  }, [id, getCandidateById])

  useEffect(() => {
    if (!candidateId) return
    let cancelled = false
    setFitsLoading(true)
    setFitsError(null)
    fetch(`/api/admin/candidates/${candidateId}/vacancy-fits`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(typeof d.error === 'string' ? d.error : 'Could not load vacancy fits')
        return d
      })
      .then((d) => {
        if (!cancelled && Array.isArray(d.fits)) setVacancyFits(d.fits)
      })
      .catch((e) => {
        if (!cancelled) setFitsError(e instanceof Error ? e.message : 'Failed to load fits')
      })
      .finally(() => {
        if (!cancelled) setFitsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [candidateId])

  if (loading || initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <BrainCircuit className="h-8 w-8 text-blue-500 animate-pulse" />
        <p className="text-slate-400">Generative AI analyzing candidate footprint...</p>
      </div>
    )
  }

  if (!candidate) return <div className="text-white">Candidate not found.</div>

  const displayEmail =
    (candidate.email && String(candidate.email).trim()) ||
    (candidate.user?.email && String(candidate.user.email).trim() && candidate.user.email !== 'Not linked'
      ? candidate.user.email
      : '') ||
    'Not available'

  const humanizeName = (rawName: string, email?: string, parseSourceFile?: string) => {
    const value = String(rawName || '').trim()
    if (!value) return 'Candidate'
    if (value.includes(' ')) return value
    const local = String(email || '').split('@')[0] || ''
    const parts = local
      .replace(/[0-9]+/g, ' ')
      .split(/[._-]+/)
      .map((p) => p.trim())
      .filter(Boolean)
    if (parts.length >= 2) {
      return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
    }
    const fromFile = String(parseSourceFile || '')
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/\[[^\]]*\]/g, ' ')
      .split(/[_-]+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .pop() || ''
    const splitFile = fromFile.replace(/([a-z])([A-Z])/g, '$1 $2').trim()
    if (splitFile.includes(' ')) {
      return splitFile.split(' ').map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
    }
    return value.charAt(0).toUpperCase() + value.slice(1)
  }

  let skills = []
  if (Array.isArray(candidate.skills)) skills = candidate.skills
  else if (typeof candidate.skills === 'string') {
    try { skills = JSON.parse(candidate.skills) } catch (e) { skills = [candidate.skills] }
  }

  const displayName = humanizeName(candidate.name, candidate.user?.email, candidate.parseSourceFile)
  const phoneRaw = String(candidate.phone || '').trim()
  const telHref = phoneRaw ? `tel:${phoneRaw.replace(/\s/g, '')}` : ''
  const mailHref =
    displayEmail && displayEmail !== 'Not available'
      ? `mailto:${displayEmail}?subject=${encodeURIComponent(`Opportunity — ${displayName}`)}`
      : ''
  const waHref = whatsappHrefFromPhone(phoneRaw)
  const selfCandidateUrl = candidateId ? `/admin/candidates/${candidateId}` : '/admin/candidates'

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700">
      <div className="flex items-start gap-4">
         <Link href={backHref} title={backFromVacancy ? 'Back to vacancy matching' : 'Back to candidates'}>
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
            <ArrowLeft className="h-4 w-4 text-white" />
          </button>
        </Link>
        <div className="flex-1">
          {backFromVacancy && (
            <p className="text-[11px] text-slate-500 mb-1">← Back returns to the vacancy you were matching.</p>
          )}
          <p className="text-xs text-blue-400 font-semibold tracking-wide">Candidate Intelligence</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mt-1">{displayName}</h1>
          <p className="text-slate-400 mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
             <Mail className="w-4 h-4 shrink-0 text-slate-500" />
             <span className="break-all text-sm">{displayEmail}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Experience" value={`${candidate.totalExperience || candidate.experienceYears || 0} yrs`} icon={<Briefcase className="w-4 h-4 text-blue-400" />} />
        <Stat label="Notice" value={candidate.noticePeriod || 'N/A'} icon={<Clock className="w-4 h-4 text-amber-400" />} />
        <Stat label="Location" value={candidate.preferredLocation || 'N/A'} icon={<MapPin className="w-4 h-4 text-red-400" />} />
        <Stat label="Phone" value={candidate.phone?.trim() ? String(candidate.phone) : 'N/A'} icon={<Phone className="w-4 h-4 text-emerald-400" />} />
      </div>

      <div className="flex flex-wrap items-stretch gap-2 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/90 via-slate-900/50 to-slate-950/80 p-4 shadow-lg shadow-black/20">
        <p className="w-full text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">Quick actions</p>
        {telHref ? (
          <a
            href={telHref}
            className="inline-flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-500/20"
          >
            <Phone className="h-4 w-4 shrink-0" /> Call
          </a>
        ) : (
          <span className="inline-flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-slate-500">
            <Phone className="h-4 w-4" /> No phone
          </span>
        )}
        {mailHref ? (
          <a
            href={mailHref}
            className="inline-flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl border border-blue-500/25 bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-100 transition-colors hover:bg-blue-500/20"
          >
            <Mail className="h-4 w-4 shrink-0" /> Email
          </a>
        ) : (
          <span className="inline-flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-slate-500">
            <Mail className="h-4 w-4" /> No email
          </span>
        )}
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-100 transition-colors hover:bg-green-500/20"
          >
            <MessageCircle className="h-4 w-4 shrink-0" /> WhatsApp
          </a>
        ) : null}
      </div>

      <Card className="glass-card border-white/10 overflow-hidden">
        <CardHeader className="border-b border-white/10 pb-4">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-violet-400" /> AI fit vs open vacancies
          </CardTitle>
          <p className="text-xs text-slate-500 font-normal mt-1">
            Same weighted score as Matching Studio, ranked across roles in the system. Open a role to shortlist or compare in context.
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          {fitsLoading ? (
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 animate-pulse text-violet-400" /> Scoring all vacancies…
            </p>
          ) : fitsError ? (
            <p className="text-sm text-amber-200/90">{fitsError}</p>
          ) : vacancyFits.length === 0 ? (
            <p className="text-sm text-slate-500">No jobs found to compare, or roles are not loaded yet.</p>
          ) : (
            <ul className="space-y-2 max-h-[min(420px,50vh)] overflow-y-auto pr-1">
              {vacancyFits.slice(0, 20).map((f) => (
                <li
                  key={f.jobId}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/matches/${f.jobId}?returnUrl=${encodeURIComponent(selfCandidateUrl)}`}
                      className="text-sm font-medium text-white hover:text-blue-300 inline-flex items-center gap-1.5"
                    >
                      {f.title || 'Untitled role'}
                      <ExternalLink className="h-3.5 w-3.5 opacity-50 shrink-0" />
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {[f.clientName, f.location, f.status].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="rounded-lg bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-1 text-sm font-semibold tabular-nums text-emerald-300">
                      {f.score}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2 border border-white/10 rounded-xl p-1 bg-white/[0.02] w-full sm:w-fit">
        <button onClick={() => setActiveTab('profile')} className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-sm min-h-[44px] ${activeTab === 'profile' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Profile</button>
        <button onClick={() => setActiveTab('cv')} className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-sm min-h-[44px] ${activeTab === 'cv' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>CV Data</button>
        <button onClick={() => setActiveTab('ai')} className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-sm min-h-[44px] ${activeTab === 'ai' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>AI Insights</button>
      </div>

      {activeTab === 'profile' && (
        <Card className="glass-card border-white/10">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Candidate Profile</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            <section>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Contact
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 min-w-0">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-1">Email</p>
                  {displayEmail && displayEmail !== 'Not available' ? (
                    <a href={mailHref || undefined} className="text-sm text-blue-300 hover:text-blue-200 break-all underline-offset-2 hover:underline">
                      {displayEmail}
                    </a>
                  ) : (
                    <p className="text-slate-200 text-sm">Not available</p>
                  )}
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 min-w-0">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-1">Phone</p>
                  {phoneRaw ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <a href={telHref} className="text-sm text-emerald-300 hover:text-emerald-200 underline-offset-2 hover:underline">
                        {phoneRaw}
                      </a>
                      {waHref ? (
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] rounded-md border border-green-500/30 px-2 py-0.5 text-green-300/90 hover:bg-green-500/10"
                        >
                          WhatsApp
                        </a>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-slate-200 text-sm">Not available</p>
                  )}
                </div>
                <Info label="Preferred location" value={candidate.preferredLocation || 'Not available'} />
                <Info label="Work setting" value={candidate.workSettingPreference || 'Not available'} />
              </div>
            </section>

            <section>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5" /> Role & experience
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Info label="Current role" value={candidate.currentRole || 'Not available'} />
                <Info label="Total experience" value={`${candidate.totalExperience ?? candidate.experienceYears ?? 0} yrs`} />
                <Info label="Notice period" value={candidate.noticePeriod || 'Not available'} />
                <Info label="Ready to join" value={candidate.isReadyToJoin ? 'Yes' : 'No'} />
              </div>
            </section>

            <section>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                <Banknote className="w-3.5 h-3.5" /> Compensation
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Info label="Expected salary" value={candidate.expectedSalary || 'Not available'} />
                <Info label="Current salary" value={candidate.currentSalary || 'Not available'} />
              </div>
            </section>

            <section>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                <GraduationCap className="w-3.5 h-3.5" /> Education
              </p>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {candidate.education?.trim() ? candidate.education : 'Not extracted — open CV Data tab or re-upload the CV.'}
                </p>
              </div>
            </section>

            <section>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {skills.length ? (
                  skills.map((s: string) => (
                    <span
                      key={s}
                      className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/12 to-violet-500/12 border border-white/10 text-slate-200 text-xs font-medium"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-sm">No skills on record</span>
                )}
              </div>
            </section>

            <section>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> Professional summary (parsed)
              </p>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {candidate.summary?.trim()
                    ? candidate.summary
                    : 'No summary extracted. Past roles may only appear inside the original CV — use CV Data or source file.'}
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      )}

      {activeTab === 'cv' && (
        <CandidateCvResumeDocument
          candidate={candidate}
          displayEmail={displayEmail}
          displayName={displayName}
          skills={skills}
          telHref={telHref}
          mailHref={mailHref}
          waHref={waHref}
        />
      )}

      {activeTab === 'ai' && (
        <Card className="glass-card border-white/10 overflow-hidden">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-blue-400" /> AI Candidate Intelligence</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {candidate.parseNeedsReview && (
              <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> This profile is flagged for manual validation due to low parse confidence.
              </div>
            )}
            <ul className="space-y-4">
              {aiSummary.map((point: string, idx: number) => (
                <motion.li key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-slate-300">
                  <span className="text-blue-300 font-semibold mr-2">{idx + 1}.</span>
                  {point}
                </motion.li>
              ))}
            </ul>
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button className="bg-white/5 hover:bg-white/10 text-white text-sm px-5 py-2 rounded-xl border border-white/10 transition-colors">
                Export Telemetry PDF
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ParsedField({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </p>
      <p className="text-[14px] leading-snug text-slate-100 break-words">{value}</p>
    </div>
  )
}

function StructuredResumeSection({
  title,
  icon,
  text,
  variant,
  emptyHint,
}: {
  title: string
  icon: ReactNode
  text: string
  variant: 'employment' | 'projects'
  emptyHint: string
}) {
  const [yearOrder, setYearOrder] = useState<ResumeSortOrder>('newest-first')
  const rows = sortEntriesForDisplay(text, yearOrder)

  if (!text.trim()) {
    return (
      <ResumeBodySection title={title} icon={icon}>
        <p className="text-sm text-slate-500 italic">{emptyHint}</p>
      </ResumeBodySection>
    )
  }

  const band =
    variant === 'employment'
      ? 'from-amber-950/45 border-amber-500/20 to-slate-950/20'
      : 'from-emerald-950/45 border-emerald-500/20 to-slate-950/20'

  return (
    <ResumeBodySection title={title} icon={icon}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <p className="text-xs text-slate-500">
          <span className="text-slate-400">Year order:</span> by end of period (highest year), then start when tied.
          Secondary sort is place, then name.
        </p>
        <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setYearOrder('newest-first')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              yearOrder === 'newest-first'
                ? variant === 'employment'
                  ? 'bg-amber-500/20 text-amber-100 border border-amber-500/25'
                  : 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownWideNarrow className="h-3.5 w-3.5" />
            Newest first
          </button>
          <button
            type="button"
            onClick={() => setYearOrder('oldest-first')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              yearOrder === 'oldest-first'
                ? variant === 'employment'
                  ? 'bg-amber-500/20 text-amber-100 border border-amber-500/25'
                  : 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpWideNarrow className="h-3.5 w-3.5" />
            Oldest first
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {rows.map(({ parsed, originalIndex }) => (
          <article
            key={`${title}-${originalIndex}`}
            className={`rounded-2xl border bg-gradient-to-br p-5 md:p-6 shadow-md ${band}`}
          >
            <div className="grid gap-6 lg:grid-cols-12 lg:gap-8 lg:items-start">
              <div className="lg:col-span-7 space-y-2 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {variant === 'employment' ? 'Company / project' : 'Project name'}
                </p>
                <h4 className="text-lg md:text-xl font-semibold leading-snug text-white tracking-tight break-words">
                  {parsed.project || '—'}
                </h4>
                <div className="pt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Designation / type
                  </p>
                  <p className="text-base text-violet-200/95 font-medium leading-snug break-words">
                    {parsed.designation || '—'}
                  </p>
                </div>
              </div>
              <div className="lg:col-span-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 border-t border-white/[0.06] pt-4 lg:border-t-0 lg:border-l lg:border-white/[0.06] lg:pt-0 lg:pl-6">
                <ParsedField
                  label="Timeline"
                  icon={<Calendar className="h-3.5 w-3.5 text-slate-500" />}
                  value={parsed.yearLabel}
                />
                <ParsedField
                  label="Place"
                  icon={<MapPinned className="h-3.5 w-3.5 text-slate-500" />}
                  value={parsed.place?.trim() ? parsed.place : '—'}
                />
              </div>
            </div>
            {parsed.detail?.trim() ? (
              <p className="mt-5 whitespace-pre-wrap border-t border-white/[0.06] pt-4 text-sm leading-relaxed text-slate-400">
                {parsed.detail.trim()}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </ResumeBodySection>
  )
}

function CandidateCvResumeDocument({
  candidate,
  displayEmail,
  displayName,
  skills,
  telHref,
  mailHref,
  waHref,
}: {
  candidate: Record<string, unknown>
  displayEmail: string
  displayName: string
  skills: string[]
  telHref: string
  mailHref: string
  waHref: string | null
}) {
  const name = displayName
  const emp = String(candidate.employmentHistory ?? '').trim()
  const proj = String(candidate.projects ?? '').trim()
  const cert = String(candidate.certifications ?? '').trim()
  const langs = Array.isArray(candidate.languages)
    ? (candidate.languages as unknown[]).map(String).filter(Boolean)
    : typeof candidate.languages === 'string'
      ? candidate.languages.split(',').map((s) => s.trim()).filter(Boolean)
      : []
  const summary = String(candidate.summary ?? '').trim()
  const education = String(candidate.education ?? '').trim()
  const linkedIn = String(candidate.linkedInUrl ?? '').trim()
  const role = String(candidate.currentRole ?? '').trim()
  const phone = String(candidate.phone ?? '').trim()
  const location = String(candidate.preferredLocation ?? '').trim()
  const parseIssues = Array.isArray(candidate.parseIssues) ? (candidate.parseIssues as string[]) : []
  const parseSource = candidate.parseSourceFile ? String(candidate.parseSourceFile) : ''
  const parseNeedsReview = Boolean(candidate.parseNeedsReview)

  return (
    <Card className="glass-card border-white/10 overflow-hidden shadow-xl shadow-black/30 ring-1 ring-white/[0.04]">
      <CardHeader className="border-b border-white/10 bg-gradient-to-br from-violet-950/30 via-slate-950/40 to-slate-950/20">
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-violet-400" /> CV — full parsed CV
        </CardTitle>
        <p className="text-xs text-slate-500 font-normal mt-1 max-w-2xl">
          Full document view: sections follow top-to-bottom like a printed CV. Projects and employment appear here when
          stored on the candidate record.
        </p>
      </CardHeader>
      <CardContent className="pt-0 px-0">
        <article className="mx-auto max-w-4xl px-4 py-8 md:px-10 md:py-14 space-y-14 text-slate-200">
          <header className="space-y-5 text-center sm:text-left border-b border-white/10 pb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">CV</p>
            <h2 className="text-3xl md:text-[2rem] font-bold text-white tracking-tight leading-tight">{name}</h2>
            {role ? <p className="text-lg md:text-xl text-slate-300 font-medium">{role}</p> : null}
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              {telHref ? (
                <a
                  href={telHref}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/20 transition-colors"
                >
                  <Phone className="w-4 h-4 shrink-0" /> Call
                </a>
              ) : null}
              {mailHref ? (
                <a
                  href={mailHref}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-100 hover:bg-blue-500/20 transition-colors"
                >
                  <Mail className="w-4 h-4 shrink-0" /> Email
                </a>
              ) : null}
              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm font-medium text-green-100 hover:bg-green-500/20 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" /> WhatsApp
                </a>
              ) : null}
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-x-5 gap-y-2 text-sm text-slate-400">
              {displayEmail && displayEmail !== 'Not available' ? (
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <Mail className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  {mailHref ? (
                    <a href={mailHref} className="break-all text-blue-400 hover:text-blue-300 underline-offset-2 hover:underline">
                      {displayEmail}
                    </a>
                  ) : (
                    <span className="break-all">{displayEmail}</span>
                  )}
                </span>
              ) : null}
              {phone ? (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  {telHref ? (
                    <a href={telHref} className="text-emerald-400 hover:text-emerald-300 underline-offset-2 hover:underline">
                      {phone}
                    </a>
                  ) : (
                    phone
                  )}
                </span>
              ) : null}
              {location ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0 opacity-70" /> {location}
                </span>
              ) : null}
              {linkedIn ? (
                <a
                  href={linkedIn.startsWith('http') ? linkedIn : `https://${linkedIn}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300"
                >
                  <Link2 className="w-3.5 h-3.5 shrink-0" /> LinkedIn profile
                </a>
              ) : null}
            </div>
            <p className="text-xs text-slate-500">
              Experience:{' '}
              <strong className="text-slate-400 font-semibold">
                {Number(candidate.totalExperience ?? candidate.experienceYears ?? 0)}
              </strong>{' '}
              yrs
              {candidate.noticePeriod ? (
                <>
                  {' '}
                  · Notice: <strong className="text-slate-400">{String(candidate.noticePeriod)}</strong>
                </>
              ) : null}
              {candidate.workSettingPreference ? (
                <>
                  {' '}
                  · <strong className="text-slate-400">{String(candidate.workSettingPreference)}</strong>
                </>
              ) : null}
            </p>
          </header>

          {summary ? (
            <ResumeBodySection title="Professional summary" icon={<User className="w-4 h-4 text-violet-400" />}>
              <PortfolioTextBlocks text={summary} accent="violet" />
            </ResumeBodySection>
          ) : null}

          {skills.length > 0 ? (
            <ResumeBodySection title="Skills & competencies" icon={<Layers className="w-4 h-4 text-blue-400" />}>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-500/14 to-violet-500/14 border border-white/10 text-sm text-slate-100 shadow-sm"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </ResumeBodySection>
          ) : null}

          <StructuredResumeSection
            title="Work experience"
            icon={<Briefcase className="w-4 h-4 text-amber-400" />}
            text={emp}
            variant="employment"
            emptyHint="Not stored on this profile yet — re-parse the CV from Candidates or edit the profile to add employment history."
          />

          <StructuredResumeSection
            title="Projects"
            icon={<FolderKanban className="w-4 h-4 text-emerald-400" />}
            text={proj}
            variant="projects"
            emptyHint="No project list on file. If your CV included a project table, re-upload and save so extraction can store it under Projects."
          />

          {education ? (
            <ResumeBodySection title="Education" icon={<GraduationCap className="w-4 h-4 text-cyan-400" />}>
              <PortfolioTextBlocks text={education} accent="violet" />
            </ResumeBodySection>
          ) : null}

          {cert ? (
            <ResumeBodySection title="Certifications & training" icon={<Award className="w-4 h-4 text-amber-400" />}>
              <PortfolioTextBlocks text={cert} accent="amber" />
            </ResumeBodySection>
          ) : null}

          {langs.length > 0 ? (
            <ResumeBodySection title="Languages" icon={<LanguagesIcon className="w-4 h-4 text-sky-400" />}>
              <p className="text-[15px] md:text-base leading-relaxed text-slate-300">{langs.join(' · ')}</p>
            </ResumeBodySection>
          ) : null}

          {!summary && !emp && !proj && !education && !cert && langs.length === 0 && skills.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-6">
              No long-form sections found yet. Re-upload or re-parse the CV to populate employment, projects, and
              summary.
            </p>
          ) : null}

          <footer className="border-t border-white/10 pt-10 space-y-2 text-[11px] text-slate-600">
            <p>
              <span className="font-semibold text-slate-500">Source file:</span> {parseSource || '—'}
            </p>
            {parseIssues.length > 0 ? (
              <p>
                <span className="font-semibold text-slate-500">Parse notes:</span> {parseIssues.join('; ')}
              </p>
            ) : null}
            {parseNeedsReview ? <p className="text-amber-600/90">Flagged for manual review.</p> : null}
          </footer>
        </article>
      </CardContent>
    </Card>
  )
}

function ResumeBodySection({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 md:p-7 shadow-inner">
      <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
        {icon}
        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{title}</h3>
      </div>
      <div>{children}</div>
    </section>
  )
}

function splitIntoResumeBlocks(text: string): string[] {
  const t = text.trim()
  if (!t) return []
  const byPara = t
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (byPara.length > 1) return byPara
  const lines = t.split('\n')
  const chunks: string[] = []
  let buf: string[] = []
  for (const line of lines) {
    const tr = line.trim()
    if (!tr) {
      if (buf.length) {
        chunks.push(buf.join('\n'))
        buf = []
      }
      continue
    }
    buf.push(line)
  }
  if (buf.length) chunks.push(buf.join('\n'))
  if (chunks.length) return chunks
  return [t]
}

function PortfolioTextBlocks({
  text,
  accent,
}: {
  text: string
  accent: 'emerald' | 'amber' | 'violet'
}) {
  const blocks = splitIntoResumeBlocks(text)
  const wrap =
    accent === 'emerald'
      ? 'border-emerald-500/20 from-emerald-950/35 to-slate-950/15'
      : accent === 'amber'
        ? 'border-amber-500/20 from-amber-950/28 to-slate-950/10'
        : 'border-violet-500/20 from-violet-950/30 to-slate-950/15'
  if (blocks.length === 0) return null
  return (
    <div className={`space-y-3 rounded-2xl border bg-gradient-to-br p-4 md:p-5 ${wrap}`}>
      {blocks.map((block, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-3.5 text-[15px] md:text-base leading-[1.65] text-slate-300 shadow-sm whitespace-pre-wrap"
        >
          {block}
        </div>
      ))}
    </div>
  )
}

/** Best-effort WhatsApp deep link; 10-digit local numbers default to India (+91). */
function whatsappHrefFromPhone(phone: string | undefined | null): string | null {
  if (!phone?.trim()) return null
  const d = phone.replace(/\D/g, '')
  if (d.length < 10) return null
  const n = d.length === 10 ? `91${d}` : d
  return `https://wa.me/${n}`
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 min-w-0">
      <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-1">{label}</p>
      <p className="text-slate-200 text-sm break-words">{value}</p>
    </div>
  )
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
        {icon}
      </div>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  )
}
