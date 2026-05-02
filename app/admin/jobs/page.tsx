'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Plus, BrainCircuit, MapPin, Briefcase, Clock, Users,
  Building2, Wifi, WifiOff, Monitor, MonitorPlay, Banknote,
  CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp,
  Calendar, PhoneCall, ShoppingBag, Layers, Tag, X, Target, Trash2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageHero, SurfaceCard } from '@/components/dashboard/Premium'

interface Job {
  id: string
  title: string
  description: string
  department?: string
  clientName?: string
  openPositions: number
  status: string
  requiredSkills: string[]
  experienceRequired: number
  salaryRange?: string
  location?: string
  workSetting?: string
  positionType?: string
  interviewMode?: string
  noticePeriod?: string
  buyoutAllowed: boolean
  category?: string
  createdAt: string
}

const JOB_CATEGORIES = ['IT', 'Non-IT', 'Specialized']
const WORK_SETTINGS = ['On-site', 'Hybrid', 'Remote']
const POSITION_TYPES = ['Permanent', 'Contract', 'Contract-to-Hire (CTH)']
const NOTICE_PERIODS = ['Immediate', '15 Days', '30 Days', '45 Days', '60 Days', '90 Days', 'Negotiable']
const STATUS_OPTIONS = ['Active', 'On Hold', 'Closed']
const DEPARTMENTS = ['Engineering', 'Data & AI', 'DevOps / Cloud', 'Finance', 'HR', 'Sales', 'Marketing', 'Design', 'Legal', 'Operations', 'Product']

const EMPTY_FORM = {
  title: '',
  description: '',
  department: '',
  clientName: '',
  openPositions: '1',
  status: 'Active',
  requiredSkills: '',
  experienceRequired: '',
  salaryRange: '',
  location: '',
  workSetting: 'On-site',
  positionType: 'Permanent',
  interviewMode: '',
  noticePeriod: 'Immediate',
  category: 'IT',
  buyoutAllowed: false,
  matchFromDatabase: true,
}

type AlertState = { type: 'success' | 'error'; message: string } | null

function statusColor(s: string) {
  if (s === 'Active') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
  if (s === 'On Hold') return 'text-amber-400 bg-amber-500/10 border-amber-500/25'
  return 'text-slate-400 bg-white/5 border-white/10'
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState<AlertState>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const flashAlert = (a: AlertState) => {
    setAlert(a)
    setTimeout(() => setAlert(null), 4500)
  }

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/jobs')
      const data = await res.json()
      setJobs(data.jobs || [])
    } catch {
      flashAlert({ type: 'error', message: 'Failed to load job listings.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { 
    fetchJobs()
  }, [fetchJobs])

  const f = (k: keyof typeof form, v: string | boolean) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const handleGenerate = async () => {
    if (!form.title) return
    setIsGenerating(true)
    try {
      const res = await fetch('/api/ai/job-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title }),
      })
      const data = await res.json()
      if (res.ok) {
        f('description', data.description)
        f('requiredSkills', data.skills)
        f('experienceRequired', data.experience?.toString() || '')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDeleteVacancy = async (job: Job) => {
    const msg = `Delete vacancy “${job.title}”? This cannot be undone. Pipeline matches for this role will be removed.`
    if (typeof window !== 'undefined' && !window.confirm(msg)) return
    setDeletingId(job.id)
    try {
      const res = await fetch(`/api/admin/jobs/${job.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Delete failed')
      setJobs((prev) => prev.filter((j) => j.id !== job.id))
      flashAlert({ type: 'success', message: 'Vacancy deleted.' })
    } catch (err: unknown) {
      flashAlert({ type: 'error', message: err instanceof Error ? err.message : 'Could not delete vacancy.' })
    } finally {
      setDeletingId(null)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.description || !form.requiredSkills || !form.experienceRequired) {
      flashAlert({ type: 'error', message: 'Title, description, skills, and experience are required.' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          requiredSkills: form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
          experienceRequired: parseInt(form.experienceRequired, 10),
          openPositions: parseInt(form.openPositions, 10) || 1,
          buyoutAllowed: form.buyoutAllowed,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const createdJobId = data.jobId as string | undefined
      const shouldAutoMatch = Boolean(form.matchFromDatabase)
      setIsOpen(false)
      setForm({ ...EMPTY_FORM })
      fetchJobs()
      flashAlert({ type: 'success', message: 'Job listing created successfully.' })
      if (createdJobId && shouldAutoMatch) {
        window.location.href = `/admin/matches/${createdJobId}`
      }
    } catch (err: any) {
      flashAlert({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  const activeCount = jobs.filter(j => j.status === 'Active').length

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">

      {/* Header */}
      <PageHero
        eyebrow="Hiring Control"
        title="Vacancy Management"
        description={loading ? 'Loading vacancies...' : `${jobs.length} vacancies · ${activeCount} active in market`}
        right={(
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            Post New Vacancy
          </button>
        )}
      />

      <AnimatePresence>
        {alert && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <SurfaceCard className={`flex items-center gap-3 px-5 py-4 text-sm font-medium ${alert.type === 'success' ? 'border-emerald-500/30 text-emerald-300' : 'border-red-500/30 text-red-300'}`}>
            {alert.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {alert.message}
            </SurfaceCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SurfaceCard className="p-4">
          <p className="text-[11px] uppercase tracking-widest text-slate-500">Total Vacancies</p>
          <p className="text-2xl font-bold text-white mt-1">{jobs.length}</p>
        </SurfaceCard>
        <SurfaceCard className="p-4">
          <p className="text-[11px] uppercase tracking-widest text-slate-500">Active</p>
          <p className="text-2xl font-bold text-emerald-300 mt-1">{jobs.filter((j) => j.status === 'Active').length}</p>
        </SurfaceCard>
        <SurfaceCard className="p-4">
          <p className="text-[11px] uppercase tracking-widest text-slate-500">On Hold</p>
          <p className="text-2xl font-bold text-amber-300 mt-1">{jobs.filter((j) => j.status === 'On Hold').length}</p>
        </SurfaceCard>
        <SurfaceCard className="p-4">
          <p className="text-[11px] uppercase tracking-widest text-slate-500">Closed</p>
          <p className="text-2xl font-bold text-slate-200 mt-1">{jobs.filter((j) => j.status === 'Closed').length}</p>
        </SurfaceCard>
      </div>

      {/* Job Matrix */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="hidden lg:grid grid-cols-12 gap-3 px-4 py-2 text-[11px] text-slate-500 uppercase tracking-wider border border-white/10 rounded-xl bg-white/[0.02]">
            <div className="col-span-3">Vacancy</div>
            <div className="col-span-2">Client / Dept</div>
            <div className="col-span-2">Logistics</div>
            <div className="col-span-2">Skills</div>
            <div className="col-span-1 text-center">Open</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          {jobs.map(job => {
            const skills = Array.isArray(job.requiredSkills) ? job.requiredSkills : []

            return (
              <motion.div key={job.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="glass-card border-white/10 hover:border-blue-500/30 transition-all p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:items-center">
                    <div className="lg:col-span-3 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-lg font-bold text-white truncate">{job.title}</h3>
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border ${statusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Created {new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </p>
                    </div>

                    <div className="lg:col-span-2">
                      <p className="text-sm text-slate-200 font-semibold truncate">{job.clientName || 'Internal Hiring'}</p>
                      <p className="text-xs text-slate-500 truncate">{job.department || 'General'} · {job.category || 'IT'}</p>
                    </div>

                    <div className="lg:col-span-2">
                      <p className="text-xs text-slate-400 truncate">{job.location || 'Remote'}</p>
                      <p className="text-xs text-slate-500 truncate">{job.workSetting || 'Remote'} · {job.noticePeriod || 'Immediate'}</p>
                    </div>

                    <div className="lg:col-span-2 flex flex-wrap gap-1.5">
                      {skills.slice(0, 3).map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-[10px] text-slate-300 uppercase tracking-wide">
                          {s}
                        </span>
                      ))}
                      {skills.length > 3 && <span className="text-[10px] text-slate-500">+{skills.length - 3}</span>}
                    </div>

                    <div className="lg:col-span-1 text-left lg:text-center">
                      <p className="text-2xl font-black text-white leading-none">{job.openPositions}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Open</p>
                    </div>

                    <div className="lg:col-span-2 flex flex-col sm:flex-row gap-2 lg:justify-end items-stretch sm:items-center">
                      <Link href={`/admin/matches/${job.id}`} className="w-full lg:w-auto">
                        <button
                          type="button"
                          className="w-full lg:w-auto min-w-[170px] h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                        >
                          <Target className="w-4 h-4" /> Open Matches
                        </button>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteVacancy(job)}
                        disabled={deletingId === job.id}
                        className="w-full lg:w-auto min-h-10 px-4 rounded-xl border border-red-500/35 bg-red-500/10 text-red-200 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all disabled:opacity-50"
                      >
                        {deletingId === job.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Delete vacancy
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-4 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5"><MonitorPlay className="w-3 h-3" /> {job.interviewMode || 'Virtual'}</span>
                    <span className="flex items-center gap-1.5"><Banknote className="w-3 h-3" /> {job.salaryRange || 'Competitive'}</span>
                    <span className="flex items-center gap-1.5"><Briefcase className="w-3 h-3" /> {job.positionType || 'Permanent'}</span>
                    <span className="flex items-center gap-1.5">{job.buyoutAllowed ? 'Buyout Allowed' : 'No Buyout'}</span>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── Create Job Dialog ── */}
      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setForm({ ...EMPTY_FORM }) }}>
        <DialogContent className="glass-card border border-white/10 text-white sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-400" />
              New Vacancy Posting
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-6 pt-2">
            <Section title="Role Information">
              <div className="col-span-2">
                <label className="form-label">Vacancy Title *</label>
                <div className="flex gap-2">
                  <input required value={form.title} onChange={e => f('title', e.target.value)} placeholder="e.g. Senior React Developer" className="form-input flex-1" />
                  <button type="button" onClick={handleGenerate} disabled={isGenerating || !form.title} className="px-3 rounded-xl border border-blue-500/20 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 transition-all flex items-center justify-center min-w-[44px] disabled:opacity-40">
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="col-span-1">
                <label className="form-label">Client Name (Optional)</label>
                <input 
                   value={form.clientName} 
                   onChange={e => f('clientName', e.target.value)} 
                   placeholder="e.g. Acme Corp"
                   className="form-input"
                />
              </div>
              <FormField label="Department" value={form.department} onChange={v => f('department', v)} select options={DEPARTMENTS} />
              <div className="col-span-2">
                <label className="form-label">Vacancy Description *</label>
                <textarea required rows={3} value={form.description} onChange={e => f('description', e.target.value)} placeholder="Describe the role..." className="form-input w-full resize-none" />
              </div>
            </Section>

            <Section title="Requirements">
              <div className="col-span-2">
                <label className="form-label">Required Skills (comma-separated) *</label>
                <input required value={form.requiredSkills} onChange={e => f('requiredSkills', e.target.value)} placeholder="React, Node.js, AWS" className="form-input w-full" />
              </div>
              <FormField label="Experience (Years) *" type="number" value={form.experienceRequired} onChange={v => f('experienceRequired', v)} min="0" />
              <FormField label="Salary Range" value={form.salaryRange} onChange={v => f('salaryRange', v)} placeholder="e.g. ₹12L – ₹18L" />
              <FormField label="Open Positions" type="number" value={form.openPositions} onChange={v => f('openPositions', v)} min="1" />
              <FormField label="Listing Status" value={form.status} onChange={v => f('status', v)} select options={STATUS_OPTIONS} />
            </Section>

            <Section title="Work Logistics">
              <div className="col-span-2">
                <label className="form-label">Work Location (Full Address)</label>
                <input value={form.location} onChange={e => f('location', e.target.value)} placeholder="e.g. Andheri East, Mumbai" className="form-input w-full" />
              </div>
              <FormField label="Category *" value={form.category} onChange={v => f('category', v)} select options={JOB_CATEGORIES} />
              <FormField label="Work Setting" value={form.workSetting} onChange={v => f('workSetting', v)} select options={WORK_SETTINGS} />
              <FormField label="Position Type" value={form.positionType} onChange={v => f('positionType', v)} select options={POSITION_TYPES} />
            </Section>

            <Section title="Interview & Availability">
              <div className="col-span-2">
                <label className="form-label">Mode of Interview</label>
                <input value={form.interviewMode} onChange={e => f('interviewMode', e.target.value)} placeholder="e.g. 1st Round Virtual / 2nd Round In-person" className="form-input w-full" />
              </div>
              <FormField label="Notice Period Preference" value={form.noticePeriod} onChange={v => f('noticePeriod', v)} select options={NOTICE_PERIODS} />
              <div className="flex flex-col gap-1.5">
                <label className="form-label">Buyout Option</label>
                <div onClick={() => f('buyoutAllowed', !form.buyoutAllowed)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${form.buyoutAllowed ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${form.buyoutAllowed ? 'bg-emerald-500' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.buyoutAllowed ? 'right-0.5' : 'left-0.5'}`} />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-widest ${form.buyoutAllowed ? 'text-emerald-300' : 'text-slate-500'}`}>
                    {form.buyoutAllowed ? 'YES — Open to buyout' : 'NO buyout'}
                  </span>
                </div>
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="form-label">AI Match Source</label>
                <div onClick={() => f('matchFromDatabase', !form.matchFromDatabase)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${form.matchFromDatabase ? 'border-blue-500/40 bg-blue-500/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${form.matchFromDatabase ? 'bg-blue-500' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.matchFromDatabase ? 'right-0.5' : 'left-0.5'}`} />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-widest ${form.matchFromDatabase ? 'text-blue-300' : 'text-slate-500'}`}>
                    {form.matchFromDatabase ? 'Use existing CV database for best match' : 'Manual match only'}
                  </span>
                </div>
              </div>
            </Section>

            <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" />Post Vacancy Listing</>}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .form-label { display: block; font-size: 0.625rem; color: #64748b; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.375rem; }
        .form-input { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.75rem; padding: 0.625rem 1rem; color: white; font-size: 0.875rem; outline: none; transition: border-color 0.15s; width: 100%; font-weight: 500; }
        .form-input:focus { border-color: rgba(37,99,235,0.6); }
        .form-input option { background: #0a0a0a; }
      `}</style>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] uppercase tracking-widest font-black text-slate-600 pb-2 border-b border-white/5">{title}</h3>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  )
}

function FormField({ label, value, onChange, placeholder, type = 'text', select, options, min }: {
  label: string;
  value: any;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  select?: boolean;
  options?: string[];
  min?: string;
}) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {select && options ? (
        <select value={value} onChange={e => onChange(e.target.value)} className="form-input">
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} min={min} className="form-input" />
      )}
    </div>
  )
}

function IntelligenceItem({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 mb-0.5">
        {icon}
        <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest truncate">{label}</span>
      </div>
      <p className="text-xs font-bold text-slate-200 truncate">{value}</p>
    </div>
  )
}
