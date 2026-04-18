'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Briefcase, MapPin, Building2, Zap, ArrowRight,
  BrainCircuit, Layers, Clock, Banknote, Search,
  ChevronRight, Sparkles, Filter
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'

export default function PublicJobBoard() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch('/api/public/jobs')
        const data = await res.json()
        setJobs(data.jobs || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [])

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.description.toLowerCase().includes(search.toLowerCase()) ||
    j.department?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30">
      
      {/* Premium Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <BrainCircuit className="w-6 h-6 text-white" />
             </div>
             <span className="text-xl font-black tracking-tighter">EasyHire <span className="text-blue-500">LT</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
             <a href="#" className="hover:text-blue-400 transition-colors">Platform</a>
             <a href="#" className="hover:text-blue-400 transition-colors">Pricing</a>
             <a href="#" className="hover:text-blue-400 transition-colors">About</a>
          </div>
          <Link href="/admin/login">
            <button className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold hover:bg-white/5 transition-all">Recruiter Login</button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6 relative z-10">
           <motion.div 
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
             className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-[10px] font-black uppercase tracking-widest text-blue-400"
           >
              <Sparkles className="w-3 h-3" /> Powered by Advanced AI Matching
           </motion.div>
           <motion.h1 
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
             className="text-5xl md:text-7xl font-black tracking-tighter"
           >
             The AI Future of <br/><span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400"> Recruitment is Here.</span>
           </motion.h1>
           <motion.p 
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
             className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
           >
             Skip the manual screening. Our platform analyzes your CV instantly to find the perfect role fit across top global firms.
           </motion.p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pb-32">
        
        {/* Search & Filter Bar */}
        <div className="glass-card mb-12 flex flex-col md:flex-row items-stretch gap-4 p-2 bg-white/[0.02] border border-white/5">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search by role, skill, or department..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-transparent border-none px-12 py-4 outline-none text-white placeholder:text-slate-600"
              />
           </div>
           <div className="flex gap-2">
              <button className="px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 text-sm font-bold transition-all">
                <Filter className="w-4 h-4" /> Filters
              </button>
              <button className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black transition-all shadow-lg shadow-blue-600/20">
                Find Jobs
              </button>
           </div>
        </div>

        {/* Job Listings */}
        {loading ? (
           <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-12 h-12 rounded-full border-t-2 border-blue-500 animate-spin" />
              <p className="text-slate-500 animate-pulse">Synchronizing with global job matrix...</p>
           </div>
        ) : filteredJobs.length === 0 ? (
           <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.01]">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-slate-700" />
              <p className="text-xl font-bold text-slate-400">No matching roles found.</p>
              <p className="text-sm text-slate-500 mt-2">Try adjusting your search parameters.</p>
           </div>
        ) : (
          <div className="grid gap-6">
            {filteredJobs.map((job, index) => (
              <motion.div 
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="glass-card border-white/5 hover:border-blue-500/30 transition-all bg-[#080c1d] overflow-hidden group">
                   <div className="p-8 flex flex-col md:flex-row items-center gap-8">
                      {/* Left: Metadata */}
                      <div className="flex-1 space-y-4">
                         <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest">{job.department || 'Engineering'}</span>
                            {job.category && (
                              <span className="px-3 py-1 rounded bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">{job.category}</span>
                            )}
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5"><MapPin className="w-3 h-3"/> {job.location || 'Remote'}</span>
                         </div>
                         <div>
                            <h2 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">{job.title}</h2>
                            <p className="text-slate-400 text-sm mt-2 line-clamp-2 leading-relaxed">{job.description}</p>
                         </div>
                         <div className="flex flex-wrap gap-2 pt-2">
                           {job.requiredSkills?.slice(0, 5).map((s: string) => (
                             <span key={s} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold uppercase">{s}</span>
                           ))}
                         </div>
                      </div>

                      {/* Middle: Highlights */}
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4 w-full md:w-auto shrink-0 md:px-8 border-t md:border-t-0 md:border-l border-white/5 pt-8 md:pt-0">
                         <Highlight label="Experience" value={`${job.experienceRequired}+ Yrs`} icon={<Clock className="w-4 h-4" />} />
                         <Highlight label="Salary" value={job.salaryRange || 'Competitive'} icon={<Banknote className="w-4 h-4" />} />
                         <Highlight label="Work Setting" value={job.workSetting || 'Hybrid'} icon={<Building2 className="w-4 h-4" />} />
                         <Highlight label="Type" value={job.positionType || 'Permanent'} icon={<Layers className="w-4 h-4" />} />
                      </div>

                      {/* Right: Apply Action */}
                      <div className="shrink-0 w-full md:w-auto">
                         <Link href={`/jobs/apply/${job.id}`}>
                           <button className="w-full md:w-48 h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm transition-all flex items-center justify-center gap-2 group/btn">
                             Apply Now
                             <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                           </button>
                         </Link>
                      </div>
                   </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-black/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-3">
              <BrainCircuit className="w-6 h-6 text-blue-500" />
              <span className="text-lg font-black tracking-tighter">EasyHire <span className="text-blue-500">LT</span></span>
           </div>
           <p className="text-slate-500 text-xs font-medium">© 2026 EasyHire Platform. Built with Advanced AI.</p>
           <div className="flex gap-6 text-sm text-slate-400 font-medium">
              <a href="#" className="hover:text-blue-400">Terms</a>
              <a href="#" className="hover:text-blue-400">Privacy</a>
              <a href="#" className="hover:text-blue-400">Security</a>
           </div>
        </div>
      </footer>

    </div>
  )
}

function Highlight({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="space-y-1 min-w-[100px]">
       <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
          {icon} <span>{label}</span>
       </div>
       <p className="text-sm font-bold text-slate-200">{value}</p>
    </div>
  )
}
