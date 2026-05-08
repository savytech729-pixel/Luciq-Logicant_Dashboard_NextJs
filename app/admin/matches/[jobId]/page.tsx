'use client'

import { useEffect, useState, useRef, type FormEvent } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  ArrowLeft, BrainCircuit, Phone, CheckCircle2, XCircle,
  Mail, MessageSquare, Loader2, Info, ChevronRight, Zap, Target,
  Clock, MapPin, Banknote, Briefcase, GraduationCap, AlertTriangle,
  Pencil, Upload, ExternalLink,
} from 'lucide-react'

import { useTalent } from '@/lib/hooks/useTalent'
import { PageHero, SurfaceCard } from '@/components/dashboard/Premium'

export default function JobMatches() {
  const { jobId } = useParams()
  const resolvedJobId = Array.isArray(jobId) ? jobId[0] : jobId
  const { getMatches, loading: initialLoading } = useTalent()
  const [matches, setMatches] = useState<any[]>([])
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [matchMode, setMatchMode] = useState<'ai' | 'manual'>('ai')
  const [manualCandidates, setManualCandidates] = useState<any[]>([])
  const [manualSearch, setManualSearch] = useState('')
  const [minAiScore, setMinAiScore] = useState(0)
  const [manualSelectedIds, setManualSelectedIds] = useState<string[]>([])
  
  // Invite Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteTemplate, setInviteTemplate] = useState<any>(null)
  const [inviteLoading, setInviteLoading] = useState(false)

  // Hire Modal State
  const [isHireOpen, setIsHireOpen] = useState(false)
  const [hiringCandidate, setHiringCandidate] = useState<any>(null)
  const [hireDetails, setHireDetails] = useState({
    baseSalary: '',
    feePercentage: '15',
    hireDate: new Date().toISOString().split('T')[0]
  })
  const [hireLoading, setHireLoading] = useState(false)

  const uploadInputRef = useRef<HTMLInputElement>(null)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [uploadNotice, setUploadNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const [jobStatusSaving, setJobStatusSaving] = useState(false)
  const [jobEditOpen, setJobEditOpen] = useState(false)
  const [jobSaving, setJobSaving] = useState(false)
  const [autoShortlistRunning, setAutoShortlistRunning] = useState(false)
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    requiredSkills: '',
    experienceRequired: '',
    location: '',
    status: 'Active',
    salaryRange: '',
  })

  const fetchMatches = async () => {
    if (!resolvedJobId) return
    const data = await getMatches(resolvedJobId)
    if (data) {
      setMatches(data.matchedCandidates || [])
      setJob(data.job)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMatches()
    fetch('/api/admin/candidates')
      .then((r) => r.json())
      .then((d) => setManualCandidates(d.candidates || []))
      .catch(() => null)
  }, [resolvedJobId])

  useEffect(() => {
    if (!resolvedJobId) return
    let mounted = true
    const runAutoShortlist = async () => {
      setAutoShortlistRunning(true)
      try {
        await fetch('/api/admin/pipeline/auto-shortlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: resolvedJobId }),
        })
        if (mounted) {
          await fetchMatches()
        }
      } catch {
        // non-blocking
      } finally {
        if (mounted) setAutoShortlistRunning(false)
      }
    }
    runAutoShortlist()
    return () => {
      mounted = false
    }
  }, [resolvedJobId])

  useEffect(() => {
    setManualSelectedIds([])
  }, [matchMode])

  useEffect(() => {
    if (!jobEditOpen || !job) return
    setJobForm({
      title: job.title || '',
      description: job.description || '',
      requiredSkills: Array.isArray(job.requiredSkills) ? job.requiredSkills.join(', ') : '',
      experienceRequired: String(job.experienceRequired ?? ''),
      location: job.location || '',
      status: job.status || 'Active',
      salaryRange: job.salaryRange || '',
    })
  }, [jobEditOpen, job])

  const patchJobStatus = async (status: string) => {
    if (!resolvedJobId) return
    setJobStatusSaving(true)
    try {
      const res = await fetch(`/api/admin/jobs/${resolvedJobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (res.ok && data.job) {
        setJob(data.job)
        fetchMatches()
      }
    } finally {
      setJobStatusSaving(false)
    }
  }

  const saveJobEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!resolvedJobId) return
    setJobSaving(true)
    try {
      const res = await fetch(`/api/admin/jobs/${resolvedJobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: jobForm.title,
          description: jobForm.description,
          requiredSkills: jobForm.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
          experienceRequired: Number(jobForm.experienceRequired),
          location: jobForm.location,
          status: jobForm.status,
          salaryRange: jobForm.salaryRange || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setJob(data.job)
      setJobEditOpen(false)
      fetchMatches()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setJobSaving(false)
    }
  }

  const handleUploadCv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (e.target) e.target.value = ''
    if (!file || !resolvedJobId) return
    setUploadBusy(true)
    setUploadNotice(null)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result || ''))
        r.onerror = () => reject(new Error('Could not read file'))
        r.readAsDataURL(file)
      })
      const comma = dataUrl.indexOf(',')
      const header = dataUrl.slice(0, comma)
      const base64 = dataUrl.slice(comma + 1)
      const mimeType = header.split(':')[1]?.split(';')[0] || 'application/pdf'

      const res = await fetch('/api/admin/candidates/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileData: { base64, mimeType },
        }),
      })
      const screenData = await res.json()
      if (!res.ok) throw new Error(screenData.error || screenData.message || screenData.details || 'Screen failed')
      const cand = screenData.candidate
      if (!cand) throw new Error('No candidate extracted from file')

      const skillsPayload = Array.isArray(cand.skills)
        ? cand.skills
        : String(cand.skills || '')
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)

      const saveRes = await fetch('/api/admin/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cand,
          skills: skillsPayload,
          intakeJobId: resolvedJobId,
        }),
      })
      const saveData = await saveRes.json()
      if (!saveRes.ok) throw new Error(saveData.error || 'Could not save candidate')

      setUploadNotice({ ok: true, text: `${cand.name || 'Candidate'} added and linked to this vacancy.` })
      await fetchMatches()
      const mc = await fetch('/api/admin/candidates').then((r) => r.json())
      setManualCandidates(mc.candidates || [])
    } catch (err: unknown) {
      setUploadNotice({ ok: false, text: err instanceof Error ? err.message : 'Upload failed' })
    } finally {
      setUploadBusy(false)
    }
  }

  const handleInvite = async (candidateId: string, channel: 'email' | 'whatsapp') => {
    setIsInviteOpen(true)
    setInviteLoading(true)
    setInviteTemplate(null)
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, jobId, channel })
      })
      const data = await res.json()
      if (res.ok) {
        setInviteTemplate(data.template)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setInviteLoading(false)
    }
  }

  const handleHire = async () => {
    if (!hiringCandidate) return
    setHireLoading(true)
    try {
      const res = await fetch('/api/admin/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: hiringCandidate.id,
          jobId: resolvedJobId,
          clientId: job.clientId, // If available
          candidateName: hiringCandidate.name,
          jobTitle: job.title,
          clientName: job.clientName,
          ...hireDetails
        })
      })
      if (res.ok) {
        setIsHireOpen(false)
        fetchMatches() // Refresh list (job will mark closed)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to record placement')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setHireLoading(false)
    }
  }

  const updateStatus = async (candidateId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/pipeline/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: resolvedJobId, candidateId, status })
      })
      if (res.ok) {
        setMatches(prev => prev.map(m => m.id === candidateId ? { ...m, pipelineStatus: status } : m))
        if (!matches.some((m) => m.id === candidateId)) {
          fetchMatches()
        }
      }
    } catch (err) {
      console.error('Pipeline update failed', err)
    }
  }

  const bulkUpdateStatus = async (candidateIds: string[], status: string) => {
    if (candidateIds.length === 0) return
    try {
      const results = await Promise.all(
        candidateIds.map((candidateId) =>
          fetch('/api/admin/pipeline/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId: resolvedJobId, candidateId, status })
          })
        )
      )
      if (results.every((r) => r.ok)) {
        setMatches((prev) =>
          prev.map((m) => (candidateIds.includes(m.id) ? { ...m, pipelineStatus: status } : m))
        )
        setManualSelectedIds((ids) => ids.filter((id) => !candidateIds.includes(id)))
        await fetchMatches()
      }
    } catch (err) {
      console.error('Bulk pipeline update failed', err)
    }
  }

  /** DB match % for this vacancy; NaN-safe. */
  const effectiveMatchScore = (c: { score?: unknown }) => {
    const n = Number(c?.score)
    return Number.isFinite(n) ? n : 0
  }

  const filteredAiMatches = matches.filter((candidate) => effectiveMatchScore(candidate) >= minAiScore)
  const selectedCount = matches.filter((candidate) => candidate.pipelineStatus === 'SELECTED').length
  const rejectedCount = matches.filter((candidate) => candidate.pipelineStatus === 'REJECTED').length
  /** REVEALED/NEW = not yet actioned; only real stages go to the shortlist queue. */
  const manualQueueStatuses = new Set(['SCREENING', 'SHORTLISTED', 'SELECTED', 'REJECTED'])
  const manualShortlist = matches.filter((candidate) => manualQueueStatuses.has(String(candidate.pipelineStatus || '')))
  const filteredManualCandidates = manualCandidates.filter((candidate) => {
    if (!manualSearch.trim()) return true
    const q = manualSearch.toLowerCase()
    return String(candidate.name || '').toLowerCase().includes(q) || String(candidate.currentRole || '').toLowerCase().includes(q)
  })
  const pipelineByCandidateId = new Map(matches.map((candidate) => [candidate.id, candidate.pipelineStatus || 'REVEALED']))
  const shortlistIdSet = new Set(manualShortlist.map((candidate) => candidate.id))
  const availableManualCandidates = filteredManualCandidates.filter((candidate) => !shortlistIdSet.has(candidate.id))
  const visibleManualIds = availableManualCandidates.map((c) => c.id)
  const allVisibleManualSelected =
    visibleManualIds.length > 0 && visibleManualIds.every((id) => manualSelectedIds.includes(id))

  const candidateProfileHref = (candidateId: string) =>
    resolvedJobId
      ? `/admin/candidates/${candidateId}?returnUrl=${encodeURIComponent(`/admin/matches/${resolvedJobId}`)}`
      : `/admin/candidates/${candidateId}`

  if (loading || initialLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <BrainCircuit className="h-8 w-8 text-blue-500 animate-pulse" />
      <p className="text-slate-400">Analyzing candidate matches...</p>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center space-x-4 mb-4">
           <Link href="/admin/jobs">
            <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group">
              <ArrowLeft className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </Link>
        </div>
        <PageHero
          eyebrow="Matching Studio"
          title={job?.title || 'Applicant Tracking'}
          description={
            matchMode === 'ai'
              ? `${matches.length} candidates ranked · ${filteredAiMatches.length} visible at ≥${minAiScore}% · Selected ${selectedCount} · Rejected ${rejectedCount}`
              : `${matches.length} candidates in database for ranking · Selected ${selectedCount} · Rejected ${rejectedCount}`
          }
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SurfaceCard className="p-4">
          <p className="text-[11px] uppercase tracking-widest text-slate-500">Matched</p>
          <p className="text-2xl font-bold text-white mt-1">{matches.length}</p>
        </SurfaceCard>
        <SurfaceCard className="p-4">
          <p className="text-[11px] uppercase tracking-widest text-slate-500">Screening</p>
          <p className="text-2xl font-bold text-blue-300 mt-1">{matches.filter((c) => c.pipelineStatus === 'SCREENING').length}</p>
        </SurfaceCard>
        <SurfaceCard className="p-4">
          <p className="text-[11px] uppercase tracking-widest text-slate-500">Shortlisted</p>
          <p className="text-2xl font-bold text-amber-300 mt-1">{matches.filter((c) => c.pipelineStatus === 'SHORTLISTED').length}</p>
        </SurfaceCard>
        <SurfaceCard className="p-4">
          <p className="text-[11px] uppercase tracking-widest text-slate-500">Selected</p>
          <p className="text-2xl font-bold text-emerald-300 mt-1">{selectedCount}</p>
        </SurfaceCard>
      </div>
      {autoShortlistRunning && (
        <p className="text-xs text-slate-500">Running AI auto-shortlist (50%+ match)…</p>
      )}

      {job && (
        <SurfaceCard className="p-5 border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">This vacancy</p>
              <h2 className="text-xl font-bold text-white mt-1 tracking-tight">{job.title}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                    job.status === 'Active'
                      ? 'border-emerald-500/35 text-emerald-300 bg-emerald-500/10'
                      : job.status === 'On Hold'
                        ? 'border-amber-500/35 text-amber-300 bg-amber-500/10'
                        : 'border-white/15 text-slate-400 bg-white/[0.03]'
                  }`}
                >
                  {job.status || 'Active'}
                </span>
                {job.clientName && (
                  <span className="text-xs text-slate-400">{job.clientName}</span>
                )}
                {job.department && (
                  <span className="text-xs text-slate-500">· {job.department}</span>
                )}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 max-h-52 overflow-y-auto">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Description</p>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {job.description?.trim() ? job.description : 'No description on file.'}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
            <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
              <p className="text-[9px] uppercase tracking-widest text-slate-500">Experience bar</p>
              <p className="text-slate-200 font-semibold mt-0.5">{job.experienceRequired ?? '—'}+ yrs</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
              <p className="text-[9px] uppercase tracking-widest text-slate-500">Location</p>
              <p className="text-slate-200 font-semibold mt-0.5 truncate">{job.location || '—'}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
              <p className="text-[9px] uppercase tracking-widest text-slate-500">Work mode</p>
              <p className="text-slate-200 font-semibold mt-0.5">{job.workSetting || '—'}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
              <p className="text-[9px] uppercase tracking-widest text-slate-500">Salary</p>
              <p className="text-slate-200 font-semibold mt-0.5 truncate">{job.salaryRange || '—'}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Required skills</p>
            <div className="flex flex-wrap gap-1.5">
              {(Array.isArray(job.requiredSkills) ? job.requiredSkills : []).length ? (
                (job.requiredSkills as string[]).map((s: string) => (
                  <span
                    key={s}
                    className="px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/25 text-[11px] text-blue-200"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">None listed</span>
              )}
            </div>
          </div>
        </SurfaceCard>
      )}

      <input
        ref={uploadInputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf"
        className="hidden"
        onChange={handleUploadCv}
      />

      <SurfaceCard className="p-4 border-white/10 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Listing status</span>
            <select
              value={job?.status || 'Active'}
              disabled={jobStatusSaving || !job}
              onChange={(e) => patchJobStatus(e.target.value)}
              className="bg-white/[0.06] border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 disabled:opacity-50"
            >
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Closed">Closed</option>
            </select>
            <button
              type="button"
              onClick={() => setJobEditOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 text-xs font-semibold text-slate-200 hover:bg-white/[0.06]"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit vacancy
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={uploadBusy}
              onClick={() => uploadInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold"
            >
              {uploadBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploadBusy ? 'Processing…' : 'Upload CV for this vacancy'}
            </button>
            <Link
              href="/admin/candidates"
              className="px-3 py-2 rounded-xl border border-white/10 text-xs text-slate-400 hover:text-white"
            >
              Talent pool
            </Link>
          </div>
        </div>
        {uploadNotice && (
          <p className={`text-xs ${uploadNotice.ok ? 'text-emerald-400' : 'text-red-400'}`}>{uploadNotice.text}</p>
        )}
      </SurfaceCard>

      {/* Matches Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button onClick={() => setMatchMode('ai')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${matchMode === 'ai' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>AI Match</button>
            <button onClick={() => setMatchMode('manual')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${matchMode === 'manual' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Manual Match</button>
          </div>
          {matchMode === 'ai' && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-slate-300">
                <span>Min job match % (this vacancy):</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={minAiScore}
                    onChange={(e) => setMinAiScore(Number(e.target.value))}
                    className="w-32 sm:w-40"
                  />
                  <span className="font-bold text-white tabular-nums w-8">{minAiScore}</span>
                  <button
                    type="button"
                    onClick={() => setMinAiScore(0)}
                    className="text-[10px] uppercase tracking-widest text-blue-400 hover:text-blue-300"
                  >
                    Reset
                  </button>
                </div>
              </div>
              {matches.length > 0 && (
                <span className="text-[11px] text-slate-500">
                  Showing <strong className="text-slate-300">{filteredAiMatches.length}</strong> of {matches.length}
                </span>
              )}
            </div>
          )}
          {matchMode === 'manual' && (
            <input
              value={manualSearch}
              onChange={(e) => setManualSearch(e.target.value)}
              placeholder="Search candidate in database..."
              className="bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none min-w-[320px]"
            />
          )}
        </div>

        {matchMode === 'ai' && filteredAiMatches.length === 0 ? (
          <Card className="glass-card text-center py-16 px-6 bg-white/[0.01] border-dashed space-y-3">
            {matches.length === 0 ? (
              <p className="text-slate-500 font-medium">No candidates in the database yet. Use <strong className="text-slate-300">Upload CV for this vacancy</strong> above, or add profiles from the talent pool.</p>
            ) : (
              <>
                <p className="text-slate-400 font-medium">
                  {matches.length} candidate{matches.length === 1 ? '' : 's'} ranked for this job, but none meet the current minimum score ({minAiScore}%+).
                </p>
                <p className="text-xs text-slate-500">Scores use skills, experience, title fit, location, and notice — weak overlap can fall below the threshold.</p>
                <button
                  type="button"
                  onClick={() => setMinAiScore(0)}
                  className="mt-2 px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-sm font-semibold text-blue-200 hover:bg-blue-600/30"
                >
                  Show all {matches.length} (set filter to 0%)
                </button>
              </>
            )}
          </Card>
        ) : matchMode === 'ai' ? (
          filteredAiMatches.map((candidate, index) => {
            const skills = Array.isArray(candidate.skills) ? candidate.skills : []
            const breakdown = candidate.matchBreakdown || {}

            return (
              <motion.div 
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-card border-white/5 overflow-hidden group hover:border-blue-500/30 transition-all">
                  <div className="flex flex-col lg:flex-row">
                    
                    {/* Left Rank & Basic Info */}
                    <div className="flex-1 p-6 flex items-start gap-6 border-b lg:border-b-0 lg:border-r border-white/5 bg-white/[0.01]">
                       <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-500 font-black text-2xl group-hover:scale-110 transition-transform">
                          #{index + 1}
                       </div>
                       <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                                {candidate.name}
                              </h3>
                              <p className="text-sm text-slate-400 font-medium">{candidate.currentRole} • {candidate.totalExperience || candidate.experienceYears} Years Exp</p>
                            </div>
                            <Link
                              href={candidateProfileHref(candidate.id)}
                              className="inline-flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl border border-blue-500/35 text-[11px] font-black uppercase tracking-widest text-blue-300 hover:bg-blue-500/10"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Full profile
                            </Link>
                          </div>
                          
                          {/* Expanded Contact & Logistics Dossier */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-4">
                             <DetailItem icon={<Mail className="w-3 h-3" />} label="Email" value={candidate.email || 'N/A'} />
                             <DetailItem icon={<Phone className="w-3 h-3" />} label="Phone" value={candidate.phone || 'N/A'} />
                             <DetailItem icon={<MapPin className="w-3 h-3" />} label="Location" value={candidate.preferredLocation || candidate.currentCity || 'N/A'} />
                             <DetailItem icon={<Clock className="w-3 h-3" />} label="Notice" value={candidate.noticePeriod || 'Immediate'} />
                             <DetailItem icon={<Banknote className="w-3 h-3" />} label="Expected" value={candidate.expectedSalary ? `₹${candidate.expectedSalary}` : 'N/A'} color="emerald" />
                             <DetailItem icon={<Zap className="w-3 h-3" />} label="Status" value={candidate.isReadyToJoin ? 'Join Ready' : 'Serving Notice'} color="amber" />
                             {(candidate.education || '').trim() ? (
                               <div className="sm:col-span-2">
                                 <DetailItem
                                   icon={<GraduationCap className="w-3 h-3" />}
                                   label="Education"
                                   value={
                                     String(candidate.education).length > 280
                                       ? `${String(candidate.education).slice(0, 280)}…`
                                       : String(candidate.education)
                                   }
                                 />
                               </div>
                             ) : (
                               <div className="sm:col-span-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-[10px] text-slate-500">
                                 Education not on profile — open candidate profile to add or re-parse CV.
                               </div>
                             )}
                          </div>

                          <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-white/5">
                             {skills.slice(0, 12).map((skill: string) => (
                               <span key={skill} className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-wider max-w-[min(100%,14rem)] truncate" title={skill}>
                                 {skill}
                               </span>
                             ))}
                             {skills.length > 12 && <span className="text-[10px] text-slate-600">+{skills.length - 12} more</span>}
                          </div>
                       </div>
                    </div>

                    {/* Middle: Match Breakdown Visualization */}
                    <div className="w-full lg:w-[400px] p-6 space-y-4">
                       <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="text-xs font-black uppercase tracking-widest text-slate-200">Match Score</span>
                          </div>
                          <span className="text-2xl font-black text-white">{candidate.score}%</span>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <BreakdownItem label="Skills" score={breakdown.skills} icon={<Briefcase className="w-3 h-3" />} />
                          <BreakdownItem label="Experience" score={breakdown.experience} icon={<Target className="w-3 h-3" />} />
                          <BreakdownItem label="Role fit" score={breakdown.roleAlignment} icon={<BrainCircuit className="w-3 h-3" />} />
                          <BreakdownItem label="Education" score={breakdown.education} icon={<Info className="w-3 h-3" />} />
                       </div>
                       <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-slate-500">
                          <span>Location · {breakdown.location ?? '—'}%</span>
                          <span>Notice · {breakdown.logistics ?? '—'}%</span>
                       </div>

                       {candidate.matchReasons && (
                         <div className="space-y-3 pt-4 border-t border-white/10">
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                             <BrainCircuit className="w-3.5 h-3.5 text-violet-400" /> Why this match
                           </p>
                           <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] p-3 space-y-2">
                             <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400/90">Strong fit</p>
                             <ul className="space-y-1.5 text-[11px] text-slate-300 leading-snug">
                               {(candidate.matchReasons.strengths || []).map((line: string, i: number) => (
                                 <li key={`s-${i}`} className="flex gap-2">
                                   <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                   <span>{line}</span>
                                 </li>
                               ))}
                             </ul>
                           </div>
                           <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 space-y-2">
                             <p className="text-[9px] font-black uppercase tracking-widest text-amber-400/90 flex items-center gap-1">
                               <AlertTriangle className="w-3 h-3" /> Watch outs
                             </p>
                             <ul className="space-y-1.5 text-[11px] text-slate-300 leading-snug">
                               {(candidate.matchReasons.gaps || []).map((line: string, i: number) => (
                                 <li key={`g-${i}`} className="flex gap-2">
                                   <XCircle className="w-3.5 h-3.5 text-amber-500/90 shrink-0 mt-0.5" />
                                   <span>{line}</span>
                                 </li>
                               ))}
                             </ul>
                           </div>
                         </div>
                       )}
                    </div>

                    {/* Right: Quick Actions */}
                    <div className="w-full lg:w-[280px] p-6 flex flex-col justify-between bg-white/[0.02]">
                       <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Contact Candidate</p>
                          <div className="grid grid-cols-2 gap-2">
                             <button 
                               onClick={() => handleInvite(candidate.id, 'whatsapp')}
                               className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 transition-all hover:scale-105"
                             >
                                <MessageSquare className="w-5 h-5 mb-1" />
                                <span className="text-[10px] font-bold">WhatsApp</span>
                             </button>
                             <button 
                               onClick={() => handleInvite(candidate.id, 'email')}
                               className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 transition-all hover:scale-105"
                             >
                                <Mail className="w-5 h-5 mb-1" />
                                <span className="text-[10px] font-bold">Email</span>
                             </button>
                          </div>
                       </div>
                       
                       <div className="mt-4 flex flex-col gap-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Pipeline Stage</p>
                          <div className="grid grid-cols-2 gap-2">
                             <StageButton 
                               label="Screen" 
                               active={candidate.pipelineStatus === 'SCREENING'} 
                              current={candidate.pipelineStatus}
                               onClick={() => updateStatus(candidate.id, 'SCREENING')} 
                               color="blue"
                             />
                             <StageButton 
                               label="Shortlist" 
                               active={candidate.pipelineStatus === 'SHORTLISTED'} 
                              current={candidate.pipelineStatus}
                               onClick={() => updateStatus(candidate.id, 'SHORTLISTED')} 
                               color="amber"
                             />
                             <StageButton 
                               label="Select" 
                               active={candidate.pipelineStatus === 'SELECTED'} 
                              current={candidate.pipelineStatus}
                               onClick={() => updateStatus(candidate.id, 'SELECTED')} 
                               color="emerald"
                             />
                             <StageButton 
                               label="Reject" 
                               active={candidate.pipelineStatus === 'REJECTED'} 
                              current={candidate.pipelineStatus}
                               onClick={() => updateStatus(candidate.id, 'REJECTED')} 
                               color="red"
                             />
                          </div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Current: {candidate.pipelineStatus || 'NEW'}</p>
                          
                          <div className="h-px bg-white/5 my-2" />

                          <div className="flex gap-2">
                             <button 
                               onClick={() => {
                                 setHiringCandidate(candidate)
                                 setHireDetails(prev => ({ ...prev, baseSalary: candidate.expectedSalary?.replace(/[^0-9.]/g, '') || '' }))
                                 setIsHireOpen(true)
                               }}
                               className="flex-1 py-1.5 rounded bg-emerald-600/20 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 hover:bg-emerald-600/30 transition-colors uppercase tracking-widest"
                             >
                               Hire Now
                             </button>
                             <Link href={candidateProfileHref(candidate.id)} className="flex-1">
                               <button type="button" className="w-full py-1.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 hover:bg-white/10 transition-colors uppercase tracking-widest">
                                 Full profile
                               </button>
                             </Link>
                          </div>
                       </div>
                    </div>

                  </div>
                </Card>
              </motion.div>
            )
          })
        ) : (
          <div className="space-y-4">
            <SurfaceCard className="p-4 border-white/10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-widest text-slate-500">In pipeline (screened, shortlisted, selected, or rejected)</p>
                <p className="text-xs text-slate-400">{manualShortlist.length} in queue</p>
              </div>
              {manualShortlist.length === 0 ? (
                <p className="text-xs text-slate-500">No candidates in an active stage yet. Use Shortlist or the bulk actions below.</p>
              ) : (
                <div className="grid gap-2">
                  {manualShortlist.map((candidate) => (
                    <div key={`shortlist-${candidate.id}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{candidate.name}</p>
                        <p className="text-xs text-slate-400 truncate">{candidate.currentRole || 'Candidate'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-widest border border-blue-500/30 text-blue-300">
                          {candidate.pipelineStatus || 'REVEALED'}
                        </span>
                        <button onClick={() => updateStatus(candidate.id, 'SELECTED')} className="px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs">
                          Select
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SurfaceCard>

            {availableManualCandidates.length > 0 && (
              <SurfaceCard className="p-4 border-white/10 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-white/20"
                    checked={allVisibleManualSelected}
                    onChange={() => {
                      if (allVisibleManualSelected) {
                        setManualSelectedIds((prev) => prev.filter((id) => !visibleManualIds.includes(id)))
                      } else {
                        setManualSelectedIds((prev) => [...new Set([...prev, ...visibleManualIds])])
                      }
                    }}
                  />
                  Select all ({visibleManualIds.length})
                </label>
                <span className="text-[11px] text-slate-500">{manualSelectedIds.length} selected</span>
                <div className="flex flex-wrap gap-2 ml-auto">
                  <button
                    type="button"
                    disabled={manualSelectedIds.length === 0}
                    onClick={() => bulkUpdateStatus(manualSelectedIds, 'SCREENING')}
                    className="px-3 py-1.5 rounded-lg border border-blue-500/35 text-[11px] font-semibold text-blue-300 disabled:opacity-40"
                  >
                    Screen selected
                  </button>
                  <button
                    type="button"
                    disabled={manualSelectedIds.length === 0}
                    onClick={() => bulkUpdateStatus(manualSelectedIds, 'SHORTLISTED')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-[11px] font-semibold text-white disabled:opacity-40"
                  >
                    Shortlist selected
                  </button>
                  <button
                    type="button"
                    disabled={manualSelectedIds.length === 0}
                    onClick={() => bulkUpdateStatus(manualSelectedIds, 'SELECTED')}
                    className="px-3 py-1.5 rounded-lg border border-emerald-500/35 text-[11px] font-semibold text-emerald-300 disabled:opacity-40"
                  >
                    Select selected
                  </button>
                  <button
                    type="button"
                    disabled={manualSelectedIds.length === 0}
                    onClick={() => bulkUpdateStatus(manualSelectedIds, 'REJECTED')}
                    className="px-3 py-1.5 rounded-lg border border-red-500/35 text-[11px] font-semibold text-red-300 disabled:opacity-40"
                  >
                    Reject selected
                  </button>
                </div>
              </SurfaceCard>
            )}

            <div className="grid gap-3">
              {availableManualCandidates.map((candidate) => {
                const status = pipelineByCandidateId.get(candidate.id) || 'REVEALED'
                const checked = manualSelectedIds.includes(candidate.id)
                return (
                  <Card key={candidate.id} className="glass-card border-white/10 hover:border-blue-500/30 transition-all">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            className="mt-1 rounded border-white/20 shrink-0"
                            checked={checked}
                            onChange={(e) => {
                              setManualSelectedIds((prev) =>
                                e.target.checked ? [...prev, candidate.id] : prev.filter((id) => id !== candidate.id)
                              )
                            }}
                          />
                          <div className="min-w-0">
                          <p className="font-semibold text-white text-lg truncate">{candidate.name}</p>
                          <p className="text-xs text-slate-400 truncate">
                            {candidate.currentRole || 'Candidate'} · {candidate.totalExperience || candidate.experienceYears || 0} yrs · {candidate.preferredLocation || 'Location N/A'}
                          </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap md:pl-2">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-widest border border-white/15 text-slate-300">
                            {status}
                          </span>
                          <Link href={candidateProfileHref(candidate.id)}>
                            <button type="button" className="px-3 py-2 rounded-xl border border-white/10 text-xs text-slate-300 hover:text-white">Full profile</button>
                          </Link>
                          <button type="button" onClick={() => updateStatus(candidate.id, 'SCREENING')} className="px-3 py-2 rounded-xl border border-blue-500/30 text-xs text-blue-300">Screen</button>
                          <button type="button" onClick={() => updateStatus(candidate.id, 'SHORTLISTED')} className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs text-white font-semibold">Shortlist</button>
                          <button type="button" onClick={() => updateStatus(candidate.id, 'SELECTED')} className="px-3 py-2 rounded-xl border border-emerald-500/35 text-xs text-emerald-300">Select</button>
                          <button type="button" onClick={() => updateStatus(candidate.id, 'REJECTED')} className="px-3 py-2 rounded-xl border border-red-500/30 text-xs text-red-300">Reject</button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {availableManualCandidates.length === 0 && (
                <SurfaceCard className="p-4 border-white/10">
                  <p className="text-xs text-slate-500">
                    {manualCandidates.length === 0
                      ? 'No candidates in the database — upload CVs under Candidates.'
                      : filteredManualCandidates.length === 0
                        ? 'No candidates match this search.'
                        : 'Everyone is already in the pipeline section above, or adjust your search.'}
                  </p>
                </SurfaceCard>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Invite Preview Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
         <DialogContent className="glass-card border border-white/10 text-white sm:max-w-xl">
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-blue-400" />
                  Outreach Preview
               </DialogTitle>
            </DialogHeader>
            
            <AnimatePresence mode="wait">
              {inviteLoading ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="py-12 flex flex-col items-center space-y-4"
                >
                   <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                   <p className="text-sm text-slate-400">Generating personalized template based on AI match...</p>
                </motion.div>
              ) : inviteTemplate ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 pt-4"
                >
                   <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                         <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Target</span>
                         <span className="text-xs text-blue-400 font-bold">{inviteTemplate.target}</span>
                      </div>
                      <div className="space-y-2">
                         <h4 className="text-sm font-bold text-white">{inviteTemplate.title}</h4>
                         <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{inviteTemplate.message}</p>
                      </div>
                   </div>
                   
                   <div className="flex gap-3">
                     <button 
                        onClick={() => setIsInviteOpen(false)}
                        className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 font-bold hover:bg-white/5 transition-colors"
                     >
                        Cancel
                     </button>
                     <a 
                        href={inviteTemplate.actionUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={() => setIsInviteOpen(false)}
                        className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-center transition-all flex items-center justify-center gap-2"
                     >
                        <Zap className="w-4 h-4" /> Send Invite
                     </a>
                   </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
         </DialogContent>
      </Dialog>

      {/* Confirm Hire Modal */}
      <Dialog open={isHireOpen} onOpenChange={setIsHireOpen}>
         <DialogContent className="glass-card border border-white/10 text-white sm:max-w-md">
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Confirm Hiring
               </DialogTitle>
            </DialogHeader>
            
            {hiringCandidate && (
              <div className="space-y-6 pt-4">
                 <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Hiring Candidate</p>
                    <p className="text-lg font-bold text-white">{hiringCandidate.name}</p>
                    <p className="text-sm text-slate-400">for {job?.title}</p>
                 </div>

                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1.5">Base Salary ($)</label>
                        <input 
                          type="number" 
                          value={hireDetails.baseSalary}
                          onChange={e => setHireDetails({...hireDetails, baseSalary: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1.5">Agency Fee (%)</label>
                        <input 
                          type="number" 
                          value={hireDetails.feePercentage}
                          onChange={e => setHireDetails({...hireDetails, feePercentage: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1.5">Official Hire Date</label>
                        <input 
                          type="date" 
                          value={hireDetails.hireDate}
                          onChange={e => setHireDetails({...hireDetails, hireDate: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                 </div>

                 <div className="flex gap-3 pt-4 border-t border-white/5">
                    <button 
                      onClick={() => setIsHireOpen(false)}
                      className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 font-bold hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleHire}
                      disabled={hireLoading}
                      className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center"
                    >
                      {hireLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Hire'}
                    </button>
                 </div>
              </div>
            )}
         </DialogContent>
      </Dialog>

      <Dialog open={jobEditOpen} onOpenChange={setJobEditOpen}>
        <DialogContent className="glass-card border border-white/10 text-white sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-blue-400" />
              Edit vacancy
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveJobEdit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Title</label>
              <input
                required
                value={jobForm.title}
                onChange={(e) => setJobForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</label>
              <textarea
                required
                rows={4}
                value={jobForm.description}
                onChange={(e) => setJobForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 resize-y min-h-[100px]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Required skills (comma-separated)</label>
              <input
                required
                value={jobForm.requiredSkills}
                onChange={(e) => setJobForm((f) => ({ ...f, requiredSkills: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Experience (years)</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={jobForm.experienceRequired}
                  onChange={(e) => setJobForm((f) => ({ ...f, experienceRequired: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Listing status</label>
                <select
                  value={jobForm.status}
                  onChange={(e) => setJobForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
                >
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Location</label>
              <input
                value={jobForm.location}
                onChange={(e) => setJobForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Salary range</label>
              <input
                value={jobForm.salaryRange}
                onChange={(e) => setJobForm((f) => ({ ...f, salaryRange: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={jobSaving}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {jobSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save changes'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StageButton({ label, active, onClick, color, current }: any) {
  const getColors = () => {
    if (active) {
      if (color === 'emerald') return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
      if (color === 'amber') return 'bg-amber-500/20 border-amber-500/40 text-amber-400'
      if (color === 'red') return 'bg-red-500/20 border-red-500/40 text-red-400'
      return 'bg-blue-500/20 border-blue-500/40 text-blue-400'
    }
    return 'bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/20'
  }

  return (
    <button 
      onClick={onClick}
      disabled={active}
      title={active ? `Already in ${current}` : `Move to ${label}`}
      className={`py-1.5 rounded text-[9px] font-black uppercase tracking-widest border transition-all ${getColors()}`}
    >
      {label}
    </button>
  )
}

function DetailItem({ icon, label, value, color = 'slate' }: any) {
  const getColors = () => {
    if (color === 'emerald') return 'text-emerald-400'
    if (color === 'amber') return 'text-amber-400'
    return 'text-slate-400'
  }
  return (
    <div className="flex items-start gap-2 min-w-0">
      <div className="flex-shrink-0 w-5 h-5 rounded bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-500 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
         <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 leading-none mb-0.5">{label}</p>
         <p className={`text-[10px] font-bold break-words whitespace-pre-wrap ${getColors()}`}>{value}</p>
      </div>
    </div>
  )
}

function BreakdownItem({ label, score, icon, color = 'blue' }: { label: string, score: number | undefined, icon: React.ReactNode, color?: string }) {
  const getColors = () => {
    if (color === 'emerald') return 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
    if (color === 'red') return 'bg-red-500 shadow-[0_0_8px_#ef4444]'
    return 'bg-blue-500 shadow-[0_0_8px_#3b82f6]'
  }

  const pct = Math.min(100, Math.max(0, Number(score ?? 0)))

  return (
    <div className="space-y-1.5">
       <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
          <span className="flex items-center gap-1">{icon}{label}</span>
          <span className="text-slate-300">{pct}%</span>
       </div>
       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${pct}%` }}
            className={`h-full rounded-full ${getColors()}`}
          />
       </div>
    </div>
  )
}
