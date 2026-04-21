'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save, UploadCloud, FileText, BrainCircuit, CheckCircle2 } from 'lucide-react'

import { useCandidate } from '@/lib/hooks/useCandidate'

export default function CandidateResume() {
  const { candidate, loading, isUpdating, updateProfile } = useCandidate()
  const [isDragging, setIsDragging] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [parseStep, setParseStep] = useState(0)
  
  const [formData, setFormData] = useState({
    currentRole: '',
    experienceYears: 0,
    skills: [] as string[],
    noticePeriod: 'Immediate',
    expectedSalary: '',
    salarySlipUrl: '',
    offerLetterUrl: '',
    terminationLetterUrl: ''
  })
  const [skillInput, setSkillInput] = useState('')

  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (candidate) {
      setFormData({
        currentRole: candidate.currentRole || '',
        experienceYears: candidate.experienceYears || 0,
        skills: candidate.skills || [],
        noticePeriod: candidate.noticePeriod || 'Immediate',
        expectedSalary: candidate.expectedSalary || '',
        salarySlipUrl: candidate.salarySlipUrl || '',
        offerLetterUrl: candidate.offerLetterUrl || '',
        terminationLetterUrl: candidate.terminationLetterUrl || ''
      })
      setSkillInput(Array.isArray(candidate.skills) ? candidate.skills.join(', ') : '')
    }
  }, [candidate])

  const handleFileUpload = (e: any) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer?.files[0] || e.target.files?.[0]
    if (!file) return

    setIsParsing(true)
    setParseStep(1)
    
    const analyze = async () => {
      try {
        setParseStep(2)
        const res = await fetch('/api/admin/candidates/screen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileSize: file.size })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Parsing failed')

        setParseStep(3)
        await new Promise(r => setTimeout(r, 800))

        setFormData(prev => ({
          ...prev,
          currentRole: data.candidate.currentRole || '',
          experienceYears: Number(data.candidate.totalExperience || data.candidate.experienceYears || 0),
          skills: data.candidate.skills || []
        }))
        setSkillInput(Array.isArray(data.candidate.skills) ? data.candidate.skills.join(', ') : '')
        
        setParseStep(4)
        setTimeout(() => setIsParsing(false), 1000)
      } catch (err) {
        setIsParsing(false)
      }
    }
    analyze()
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const skillList = skillInput.split(',').map(s => s.trim()).filter(s => s)
    const success = await updateProfile({
      ...formData,
      skills: skillList
    })
    if (success) {
      router.push('/candidate/dashboard')
    }
  }

  if (loading) return null

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center space-x-4">
        <Link href="/candidate/dashboard">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
            <ArrowLeft className="h-4 w-4 text-white" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Career Resume</h1>
          <p className="text-slate-400">Upload and configure your professional skillset.</p>
        </div>
      </div>

      <Card className="glass-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
        <CardHeader className="border-b border-white/5 bg-white/[0.01]">
          <CardTitle className="text-lg text-white flex items-center">
            <BrainCircuit className="w-5 h-5 mr-3 text-blue-500" /> AI Resume Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 relative z-10">
          <AnimatePresence mode="wait">
            {!isParsing ? (
              <motion.div 
                key="dropzone"
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileUpload}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'} rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center group`}
              >
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt" />
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-white font-bold text-lg mb-1">Upload New Resume</h3>
                <p className="text-slate-400 text-sm">PDF or DOCX. AI will extract your skills and experience instantly.</p>
              </motion.div>
            ) : (
              <motion.div key="parsing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 px-4 flex flex-col items-center">
                <div className="relative w-32 h-32 mb-8">
                   <div className="absolute inset-0 rounded-full border-[3px] border-blue-500 border-t-transparent animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center">
                     {parseStep === 4 ? <CheckCircle2 className="w-10 h-10 text-blue-400" /> : <FileText className="w-10 h-10 text-white animate-pulse" />}
                   </div>
                </div>
                <div className="space-y-4 w-full max-w-sm text-center">
                   <p className="text-white font-bold tracking-wide">AI Engine Parsing...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <Card className="glass-card overflow-hidden">
        <form onSubmit={onSubmit}>
          <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-4">
            <CardTitle className="text-xl text-white">Professional Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-300">Designation / Role</Label>
                <input 
                  id="role" 
                  value={formData.currentRole} 
                  onChange={(e) => setFormData({...formData, currentRole: e.target.value})} 
                  required 
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-white h-12 px-4 rounded-xl outline-none transition-colors" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp" className="text-slate-300">Total Experience (Years)</Label>
                <input 
                  id="exp" 
                  type="number" 
                  value={formData.experienceYears} 
                  onChange={(e) => setFormData({...formData, experienceYears: parseInt(e.target.value, 10)})} 
                  required 
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-white h-12 px-4 rounded-xl outline-none transition-colors" 
                />
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-white/5 bg-white/[0.01] p-6">
              <Label htmlFor="skills" className="text-blue-500 font-semibold flex items-center">
                Skills (Comma Separated)
              </Label>
              <input 
                id="skills" 
                value={skillInput} 
                onChange={(e) => setSkillInput(e.target.value)} 
                required 
                className="w-full mt-4 bg-[#0A0A0A] border border-white/10 focus:border-blue-500 text-white h-12 px-4 rounded-xl outline-none transition-colors" 
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Salary Slip</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-12 bg-white/[0.02] border border-white/10 rounded-xl flex items-center px-4 text-xs text-slate-500">
                    {formData.salarySlipUrl ? 'Uploaded' : 'Not uploaded'}
                  </div>
                  <button type="button" onClick={() => setFormData({...formData, salarySlipUrl: 'linked'})} className="px-4 py-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-bold transition-all">Upload</button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Other Documents</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-12 bg-white/[0.02] border border-white/10 rounded-xl flex items-center px-4 text-xs text-slate-500">
                    {formData.offerLetterUrl ? 'Uploaded' : 'Not uploaded'}
                  </div>
                  <button type="button" onClick={() => setFormData({...formData, offerLetterUrl: 'linked'})} className="px-4 py-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-bold transition-all">Upload</button>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 p-6 bg-white/[0.01] border border-white/5 rounded-2xl">
              <div className="space-y-2">
                <Label htmlFor="notice" className="text-slate-300">Notice Period</Label>
                <select 
                  id="notice" 
                  value={formData.noticePeriod} 
                  onChange={(e) => setFormData({...formData, noticePeriod: e.target.value})}
                  className="w-full bg-[#0A0A0A] border border-white/10 focus:border-blue-500 text-white h-12 px-4 rounded-xl outline-none"
                >
                  <option value="Immediate">Immediate</option>
                  <option value="15 Days">15 Days</option>
                  <option value="30 Days">30 Days</option>
                  <option value="Negotiable">Negotiable</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary" className="text-slate-300">Expected Salary</Label>
                <input 
                  id="salary" 
                  value={formData.expectedSalary} 
                  onChange={(e) => setFormData({...formData, expectedSalary: e.target.value})} 
                  placeholder="e.g. ₹18L p.a."
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-white h-12 px-4 rounded-xl outline-none" 
                />
              </div>
            </div>

          </CardContent>
          <div className="border-t border-white/5 bg-white/[0.01] p-6 flex justify-end">
             <button type="submit" disabled={isUpdating} className="btn-primary w-full sm:w-auto">
              {isUpdating ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Update Resume Model</>}
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
