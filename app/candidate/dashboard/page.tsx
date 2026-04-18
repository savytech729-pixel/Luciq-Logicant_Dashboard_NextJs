'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Briefcase, MapPin, Code2, Zap, Target, Clock, ArrowRight } from 'lucide-react'

import { useCandidate } from '@/lib/hooks/useCandidate'

export default function CandidateDashboard() {
  const { candidate, loading } = useCandidate()

  if (loading) return null

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">My Intelligence Profile</h1>
          <p className="text-slate-400">Keep your datasets updated to increase ranking latency.</p>
        </div>
        {candidate && (
          <Link href="/candidate/profile">
            <button className="hidden sm:flex px-4 py-2 bg-white/[0.05] border border-white/10 hover:bg-white/10 rounded-lg text-sm text-white transition-colors">
              Update Profile Data
            </button>
          </Link>
        )}
      </div>

      {candidate?.matches?.some((m: any) => m.status === 'SELECTED' || m.status === 'HIRED') && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.1)]"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-4 text-center md:text-left">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                   <Target className="w-8 h-8 text-emerald-400 animate-pulse" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-white tracking-tight">Congratulations, {candidate.name}!</h3>
                   <p className="text-slate-300 font-medium">You have been selected for a premium role. Our talent partners will coordinate the next phase.</p>
                </div>
             </div>
             <Link href="/candidate/jobs" className="flex-shrink-0">
                <button className="px-6 py-3 bg-white text-black font-black text-sm rounded-xl hover:bg-emerald-50 transition-all shadow-xl shadow-white/10 flex items-center gap-2 group">
                   Schedule Briefing <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
             </Link>
          </div>
        </motion.div>
      )}

      {!candidate ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="glass-card overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl text-white">Initialization Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-400">
                You must complete your candidate schema mapping to become visible to the matching engine.
              </p>
              <Link href="/candidate/profile" className="inline-block mt-2">
                <button className="btn-primary">
                  Go to Setup Phase
                </button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-12">
          {/* Identity Card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-8">
            <Card className="glass-card h-full overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full group-hover:bg-blue-600/20 transition-all duration-700 pointer-events-none" />
              <CardContent className="p-8 relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-blue-800 flex items-center justify-center text-3xl font-bold text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                    {candidate.name.charAt(0)}
                  </div>
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{candidate.name}</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-slate-300 text-sm">
                      <div className="flex items-center"><Briefcase className="w-4 h-4 mr-1 text-blue-500" /> {candidate.currentRole}</div>
                      <div className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-blue-500" /> {candidate.experienceYears} Yrs Exp</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                      <Code2 className="w-4 h-4 mr-2" /> Top Mapped Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.slice(0, 5).map((skill: string) => (
                        <span key={skill} className="px-2 py-1 rounded bg-white/[0.05] border border-white/5 text-slate-300 text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Visibility Status Card */}
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="md:col-span-4">
            <Card className="glass-card h-full overflow-hidden relative group">
              <CardHeader>
                <CardTitle className="flex items-center text-white text-lg">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-3 shadow-[0_0_8px_#2563eb]" />
                  Active Model
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-400 text-sm leading-relaxed">
                  Your profile has been fully indexed. You are currently visible in {candidate.matches?.length || 0} active requisition searches.
                </p>
                <Link href="/candidate/profile" className="block w-full">
                  <button className="w-full text-center px-4 py-2 bg-white/[0.03] hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors mt-2">
                    Update Profile Data
                  </button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* NEW: Live Recruitment Feed */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-12">
            <Card className="glass-card overflow-hidden bg-transparent border-white/5">
              <CardHeader className="border-b border-white/5 px-8 py-6">
                <div className="flex items-center justify-between">
                   <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                      <Target className="w-5 h-5 text-blue-500" /> Live Recruitment Tracker
                   </CardTitle>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Real-time Pipeline Sync</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {(!candidate.matches || candidate.matches.length === 0) ? (
                   <div className="p-12 text-center">
                      <p className="text-slate-500 italic">No active recruitment matching sequences detected for your profile yet.</p>
                   </div>
                ) : (
                   <div className="divide-y divide-white/5">
                      {candidate.matches.map((match: any, idx: number) => (
                        <div key={match.jobId} className="px-8 py-6 flex items-center justify-between hover:bg-white/[0.01] transition-all group">
                           <div className="flex items-center gap-6">
                              <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-600/20 transition-all">
                                 <Briefcase className="w-5 h-5 text-blue-500" />
                              </div>
                              <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-bold text-white">Matched Requisition #{idx + 1}</span>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                                      match.status === 'SELECTED' ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]' :
                                      match.status === 'SHORTLISTED' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                                      'bg-white/5 border-white/10 text-slate-400'
                                    }`}>
                                      {match.status}
                                    </span>
                                 </div>
                                 <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                    <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-500" /> AI Score: {match.score}%</span>
                                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Updated {new Date(match.updatedAt).toLocaleDateString()}</span>
                                 </div>
                              </div>
                           </div>
                           <Link href="/candidate/jobs">
                              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
                                 View Opportunity <ArrowRight className="w-3 h-3" />
                              </button>
                           </Link>
                        </div>
                      ))}
                   </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  )
}
