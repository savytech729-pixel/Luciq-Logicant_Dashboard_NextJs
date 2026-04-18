'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, BrainCircuit, Mail, MapPin, Briefcase } from 'lucide-react'

import { useTalent } from '@/lib/hooks/useTalent'

export default function CandidateDetailPage() {
  const { id } = useParams()
  const { getCandidateById, loading: initialLoading } = useTalent()
  const [candidate, setCandidate] = useState<any>(null)
  const [aiSummary, setAiSummary] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCandidate = async () => {
      if (!id) return
      const data = await getCandidateById(id as string)
      if (data) {
        setCandidate(data.candidate)
        setAiSummary(data.aiSummary || [])
      }
      setLoading(false)
    }
    fetchCandidate()
  }, [id, getCandidateById])

  if (loading || initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <BrainCircuit className="h-8 w-8 text-blue-500 animate-pulse" />
        <p className="text-slate-400">Generative AI analyzing candidate footprint...</p>
      </div>
    )
  }

  if (!candidate) return <div className="text-white">Candidate not found.</div>

  let skills = []
  if (Array.isArray(candidate.skills)) skills = candidate.skills
  else if (typeof candidate.skills === 'string') {
    try { skills = JSON.parse(candidate.skills) } catch (e) { skills = [candidate.skills] }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center space-x-4 mb-4">
         <Link href="/admin/candidates">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
            <ArrowLeft className="h-4 w-4 text-white" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{candidate.name}</h1>
          <p className="text-slate-400 mt-1 flex items-center">
             <Mail className="w-4 h-4 mr-2" /> {candidate.user.email}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-4 space-y-6">
          <Card className="glass-card">
             <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-4">
               <CardTitle className="text-lg text-white">Base Profile</CardTitle>
             </CardHeader>
             <CardContent className="pt-6 space-y-4">
               <div className="space-y-1">
                 <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">Target Role</p>
                 <p className="text-slate-200 font-medium flex items-center"><Briefcase className="w-4 h-4 mr-2 text-blue-400" /> {candidate.currentRole}</p>
               </div>
               <div className="space-y-1">
                 <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">Experience</p>
                 <p className="text-slate-200 font-medium flex items-center"><MapPin className="w-4 h-4 mr-2 text-blue-400" /> {candidate.experienceYears} Years Documented</p>
               </div>
               <div className="space-y-2 pt-2">
                 <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">Extracted Top Skills</p>
                 <div className="flex flex-wrap gap-2">
                   {skills.map((s: string) => <span key={s} className="px-2 py-1 rounded-md bg-white/[0.05] border border-white/10 text-slate-300 text-xs">{s}</span>)}
                 </div>
               </div>
             </CardContent>
          </Card>
        </div>

        <div className="md:col-span-8">
          <Card className="glass-card h-full border-blue-500/30 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] rounded-full pointer-events-none" />
            <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-4 flex flex-row items-center space-y-0 gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                 <BrainCircuit className="text-blue-400 w-5 h-5" />
              </div>
              <CardTitle className="text-xl text-white">AI Candidate Intelligence</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 z-10 relative">
              <ul className="space-y-6">
                 {aiSummary.map((point: string, idx: number) => (
                   <motion.li 
                     key={idx}
                     initial={{ opacity: 0, x: -10 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: idx * 0.2 }}
                     className="flex items-start"
                   >
                     <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold mr-4 mt-0.5 shrink-0">
                       {idx + 1}
                     </div>
                     <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                       {point}
                     </p>
                   </motion.li>
                 ))}
              </ul>
              
              <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                 <button className="bg-white/5 hover:bg-white/10 text-white text-sm px-6 py-2 rounded-full border border-white/10 transition-colors">
                   Export Telemetry PDF
                 </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
