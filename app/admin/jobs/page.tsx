'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Plus, BrainCircuit, MapPin, Briefcase, Clock, Users,
  Building2, Wifi, WifiOff, Monitor, MonitorPlay, Banknote,
  CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp,
  Calendar, PhoneCall, ShoppingBag, Layers, Tag, X, Target
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
      setIsOpen(false)
      setForm({ ...EMPTY_FORM })
      fetchJobs()
      flashAlert({ type: 'success', message: 'Job listing created successfully.' })
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Vacancy Management</h1>
          <p className="text-slate-400 font-medium">
            {loading ? 'Loading vacancies...' : `${jobs.length} vacancies · ${activeCount} active in market`}
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Post New Vacancy
        </button>
      </div>

      <AnimatePresence>
        {alert && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`flex items-center gap-3 px-5 py-4 rounded-xl border text-sm font-medium ${alert.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
            {alert.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {alert.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job Matrix */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {jobs.map(job => {
            const skills = Array.isArray(job.requiredSkills) ? job.requiredSkills : []
            const isExpanded = expandedId === job.id

            return (
              <motion.div key={job.id} layout>
                <Card className="glass-card border-white/5 hover:border-blue-500/20 transition-all group overflow-hidden relative p-0">
                  {/* Glow */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] rounded-full pointer-events-none transition-all group-hover:bg-blue-600/10" />

                  <div className="p-6 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                          <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                            {job.title}
                          </h3>
                          <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border ${statusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-bold uppercase tracking-wider">
                           {job.clientName && <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-blue-500" />{job.clientName}</span>}
                           <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-violet-500" />{job.department || 'General'}</span>
                           <span className={`px-2 py-0.5 rounded border text-[8px] font-black tracking-widest ${job.category === 'IT' ? 'text-blue-400 border-blue-500/30' : 'text-amber-400 border-amber-500/30'}`}>
                              {job.category || 'IT'}
                           </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                         <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Open Positions</div>
                         <div className="text-2xl font-black text-white">{job.openPositions}</div>
                      </div>
                    </div>

                    {/* EASYHIRE RECRUITMENT INTELLIGENCE (Surfaced Data) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <IntelligenceItem icon={<MapPin className="w-3.5 h-3.5 text-red-400" />} label="Location" value={job.location || 'Remote'} />
                        <IntelligenceItem icon={<Wifi className="w-3.5 h-3.5 text-emerald-400" />} label="Setting" value={job.workSetting || 'Remote'} />
                        <IntelligenceItem icon={<Briefcase className="w-3.5 h-3.5 text-blue-400" />} label="Type" value={job.positionType || 'Permanent'} />
                        <IntelligenceItem icon={<Clock className="w-3.5 h-3.5 text-amber-400" />} label="Notice" value={job.noticePeriod || 'Immediate'} />
                    </div>

                    <div className="flex justify-between items-start gap-4">
                       <div className="flex-1">
                          <p className="text-sm text-slate-400 font-medium leading-relaxed line-clamp-2">{job.description}</p>
                       </div>
                       <div className="shrink-0 text-right">
                          <p className="text-[10px] uppercase font-black text-slate-600 tracking-widest mb-1">Buyout Option</p>
                          <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border tracking-widest ${job.buyoutAllowed ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-slate-600 border-white/5 bg-white/5'}`}>
                             {job.buyoutAllowed ? 'YES' : 'NO'}
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {skills.slice(0, 5).map(s => (
                        <span key={s} className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/10 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                          {s}
                        </span>
                      ))}
                      {skills.length > 5 && <span className="px-2.5 py-1 rounded-lg text-slate-500 text-[10px] font-bold">+{skills.length - 5}</span>}
                    </div>

                    <div className="pt-2 flex flex-col gap-4">
                       <div className="flex items-center justify-between text-[10px] text-slate-500 font-black uppercase tracking-widest border-t border-white/5 pt-4">
                          <div className="flex items-center gap-4">
                             <span className="flex items-center gap-1.5"><MonitorPlay className="w-3 h-3" /> {job.interviewMode || 'Virtual'}</span>
                             <span className="flex items-center gap-1.5"><Banknote className="w-3 h-3" /> {job.salaryRange || 'Competitive'}</span>
                          </div>
                          <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                       </div>

                       <Link href={`/admin/matches/${job.id}`}>
                          <button className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_4px_15px_rgba(37,99,235,0.2)]">
                             <Target className="w-4 h-4" /> View Best Matches
                          </button>
                       </Link>
                    </div>
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
