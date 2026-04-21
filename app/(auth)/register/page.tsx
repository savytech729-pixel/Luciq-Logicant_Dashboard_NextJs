'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Label } from '@/components/ui/label'
import { ArrowRight, Mail, Lock, User, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'

function RegisterForm() {
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role') || 'CANDIDATE'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState(roleParam)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const router = useRouter()

  const validate = () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address.')
      return false
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return false
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return false
    }
    return true
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setIsSuccess(true)
      setTimeout(() => {
        router.push('/onboarding')
        router.refresh()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0A0A0A] brand-bg-gradient">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] relative z-10"
      >
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-4 hover:scale-105 transition-transform">
            <img src="https://www.luciqandlogicant.com/logo.png" alt="Logo" className="h-[50px] mx-auto object-contain" />
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2">
            {role === 'ADMIN' ? 'Recruiter Registration' : 'Candidate Registration'}
          </h2>
          <p className="text-slate-400 text-sm">Join the next generation of AI-driven recruitment.</p>
        </div>

        <div className="glass-card p-8 border-white/10 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-4"
              >
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Account Created!</h3>
                <p className="text-slate-400">Verifying your clearance... redirecting to onboarding.</p>
              </motion.div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" placeholder="you@example.com" 
                      value={email} onChange={(e) => setEmail(e.target.value)} required 
                      className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-white h-12 pl-11 pr-4 rounded-xl transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type={showPassword ? "text" : "password"} placeholder="••••••••"
                        value={password} onChange={(e) => setPassword(e.target.value)} required 
                        className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-white h-12 pl-11 pr-12 rounded-xl transition-all outline-none"
                      />
                      <button 
                        type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Confirm Password</Label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} placeholder="••••••••"
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required 
                        className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-white h-12 px-4 rounded-xl transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="py-2">
                   <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                      {role === 'ADMIN' ? <ShieldCheck className="w-5 h-5 text-purple-400" /> : <User className="w-5 h-5 text-blue-400" />}
                      <div className="flex-1">
                         <p className="text-xs font-bold text-white uppercase tracking-tighter">Registering as {role === 'ADMIN' ? 'Recruiter' : 'Job Seeker'}</p>
                         <p className="text-[10px] text-slate-500">Click to change</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setRole(role === 'ADMIN' ? 'CANDIDATE' : 'ADMIN')}
                        className="text-[10px] font-bold text-blue-400 hover:underline"
                      >
                        Switch Role
                      </button>
                   </div>
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-14 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : (
                    <>
                      Register Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="text-sm text-center text-slate-500 pt-4">
                  Already have an account?{' '}
                  <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                    Login
                  </Link>
                </div>
              </form>
            )}
          </AnimatePresence>
        </div>
        
        {/* Trust badge */}
        <div className="mt-8 flex justify-center items-center gap-6 opacity-40">
           <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Google.png" alt="Google" className="h-4 grayscale invert" />
           <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" className="h-4 grayscale invert" />
           <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" className="h-4 grayscale invert" />
        </div>
      </motion.div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">Loading Security Module...</div>}>
      <RegisterForm />
    </Suspense>
  )
}
