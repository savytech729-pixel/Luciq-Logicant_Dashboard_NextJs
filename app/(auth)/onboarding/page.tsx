'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { User, Phone, MapPin, Briefcase, Camera, CheckCircle2, ChevronRight, GraduationCap, ShieldCheck } from 'lucide-react'
export default function OnboardingPage() {
  const [session, setSession] = useState<any>(null)
  const [step, setStep] = useState(1)
  const [isFresher, setIsFresher] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    designation: '',
    department: '',
    skills: '',
    profilePic: ''
  })

  const router = useRouter()

  useEffect(() => {
    const fetchSession = async () => {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (data.user) {
        setSession(data.user)
        setFormData(prev => ({ ...prev, name: data.user.name || '' }))
      } else {
        router.push('/login')
      }
    }
    fetchSession()
  }, [router])

  const onSubmit = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isFresher,
          role: session?.user?.role
        }),
      })

      if (res.ok) {
        // Session refreshed via API
        if (session?.role === 'ADMIN') {
          router.push('/admin/dashboard')
        } else {
          router.push('/candidate/dashboard')
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => setStep(step + 1)
  const prevStep = () => setStep(step - 1)

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg relative z-10"
      >
        <Card className="glass-card border-white/10 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
               <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-blue-500" 
                    initial={{ width: 0 }}
                    animate={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
                  />
               </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">Initialize Your Profile</CardTitle>
            <p className="text-slate-400 text-sm">Security clearance requires your identity matrix to be complete.</p>
          </CardHeader>

          <CardContent className="p-8 pt-4">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                   <div className="flex justify-center mb-8">
                      <div className="relative group cursor-pointer">
                         <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center group-hover:border-blue-500 transition-colors overflow-hidden">
                            {formData.profilePic ? (
                               <img src={formData.profilePic} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                               <Camera className="w-8 h-8 text-slate-500 group-hover:text-blue-400 transition-colors" />
                            )}
                         </div>
                         <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1.5 border-2 border-[#0A0A0A]">
                            <ChevronRight className="w-3 h-3 text-white rotate-90" />
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="space-y-2">
                         <Label className="text-slate-400 text-xs uppercase tracking-widest font-black">Full Name</Label>
                         <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              placeholder="e.g. Alex Rivera"
                              className="w-full bg-white/[0.02] border border-white/10 rounded-xl h-12 pl-11 pr-4 text-white outline-none focus:border-blue-500 transition-all"
                            />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <Label className="text-slate-400 text-xs uppercase tracking-widest font-black">Phone Number</Label>
                         <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              placeholder="+91 00000 00000"
                              className="w-full bg-white/[0.02] border border-white/10 rounded-xl h-12 pl-11 pr-4 text-white outline-none focus:border-blue-500 transition-all"
                            />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <Label className="text-slate-400 text-xs uppercase tracking-widest font-black">Residence Address</Label>
                         <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                              value={formData.address}
                              onChange={(e) => setFormData({...formData, address: e.target.value})}
                              placeholder="City, Country"
                              className="w-full bg-white/[0.02] border border-white/10 rounded-xl h-12 pl-11 pr-4 text-white outline-none focus:border-blue-500 transition-all"
                            />
                         </div>
                      </div>
                   </div>
                   <button 
                     onClick={nextStep} 
                     disabled={!formData.name || !formData.phone} 
                     className="w-full btn-primary h-12 text-sm mt-4"
                   >
                     {session?.role === 'CANDIDATE' ? 'Next: Career Path' : 'Next: Hiring Details'} <ChevronRight className="w-4 h-4 ml-2 inline" />
                   </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-8">
                   {session?.role === 'CANDIDATE' ? (
                     <>
                        <div className="grid grid-cols-2 gap-4">
                           <button 
                             onClick={() => setIsFresher(true)}
                             className={`p-6 rounded-2xl border-2 transition-all text-left group ${isFresher ? 'border-blue-500 bg-blue-500/5' : 'border-white/5 bg-white/[0.01] hover:border-white/10'}`}
                           >
                              <GraduationCap className={`w-8 h-8 mb-3 ${isFresher ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                              <h4 className="text-white font-bold">Fresher</h4>
                              <p className="text-xs text-slate-500 mt-1">Starting my journey</p>
                           </button>
                           <button 
                             onClick={() => setIsFresher(false)}
                             className={`p-6 rounded-2xl border-2 transition-all text-left group ${!isFresher ? 'border-blue-500 bg-blue-500/5' : 'border-white/5 bg-white/[0.01] hover:border-white/10'}`}
                           >
                              <Briefcase className={`w-8 h-8 mb-3 ${!isFresher ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                              <h4 className="text-white font-bold">Experienced</h4>
                              <p className="text-xs text-slate-500 mt-1">Building on my expertise</p>
                           </button>
                        </div>

                        {!isFresher && (
                           <div className="space-y-4 animate-in slide-in-from-top-4">
                              <div className="space-y-2">
                                 <Label className="text-slate-400 text-xs uppercase tracking-widest font-black">Current Designation</Label>
                                 <input 
                                   value={formData.designation}
                                   onChange={(e) => setFormData({...formData, designation: e.target.value})}
                                   placeholder="e.g. Senior Product Manager"
                                   className="w-full bg-white/[0.02] border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-blue-500 transition-all"
                                 />
                              </div>
                              <div className="space-y-2">
                                 <Label className="text-slate-400 text-xs uppercase tracking-widest font-black">Department / Profession</Label>
                                 <input 
                                   value={formData.department}
                                   onChange={(e) => setFormData({...formData, department: e.target.value})}
                                   placeholder="e.g. Engineering"
                                   className="w-full bg-white/[0.02] border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-blue-500 transition-all"
                                 />
                              </div>
                           </div>
                        )}
                     </>
                   ) : (
                     <div className="space-y-6">
                        <div className="text-center mb-6">
                           <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                              <ShieldCheck className="w-8 h-8 text-blue-400" />
                           </div>
                           <h4 className="text-white font-bold text-lg">Recruiter Credentials</h4>
                           <p className="text-xs text-slate-500">Provide your professional hiring details.</p>
                        </div>
                        <div className="space-y-4">
                           <div className="space-y-2">
                              <Label className="text-slate-400 text-xs uppercase tracking-widest font-black">Company / Agency Name</Label>
                              <input 
                                value={formData.department}
                                onChange={(e) => setFormData({...formData, department: e.target.value})}
                                placeholder="e.g. Luciq & Logicant"
                                className="w-full bg-white/[0.02] border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-blue-500 transition-all"
                              />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-slate-400 text-xs uppercase tracking-widest font-black">Your HR Role / Title</Label>
                              <input 
                                value={formData.designation}
                                onChange={(e) => setFormData({...formData, designation: e.target.value})}
                                placeholder="e.g. Head of Talent Acquisition"
                                className="w-full bg-white/[0.02] border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-blue-500 transition-all"
                              />
                           </div>
                        </div>
                     </div>
                   )}

                   <div className="flex gap-3">
                      <button onClick={prevStep} className="flex-1 py-3 border border-white/10 text-white rounded-xl font-bold hover:bg-white/5 transition-all">Back</button>
                      <button 
                        onClick={onSubmit} 
                        disabled={isLoading || (session?.role === 'CANDIDATE' && !isFresher && !formData.designation) || (session?.role === 'ADMIN' && !formData.designation)} 
                        className="flex-[2] btn-primary h-12 text-sm"
                      >
                        {isLoading ? 'Finalizing...' : <><CheckCircle2 className="w-4 h-4 mr-2 inline" /> Finish Onboarding</>}
                      </button>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
