'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  User, Mail, Shield, Calendar, Lock, CheckCircle2,
  AlertCircle, Loader2, Edit3, Save, X, ShieldCheck,
  Activity, Clock, KeyRound, Eye, EyeOff
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AdminUser {
  id: string
  email: string
  role: string
  createdAt: string
}

type AlertType = { type: 'success' | 'error'; message: string } | null

export default function AdminProfilePage() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState<AlertType>(null)

  // Email edit
  const [editingEmail, setEditingEmail] = useState(false)
  const [emailDraft, setEmailDraft] = useState('')

  // Password change
  const [editingPassword, setEditingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)

  const flashAlert = (a: AlertType) => {
    setAlert(a)
    setTimeout(() => setAlert(null), 4000)
  }

  useEffect(() => {
    fetch('/api/admin/profile')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
          setEmailDraft(data.user.email)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSaveEmail = async () => {
    if (!emailDraft.trim() || emailDraft === user?.email) {
      setEditingEmail(false)
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailDraft }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUser(data.user)
      setEditingEmail(false)
      flashAlert({ type: 'success', message: 'Email updated successfully.' })
    } catch (err: any) {
      flashAlert({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      flashAlert({ type: 'error', message: 'All password fields are required.' })
      return
    }
    if (newPassword !== confirmPassword) {
      flashAlert({ type: 'error', message: 'New passwords do not match.' })
      return
    }
    if (newPassword.length < 8) {
      flashAlert({ type: 'error', message: 'New password must be at least 8 characters.' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEditingPassword(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      flashAlert({ type: 'success', message: 'Password changed successfully.' })
    } catch (err: any) {
      flashAlert({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  const cancelEmail = () => {
    setEmailDraft(user?.email || '')
    setEditingEmail(false)
  }

  const cancelPassword = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setEditingPassword(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Failed to load profile. Please try again.</p>
      </div>
    )
  }

  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const initials = user.email.slice(0, 2).toUpperCase()

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Admin Profile</h1>
        <p className="text-slate-400">Manage your account identity and security credentials.</p>
      </div>

      {/* Global Alert */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
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

      {/* Profile Hero */}
      <Card className="glass-card overflow-hidden">
        <div
          className="h-28 w-full relative"
          style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(124,58,237,0.15) 50%, rgba(16,185,129,0.1) 100%)',
          }}
        >
          {/* Decorative grid */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
        </div>

        <div className="px-8 pb-8 -mt-12 relative">
          {/* Avatar */}
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white text-3xl font-black border-4 border-[#0A0A0A] shadow-xl">
              {initials}
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0A0A0A] shadow-md" />
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{user.email.split('@')[0]}</h2>
              <p className="text-slate-400 text-sm mt-0.5">{user.email}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full">
                <ShieldCheck className="w-3, h-3" />
                Super Admin
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <div className="flex items-center justify-center mb-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Member Since</p>
              <p className="text-white text-sm font-bold mt-0.5">{joinDate}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <div className="flex items-center justify-center mb-1.5">
                <Shield className="w-4 h-4 text-violet-400" />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Access Level</p>
              <p className="text-white text-sm font-bold mt-0.5">Full Permissions</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <div className="flex items-center justify-center mb-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Status</p>
              <p className="text-emerald-400 text-sm font-bold mt-0.5 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block" />
                Active
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Account Information */}
      <Card className="glass-card overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <CardTitle className="text-lg text-white flex items-center">
            <User className="w-5 h-5 mr-3 text-blue-500" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* User ID (read-only) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">User ID</p>
                <p className="text-slate-300 text-sm font-mono mt-0.5">{user.id}</p>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-slate-600 border border-white/10 px-2 py-1 rounded-md">
              Read-only
            </span>
          </div>

          {/* Email */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-white/5">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Email Address</p>
                {editingEmail ? (
                  <input
                    type="email"
                    value={emailDraft}
                    onChange={e => setEmailDraft(e.target.value)}
                    className="mt-1 w-full max-w-sm bg-black/50 border border-blue-500/40 px-3 py-1.5 rounded-lg text-white text-sm outline-none focus:border-blue-500 transition-colors"
                    autoFocus
                  />
                ) : (
                  <p className="text-white text-sm font-medium mt-0.5">{user.email}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {editingEmail ? (
                <>
                  <button
                    onClick={handleSaveEmail}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save
                  </button>
                  <button
                    onClick={cancelEmail}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditingEmail(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-sm transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* Role (read-only) */}
          <div className="flex items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Account Role</p>
                <p className="text-white text-sm font-medium mt-0.5 flex items-center gap-2">
                  {user.role}
                  <span className="text-[10px] bg-violet-500/15 text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                    System
                  </span>
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-slate-600 border border-white/10 px-2 py-1 rounded-md">
              Read-only
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Security — Password Change */}
      <Card className="glass-card overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <CardTitle className="text-lg text-white flex items-center">
            <Lock className="w-5 h-5 mr-3 text-emerald-500" />
            Security &amp; Password
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {!editingPassword ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Password</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-white text-sm tracking-[0.4em]">••••••••</p>
                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                    <span className="text-xs text-slate-500">Last set at account creation</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingPassword(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-sm font-medium transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                Change Password
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Current Password */}
              <div className="space-y-2">
                <label className="text-sm text-slate-300 font-semibold">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPwd ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full bg-black/50 border border-white/10 px-4 py-2.5 rounded-lg text-white text-sm outline-none focus:border-blue-500 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label className="text-sm text-slate-300 font-semibold">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full bg-black/50 border border-white/10 px-4 py-2.5 rounded-lg text-white text-sm outline-none focus:border-blue-500 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password strength bar */}
                {newPassword && (
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          newPassword.length >= i * 3
                            ? newPassword.length >= 12 ? 'bg-emerald-500' : newPassword.length >= 8 ? 'bg-yellow-500' : 'bg-red-500'
                            : 'bg-white/10'
                        }`}
                      />
                    ))}
                    <span className="text-[10px] text-slate-500 ml-2 self-center">
                      {newPassword.length < 8 ? 'Too short' : newPassword.length < 12 ? 'Fair' : 'Strong'}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <label className="text-sm text-slate-300 font-semibold">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className={`w-full bg-black/50 border px-4 py-2.5 rounded-lg text-white text-sm outline-none transition-colors ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-red-500/50 focus:border-red-500'
                      : 'border-white/10 focus:border-blue-500'
                  }`}
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Passwords do not match
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSavePassword}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Update Password
                </button>
                <button
                  onClick={cancelPassword}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/10 text-slate-400 hover:text-white text-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="glass-card overflow-hidden border border-red-500/15">
        <CardHeader className="bg-red-500/5 border-b border-red-500/15">
          <CardTitle className="text-lg text-red-400 flex items-center">
            <AlertCircle className="w-5 h-5 mr-3" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold text-sm">Sign Out of All Sessions</p>
            <p className="text-slate-400 text-sm mt-1">
              Invalidate all active sessions and return to login. Your data remains intact.
            </p>
          </div>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              window.location.href = '/login'
            }}
            className="shrink-0 px-5 py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-colors"
          >
            Sign Out
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
