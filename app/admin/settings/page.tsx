'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Save,
  UserCircle,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
} from 'lucide-react'
import { PageHero, SurfaceCard, FieldLabel } from '@/components/dashboard/Premium'
import { resizeImageFileToJpegDataUrl } from '@/lib/resize-avatar'

type TabId = 'profile' | 'security'

type AlertState = { type: 'success' | 'error'; message: string } | null

export default function AdminSettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<TabId>('profile')
  const [savingProfile, setSavingProfile] = useState(false)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [alert, setAlert] = useState<AlertState>(null)

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: '',
    avatarUrl: '',
  })

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [savingSecurity, setSavingSecurity] = useState(false)

  const flash = (a: AlertState) => {
    setAlert(a)
    if (a) setTimeout(() => setAlert(null), 5000)
  }

  useEffect(() => {
    const load = async () => {
      const profileRes = await fetch('/api/admin/profile')
      if (profileRes.ok) {
        const data = await profileRes.json()
        if (data.user) {
          setProfile({
            name: data.user.name || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
            jobTitle: data.user.jobTitle || '',
            department: data.user.department || '',
            avatarUrl: data.user.avatarUrl || '',
          })
        }
      } else {
        flash({ type: 'error', message: 'Could not load your profile. Try signing in again.' })
      }
    }
    load()
  }, [])

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        flash({ type: 'error', message: typeof data.error === 'string' ? data.error : 'Save failed.' })
        return
      }
      flash({ type: 'success', message: data.message || 'Profile saved.' })
      if (data.user) {
        setProfile((p) => ({
          ...p,
          avatarUrl: data.user.avatarUrl || p.avatarUrl,
          email: data.user.email || p.email,
        }))
      }
    } finally {
      setSavingProfile(false)
    }
  }

  const saveSecurity = async () => {
    if (!security.newPassword || security.newPassword.length < 8) {
      flash({ type: 'error', message: 'New password must be at least 8 characters.' })
      return
    }
    if (security.newPassword !== security.confirmPassword) {
      flash({ type: 'error', message: 'New password and confirmation do not match.' })
      return
    }
    setSavingSecurity(true)
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: security.currentPassword,
          newPassword: security.newPassword,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        flash({ type: 'error', message: typeof data.error === 'string' ? data.error : 'Could not update password.' })
        return
      }
      flash({ type: 'success', message: 'Password updated. Use it next time you sign in.' })
      setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } finally {
      setSavingSecurity(false)
    }
  }

  const onAvatarSelect = async (file?: File) => {
    if (!file) return
    setAvatarBusy(true)
    try {
      const dataUrl = await resizeImageFileToJpegDataUrl(file)
      setProfile((prev) => ({ ...prev, avatarUrl: dataUrl }))
      flash({ type: 'success', message: 'Photo processed — click Save profile to store it.' })
    } catch (e) {
      flash({ type: 'error', message: e instanceof Error ? e.message : 'Could not use this image.' })
    } finally {
      setAvatarBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const tabs: { id: TabId; label: string; icon: typeof UserCircle }[] = [
    { id: 'profile', label: 'Profile', icon: UserCircle },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-16">
      <PageHero
        eyebrow="Admin"
        title="Settings & profile"
        description="Your account details and sign-in security."
      />

      {alert && (
        <SurfaceCard
          className={`flex items-center gap-3 px-4 py-3 text-sm ${
            alert.type === 'success' ? 'border-emerald-500/35 text-emerald-200' : 'border-red-500/35 text-red-200'
          }`}
        >
          {alert.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          {alert.message}
        </SurfaceCard>
      )}

      <div className="flex flex-wrap gap-2 p-1 rounded-2xl border border-white/10 bg-white/[0.03]">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Icon className="w-4 h-4 opacity-90" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <Card className="glass-card border-white/10 overflow-hidden">
          <CardHeader className="border-b border-white/10 bg-white/[0.02]">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-blue-400" /> Profile & visibility
            </CardTitle>
            <p className="text-xs text-slate-500 font-normal mt-1">
              How you appear in the admin workspace. Email changes apply to login once saved.
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="relative shrink-0">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    className="w-24 h-24 rounded-2xl object-cover border border-white/15 ring-2 ring-white/5"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-2xl ring-2 ring-white/10">
                    {(profile.name || profile.email || 'AD').slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="space-y-3 flex-1 min-w-0">
                <p className="text-sm text-slate-400">
                  Square photos work best. We resize automatically so saving stays reliable.
                </p>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => onAvatarSelect(e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    disabled={avatarBusy}
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white hover:bg-white/[0.1] disabled:opacity-50"
                  >
                    {avatarBusy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 text-blue-400" />
                    )}
                    {avatarBusy ? 'Processing…' : 'Choose photo'}
                  </button>
                  <span className="text-[11px] text-slate-500 self-center">JPG / PNG · saved after you press Save profile</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <FieldLabel>Full name</FieldLabel>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                  placeholder="Your name"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <FieldLabel>Work email</FieldLabel>
                <input
                  type="email"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                  placeholder="name@company.com"
                  value={profile.email}
                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div>
                <FieldLabel>Phone</FieldLabel>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                  placeholder="+91 …"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div>
                <FieldLabel>Job title</FieldLabel>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                  placeholder="e.g. Talent Lead"
                  value={profile.jobTitle}
                  onChange={(e) => setProfile((p) => ({ ...p, jobTitle: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Department</FieldLabel>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                  placeholder="e.g. Operations"
                  value={profile.department}
                  onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={saveProfile}
              disabled={savingProfile}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 transition-colors"
            >
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save profile
            </button>
          </CardContent>
        </Card>
      )}

      {tab === 'security' && (
        <Card className="glass-card border-white/10 overflow-hidden">
          <CardHeader className="border-b border-white/10 bg-white/[0.02]">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-violet-400" /> Password
            </CardTitle>
            <p className="text-xs text-slate-500 font-normal mt-1">
              Change the password you use to sign in to this admin account.
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-5 max-w-lg">
            <div>
              <FieldLabel>Current password</FieldLabel>
              <input
                type="password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                value={security.currentPassword}
                onChange={(e) => setSecurity((s) => ({ ...s, currentPassword: e.target.value }))}
              />
            </div>
            <div>
              <FieldLabel>New password</FieldLabel>
              <input
                type="password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                value={security.newPassword}
                onChange={(e) => setSecurity((s) => ({ ...s, newPassword: e.target.value }))}
              />
            </div>
            <div>
              <FieldLabel>Confirm new password</FieldLabel>
              <input
                type="password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                value={security.confirmPassword}
                onChange={(e) => setSecurity((s) => ({ ...s, confirmPassword: e.target.value }))}
              />
            </div>
            <button
              type="button"
              onClick={saveSecurity}
              disabled={savingSecurity}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {savingSecurity ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Update password
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
