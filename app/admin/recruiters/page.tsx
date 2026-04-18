'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  UserCog, Shield, Activity, Lock, Plus, Mail,
  Trash2, Power, PowerOff, Loader2, CheckCircle2,
  AlertCircle, X, ShieldCheck, Eye, EyeOff, UserX, Users
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface RecruiterUser {
  id: string
  email: string
  createdAt: string
}

interface Recruiter {
  id: string
  userId: string
  name: string
  jobTitle: string
  scope: string
  isActive: boolean
  createdAt: string
  user: RecruiterUser
}

type AlertState = { type: 'success' | 'error'; message: string } | null

const SCOPE_OPTIONS = [
  'Global Admin',
  'Restricted (Engineering)',
  'Restricted (Sourcing)',
  'Technical Screener',
  'Tenant/Scoped',
]

const JOB_TITLE_OPTIONS = [
  'Lead Talent Partner',
  'Technical Screener',
  'Sourcing Specialist',
  'External Agency',
  'Talent Acquisition Manager',
  'Recruitment Coordinator',
]

function scopeColor(scope: string) {
  if (scope.includes('Global')) return 'text-purple-400 bg-purple-500/10 border-purple-500/25'
  if (scope.includes('Engineering')) return 'text-blue-400 bg-blue-500/10 border-blue-500/25'
  if (scope.includes('Sourcing')) return 'text-amber-400 bg-amber-500/10 border-amber-500/25'
  if (scope.includes('Tenant')) return 'text-slate-300 bg-white/5 border-white/15'
  return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25'
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

export default function AdminRecruitersPage() {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState<AlertState>(null)

  // Add dialog state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({
    name: '', email: '', password: '', jobTitle: JOB_TITLE_OPTIONS[0], scope: SCOPE_OPTIONS[0]
  })
  const [showPwd, setShowPwd] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addStep, setAddStep] = useState<'form' | 'saving' | 'done'>('form')

  // Confirm delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Recruiter | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // In-flight toggle tracking
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const flashAlert = (a: AlertState) => {
    setAlert(a)
    setTimeout(() => setAlert(null), 4500)
  }

  const fetchRecruiters = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/recruiters')
      const data = await res.json()
      if (data.recruiters) setRecruiters(data.recruiters)
    } catch {
      flashAlert({ type: 'error', message: 'Failed to load recruiters.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRecruiters() }, [fetchRecruiters])

  // ── Add Recruiter ─────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addForm.name || !addForm.email || !addForm.password) {
      flashAlert({ type: 'error', message: 'All fields are required.' })
      return
    }
    if (addForm.password.length < 8) {
      flashAlert({ type: 'error', message: 'Password must be at least 8 characters.' })
      return
    }
    setAddLoading(true)
    setAddStep('saving')
    try {
      const res = await fetch('/api/admin/recruiters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAddStep('done')
      setTimeout(() => {
        setIsAddOpen(false)
        setAddStep('form')
        setAddForm({ name: '', email: '', password: '', jobTitle: JOB_TITLE_OPTIONS[0], scope: SCOPE_OPTIONS[0] })
        fetchRecruiters()
      }, 1800)
    } catch (err: any) {
      flashAlert({ type: 'error', message: err.message })
      setAddStep('form')
    } finally {
      setAddLoading(false)
    }
  }

  // ── Toggle Active / Inactive ──────────────────────────────────
  const handleToggle = async (recruiter: Recruiter) => {
    setTogglingId(recruiter.id)
    try {
      const res = await fetch(`/api/admin/recruiters/${recruiter.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !recruiter.isActive }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRecruiters(prev =>
        prev.map(r => r.id === recruiter.id ? { ...r, isActive: !r.isActive } : r)
      )
      flashAlert({ type: 'success', message: data.message })
    } catch (err: any) {
      flashAlert({ type: 'error', message: err.message })
    } finally {
      setTogglingId(null)
    }
  }

  // ── Delete Recruiter ──────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/admin/recruiters/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRecruiters(prev => prev.filter(r => r.id !== deleteTarget.id))
      setDeleteTarget(null)
      flashAlert({ type: 'success', message: 'Recruiter removed successfully.' })
    } catch (err: any) {
      flashAlert({ type: 'error', message: err.message })
    } finally {
      setDeleteLoading(false)
    }
  }

  const activeCount = recruiters.filter(r => r.isActive).length
  const inactiveCount = recruiters.length - activeCount

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">

      {/* Header + CTA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Recruiters &amp; Staff</h1>
          <p className="text-slate-400">Manage internal talent partners and Role-Based Access Control (RBAC).</p>
        </div>
        <button
          onClick={() => { setIsAddOpen(true); setAddStep('form') }}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:shadow-[0_4px_30px_rgba(99,102,241,0.6)]"
        >
          <Plus className="w-4 h-4" />
          Add Recruiter
        </button>
      </div>

      {/* Alert banner */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`flex items-center gap-3 px-5 py-4 rounded-xl border text-sm font-medium ${
              alert.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            {alert.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 shrink-0" />
              : <AlertCircle className="w-4 h-4 shrink-0" />}
            {alert.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Total Staff</p>
            <p className="text-xl font-bold text-white">{loading ? '–' : recruiters.length}</p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Power className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Active</p>
            <p className="text-xl font-bold text-emerald-400">{loading ? '–' : activeCount}</p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <PowerOff className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Inactive</p>
            <p className="text-xl font-bold text-red-400">{loading ? '–' : inactiveCount}</p>
          </div>
        </div>
      </div>

      {/* Recruiter Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : recruiters.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <UserX className="w-10 h-10 text-slate-600" />
          <p className="text-slate-400 text-sm">No recruiters found. Add one to get started.</p>
        </div>
      ) : (
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          layout
        >
          <AnimatePresence mode="popLayout">
            {recruiters.map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={`glass-card border-white/5 transition-all hover:border-white/10 relative overflow-hidden ${!r.isActive ? 'opacity-60' : ''}`}>
                  {/* Inactive overlay badge */}
                  {!r.isActive && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="text-[10px] uppercase font-bold tracking-widest bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                        Inactive
                      </span>
                    </div>
                  )}

                  <CardContent className="p-6">
                    {/* Avatar + scope icon */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center border-2 border-white/10">
                        <span className="text-white text-base font-black">{initials(r.name)}</span>
                      </div>
                      {r.scope.includes('Global') ? (
                        <ShieldCheck className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-500" />
                      )}
                    </div>

                    <h3 className="text-white font-bold text-base leading-tight">{r.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 mb-1">{r.jobTitle}</p>
                    <p className="text-[11px] text-slate-500 truncate mb-4">{r.user.email}</p>

                    {/* Scope badge */}
                    <span className={`inline-flex text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${scopeColor(r.scope)}`}>
                      {r.scope}
                    </span>

                    {/* Status indicator */}
                    <div className="flex items-center gap-1.5 mt-3 mb-4">
                      <span className={`w-1.5 h-1.5 rounded-full ${r.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                      <span className={`text-xs font-medium ${r.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {r.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-4 border-t border-white/5">
                      {/* Activate / Deactivate */}
                      <button
                        onClick={() => handleToggle(r)}
                        disabled={togglingId === r.id}
                        title={r.isActive ? 'Deactivate recruiter' : 'Activate recruiter'}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                          r.isActive
                            ? 'border border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                            : 'border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                      >
                        {togglingId === r.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : r.isActive ? (
                          <><PowerOff className="w-3.5 h-3.5" />Deactivate</>
                        ) : (
                          <><Power className="w-3.5 h-3.5" />Activate</>
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteTarget(r)}
                        title="Delete recruiter"
                        className="flex items-center justify-center px-3 py-2 rounded-xl border border-red-500/25 text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Add Recruiter Dialog ── */}
      <Dialog open={isAddOpen} onOpenChange={(open) => {
        if (!open) { setAddStep('form'); setAddForm({ name: '', email: '', password: '', jobTitle: JOB_TITLE_OPTIONS[0], scope: SCOPE_OPTIONS[0] }) }
        setIsAddOpen(open)
      }}>
        <DialogContent className="glass-card border border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UserCog className="w-5 h-5 text-indigo-400" />
              Add New Recruiter
            </DialogTitle>
          </DialogHeader>

          {addStep === 'form' && (
            <form onSubmit={handleAdd} className="space-y-4 pt-2">
              {/* Super Admin badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                Only Super Admins can provision recruiter accounts.
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block font-medium">Email Address</label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="recruiter@luciqandlogicant.com"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block font-medium">Initial Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    value={addForm.password}
                    onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 8 characters"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500 transition-colors pr-10"
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block font-medium">Job Title</label>
                <select
                  value={addForm.jobTitle}
                  onChange={e => setAddForm(f => ({ ...f, jobTitle: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500 appearance-none"
                >
                  {JOB_TITLE_OPTIONS.map(t => (
                    <option key={t} value={t} className="bg-[#0a0a0a]">{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block font-medium">Access Scope (RBAC)</label>
                <select
                  value={addForm.scope}
                  onChange={e => setAddForm(f => ({ ...f, scope: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500 appearance-none"
                >
                  {SCOPE_OPTIONS.map(s => (
                    <option key={s} value={s} className="bg-[#0a0a0a]">{s}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={addLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-60 mt-2"
              >
                {addLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><Mail className="w-4 h-4" />Create Recruiter Account</>}
              </button>
            </form>
          )}

          {addStep === 'saving' && (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4" />
              <p className="text-slate-300 font-medium">Provisioning account…</p>
              <p className="text-xs text-slate-500 mt-1">Creating user + RBAC profile</p>
            </div>
          )}

          {addStep === 'done' && (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-white font-bold text-lg">Recruiter Provisioned</h3>
              <p className="text-sm text-slate-400 mt-1">Account is active and ready to use.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="glass-card border border-red-500/20 text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5" />
              Remove Recruiter
            </DialogTitle>
          </DialogHeader>

          {deleteTarget && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-black">{initials(deleteTarget.name)}</span>
                </div>
                <div>
                  <p className="text-white font-semibold">{deleteTarget.name}</p>
                  <p className="text-xs text-slate-400">{deleteTarget.user.email}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                <strong>Warning:</strong> This permanently deletes the recruiter profile and their linked user account. This action cannot be undone. <br/>
                Consider <strong>deactivating</strong> instead if you want to preserve history.
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" />Delete Permanently</>}
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
