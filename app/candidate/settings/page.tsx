'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Bell, Lock, Shield, Trash2, Globe, Eye, UserCircle, Camera } from 'lucide-react'
import { useCandidate } from '@/lib/hooks/useCandidate'
import { PageHero } from '@/components/dashboard/Premium'

export default function CandidateSettings() {
  const { candidate, loading, updateProfile, isUpdating } = useCandidate()

  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    preferredLocation: '',
    profilePic: '',
  })
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    otp: '',
    resetNewPassword: '',
  })
  const [securityBusy, setSecurityBusy] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)

  useEffect(() => {
    if (candidate) {
      setEditData({
        name: candidate.name || '',
        phone: candidate.phone || '',
        preferredLocation: candidate.preferredLocation || '',
        profilePic: candidate.profilePic || '',
      })
    }
  }, [candidate])

  const handleSaveProfile = async () => {
    const success = await updateProfile(editData)
    if (success) {
      alert('Profile updated successfully')
    }
  }

  if (loading) return null

  const handleProfilePhotoUpload = (file?: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG/PNG/WEBP).')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Profile photo should be under 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = String(ev.target?.result || '')
      setEditData((prev) => ({ ...prev, profilePic: dataUrl }))
      setPhotoBusy(true)
      try {
        const ok = await updateProfile({ profilePic: dataUrl })
        if (!ok) throw new Error('Unable to save profile photo')
        alert('Profile photo updated.')
      } catch {
        alert('Failed to update profile photo. Please try again.')
      } finally {
        setPhotoBusy(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleChangePassword = async () => {
    if (!security.currentPassword || !security.newPassword || security.newPassword.length < 8) {
      alert('Enter current password and new password (min 8 chars).')
      return
    }
    if (security.newPassword !== security.confirmPassword) {
      alert('New password and confirm password do not match.')
      return
    }
    setSecurityBusy(true)
    try {
      const res = await fetch('/api/candidate/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-password',
          currentPassword: security.currentPassword,
          newPassword: security.newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change password')
      alert('Password changed successfully.')
      setSecurity((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
    } catch (err: any) {
      alert(err.message || 'Failed to change password')
    } finally {
      setSecurityBusy(false)
    }
  }

  const handleSendResetOtp = async () => {
    setSecurityBusy(true)
    try {
      const res = await fetch('/api/candidate/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-reset-otp' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send reset OTP')
      alert('Reset OTP sent to your email.')
    } catch (err: any) {
      alert(err.message || 'Failed to send reset OTP')
    } finally {
      setSecurityBusy(false)
    }
  }

  const handleResetWithOtp = async () => {
    if (!security.otp || !security.resetNewPassword || security.resetNewPassword.length < 8) {
      alert('Enter OTP and a new password (min 8 chars).')
      return
    }
    setSecurityBusy(true)
    try {
      const res = await fetch('/api/candidate/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password-with-otp',
          otp: security.otp,
          newPassword: security.resetNewPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reset password')
      alert('Password reset successfully.')
      setSecurity((prev) => ({ ...prev, otp: '', resetNewPassword: '' }))
    } catch (err: any) {
      alert(err.message || 'Failed to reset password')
    } finally {
      setSecurityBusy(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <PageHero
        eyebrow="Personal Controls"
        title="Account Settings"
        description="Manage your security, notifications, and personal profile."
      />

      <div className="grid gap-6">
        {/* My Profile Section */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center gap-4">
             <div className="p-2 bg-blue-500/10 rounded-lg">
                <UserCircle className="w-5 h-5 text-blue-500" />
             </div>
             <div>
                <CardTitle className="text-white text-lg">My Profile</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Your personal and contact information.</p>
             </div>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Profile Picture</h4>
                <input
                  id="candidate-settings-profile-photo"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => handleProfilePhotoUpload(e.target.files?.[0])}
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border border-white/10 bg-white/[0.03] flex items-center justify-center">
                      {editData.profilePic ? (
                        <img src={editData.profilePic} alt="Profile preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-slate-500">No Photo</span>
                      )}
                    </div>
                    <label
                      htmlFor="candidate-settings-profile-photo"
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 border border-white/20 flex items-center justify-center cursor-pointer transition-colors"
                      title="Upload profile picture"
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </label>
                  </div>
                  <label
                    htmlFor="candidate-settings-profile-photo"
                    className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-sm text-white cursor-pointer transition-colors"
                  >
                    Upload Profile Pic
                  </label>
                  <p className="text-[11px] text-slate-500">JPG, PNG or WEBP up to 2MB.</p>
                  {photoBusy ? <p className="text-xs text-slate-400">Uploading...</p> : null}
                </div>
             </div>
             <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 px-1">Full Name</h4>
                   <input 
                     type="text"
                     value={editData.name}
                     onChange={(e) => setEditData({...editData, name: e.target.value})}
                     className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-sm text-white px-4 py-3 rounded-xl outline-none transition-all"
                   />
                </div>
                <div className="space-y-2 opacity-50">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 px-1">Email Address (Primary)</h4>
                   <div className="w-full bg-white/5 border border-white/5 text-sm text-slate-400 px-4 py-3 rounded-xl cursor-not-allowed">
                      {candidate?.email || candidate?.user?.email}
                   </div>
                </div>
                <div className="space-y-2">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 px-1">Phone Number</h4>
                   <input 
                     type="text"
                     value={editData.phone}
                     onChange={(e) => setEditData({...editData, phone: e.target.value})}
                     className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-sm text-white px-4 py-3 rounded-xl outline-none transition-all"
                   />
                </div>
                <div className="space-y-2">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 px-1">Location</h4>
                   <input 
                     type="text"
                     value={editData.preferredLocation}
                     onChange={(e) => setEditData({...editData, preferredLocation: e.target.value})}
                     className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-sm text-white px-4 py-3 rounded-xl outline-none transition-all"
                   />
                </div>
             </div>
             <button 
               onClick={handleSaveProfile}
               disabled={isUpdating}
               className="w-full py-3 bg-white/[0.05] border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all disabled:opacity-50"
             >
                {isUpdating ? 'Saving...' : 'Save Personal Info'}
             </button>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center gap-4">
             <div className="p-2 bg-blue-500/10 rounded-lg">
                <Lock className="w-5 h-5 text-blue-500" />
             </div>
             <div>
                <CardTitle className="text-white text-lg">Login & Security</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Manage your password and protect your account.</p>
             </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              <input
                type="password"
                placeholder="Current password"
                value={security.currentPassword}
                onChange={(e) => setSecurity((s) => ({ ...s, currentPassword: e.target.value }))}
                className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-sm text-white px-4 py-3 rounded-xl outline-none transition-all"
              />
              <input
                type="password"
                placeholder="New password"
                value={security.newPassword}
                onChange={(e) => setSecurity((s) => ({ ...s, newPassword: e.target.value }))}
                className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-sm text-white px-4 py-3 rounded-xl outline-none transition-all"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={security.confirmPassword}
                onChange={(e) => setSecurity((s) => ({ ...s, confirmPassword: e.target.value }))}
                className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-sm text-white px-4 py-3 rounded-xl outline-none transition-all"
              />
            </div>
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={securityBusy}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all disabled:opacity-60"
            >
              {securityBusy ? 'Please wait...' : 'Change Password'}
            </button>
            <div className="border-t border-white/10 pt-4 space-y-3">
              <p className="text-xs text-slate-400">Forgot current password? Use reset via OTP.</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSendResetOtp}
                  disabled={securityBusy}
                  className="px-4 py-2 bg-blue-600/10 border border-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all disabled:opacity-60"
                >
                  Send Reset OTP
                </button>
                <input
                  type="text"
                  placeholder="OTP"
                  value={security.otp}
                  onChange={(e) => setSecurity((s) => ({ ...s, otp: e.target.value }))}
                  className="w-28 bg-white/[0.02] border border-white/10 focus:border-blue-500 text-sm text-white px-3 py-2 rounded-lg outline-none"
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={security.resetNewPassword}
                  onChange={(e) => setSecurity((s) => ({ ...s, resetNewPassword: e.target.value }))}
                  className="bg-white/[0.02] border border-white/10 focus:border-blue-500 text-sm text-white px-3 py-2 rounded-lg outline-none"
                />
                <button
                  type="button"
                  onClick={handleResetWithOtp}
                  disabled={securityBusy}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all disabled:opacity-60"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center gap-4">
             <div className="p-2 bg-amber-500/10 rounded-lg">
                <Bell className="w-5 h-5 text-amber-500" />
             </div>
             <div>
                <CardTitle className="text-white text-lg">Notifications</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Choose how you want to be contacted.</p>
             </div>
          </CardHeader>
          <CardContent className="space-y-4">
             {[
               { title: "Interview Invites", desc: "Emails when a recruiter wants to meet you", default: true },
               { title: "New Job Matches", desc: "Alerts for jobs that fit your profile", default: true },
               { title: "Salary Updates", desc: "News about pay trends in your field", default: false }
             ].map((pref) => (
                <div key={pref.title} className="flex items-center justify-between p-4">
                   <div>
                      <h4 className="text-sm font-bold text-white">{pref.title}</h4>
                      <p className="text-[10px] text-slate-500">{pref.desc}</p>
                   </div>
                   <div className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${pref.default ? 'bg-blue-600' : 'bg-slate-800'}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${pref.default ? 'right-1' : 'left-1'}`} />
                   </div>
                </div>
             ))}
          </CardContent>
        </Card>

        {/* Privacy Section */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center gap-4">
             <div className="p-2 bg-purple-500/10 rounded-lg">
                <Eye className="w-5 h-5 text-purple-500" />
             </div>
             <div>
                <CardTitle className="text-white text-lg">Profile Privacy</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Control who can see your resume and skills.</p>
             </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                   <Globe className="w-4 h-4 text-slate-400" />
                   <div>
                      <h4 className="text-sm font-bold text-white">Visible to Recruiters</h4>
                      <p className="text-[10px] text-slate-500">Allow companies to find you in candidate searches.</p>
                   </div>
                </div>
                <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer">
                   <div className="absolute top-1 right-1 w-3 h-3 bg-white rounded-full" />
                </div>
             </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="glass-card border-red-500/20 bg-red-500/[0.01]">
          <CardHeader className="flex flex-row items-center gap-4">
             <div className="p-2 bg-red-500/10 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-500" />
             </div>
             <div>
                <CardTitle className="text-red-500 text-lg">Delete Account</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Permanent actions for your account.</p>
             </div>
          </CardHeader>
          <CardContent>
             <button className="px-6 py-3 border border-red-500/20 hover:bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest rounded-xl transition-all">
                Close My Account
             </button>
             <p className="text-[9px] text-slate-600 mt-4 italic font-medium">This will permanently delete your resume, applications, and all data from our system.</p>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
