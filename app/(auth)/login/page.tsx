'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        throw new Error(data.error || 'Login failed')
      }

      if (data.role === 'ADMIN') {
        router.push('/admin/dashboard')
      } else {
        router.push('/candidate/dashboard')
      }
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0A0A0A] brand-bg-gradient">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-2">
            <img src="https://www.luciqandlogicant.com/logo.png" alt="Luciq & Logicant Logo" className="h-[60px] mx-auto object-contain" />
          </Link>
          <p className="text-slate-400 text-sm">Enter your credentials to access the intelligence platform.</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={onSubmit} className="space-y-6">
            {error && (
              <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 text-xs font-medium uppercase tracking-wider">Email Address</Label>
              <input 
                id="email" type="email" placeholder="admin@luciqandlogicant.com" 
                value={email} onChange={(e) => setEmail(e.target.value)} required 
                className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 text-white h-12 px-4 rounded-xl transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300 text-xs font-medium uppercase tracking-wider">Password</Label>
              <input 
                id="password" type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required 
                className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 text-white h-12 px-4 rounded-xl transition-all outline-none"
              />
            </div>
            <button type="submit" className="w-full btn-primary h-12 text-sm mt-4" disabled={isLoading}>
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
            <div className="text-sm text-center text-slate-400 pt-4">
              Requires clearance?{' '}
              <Link href="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
                Apply Now
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
