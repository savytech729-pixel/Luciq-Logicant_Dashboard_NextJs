'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Label } from '@/components/ui/label'
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  const validate = () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Invalid email format.')
      return false
    }
    if (password.length < 1) {
      setError('Please enter your password.')
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials')
      }

      setIsSuccess(true)
      setTimeout(() => {
        if (!data.isOnboarded) {
          router.push('/onboarding')
        } else if (data.role === 'ADMIN') {
          router.push('/admin/dashboard')
        } else {
          router.push('/candidate/dashboard')
        }
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0A0A0A] brand-bg-gradient">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-4">
            <img src="https://www.luciqandlogicant.com/logo.png" alt="Logo" className="h-[50px] mx-auto object-contain" />
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-slate-400 text-sm">Sign in to access your intelligence dashboard.</p>
        </div>

        <div className="glass-card p-8 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10 space-y-4"
              >
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Authenticated</h3>
                <p className="text-slate-400">Synchronizing session... please wait.</p>
              </motion.div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-6">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
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
                      type="email" placeholder="admin@domain.com" 
                      value={email} onChange={(e) => setEmail(e.target.value)} required 
                      className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-white h-12 pl-11 pr-4 rounded-xl outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Password</Label>
                    <button type="button" className="text-[10px] text-blue-400 hover:underline">Forgot Password?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type={showPassword ? "text" : "password"} placeholder="••••••••"
                      value={password} onChange={(e) => setPassword(e.target.value)} required 
                      className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 text-white h-12 pl-11 pr-12 rounded-xl outline-none transition-all"
                    />
                    <button 
                      type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-14 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group" disabled={isLoading}>
                  {isLoading ? 'Authenticating...' : (
                    <>
                      Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                <div className="text-sm text-center text-slate-500 pt-4">
                  New to the platform?{' '}
                  <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                    Create Account
                  </Link>
                </div>
              </form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
