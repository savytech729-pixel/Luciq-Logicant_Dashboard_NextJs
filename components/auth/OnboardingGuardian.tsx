'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function OnboardingGuardian({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        setSession(data.user)
      } catch (err) {
        setSession(null)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [pathname])

  useEffect(() => {
    if (!loading && session) {
      const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/onboarding')
      
      if (!session.isOnboarded && !isAuthPage) {
        router.push('/onboarding')
      }
    }
  }, [session, loading, pathname, router])

  return <>{children}</>
}
