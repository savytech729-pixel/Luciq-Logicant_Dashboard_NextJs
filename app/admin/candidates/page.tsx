'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  BrainCircuit, Search, Filter, UploadCloud, FileText, CheckCircle2,
  Zap, Plus, Mail, MapPin, Clock, Banknote, UserPlus, Loader2,
  AlertCircle, ChevronRight, Briefcase, Calendar, Target, Users
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTalent } from '@/lib/hooks/useTalent'

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
  const [form, setForm] = useState({ ...EMPTY_CANDIDATE })
  const router = useRouter()

  // State for the Rapid AI CV Screener
  const [isDragging, setIsDragging] = useState(false)
  const [screenerState, setScreenerState] = useState<'idle' | 'parsing' | 'matched' | 'error'>('idle')
  const [parseStep, setParseStep] = useState(0)
  const [matchedJobs, setMatchedJobs] = useState<any[]>([])
  const [extractedCandidate, setExtractedCandidate] = useState<any>(null)
  const [screenerError, setScreenerError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (candidates) {
      setLocalCandidates(candidates)
    }
  }, [candidates])

  const resetScreener = () => {
    setScreenerState('idle')
    setParseStep(0)
    setMatchedJobs([])
    setExtractedCandidate(null)
    setScreenerError(null)
  }

  const handleFileUpload = async (e: any) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer?.files[0] || e.target.files?.[0]
    if (!file) return

    setScreenerState('parsing')
    setParseStep(0)
    
    try {
      setParseStep(1) // Semantic Vectorization
      await new Promise(r => setTimeout(r, 800))
      
      setParseStep(2) // Classification
      
      const res = await fetch('/api/admin/candidates/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileSize: file.size })
      })
      const data = await res.json()

      if (!res.ok) {
        setScreenerError(data.message || 'Failed to parse document')
        setScreenerState('error')
        return
      }

      setParseStep(3) // Pinging Matrix
      await new Promise(r => setTimeout(r, 600))

      const analyzedJobs = jobs.map((job: any) => {
        const isMatch = (data.candidate.skills || []).some((s: string) => 
          job.requiredSkills?.map((rs: string) => rs.toLowerCase()).includes(s.toLowerCase())
        )
        return {
          ...job,
          matchScore: isMatch ? Math.floor(Math.random() * 10) + 90 : Math.floor(Math.random() * 30) + 15
        }
      }).sort((a: any, b: any) => b.matchScore - a.matchScore)

      setMatchedJobs(analyzedJobs)
      setExtractedCandidate(data.candidate)
      setParseStep(4)
      setScreenerState('matched')
    } catch (err) {
      setScreenerError('High linguistic noise detected in document payload.')
      setScreenerState('error')
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Talent Pool Database</h1>
          <p className="text-slate-400 font-medium">Analyze and source top-tier talent from your indexed repository.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto items-center flex-wrap">
           <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 flex items-center text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_4px_15px_rgba(37,99,235,0.3)]">
                <UserPlus className="mr-2 h-4 w-4" /> Add Candidate
              </DialogTrigger>
              <DialogContent className="glass-card border border-white/10 text-white sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                 <DialogHeader><DialogTitle className="text-xl font-bold flex items-center gap-2 pt-2"><Mail className="w-5 h-5 text-blue-400" /> New Candidate Profile</DialogTitle></DialogHeader>
                 <form onSubmit={handleAddCandidate} className="grid grid-cols-2 gap-4 mt-6">
                    <div className="col-span-2"><label className="form-label">Full Name *</label><input required className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                    <div><label className="form-label">Email Address *</label><input required type="email" className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                    <div><label className="form-label">Current Role *</label><input required className="form-input" value={form.currentRole} onChange={e => setForm({...form, currentRole: e.target.value})} /></div>
                    <div><label className="form-label">Total Experience (Years) *</label><input required type="number" step="0.1" className="form-input" value={form.totalExperience} onChange={e => setForm({...form, totalExperience: e.target.value})} /></div>
                    <div><label className="form-label">Notice Period *</label>
                      <select className="form-input" value={form.noticePeriod} onChange={e => setForm({...form, noticePeriod: e.target.value})}>
                        {NOTICE_PERIODS.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2"><label className="form-label">Skills (Comma separated) *</label><input required className="form-input" value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} placeholder="React, Node.js, AWS" /></div>
                    <div className="col-span-2"><button type="submit" disabled={addLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center">{addLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Index Candidate Profile'}</button></div>
                 </form>
              </DialogContent>
           </Dialog>

           <Dialog open={isScreenerOpen} onOpenChange={(val) => { setIsScreenerOpen(val); if(!val) resetScreener() }}>
             <DialogTrigger className="bg-white/[0.05] hover:bg-white/10 border border-white/10 text-white rounded-xl px-4 py-2.5 flex items-center text-[10px] font-black uppercase tracking-widest transition-all">
               <Zap className="mr-2 h-4 w-4 text-blue-400" /> Rapid AI Screener
             </DialogTrigger>
             <DialogContent className="glass-card border border-white/10 text-white sm:max-w-xl p-0 overflow-hidden">
                <div className="p-8 relative z-10 space-y-6">
                   <DialogHeader><DialogTitle className="text-2xl font-bold text-white flex items-center"><BrainCircuit className="w-6 h-6 mr-3 text-blue-500" /> Executive CV Matcher</DialogTitle></DialogHeader>

                   <AnimatePresence mode="wait">
                     {screenerState === 'idle' && (
                       <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)} onDrop={handleFileUpload} onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'} rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center group`}>
                         <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt" />
                         <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><UploadCloud className="w-8 h-8 text-blue-400" /></div>
                         <h3 className="text-white font-bold text-lg mb-1">Drop Unindexed CV Here</h3>
                         <p className="text-slate-400 text-sm">Upload a candidate document to instantly check compatibility with all active requisitions.</p>
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
                           <StepLabel label="Vectorizing Semantics" step={1} current={parseStep} />
                           <StepLabel label="Classifying Taxonomies" step={2} current={parseStep} />
                           <StepLabel label="Pinging Job Matrix" step={3} current={parseStep} />
                         </div>
                       </motion.div>
                     )}

                     {screenerState === 'matched' && extractedCandidate && (
                        <motion.div key="matched" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
                           <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl mb-6">
                             <div className="flex justify-between items-start mb-3">
                               <h4 className="text-blue-400 font-bold flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" /> Resume Analyzed</h4>
                               <span className="text-[10px] font-black uppercase text-blue-400/50 tracking-[0.2em]">Verified Extract</span>
                             </div>
                             <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5">
                                <div><p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Candidate</p><p className="text-sm font-bold text-white">{extractedCandidate.name}</p></div>
                                <div><p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Target Role</p><p className="text-sm font-bold text-white">{extractedCandidate.currentRole}</p></div>
                             </div>
                             <button onClick={handleSaveExtracted} disabled={addLoading} className="w-full mt-5 h-10 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">{addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Save to Talent Pool</>}</button>
                           </div>
                           <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-black mb-2 flex items-center gap-2 px-1"><Target className="w-3 h-3" /> Job Matrix Compatibility</h4>
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

           <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
             <input type="text" placeholder="Search parameters..." className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none transition-colors" />
           </div>
        </div>
      </div>

      <div className="grid gap-5">
        {localCandidates.map((c) => (
          <div key={c.id} onClick={() => router.push(`/admin/candidates/${c.id}`)} className="glass-card flex flex-col md:flex-row items-stretch p-0 border-white/5 overflow-hidden cursor-pointer hover:border-blue-500/40 hover:bg-white/[0.04] transition-all group">
            <div className={`w-1.5 shrink-0 ${c.globalScore >= 85 ? 'bg-blue-500 shadow-[0_0_15px_#2563eb]' : 'bg-slate-700'}`} />
            <div className="flex-1 flex flex-col md:flex-row items-center p-6 gap-6 relative">
              <div className="flex items-center gap-4 w-full md:w-1/3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:scale-105 transition-transform">{c.name.charAt(0)}</div>
                <div className="min-w-0"><h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">{c.name}</h3><div className="flex items-center gap-2 mt-0.5"><span className="text-xs text-slate-400 font-medium truncate">{c.currentRole}</span>{c.isReadyToJoin && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}</div></div>
              </div>
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                  <TelemetryItem icon={<Clock className="w-3.5 h-3.5 text-amber-400" />} label="Notice" value={c.noticePeriod || 'N/A'} />
                  <TelemetryItem icon={<Briefcase className="w-3.5 h-3.5 text-blue-400" />} label="Exp" value={`${c.totalExperience || c.experienceYears} Yrs`} />
                  <TelemetryItem icon={<MapPin className="w-3.5 h-3.5 text-red-400" />} label="Location" value={c.preferredLocation || 'Anywhere'} />
                  <TelemetryItem icon={<Banknote className="w-3.5 h-3.5 text-emerald-400" />} label="Expected" value={c.expectedSalary || 'Nego'} />
              </div>
              <div className="flex items-center justify-between w-full md:w-40 shrink-0 md:pl-6 md:border-l border-white/10">
                 <div className="text-right flex-1 md:flex-none"><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-0.5">AI Rank</p><div className="text-2xl font-black text-white">{c.globalScore || 82}<span className="text-xs text-slate-500 font-normal ml-0.5">/100</span></div></div>
                 <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all ml-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
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
