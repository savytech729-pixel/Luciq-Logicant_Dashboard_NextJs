'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save, UploadCloud, FileText, BrainCircuit, CheckCircle2 } from 'lucide-react'

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
    skills: [] as string[]
  })
  const [skillInput, setSkillInput] = useState('')

  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (candidate) {
      setFormData({
        name: candidate.name || '',
        currentRole: candidate.currentRole || '',
        experienceYears: candidate.experienceYears || 0,
        skills: candidate.skills || []
      })
      setSkillInput(Array.isArray(candidate.skills) ? candidate.skills.join(', ') : '')
    }
  }, [candidate])

  const handleFileUpload = (e: any) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer?.files[0] || e.target.files?.[0]
    if (!file) return

    // Trigger Fake AI NLP Parsing
    setIsParsing(true)
    setParseStep(1)
    
    setTimeout(() => setParseStep(2), 1500) // Reading Vectors
    setTimeout(() => setParseStep(3), 3000) // Extracting Skills
    setTimeout(() => {
      // Auto-fill logic based on uploaded CV
      setFormData({
        name: "Pardeep Dhiman (Parsed)",
        currentRole: "Data Center Architect",
        experienceYears: 20,
        skills: ["Data Center Architecture", "Cisco Nexus", "VMware", "AWS", "BGP", "OSPF", "Network Design", "Cloud Infrastructure"]
      })
      setSkillInput("Data Center Architecture, Cisco Nexus, VMware, AWS, BGP, OSPF, Network Design, Cloud Infrastructure")
      setParseStep(4) // Complete
      setTimeout(() => setIsParsing(false), 1500)
    }, 4500)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Convert comma string to array
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
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Vector Engine Map</h1>
          <p className="text-slate-400">Upload your resume or manually configure your schema for the AI.</p>
        </div>
      </div>

      {/* AI RESUME PARSER */}
      <Card className="glass-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
        <CardHeader className="border-b border-white/5 bg-white/[0.01]">
          <CardTitle className="text-lg text-white flex items-center">
            <BrainCircuit className="w-5 h-5 mr-3 text-blue-500" /> Auto-Parse Document (NLP)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 relative z-10">
          <AnimatePresence mode="wait">
            {!isParsing ? (
              <motion.div 
                key="dropzone"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
                <h3 className="text-white font-bold text-lg mb-1">Drop your Resume here</h3>
                <p className="text-slate-400 text-sm">PDF, DOCX, or TXT. Our Neural Net will extract your data instantly.</p>
              </motion.div>
            ) : (
              <motion.div key="parsing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 px-4 flex flex-col items-center">
                <div className="relative w-32 h-32 mb-8">
                   <div className="absolute inset-0 rounded-full border-[3px] border-white/10" />
                   <div className="absolute inset-0 rounded-full border-[3px] border-blue-500 border-t-transparent animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center">
                     {parseStep === 4 ? <CheckCircle2 className="w-10 h-10 text-blue-400" /> : <FileText className="w-10 h-10 text-white animate-pulse" />}
                   </div>
                </div>
                
                <div className="space-y-4 w-full max-w-sm">
                  <div className="flex justify-between text-sm">
                    <span className={`transition-colors ${parseStep >= 1 ? 'text-white' : 'text-slate-600'}`}>Uploading Document...</span>
                    {parseStep >= 1 && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={`transition-colors ${parseStep >= 2 ? 'text-white' : 'text-slate-600'}`}>Vectorizing Text Content...</span>
                    {parseStep >= 2 ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> : parseStep === 1 ? <span className="text-blue-500 animate-pulse">Running</span> : null}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={`transition-colors ${parseStep >= 3 ? 'text-white' : 'text-slate-600'}`}>Mapping Skill Taxonomies...</span>
                    {parseStep >= 3 ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> : parseStep === 2 ? <span className="text-blue-500 animate-pulse">Running</span> : null}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <Card className="glass-card overflow-hidden">
        <form onSubmit={onSubmit}>
          <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-4">
            <CardTitle className="text-xl text-white">Identity Matrix</CardTitle>
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
                <Label htmlFor="exp" className="text-slate-300">Experience (Years)</Label>
                <input 
                  id="exp" 
                  type="number" 
                  min="0" 
                  value={formData.experienceYears} 
                  onChange={(e) => setFormData({...formData, experienceYears: parseInt(e.target.value, 10)})} 
                  required 
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-white h-12 px-4 rounded-xl outline-none transition-colors" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-slate-300">Target Requisition</Label>
              <input 
                id="role" 
                placeholder="e.g. Senior Machine Learning Engineer" 
                value={formData.currentRole} 
                onChange={(e) => setFormData({...formData, currentRole: e.target.value})} 
                required 
                className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-white h-12 px-4 rounded-xl outline-none transition-colors" 
              />
            </div>
            <div className="space-y-2 rounded-xl border border-white/5 bg-white/[0.01] p-6">
              <Label htmlFor="skills" className="text-blue-500 font-semibold flex items-center">
                Skills Array (Comma Separated)
              </Label>
              <input 
                id="skills" 
                placeholder="React, Node.js, Python, TensorFlow" 
                value={skillInput} 
                onChange={(e) => setSkillInput(e.target.value)} 
                required 
                className="w-full mt-4 bg-[#0A0A0A] border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-white h-12 px-4 rounded-xl outline-none transition-colors" 
              />
            </div>
          </CardContent>
          <div className="border-t border-white/5 bg-white/[0.01] p-6 flex justify-end">
             <button type="submit" disabled={isUpdating} className="btn-primary w-full sm:w-auto">
              {isUpdating ? 'Processing...' : <><Save className="w-4 h-4 mr-2" /> Commit Profile Model</>}
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
