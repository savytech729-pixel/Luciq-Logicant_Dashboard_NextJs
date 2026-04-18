'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BrainCircuit, ArrowLeft, UploadCloud, CheckCircle2,
  Briefcase, MapPin, Loader2, Sparkles, Mail, Phone,
  Banknote, Clock, Building2, Terminal, User, Zap
} from 'lucide-react'

const NOTICE_PERIODS = ['Immediate', '15 Days', '30 Days', '45 Days', '60 Days', '90 Days', 'Negotiable']
const WORK_SETTING_PREFS = ['Remote', 'Hybrid', 'On-site']

export default function DirectApplyPage() {
  const { id: jobId } = useParams()
  const router = useRouter()
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    currentRole: '',
    totalExperience: '',
    skills: '',
    expectedSalary: '',
    noticePeriod: 'Immediate',
    preferredLocation: '',
    workSettingPreference: 'Remote',
    cvUrl: 'https://storage.easyhire.lt/temp/cv_upload.pdf',
    linkedInUrl: ''
  })

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch('/api/public/jobs')
        const data = await res.json()
        const found = data.jobs?.find((j: any) => j.id === jobId)
        setJob(found)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchJob()
  }, [jobId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/public/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, jobId })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/jobs'), 4000)
      } else {
        alert(data.error || 'Failed to submit application')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
       <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  )

  if (!job) return (
     <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center space-y-4">
        <p className="text-slate-400 font-bold">Position not found or requisition expired.</p>
        <Link href="/jobs" className="text-blue-500 underline text-sm">Return to Job Board</Link>
     </div>
  )

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30 pb-20">
      
      {/* Header */}
      <nav className="border-b border-white/5 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/jobs" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
             <ArrowLeft className="w-4 h-4" />
             <span className="text-sm font-bold">Back to Open Roles</span>
          </Link>
          <div className="flex items-center gap-2">
             <BrainCircuit className="w-5 h-5 text-blue-500" />
             <span className="text-sm font-black tracking-tighter">EasyHire <span className="text-blue-500">LT</span></span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-12">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
               className="glass-card p-12 text-center space-y-6"
            >
               <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
               </div>
               <div className="space-y-2">
                  <h1 className="text-3xl font-black text-white px-2 py-0.5 rounded bg-blue-500">Application Received!</h1>
                  <p className="text-slate-400">Our AI engine is currently vectorizing your CV and calculating your match compatibility score for <strong>{job.title}</strong>.</p>
               </div>
               <p className="text-xs text-slate-500">Redirecting you back to the job board in a few seconds...</p>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
               
               {/* Job Brief Card */}
               <div className="glass-card p-8 border-blue-500/20 bg-blue-500/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-blue-500/5 to-transparent" />
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                     <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">{job.department}</span>
                        <h1 className="text-3xl font-black text-white">{job.title}</h1>
                        <p className="text-slate-400 text-sm">{job.location} • {job.workSetting} • {job.positionType}</p>
                     </div>
                     <div className="hidden md:block text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Confidential Range</span>
                        <span className="text-xl font-black text-white">{job.salaryRange || 'Competitive'}</span>
                     </div>
                  </div>
               </div>

               {/* Application Form */}
               <form onSubmit={handleSubmit} className="space-y-12">
                  
                  {/* Section 1: Core Identity */}
                  <Section title="Personal Information" icon={<User className="w-4 h-4" />}>
                     <div className="grid md:grid-cols-2 gap-6">
                        <Field label="Full Name *" value={form.name} onChange={v => setForm({...form, name: v})} placeholder="e.g. Rahul Sharma" required />
                        <Field label="Email Address *" type="email" value={form.email} onChange={v => setForm({...form, email: v})} placeholder="rahul@example.com" required />
                        <Field label="Phone Number" value={form.phone} onChange={v => setForm({...form, phone: v})} placeholder="+91 98765 43210" />
                        <Field label="LinkedIn Profile" value={form.linkedInUrl} onChange={v => setForm({...form, linkedInUrl: v})} placeholder="linkedin.com/in/rahul" />
                     </div>
                  </Section>

                  {/* Section 2: Professional Vectors */}
                  <Section title="Professional Telemetry" icon={<Briefcase className="w-4 h-4" />}>
                     <div className="grid md:grid-cols-2 gap-6">
                        <Field label="Target Role *" value={form.currentRole} onChange={v => setForm({...form, currentRole: v})} placeholder="e.g. Senior Frontend Engineer" required />
                        <Field label="Total Experience (Years) *" type="number" step="0.1" value={form.totalExperience} onChange={v => setForm({...form, totalExperience: v})} placeholder="e.g. 5.5" required />
                        <div className="md:col-span-2">
                           <Field label="Key Skills (comma separated) *" value={form.skills} onChange={v => setForm({...form, skills: v})} placeholder="React, Node.js, TypeScript, AWS, Next.js" required />
                        </div>
                     </div>
                  </Section>

                  {/* Section 3: Recruitment Logistics */}
                  <Section title="Hiring Logistics" icon={<Sparkles className="w-4 h-4" />}>
                     <div className="grid md:grid-cols-2 gap-6">
                        <Field label="Notice Period *" value={form.noticePeriod} onChange={v => setForm({...form, noticePeriod: v})} select options={NOTICE_PERIODS} />
                        <Field label="Work Setting Preference" value={form.workSettingPreference} onChange={v => setForm({...form, workSettingPreference: v})} select options={WORK_SETTING_PREFS} />
                        <Field label="Expected Annual Compensation" value={form.expectedSalary} onChange={v => setForm({...form, expectedSalary: v})} placeholder="e.g. ₹18L p.a." />
                        <Field label="Preferred Location" value={form.preferredLocation} onChange={v => setForm({...form, preferredLocation: v})} placeholder="e.g. Mumbai / Remote" />
                     </div>
                  </Section>

                  {/* Section 4: CV Upload */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 mb-2">
                        <Terminal className="w-4 h-4 text-blue-500" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">CV Screening Analysis</h3>
                     </div>
                     <div className="border-2 border-dashed border-white/10 rounded-2xl p-10 text-center bg-white/[0.01] hover:border-blue-500/30 transition-all cursor-pointer group">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                           <UploadCloud className="w-8 h-8 text-blue-400" />
                        </div>
                        <p className="text-white font-bold">Resume Uploaded (cv_analysis_v1.pdf)</p>
                        <p className="text-xs text-slate-500 mt-1">Our AI will parse this document instantly upon submission.</p>
                     </div>
                  </div>

                  {/* Submit Action */}
                  <div className="pt-8 border-t border-white/5">
                     <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-lg font-black transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-3 group"
                     >
                        {submitting ? (
                          <><Loader2 className="w-6 h-6 animate-spin" /> Analyzing Profile...</>
                        ) : (
                          <>Deploy Application <Zap className="w-5 h-5 group-hover:scale-125 transition-transform" /></>
                        )}
                     </button>
                     <p className="text-center text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-4">
                        By deploying your application, you agree to our AI data processing terms.
                     </p>
                  </div>

               </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

    </div>
  )
}

function Section({ title, icon, children }: { title: string, icon: any, children: React.ReactNode }) {
  return (
    <div className="space-y-6">
       <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          {icon}
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">{title}</h3>
       </div>
       {children}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', required, select, options, step }: {
  label: string;
  value: any;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  select?: boolean;
  options?: string[];
  step?: string;
}) {
  return (
    <div className="space-y-2">
       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block ml-1">{label}</label>
       {select && options ? (
         <select 
            value={value} 
            onChange={e => onChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors appearance-none"
         >
            {options.map((o: string) => <option key={o} value={o} className="bg-[#020617]">{o}</option>)}
         </select>
       ) : (
         <input 
            type={type} 
            step={step}
            value={value} 
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors"
         />
       )}
    </div>
  )
}
