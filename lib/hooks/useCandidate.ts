import { useState, useEffect, useCallback } from 'react'

export function useCandidate() {
  const [candidate, setCandidate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/candidate/me')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch profile')
      setCandidate(data.candidate)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const updateProfile = async (profileData: any) => {
    setIsUpdating(true)
    try {
      const res = await fetch('/api/candidate/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })
      if (!res.ok) throw new Error('Failed to update profile')
      await fetchProfile()
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setIsUpdating(false)
    }
  }

  const getJobs = async () => {
    try {
      const res = await fetch('/api/candidate/jobs')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch jobs')
      return data.jobs || []
    } catch (err: any) {
      setError(err.message)
      return []
    }
  }

  return {
    candidate,
    loading,
    error,
    isUpdating,
    updateProfile,
    getJobs,
    refresh: fetchProfile
  }
}
