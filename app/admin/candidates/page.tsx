'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import {
  BrainCircuit, Search, Filter, UploadCloud, FileText, CheckCircle2,
  Zap, Plus, Mail, MapPin, Clock, Banknote, UserPlus, Loader2,
  AlertCircle, ChevronRight, Briefcase, Calendar, Target, Users, X, Trash2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTalent } from '@/lib/hooks/useTalent'
import { PageHero, SurfaceCard } from '@/components/dashboard/Premium'
import { ExtractionPreview } from '@/components/admin/ExtractionPreview'
import { computeWeightedMatchScore } from '@/lib/match-score'

const NOTICE_PERIODS = ['Immediate', '15 Days', '30 Days', '45 Days', '60 Days', '90 Days', 'Negotiable']
const WORK_SETTING_PREFS = ['Remote', 'Hybrid', 'On-site']

const EMPTY_CANDIDATE = {
  name: '',
  email: '',
  currentRole: '',
  totalExperience: '',
  skills: '',
  currentSalary: '',
  expectedSalary: '',
  noticePeriod: 'Immediate',
  preferredLocation: '',
  workSettingPreference: 'Remote',
  isReadyToJoin: true,
}

export default function AdminCandidatesPage() {
  const { candidates, loading, jobs } = useTalent()
  const [isScreenerOpen, setIsScreenerOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [localCandidates, setLocalCandidates] = useState<any[]>([])
  const [pipeline, setPipeline] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'pool' | 'pipeline'>('pool')
  const [candidateFilter, setCandidateFilter] = useState<'all' | 'selected' | 'rejected'>('all')
  const [pipelineStatusMap, setPipelineStatusMap] = useState<Record<string, string>>({})
  const [reviewQueue, setReviewQueue] = useState<any[]>([])
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([])
  const [reviewActionLoading, setReviewActionLoading] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_CANDIDATE })
  const [reviewQueueCount, setReviewQueueCount] = useState(0)
  const router = useRouter()

  // State for the Rapid AI CV Screener
  const [isDragging, setIsDragging] = useState(false)
  const [screenerState, setScreenerState] = useState<'idle' | 'parsing' | 'matched' | 'bulk_processing' | 'error'>('idle')
  const [parseStep, setParseStep] = useState(0)
  const [matchedJobs, setMatchedJobs] = useState<any[]>([])
  const [extractedCandidate, setExtractedCandidate] = useState<any>(null)
  const [screenerError, setScreenerError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Bulk Upload State (parse all → explicit "Save all" like single-file flow)
  const [bulkFiles, setBulkFiles] = useState<File[]>([])
  const [bulkResults, setBulkResults] = useState<
    {
      name: string
      status: 'pending' | 'parsing' | 'parsed' | 'saved' | 'error' | 'save_error'
      error?: string
      saveError?: string
      extracted?: any
      intelligence?: any
    }[]
  >([])
  const [processedCount, setProcessedCount] = useState(0)
  const [bulkSaveLoading, setBulkSaveLoading] = useState(false)
  const [screenIntelligence, setScreenIntelligence] = useState<any>(null)
  const [bulkPreviewItem, setBulkPreviewItem] = useState<{ name: string; extracted: any; intelligence?: any } | null>(null)

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pipeline')
      const data = await res.json()
      if (res.ok) setPipeline(data.pipeline || [])
    } catch (err) {
      console.error('Failed to fetch pipeline', err)
    }
  }, [])

  useEffect(() => {
    if (candidates) {
      setLocalCandidates(candidates)
    }
    fetchPipeline()
    fetch('/api/admin/candidates/review')
      .then((r) => r.json())
      .then((d) => {
        setReviewQueueCount(d.count || 0)
        setReviewQueue(d.candidates || [])
      })
      .catch(() => null)
    fetch('/api/admin/pipeline/statuses')
      .then((r) => r.json())
      .then((d) => setPipelineStatusMap(d.statusMap || {}))
      .catch(() => null)
  }, [candidates, fetchPipeline])

  const resetScreener = () => {
    setScreenerState('idle')
    setParseStep(0)
    setMatchedJobs([])
    setExtractedCandidate(null)
    setScreenerError(null)
    setBulkFiles([])
    setBulkResults([])
    setProcessedCount(0)
    setBulkSaveLoading(false)
    setScreenIntelligence(null)
    setBulkPreviewItem(null)
  }

  const handleBulkSaveAll = async () => {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
    const toSave = bulkResults
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => (r.status === 'parsed' || r.status === 'save_error') && r.extracted)
    if (!toSave.length) return
    setBulkSaveLoading(true)
    try {
      for (const { r, i } of toSave) {
        try {
          const saveRes = await fetch('/api/admin/candidates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...r.extracted,
              name: r.extracted?.name || r.name.replace(/\.[^.]+$/, ''),
              currentRole: r.extracted?.currentRole || 'Candidate',
              skills: Array.isArray(r.extracted.skills) ? r.extracted.skills.join(', ') : r.extracted.skills,
            }),
          })
          const saveData = await saveRes.json().catch(() => ({}))
          if (!saveRes.ok) {
            setBulkResults((prev) =>
              prev.map((row, idx) =>
                idx === i ? { ...row, status: 'save_error' as const, saveError: saveData.error || 'Could not save' } : row
              )
            )
            continue
          }
          setBulkResults((prev) =>
            prev.map((row, idx) => (idx === i ? { ...row, status: 'saved' as const, saveError: undefined } : row))
          )
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Save failed'
          setBulkResults((prev) =>
            prev.map((row, idx) => (idx === i ? { ...row, status: 'save_error' as const, saveError: msg } : row))
          )
        }
        await sleep(120)
      }
    } finally {
      setBulkSaveLoading(false)
    }
  }

  const handleFileUpload = async (e: any) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer?.files || e.target.files || []) as File[]
    if (files.length === 0) return

    if (files.length > 1) {
      // Bulk Mode
      setScreenerState('bulk_processing')
      setBulkFiles(files)
      setBulkResults(files.map(f => ({ name: f.name, status: 'pending' })))
      setProcessedCount(0)

      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
      let count = 0
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setBulkResults((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: 'parsing' as const } : r)))
        try {
          // Read file content as Base64 for real AI parsing
          const reader = new FileReader()
          const fileData = await new Promise<{ base64: string, mimeType: string }>((resolve, reject) => {
            reader.onload = (e) => {
              const res = e.target?.result as string || ""
              const [header, base64] = res.split(';base64,')
              if (!base64) {
                reject(new Error('Unable to read file content'))
                return
              }
              resolve({
                base64,
                mimeType: header.split(':')[1] || "application/pdf"
              })
            }
            reader.onerror = () => reject(new Error('File read failed'))
            reader.readAsDataURL(file)
          })

          // 1. Screen/Parse
          const runScreen = async () => {
            const screenRes = await fetch('/api/admin/candidates/screen', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileName: file.name,
                fileSize: file.size,
                fileData
              })
            })
            const screenData = await screenRes.json().catch(() => ({}))
            if (!screenRes.ok) {
              const message = screenData.error || screenData.message || 'Parse failed'
              throw new Error(`${message} (HTTP ${screenRes.status})`)
            }
            return screenData
          }

          const retryableHttp = (msg: string) =>
            ['HTTP 429', 'HTTP 500', 'HTTP 503', 'HTTP 504'].some((h) => msg.includes(h))

          let screenData: any
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              screenData = await runScreen()
              break
            } catch (e) {
              const msg = String(e instanceof Error ? e.message : e)
              if (attempt < 2 && retryableHttp(msg)) {
                await sleep(800 * (attempt + 1))
                continue
              }
              throw e
            }
          }

          setBulkResults((prev) =>
            prev.map((r, idx) =>
              idx === i
                ? {
                    ...r,
                    status: 'parsed' as const,
                    extracted: screenData.candidate,
                    intelligence: screenData.intelligence,
                  }
                : r
            )
          )
        } catch (err: any) {
          setBulkResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', error: err.message } : r))
        }
        count++
        setProcessedCount(count)
        await sleep(280)
      }

    } else {
      // Single Mode
      const file = files[0]
      setScreenerState('parsing')
      setParseStep(0)

      try {
        setParseStep(1) // Semantic Vectorization

        // Read file content as Base64 for real AI parsing
        const reader = new FileReader()
        const fileData = await new Promise<{ base64: string, mimeType: string }>((resolve, reject) => {
          reader.onload = (e) => {
            const res = e.target?.result as string || ""
            const [header, base64] = res.split(';base64,')
            if (!base64) {
              reject(new Error('Unable to read file content'))
              return
            }
            resolve({
              base64,
              mimeType: header.split(':')[1] || "application/pdf"
            })
          }
          reader.onerror = () => reject(new Error('File read failed'))
          reader.readAsDataURL(file)
        })

        setParseStep(2) // Classification

        const retryableStatus = (status: number) => [429, 500, 503, 504].includes(status)
        const stall = (ms: number) => new Promise((r) => setTimeout(r, ms))

        let res!: Response
        let data: unknown
        for (let attempt = 0; attempt < 3; attempt++) {
          res = await fetch('/api/admin/candidates/screen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileSize: file.size,
              fileData
            })
          })
          data = await res.json()
          if (res.ok || !retryableStatus(res.status) || attempt === 2) break
          await stall(800 * (attempt + 1))
        }

        const body = data as { error?: string; message?: string; details?: string; candidate?: any }
        if (!res.ok) {
          setScreenerError(`${body.error || body.message || 'AI Error'}: ${body.details || 'The AI model could not process this document.'}`)
          setScreenerState('error')
          return
        }

        setParseStep(3) // Pinging Matrix
        await new Promise(r => setTimeout(r, 600))

        const raw = body.candidate || {}
        const skillsArr = Array.isArray(raw.skills)
          ? raw.skills
          : typeof raw.skills === 'string'
            ? raw.skills.split(/[,;|]/).map((s: string) => s.trim()).filter(Boolean)
            : []
        const candidateForScore = { ...raw, skills: skillsArr }
        const analyzedJobs = jobs
          .map((job: any) => ({
            ...job,
            matchScore: computeWeightedMatchScore(job, candidateForScore).score,
          }))
          .sort((a: any, b: any) => b.matchScore - a.matchScore)

        setMatchedJobs(analyzedJobs)
        setExtractedCandidate(body.candidate)
        setScreenIntelligence((body as { intelligence?: unknown }).intelligence ?? null)
        setParseStep(4)
        setScreenerState('matched')
      } catch (err) {
        setScreenerError('High linguistic noise detected in document payload.')
        setScreenerState('error')
      }
    }
  }

  const handleSaveExtracted = async () => {
    if (!extractedCandidate) return
    setAddLoading(true)
    try {
      const res = await fetch('/api/admin/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...extractedCandidate,
          skills: Array.isArray(extractedCandidate.skills) ? extractedCandidate.skills.join(', ') : extractedCandidate.skills
        }),
      })
      if (!res.ok) throw new Error('Failed to index candidate')
      setIsScreenerOpen(false)
      resetScreener()
      window.location.reload()
    } catch (err) {
      console.error(err)
    } finally {
      setAddLoading(false)
    }
  }

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddLoading(true)
    try {
      const res = await fetch('/api/admin/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to add candidate')

      setIsAddOpen(false)
      setForm({ ...EMPTY_CANDIDATE })
      window.location.reload()
    } catch (err) {
      console.error(err)
    } finally {
      setAddLoading(false)
    }
  }

  const handleDeleteCandidate = async (candidateId: string) => {
    const ok = window.confirm('Delete this candidate profile? This cannot be undone.')
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/candidates/${candidateId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete candidate')
      setLocalCandidates(prev => prev.filter(c => c.id !== candidateId))
    } catch (err) {
      console.error(err)
    }
  }

  const handleBulkDelete = async () => {
    if (!selectedCandidateIds.length) return
    const ok = window.confirm(`Delete ${selectedCandidateIds.length} selected candidates? This cannot be undone.`)
    if (!ok) return
    const res = await fetch('/api/admin/candidates/bulk-delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedCandidateIds }),
    })
    if (!res.ok) return
    setLocalCandidates(prev => prev.filter(c => !selectedCandidateIds.includes(c.id)))
    setReviewQueue(prev => prev.filter(c => !selectedCandidateIds.includes(c.id)))
    setSelectedCandidateIds([])
  }

  const handleReviewAction = async (action: 'approve' | 'reject' | 'edit', ids: string[], updates?: Record<string, string>) => {
    if (!ids.length) return
    setReviewActionLoading(true)
    try {
      const res = await fetch('/api/admin/candidates/review/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids, updates }),
      })
      if (!res.ok) return
      const refreshed = await fetch('/api/admin/candidates/review').then(r => r.json())
      setReviewQueue(refreshed.candidates || [])
      setReviewQueueCount(refreshed.count || 0)
      setSelectedCandidateIds([])
    } finally {
      setReviewActionLoading(false)
    }
  }

  const bulkPendingSaveCount = bulkResults.filter(
    (r) => (r.status === 'parsed' || r.status === 'save_error') && r.extracted
  ).length
  const bulkSavedCount = bulkResults.filter((r) => r.status === 'saved').length
  const bulkParseErrorCount = bulkResults.filter((r) => r.status === 'error').length

  const filteredCandidates = localCandidates.filter((c) => {
    if (candidateFilter === 'all') return true
    const status = pipelineStatusMap[c.id]
    if (candidateFilter === 'selected') return status === 'SELECTED'
    if (candidateFilter === 'rejected') return status === 'REJECTED'
    return true
  })
  const displayName = (name: string, email?: string, parseSourceFile?: string) => {
    const value = String(name || '').trim()
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
    const splitFileName = fromFile.replace(/([a-z])([A-Z])/g, '$1 $2').trim()
    if (splitFileName.includes(' ')) {
      return splitFileName.split(' ').map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
    }
    return value.charAt(0).toUpperCase() + value.slice(1)
  }
  const displayEmail = (email?: string) => {
    const value = String(email || '').trim()
    if (!value || value.includes('@placeholder.local')) return 'Email not extracted from CV'
    return value
  }
  const filteredCandidateIds = filteredCandidates.map((c) => c.id)
  const selectedVisibleCount = filteredCandidateIds.filter((id) => selectedCandidateIds.includes(id)).length
  const allVisibleSelected = filteredCandidateIds.length > 0 && selectedVisibleCount === filteredCandidateIds.length

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <PageHero
        eyebrow="Candidate Operations"
        title="Talent Management"
        description="AI-powered recruitment and candidate pipeline tracking."
        right={(
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('pool')}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pool' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Talent Pool
            </button>
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pipeline' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Active Pipeline
            </button>
          </div>
        )}
      />
      {reviewQueueCount > 0 && (
        <SurfaceCard className="p-3 border-amber-500/20 bg-amber-500/5">
          <p className="text-amber-300 text-xs font-semibold">Review Queue: {reviewQueueCount} CV(s) need manual validation</p>
        </SurfaceCard>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex gap-3 w-full md:w-auto items-center flex-wrap">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 flex items-center text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_4px_15px_rgba(37,99,235,0.3)]">
              <UserPlus className="mr-2 h-4 w-4" /> Add Candidate
            </DialogTrigger>
            <DialogContent showCloseButton={false} className="glass-card border border-white/10 text-white sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogClose className="absolute top-4 right-4 z-[60] p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all pointer-events-auto">
                <X className="w-4 h-4" />
              </DialogClose>
              <DialogHeader><DialogTitle className="text-xl font-bold flex items-center gap-2 pt-2"><Mail className="w-5 h-5 text-blue-400" /> New Candidate Profile</DialogTitle></DialogHeader>
              <form onSubmit={handleAddCandidate} className="grid grid-cols-2 gap-4 mt-6">
                <div className="col-span-2"><label className="form-label">Full Name *</label><input required className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="form-label">Email Address *</label><input required type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div><label className="form-label">Current Role *</label><input required className="form-input" value={form.currentRole} onChange={e => setForm({ ...form, currentRole: e.target.value })} /></div>
                <div><label className="form-label">Total Experience (Years) *</label><input required type="number" step="0.1" className="form-input" value={form.totalExperience} onChange={e => setForm({ ...form, totalExperience: e.target.value })} /></div>
                <div><label className="form-label">Notice Period *</label>
                  <select className="form-input" value={form.noticePeriod} onChange={e => setForm({ ...form, noticePeriod: e.target.value })}>
                    {NOTICE_PERIODS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="col-span-2"><label className="form-label">Skills (Comma separated) *</label><input required className="form-input" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="React, Node.js, AWS" /></div>
                <div className="col-span-2"><button type="submit" disabled={addLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center">{addLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Index Candidate Profile'}</button></div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isScreenerOpen} onOpenChange={(val) => { setIsScreenerOpen(val); if (!val) resetScreener() }}>
            <DialogTrigger className="bg-white/[0.05] hover:bg-white/10 border border-white/10 text-white rounded-xl px-4 py-2.5 flex items-center text-[10px] font-black uppercase tracking-widest transition-all">
              <Zap className="mr-2 h-4 w-4 text-blue-400" /> Upload Resume's
            </DialogTrigger>
            <DialogContent showCloseButton={false} className="glass-card border border-white/10 text-white sm:max-w-2xl p-0 overflow-hidden">
              <DialogClose className="absolute top-4 right-4 z-[60] p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all pointer-events-auto">
                <X className="w-4 h-4" />
              </DialogClose>
              <div className="p-8 relative z-10 space-y-6">
                <DialogHeader><DialogTitle className="text-2xl font-bold text-white flex items-center"><BrainCircuit className="w-6 h-6 mr-3 text-blue-500" /> Bulk Resume's Upload & Match with AI </DialogTitle></DialogHeader>

                <AnimatePresence mode="wait">
                  {screenerState === 'idle' && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }}
                      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false) }}
                      onDrop={handleFileUpload}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'} rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center group`}
                    >
                      <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt" />
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><UploadCloud className="w-8 h-8 text-blue-400" /></div>
                      <h3 className="text-white font-bold text-lg mb-1">Drop CVs Here</h3>
                      <p className="text-slate-400 text-sm font-medium">Upload multiple resumes: we parse each CV first, then you save them all to the talent pool in one click.</p>
                      <p className="text-slate-500 text-xs mt-3 max-w-sm mx-auto leading-relaxed">
                        Same pipeline as single upload (Document AI when configured, then AI extraction). Use Preview on any row, then choose Save all when ready.
                      </p>
                    </motion.div>
                  )}

                  {screenerState === 'bulk_processing' && (
                    <motion.div key="bulk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white">Bulk parse</h3>
                          <p className="text-xs text-slate-500 uppercase font-black tracking-widest mt-1">OCR + AI per file · {processedCount} of {bulkFiles.length}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-blue-500">{Math.round((processedCount / bulkFiles.length) * 100)}%</div>
                        </div>
                      </div>

                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${(processedCount / bulkFiles.length) * 100}%` }}
                        />
                      </div>

                      <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                        {bulkResults.map((res, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-center gap-3 min-w-0">
                              <FileText
                                className={`w-4 h-4 shrink-0 ${
                                  res.status === 'saved'
                                    ? 'text-emerald-400'
                                    : res.status === 'error' || res.status === 'save_error'
                                      ? 'text-red-400'
                                      : res.status === 'parsed'
                                        ? 'text-amber-400'
                                        : 'text-slate-500'
                                }`}
                              />
                              <div className="min-w-0">
                                <span className="text-sm font-medium text-slate-300 truncate block">{res.name}</span>
                                {res.status === 'save_error' && res.saveError && (
                                  <span className="text-[10px] text-red-400/90 truncate block" title={res.saveError}>
                                    {res.saveError}
                                  </span>
                                )}
                                {res.status === 'error' && res.error && (
                                  <span className="text-[10px] text-red-400/90 truncate block" title={res.error}>
                                    {res.error}
                                  </span>
                                )}
                                {res.status === 'saved' && (
                                  <span className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-wider">In talent pool</span>
                                )}
                                {res.status === 'parsed' && (
                                  <span className="text-[10px] text-amber-500/80 font-bold uppercase tracking-wider">Ready to save</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {res.extracted && (res.status === 'parsed' || res.status === 'saved' || res.status === 'save_error') && (
                                <button
                                  type="button"
                                  onClick={() => setBulkPreviewItem({ name: res.name, extracted: res.extracted, intelligence: res.intelligence })}
                                  className="text-[10px] font-black uppercase tracking-wider text-blue-400 hover:text-blue-300 px-2 py-1 rounded-lg border border-blue-500/30 bg-blue-500/10"
                                >
                                  Preview
                                </button>
                              )}
                              {(res.status === 'pending' || res.status === 'parsing') && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
                              {res.status === 'saved' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                              {res.status === 'parsed' && <span className="text-[9px] font-black text-amber-500/90 uppercase">Unsaved</span>}
                              {res.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                              {res.status === 'save_error' && <AlertCircle className="w-4 h-4 text-amber-500" />}
                            </div>
                          </div>
                        ))}
                        {bulkResults.some((r) => r.status === 'error' && r.error) && (
                          <p className="text-xs text-red-300 mt-2">
                            Last error: {bulkResults.find((r) => r.status === 'error' && r.error)?.error}
                          </p>
                        )}
                      </div>

                      {processedCount === bulkFiles.length && (
                        <div className="space-y-3">
                          <p className="text-center text-xs text-slate-500">
                            Done · {bulkFiles.length} file{bulkFiles.length === 1 ? '' : 's'}
                            {bulkSavedCount > 0 ? ` · ${bulkSavedCount} saved` : ''}
                            {bulkPendingSaveCount > 0 ? ` · ${bulkPendingSaveCount} ready to save` : ''}
                            {bulkParseErrorCount > 0 ? ` · ${bulkParseErrorCount} parse error${bulkParseErrorCount === 1 ? '' : 's'}` : ''}
                          </p>
                          {bulkPendingSaveCount > 0 && (
                            <button
                              type="button"
                              disabled={bulkSaveLoading}
                              onClick={() => void handleBulkSaveAll()}
                              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                              {bulkSaveLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4" /> Save all to talent pool ({bulkPendingSaveCount})
                                </>
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={bulkSaveLoading}
                            onClick={() => {
                              setIsScreenerOpen(false)
                              window.location.reload()
                            }}
                            className="w-full py-3 border border-white/15 bg-white/[0.03] hover:bg-white/[0.06] text-slate-200 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                          >
                            Refresh talent pool
                          </button>
                          <p className="text-[10px] text-center text-slate-600 leading-relaxed px-2">
                            Saving adds each parsed CV to the database. Refresh reloads the list so new profiles appear.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {screenerState === 'parsing' && (
                    <motion.div key="parsing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-12 px-4 flex flex-col items-center">
                      <div className="relative w-24 h-24 mb-8">
                        <div className="absolute inset-0 rounded-full border-[3px] border-white/10" />
                        <div className="absolute inset-0 rounded-full border-[3px] border-blue-500 border-t-transparent animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">{parseStep === 4 ? <CheckCircle2 className="w-8 h-8 text-blue-400" /> : <FileText className="w-8 h-8 text-white animate-pulse" />}</div>
                      </div>
                      <div className="space-y-4 w-full max-w-sm">
                        <StepLabel label="Reading Skills" step={1} current={parseStep} />
                        <StepLabel label="Categorizing Profile" step={2} current={parseStep} />
                        <StepLabel label="Checking Vacancies" step={3} current={parseStep} />
                      </div>
                    </motion.div>
                  )}

                  {screenerState === 'matched' && extractedCandidate && (
                    <motion.div key="matched" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 max-h-[72vh] overflow-y-auto scrollbar-hide pr-1">
                      <div className="p-5 bg-gradient-to-b from-blue-500/15 to-white/[0.02] border border-blue-500/25 rounded-2xl">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-blue-400 font-bold flex items-center text-lg"><CheckCircle2 className="w-5 h-5 mr-2" /> Extracted CV preview</h4>
                          <span className="text-[10px] font-black uppercase text-blue-400/60 tracking-[0.2em]">Review before save</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                          Same field layout as intelligent capture: confirm email, skills, education, and summary. Adjust the CV or re-upload if anything looks wrong, then save.
                        </p>
                        <ExtractionPreview
                          data={extractedCandidate}
                          intelligence={screenIntelligence}
                        />
                        <button
                          onClick={handleSaveExtracted}
                          disabled={addLoading}
                          className="w-full mt-6 h-11 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-900/30"
                        >
                          {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Save to Talent Pool</>}
                        </button>
                      </div>
                      <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-black mb-2 flex items-center gap-2 px-1"><Target className="w-3 h-3" /> Vacancy Matching</h4>
                      <div className="grid gap-2">
                        {matchedJobs.slice(0, 3).map((job) => (
                          <Card key={job.id} onClick={() => router.push(`/admin/matches/${job.id}`)} className="glass-card bg-white/[0.01] border-white/5 overflow-hidden cursor-pointer hover:border-blue-500/30 transition-colors">
                            <CardContent className="p-4 flex items-center justify-between">
                              <div className="min-w-0"><h3 className="text-sm font-bold text-white truncate">{job.title}</h3><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{job.clientName || 'Market'}</p></div>
                              <div className="text-right pl-4"><div className={`text-xl font-black ${job.matchScore >= 90 ? 'text-emerald-400' : 'text-slate-500'}`}>{job.matchScore}%</div></div>
                            </CardContent>
                            {job.matchScore >= 90 && <div className="h-0.5 w-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />}
                          </Card>
                        ))}
                      </div>
                      <button onClick={resetScreener} className="w-full mt-4 py-2 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Try Another CV</button>
                    </motion.div>
                  )}

                  {screenerState === 'error' && (
                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 px-4 flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6"><AlertCircle className="w-8 h-8 text-red-500" /></div>
                      <h3 className="text-white font-black text-xl mb-2">Extraction Blocked</h3>
                      <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-8">{screenerError}</p>
                      <button onClick={resetScreener} className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Try Different Document</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={!!bulkPreviewItem} onOpenChange={(open) => { if (!open) setBulkPreviewItem(null) }}>
            <DialogContent className="glass-card border border-white/10 text-white sm:max-w-2xl max-h-[88vh] overflow-hidden flex flex-col p-0">
              <DialogHeader className="p-6 pb-2 shrink-0 border-b border-white/10">
                <DialogTitle className="text-white text-lg">Extracted fields · {bulkPreviewItem?.name}</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto px-6 pb-6 flex-1 min-h-0">
                {bulkPreviewItem && (
                  <ExtractionPreview
                    data={bulkPreviewItem.extracted}
                    intelligence={bulkPreviewItem.intelligence}
                    fileLabel={bulkPreviewItem.name}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>

          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input type="text" placeholder="Search parameters..." className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none transition-colors" />
          </div>
        </div>
      </div>

      {activeTab === 'pool' ? (
        <div className="grid gap-5">
          {reviewQueueCount > 0 && (
            <Card className="glass-card border border-amber-500/20 bg-amber-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-amber-300 flex items-center justify-between">
                  <span>Review Queue Workflow</span>
                  <span className="text-xs">{reviewQueueCount} pending</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button disabled={reviewActionLoading || selectedCandidateIds.length === 0} onClick={() => handleReviewAction('approve', selectedCandidateIds)} className="px-3 py-1.5 rounded-lg text-xs bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 disabled:opacity-50">Approve</button>
                  <button disabled={reviewActionLoading || selectedCandidateIds.length === 0} onClick={() => handleReviewAction('reject', selectedCandidateIds)} className="px-3 py-1.5 rounded-lg text-xs bg-red-600/20 border border-red-500/30 text-red-300 disabled:opacity-50">Reject</button>
                </div>
                <div className="space-y-2">
                  {reviewQueue.slice(0, 8).map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/10 p-2.5">
                      <label className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedCandidateIds.includes(item.id)}
                          onChange={(e) => {
                            setSelectedCandidateIds((prev) => e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id))
                          }}
                        />
                        <span className="text-sm text-white truncate">{item.name}</span>
                      </label>
                      <div className="flex gap-2">
                        <button onClick={() => handleReviewAction('approve', [item.id])} className="text-xs text-emerald-300">Approve</button>
                        <button onClick={() => {
                          const name = window.prompt('Name', item.name || '') || item.name
                          const role = window.prompt('Current role', item.currentRole || '') || item.currentRole
                          const exp = window.prompt('Total experience', String(item.totalExperience || '')) || String(item.totalExperience || '')
                          const skills = window.prompt('Skills (comma separated)', Array.isArray(item.skills) ? item.skills.join(', ') : '') || ''
                          handleReviewAction('edit', [item.id], { name, currentRole: role, totalExperience: exp, skills })
                        }} className="text-xs text-blue-300">Edit</button>
                        <button onClick={() => handleReviewAction('reject', [item.id])} className="text-xs text-red-300">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'selected', 'rejected'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setCandidateFilter(tab)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${candidateFilter === tab ? 'bg-blue-600 text-white border-blue-500/50' : 'bg-white/[0.02] text-slate-400 border-white/10 hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
            <button
              disabled={selectedCandidateIds.length === 0}
              onClick={handleBulkDelete}
              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all bg-red-600/20 text-red-300 border-red-500/30 disabled:opacity-40"
            >
              Bulk Delete ({selectedCandidateIds.length})
            </button>
            <button
              onClick={() => {
                if (allVisibleSelected) {
                  setSelectedCandidateIds((prev) => prev.filter((id) => !filteredCandidateIds.includes(id)))
                } else {
                  setSelectedCandidateIds((prev) => Array.from(new Set([...prev, ...filteredCandidateIds])))
                }
              }}
              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all bg-white/[0.03] text-slate-300 border-white/10 hover:text-white"
            >
              {allVisibleSelected ? 'Unselect Visible' : `Select Visible (${filteredCandidates.length})`}
            </button>
          </div>
          <div className="hidden lg:grid grid-cols-12 gap-3 px-4 py-2 text-[11px] text-slate-500 uppercase tracking-wider border border-white/10 rounded-xl bg-white/[0.02]">
            <div className="col-span-6">Candidate</div>
            <div className="col-span-2">Notice</div>
            <div className="col-span-2">Experience</div>
            <div className="col-span-2">Location</div>
          </div>
          {filteredCandidates.map((c) => (
            <div key={c.id} onClick={() => router.push(`/admin/candidates/${c.id}`)} className={`glass-card p-5 cursor-pointer hover:border-blue-500/40 hover:bg-white/[0.04] transition-all group shadow-sm ${selectedCandidateIds.includes(c.id) ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10'}`}>
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center gap-3 min-w-0 lg:w-[42%] xl:w-[40%]">
                  <input
                    type="checkbox"
                    checked={selectedCandidateIds.includes(c.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setSelectedCandidateIds((prev) => e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id))}
                  />
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center text-white font-bold text-lg">
                    {displayName(c.name, c.email, c.parseSourceFile).charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">{displayName(c.name, c.email, c.parseSourceFile)}</h3>
                    <p className="text-sm text-slate-400 truncate">{c.currentRole || 'Candidate'}</p>
                    <p className="text-xs text-slate-500 truncate">{displayEmail(c.email)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:flex-1">
                  <TelemetryItem icon={<Clock className="w-3.5 h-3.5 text-amber-400" />} label="Notice" value={c.noticePeriod || 'N/A'} />
                  <TelemetryItem icon={<Briefcase className="w-3.5 h-3.5 text-blue-400" />} label="Experience" value={`${c.totalExperience || c.experienceYears || 0} Yrs`} />
                  <TelemetryItem icon={<MapPin className="w-3.5 h-3.5 text-red-400" />} label="Location" value={c.preferredLocation || 'Anywhere'} />
                  <TelemetryItem icon={<Banknote className="w-3.5 h-3.5 text-emerald-400" />} label="Expected" value={c.expectedSalary || 'Negotiable'} />
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0 mt-2 lg:mt-0">
                  {c.parseNeedsReview && (
                    <span className="text-[10px] text-amber-400 uppercase tracking-widest hidden sm:inline">Needs review</span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCandidate(c.id) }}
                    className="p-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
                    title="Delete candidate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-5">
          {pipeline.length === 0 ? (
            <Card className="glass-card text-center py-20 bg-white/[0.01] border-dashed">
              <p className="text-slate-500 font-medium tracking-tight">No candidates are currently in the active shortlist.</p>
            </Card>
          ) : (
            pipeline.map((item) => (
              <div key={item.id} onClick={() => router.push(`/admin/matches/${item.jobId}`)} className="glass-card flex flex-col md:flex-row items-stretch p-0 border-white/5 overflow-hidden cursor-pointer hover:border-blue-500/40 hover:bg-white/[0.04] transition-all group">
                <div className={`w-1.5 shrink-0 ${item.status === 'SELECTED' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-amber-500 shadow-[0_0_15px_#f59e0b]'}`} />
                <div className="flex-1 flex flex-col md:flex-row items-center p-6 gap-6">
                  <div className="flex items-center gap-4 w-full md:w-1/3">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-black text-xl group-hover:bg-blue-600/10 transition-colors">
                      {item.candidate?.name?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">{item.candidate?.name || 'Unknown Candidate'}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 px-1.5 py-0.5 rounded bg-blue-500/10">Shortlisted</span>
                        <span className="text-xs text-slate-500 font-medium truncate">for {item.job?.title}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                    <TelemetryItem icon={<Users className="w-3.5 h-3.5 text-blue-400" />} label="Client" value={item.job?.clientName || 'Market'} />
                    <TelemetryItem icon={<Calendar className="w-3.5 h-3.5 text-violet-400" />} label="Added On" value={new Date(item.createdAt).toLocaleDateString()} />
                    <TelemetryItem icon={<Zap className="w-3.5 h-3.5 text-amber-400" />} label="Current Stage" value={item.status} />
                  </div>
                  <div className="flex items-center justify-end w-full md:w-32 shrink-0 md:pl-6 md:border-l border-white/10">
                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${item.status === 'SELECTED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                      {item.status}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      <style jsx global>{`
        .form-label { display: block; font-size: 0.625rem; color: #64748b; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.375rem; }
        .form-input { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.75rem; padding: 0.625rem 1rem; color: white; font-size: 0.875rem; outline: none; transition: border-color 0.15s; width: 100%; font-weight: 500; }
        .form-input option { background: #0a0a0a; }
      `}</style>
    </div>
  )
}

function StepLabel({ label, step, current }: { label: string, step: number, current: number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className={`transition-colors font-medium ${current >= step ? 'text-white' : 'text-slate-600'}`}>{label}...</span>
      {current >= step ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> : current === step - 1 ? <span className="text-blue-500 animate-pulse text-[10px] font-black uppercase tracking-widest">Running</span> : null}
    </div>
  )
}

function TelemetryItem({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none">{label}</span></div>
      <p className="text-xs font-bold text-slate-200 truncate">{value}</p>
    </div>
  )
}
