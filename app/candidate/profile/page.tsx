'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save, UploadCloud, FileText, BrainCircuit, CheckCircle2 } from 'lucide-react'
import { PageHero, SurfaceCard } from '@/components/dashboard/Premium'

import { useCandidate } from '@/lib/hooks/useCandidate'

export default function CandidateProfile() {
  const { candidate, loading, isUpdating, updateProfile } = useCandidate()
  const [isDragging, setIsDragging] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [parseStep, setParseStep] = useState(0)
  
  const [formData, setFormData] = useState({
    name: '',
    currentRole: '',
    experienceYears: 0,
    skills: [] as string[],
    phone: '',
    preferredLocation: '',
    noticePeriod: 'Immediate',
    expectedSalary: '',
    workSettingPreference: 'Remote',
    linkedInUrl: '',
    profilePic: '',
    salarySlipUrl: '',
    offerLetterUrl: '',
    terminationLetterUrl: '',
    education: '',
    summary: '',
    certifications: '',
    employmentHistory: '',
    projects: '',
  })
  const [skillInput, setSkillInput] = useState('')
  const [languageInput, setLanguageInput] = useState('')

  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (candidate) {
      setFormData({
        name: candidate.name || '',
        currentRole: candidate.currentRole || '',
        experienceYears: candidate.experienceYears || 0,
        skills: candidate.skills || [],
        phone: candidate.phone || '',
        preferredLocation: candidate.preferredLocation || '',
        noticePeriod: candidate.noticePeriod || 'Immediate',
        expectedSalary: candidate.expectedSalary || '',
        workSettingPreference: candidate.workSettingPreference || 'Remote',
        linkedInUrl: candidate.linkedInUrl || '',
        profilePic: candidate.profilePic || '',
        salarySlipUrl: candidate.salarySlipUrl || '',
        offerLetterUrl: candidate.offerLetterUrl || '',
        terminationLetterUrl: candidate.terminationLetterUrl || '',
        education: candidate.education || '',
        summary: candidate.summary || '',
        certifications: candidate.certifications || '',
        employmentHistory: candidate.employmentHistory || '',
        projects: candidate.projects || '',
      })
      setSkillInput(Array.isArray(candidate.skills) ? candidate.skills.join(', ') : '')
      setLanguageInput(
        Array.isArray(candidate.languages) && candidate.languages.length
          ? candidate.languages.join(', ')
          : ''
      )
    }
  }, [candidate])

  const handleFileUpload = (e: any) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer?.files[0] || e.target.files?.[0]
    if (!file) return

    // Trigger Real AI NLP Parsing
    setIsParsing(true)
    setParseStep(1)
    
    const analyze = async () => {
      try {
        setParseStep(2) // Reading Vectors
        const reader = new FileReader()
        const fileData = await new Promise<{ base64: string, mimeType: string }>((resolve) => {
          reader.onload = (ev) => {
            const out = String(ev.target?.result || '')
            const [header, base64] = out.split(';base64,')
            resolve({
              base64,
              mimeType: header.split(':')[1] || 'application/pdf',
            })
          }
          reader.readAsDataURL(file)
        })

        const res = await fetch('/api/admin/candidates/screen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileSize: file.size, fileData })
        })
        const data = await res.json()
        
        if (!res.ok) throw new Error(data.message || 'Parsing failed')

        setParseStep(3) // Mapping Skill Taxonomies
        await new Promise(r => setTimeout(r, 800))

        setFormData(prev => ({
          ...prev,
          name: data.candidate.name || '',
          currentRole: data.candidate.currentRole || '',
          experienceYears: Number(data.candidate.totalExperience || data.candidate.experienceYears || 0),
          skills: data.candidate.skills || [],
          phone: data.candidate.phone || '',
          preferredLocation: data.candidate.preferredLocation || '',
          noticePeriod: data.candidate.noticePeriod || 'Immediate',
          expectedSalary: data.candidate.expectedSalary || '',
          workSettingPreference: data.candidate.workSettingPreference || 'Remote',
          linkedInUrl: data.candidate.linkedInUrl || '',
          education: data.candidate.education || '',
          summary: data.candidate.summary || '',
          certifications: data.candidate.certifications || '',
          employmentHistory: data.candidate.employmentHistory || '',
          projects: data.candidate.projects || '',
        }))
        setSkillInput(Array.isArray(data.candidate.skills) ? data.candidate.skills.join(', ') : '')
        setLanguageInput(
          Array.isArray(data.candidate.languages) && data.candidate.languages.length
            ? data.candidate.languages.join(', ')
            : ''
        )
        
        setParseStep(4) // Complete
        setTimeout(() => setIsParsing(false), 1000)
      } catch (err) {
        console.error(err)
        alert('AI Parsing failed. Please fill manually.')
        setIsParsing(false)
      }
    }

    analyze()
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Convert comma string to array
    const skillList = skillInput.split(',').map(s => s.trim()).filter(s => s)
    const langList = languageInput.split(/[,;]/).map(s => s.trim()).filter(s => s)

    const success = await updateProfile({
      ...formData,
      skills: skillList,
      languages: langList,
      totalExperience: formData.experienceYears,
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
        <div className="flex-1">
          <PageHero title="Personal Profile" description="Manage your identity, CV-derived details, and recruiter-facing profile quality." />
        </div>
      </div>

      <SurfaceCard className="p-0 overflow-hidden">
        <form onSubmit={onSubmit}>
          <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-4">
            <CardTitle className="text-xl text-white">Identity Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                <input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-white h-12 px-4 rounded-xl outline-none transition-colors" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">Phone Number</Label>
                <input 
                  id="phone" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  placeholder="+91 00000 00000"
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-white h-12 px-4 rounded-xl outline-none transition-colors" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="linkedin" className="text-slate-300">LinkedIn Profile URL</Label>
              <input 
                id="linkedin" 
                value={formData.linkedInUrl} 
                onChange={(e) => setFormData({...formData, linkedInUrl: e.target.value})} 
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-white h-12 px-4 rounded-xl outline-none transition-colors" 
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-slate-300">Current Location / Preferred</Label>
                <input 
                  id="location" 
                  value={formData.preferredLocation} 
                  onChange={(e) => setFormData({...formData, preferredLocation: e.target.value})} 
                  placeholder="e.g. Mumbai, Remote"
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-white h-12 px-4 rounded-xl outline-none transition-colors" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setting" className="text-slate-300">Work Setting Preference</Label>
                <select 
                  id="setting" 
                  value={formData.workSettingPreference} 
                  onChange={(e) => setFormData({...formData, workSettingPreference: e.target.value})}
                  className="w-full bg-[#0A0A0A] border border-white/10 focus:border-blue-500 text-white h-12 px-4 rounded-xl outline-none transition-colors"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="notice" className="text-slate-300">Notice Period</Label>
                <select 
                  id="notice" 
                  value={formData.noticePeriod} 
                  onChange={(e) => setFormData({...formData, noticePeriod: e.target.value})}
                  className="w-full bg-[#0A0A0A] border border-white/10 focus:border-blue-500 text-white h-12 px-4 rounded-xl outline-none transition-colors"
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
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-white h-12 px-4 rounded-xl outline-none transition-colors" 
                />
              </div>
            </div>

            <div className="border-t border-white/10 pt-8 mt-2 space-y-6">
              <div>
                <Label className="text-slate-300">Skills (comma-separated)</Label>
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="React, Node.js, AWS…"
                  className="mt-2 w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-white min-h-12 px-4 rounded-xl outline-none transition-colors"
                />
              </div>
              <div>
                <Label className="text-slate-300">Languages (comma-separated)</Label>
                <input
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  placeholder="English, Hindi…"
                  className="mt-2 w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-white min-h-12 px-4 rounded-xl outline-none transition-colors"
                />
              </div>
              <div>
                <Label className="text-slate-300">Education</Label>
                <textarea
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  rows={3}
                  className="mt-2 w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-white px-4 py-3 rounded-xl outline-none transition-colors resize-y min-h-[80px]"
                  placeholder="Degree, institution, year"
                />
              </div>
              <div>
                <Label className="text-slate-300">Work experience (from CV)</Label>
                <textarea
                  value={formData.employmentHistory}
                  onChange={(e) => setFormData({ ...formData, employmentHistory: e.target.value })}
                  rows={6}
                  className="mt-2 w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-white px-4 py-3 rounded-xl outline-none transition-colors resize-y min-h-[120px] font-mono text-sm"
                  placeholder="Company | Role | Dates — one block per job"
                />
              </div>
              <div>
                <Label className="text-slate-300">Certifications & training</Label>
                <textarea
                  value={formData.certifications}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                  rows={3}
                  className="mt-2 w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-white px-4 py-3 rounded-xl outline-none transition-colors resize-y"
                />
              </div>
              <div>
                <Label className="text-slate-300">Projects & highlights</Label>
                <textarea
                  value={formData.projects}
                  onChange={(e) => setFormData({ ...formData, projects: e.target.value })}
                  rows={3}
                  className="mt-2 w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-white px-4 py-3 rounded-xl outline-none transition-colors resize-y"
                />
              </div>
              <div>
                <Label className="text-slate-300">Professional summary</Label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows={4}
                  className="mt-2 w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-white px-4 py-3 rounded-xl outline-none transition-colors resize-y"
                />
              </div>
            </div>

            <div className="border-t border-white/10 pt-8 mt-4">
              <Label className="text-slate-300 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-blue-400" /> Re-parse CV (updates fields above)
              </Label>
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} />
              <button
                type="button"
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileUpload}
                onClick={() => fileInputRef.current?.click()}
                className={`mt-3 w-full rounded-xl border-2 border-dashed py-10 text-sm transition-colors ${
                  isDragging ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/15 text-slate-400 hover:border-white/25'
                }`}
              >
                Drop a CV here or click to upload
              </button>
            </div>
          </CardContent>
          <div className="border-t border-white/5 bg-white/[0.01] p-6 flex justify-end">
             <button type="submit" disabled={isUpdating} className="btn-primary w-full sm:w-auto">
              {isUpdating ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Personal Profile</>}
            </button>
          </div>
        </form>
      </SurfaceCard>

      <AnimatePresence>
        {isParsing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm px-6"
          >
            <BrainCircuit className="w-10 h-10 text-blue-400 animate-pulse mb-4" />
            <p className="text-white font-semibold text-center">Extracting fields from your CV…</p>
            <p className="text-slate-400 text-sm mt-2">Step {parseStep} of 4</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

  )
}
