'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  ArrowLeft, BrainCircuit, Phone, Video, CheckCircle2, XCircle,
  Mail, MessageSquare, Loader2, Info, ChevronRight, Zap, Target,
  Clock, MapPin, Banknote, Briefcase
} from 'lucide-react'

import { useTalent } from '@/lib/hooks/useTalent'

export default function JobMatches() {
  const { jobId } = useParams()
  const { getMatches, loading: initialLoading } = useTalent()
  const [matches, setMatches] = useState<any[]>([])
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
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

  const fetchMatches = async () => {
    if (!jobId) return
    const data = await getMatches(jobId as string)
    if (data) {
      setMatches(data.matchedCandidates || [])
      setJob(data.job)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMatches()
  }, [jobId])

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
          jobId,
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
        body: JSON.stringify({ jobId, candidateId, status })
      })
      if (res.ok) {
        setMatches(prev => prev.map(m => m.id === candidateId ? { ...m, pipelineStatus: status } : m))
      }
    } catch (err) {
      console.error('Pipeline update failed', err)
    }
  }

  if (loading || initialLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <BrainCircuit className="h-8 w-8 text-blue-500 animate-pulse" />
      <p className="text-slate-400">Computing multidimensional match vectors...</p>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-8">
        <div className="flex items-center space-x-4">
           <Link href="/admin/jobs">
            <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group">
              <ArrowLeft className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 px-2 py-0.5 rounded bg-blue-500/10">EasyHire Platform</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Live Requisition</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white flex items-center">
              {job?.title || 'Applicant Tracking'}
            </h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              {matches.length} candidates identified by AI Matcher
            </p>
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      <div className="space-y-6">
        {matches.length === 0 ? (
          <Card className="glass-card text-center py-20 bg-white/[0.01] border-dashed">
            <p className="text-slate-500 font-medium">No candidates have met the AI confidence threshold yet.</p>
          </Card>
        ) : (
          matches.map((candidate, index) => {
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
                       <div className="min-w-0">
                          <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                            {candidate.name}
                          </h3>
                          <p className="text-sm text-slate-400 font-medium">{candidate.currentRole} • {candidate.totalExperience || candidate.experienceYears} Years Exp</p>
                          
                          {/* Expanded Contact & Logistics Dossier */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-4">
                             <DetailItem icon={<Mail className="w-3 h-3" />} label="Email" value={candidate.email} />
                             <DetailItem icon={<Phone className="w-3 h-3" />} label="Phone" value={candidate.phone || 'N/A'} />
                             <DetailItem icon={<MapPin className="w-3 h-3" />} label="Location" value={candidate.preferredLocation || candidate.currentCity || 'N/A'} />
                             <DetailItem icon={<Clock className="w-3 h-3" />} label="Notice" value={candidate.noticePeriod || 'Immediate'} />
                             <DetailItem icon={<Banknote className="w-3 h-3" />} label="Expected" value={candidate.expectedSalary ? `₹${candidate.expectedSalary}` : 'N/A'} color="emerald" />
                             <DetailItem icon={<Zap className="w-3 h-3" />} label="Status" value={candidate.isReadyToJoin ? 'Join Ready' : 'Serving Notice'} color="amber" />
                          </div>

                          <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-white/5">
                             {skills.slice(0, 4).map((skill: string) => (
                               <span key={skill} className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                 {skill}
                               </span>
                             ))}
                             {skills.length > 4 && <span className="text-[10px] text-slate-600">+{skills.length - 4} more</span>}
                          </div>
                       </div>
                    </div>

                    {/* Middle: Match Breakdown Visualization */}
                    <div className="w-full lg:w-[400px] p-6 space-y-4">
                       <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="text-xs font-black uppercase tracking-widest text-slate-200">Confidence Matrix</span>
                          </div>
                          <span className="text-2xl font-black text-white">{candidate.score}%</span>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <BreakdownItem label="Skills" score={breakdown.skills} icon={<Briefcase className="w-3 h-3" />} />
                          <BreakdownItem label="Logistics" score={breakdown.logistics} icon={<Clock className="w-3 h-3" />} />
                          <BreakdownItem label="Salary" score={breakdown.salary || 85} icon={<Banknote className="w-3 h-3" />} color="emerald" />
                          <BreakdownItem label="Location" score={breakdown.location} icon={<MapPin className="w-3 h-3" />} color="red" />
                       </div>
                    </div>

                    {/* Right: Quick Actions */}
                    <div className="w-full lg:w-[280px] p-6 flex flex-col justify-between bg-white/[0.02]">
                       <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Instant Outreach</p>
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
                               onClick={() => updateStatus(candidate.id, 'SCREENING')} 
                               color="blue"
                             />
                             <StageButton 
                               label="Shortlist" 
                               active={candidate.pipelineStatus === 'SHORTLISTED'} 
                               onClick={() => updateStatus(candidate.id, 'SHORTLISTED')} 
                               color="amber"
                             />
                             <StageButton 
                               label="Select" 
                               active={candidate.pipelineStatus === 'SELECTED'} 
                               onClick={() => updateStatus(candidate.id, 'SELECTED')} 
                               color="emerald"
                             />
                             <StageButton 
                               label="Reject" 
                               active={candidate.pipelineStatus === 'REJECTED'} 
                               onClick={() => updateStatus(candidate.id, 'REJECTED')} 
                               color="red"
                             />
                          </div>
                          
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
                             <Link href={`/admin/candidates/${candidate.id}`} className="flex-1">
                               <button className="w-full py-1.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 hover:bg-white/10 transition-colors uppercase tracking-widest">
                                 View Profile
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
                  Confirm Placement
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
    </div>
  )
}

function StageButton({ label, active, onClick, color }: any) {
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
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-shrink-0 w-5 h-5 rounded bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-500">
        {icon}
      </div>
      <div className="min-w-0">
         <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 leading-none mb-0.5">{label}</p>
         <p className={`text-[10px] font-bold truncate ${getColors()}`}>{value}</p>
      </div>
    </div>
  )
}

function BreakdownItem({ label, score, icon, color = 'blue' }: { label: string, score: number, icon: React.ReactNode, color?: string }) {
  const getColors = () => {
    if (color === 'emerald') return 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
    if (color === 'red') return 'bg-red-500 shadow-[0_0_8px_#ef4444]'
    return 'bg-blue-500 shadow-[0_0_8px_#3b82f6]'
  }

  return (
    <div className="space-y-1.5">
       <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
          <span className="flex items-center gap-1">{icon}{label}</span>
          <span className="text-slate-300">{score}%</span>
       </div>
       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${score}%` }}
            className={`h-full rounded-full ${getColors()}`}
          />
       </div>
    </div>
  )
}
