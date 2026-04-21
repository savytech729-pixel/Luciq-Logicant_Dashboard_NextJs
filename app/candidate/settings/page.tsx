'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Bell, Lock, Shield, Trash2, Globe, Eye, UserCircle } from 'lucide-react'
import { useCandidate } from '@/lib/hooks/useCandidate'

export default function CandidateSettings() {
  const { candidate, loading, updateProfile, isUpdating } = useCandidate()

  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    preferredLocation: ''
  })

  useEffect(() => {
    if (candidate) {
      setEditData({
        name: candidate.name || '',
        phone: candidate.phone || '',
        preferredLocation: candidate.preferredLocation || ''
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-white mb-2">Account Settings</h1>
        <p className="text-slate-400 font-medium">Manage your security, notifications, and personal profile.</p>
      </div>

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
             <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <div>
                   <h4 className="text-sm font-bold text-white">Password</h4>
                   <p className="text-[10px] text-slate-500">Last changed 3 months ago</p>
                </div>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all">Change</button>
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
