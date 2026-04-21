'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { BrainCircuit, Briefcase, Zap, CheckCircle2, AlertCircle } from 'lucide-react'

import { useCandidate } from '@/lib/hooks/useCandidate'

export default function CandidateJobsPage() {
  const { getJobs, loading: initialLoading } = useCandidate()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({})

  const [activeJob, setActiveJob] = useState<any>(null)
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApplyClick = async (job: any) => {
    setActiveJob(job)
    setAnswers([])
    setError(null)
    setIsQuestionsLoading(true)
    
    try {
      const res = await fetch(`/api/jobs/${job.id}/questions`)
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Failed to fetch questions')
      
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions)
      } else {
        // Fallback if AI fails
        setQuestions(job.screeningQuestions || ["Tell us why you are a great fit for this role?", "What is your biggest professional achievement?"])
      }
    } catch (err: any) {
      console.error('Failed to fetch questions', err)
      setError(err.message)
      // Final fallback
      setQuestions(job.screeningQuestions || ["Tell us why you are a great fit for this role?", "What is your biggest professional achievement?"])
    } finally {
      setIsQuestionsLoading(false)
    }
  }

  const submitApplication = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const formattedAnswers = questions.map((q, idx) => ({
        question: q,
        answer: answers[idx]
      }))

      const res = await fetch('/api/candidate/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: activeJob.id, answers: formattedAnswers })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')

      setAppliedJobs(prev => ({...prev, [activeJob.id]: true}))
      setActiveJob(null)
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }


  useEffect(() => {
    const fetchJobs = async () => {
      const data = await getJobs()
      setJobs(data)
      setLoading(false)
    }
    fetchJobs()
  }, [getJobs])

  if (loading || initialLoading) return null

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Available Vacancies</h1>
        <p className="text-slate-400">View open vacancies and your AI match score.</p>
      </div>

      {/* AI SCREENING DIALOG */}
      <AnimatePresence>
        {activeJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveJob(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#111] border border-white/10 p-8 rounded-3xl w-full max-w-xl shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                       <BrainCircuit className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                       <h3 className="text-xl font-bold text-white">AI Candidate Screening</h3>
                       <p className="text-sm text-slate-400">{activeJob.title}</p>
                    </div>
                 </div>

                 {isQuestionsLoading ? (
                   <div className="py-12 text-center space-y-4">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-slate-400 text-sm animate-pulse">Generating job-specific questions...</p>
                   </div>
                 ) : (
                   <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                      {questions.map((q, idx) => (
                        <div key={idx} className="space-y-3">
                           <Label className="text-slate-300 text-sm font-medium">{q}</Label>
                           <textarea 
                             className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-blue-500 transition-all min-h-[100px] resize-none"
                             placeholder="Provide your detailed response..."
                             value={answers[idx] || ""}
                             onChange={(e) => {
                               const newAnswers = [...answers]
                               newAnswers[idx] = e.target.value
                               setAnswers(newAnswers)
                             }}
                           />
                        </div>
                      ))}
                   </div>
                 )}

                 {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                       <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                       <div className="flex-1">
                          <p className="text-xs text-red-300 leading-relaxed font-bold mb-1">Application Error</p>
                          <p className="text-[10px] text-red-200/70 leading-relaxed">{error}</p>
                          {error.toLowerCase().includes('profile') && (
                            <Link href="/candidate/profile" className="inline-block mt-2 text-[10px] font-bold text-blue-400 hover:underline">
                              Go to Profile →
                            </Link>
                          )}
                       </div>
                    </div>
                 )}

                 <div className="flex gap-3 mt-8">
                    <button onClick={() => setActiveJob(null)} className="flex-1 py-3 border border-white/10 text-white rounded-xl font-bold hover:bg-white/5 transition-all">Cancel</button>
                    <button 
                      onClick={submitApplication} 
                      disabled={isSubmitting || isQuestionsLoading || answers.length < questions.length || answers.some(a => !a)} 
                      className={`flex-[2] rounded-xl font-bold h-12 text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                        (isSubmitting || isQuestionsLoading || answers.length < questions.length || answers.some(a => !a))
                        ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Analyzing...
                        </>
                      ) : 'Submit Application'}
                    </button>
                 </div>

              </motion.div>
          </div>
        )}
      </AnimatePresence>

      {jobs.length === 0 ? (
        <Card className="glass-card bg-transparent shadow-none text-center py-16 border-dashed border-white/20">
          <p className="text-slate-500">No active vacancies found in the system.</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {jobs.map((job) => {
             let parsedSkills = []
             if (Array.isArray(job.requiredSkills)) parsedSkills = job.requiredSkills
             else if (typeof job.requiredSkills === 'string') {
                try { parsedSkills = JSON.parse(job.requiredSkills) } 
                catch(e) { parsedSkills = [job.requiredSkills] }
             }

             return (
              <Card key={job.id} className="glass-card flex flex-col h-full hover:border-blue-500/50 transition-colors">
                <CardHeader className="pb-4 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-white">{job.title}</CardTitle>
                      <CardDescription className="text-slate-400 mt-1 flex items-center">
                        <Briefcase className="w-3 h-3 mr-1" /> {job.location || 'Remote'} • {job.experienceRequired}+ Yrs
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end">
                       <div className="flex flex-col items-center justify-center bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 min-w-[70px] mb-2">
                         <span className="text-xs text-blue-400 font-semibold mb-1">Match</span>
                         <span className="text-xl font-bold text-white leading-none">{job.matchScore}%</span>
                       </div>
                       {appliedJobs[job.id] ? (
                         <button className="flex items-center text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full cursor-default">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Applied
                         </button>
                       ) : (
                         <button 
                           onClick={() => handleApplyClick(job)}
                           className="flex items-center text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-full transition-colors shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                         >
                            <Zap className="w-3 h-3 mr-1" /> Screen & Apply
                         </button>
                       )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4 pt-4">
                  <p className="text-sm text-slate-300 line-clamp-3">{job.description}</p>
                  <div>
                    <p className="text-xs text-slate-500 mb-2 uppercase font-medium tracking-wider">Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {parsedSkills.map((s: string) => (
                        <span key={s} className="px-2 py-1 rounded-md bg-white/[0.05] border border-white/10 text-slate-300 text-xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
             )
          })}
        </div>
      )}
    </div>
  )
}
