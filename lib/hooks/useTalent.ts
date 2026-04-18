import { useState, useEffect, useCallback } from 'react'

export function useTalent() {
  const [candidates, setCandidates] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCandidates = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/candidates')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch candidates')
      
      const enriched = (data.candidates || []).map((c: any) => ({
        ...c,
        globalScore: Math.floor(Math.random() * 30) + 70
      })).sort((a: any, b: any) => b.globalScore - a.globalScore)
      
      setCandidates(enriched)
    } catch (err: any) {
      setError(err.message)
    }
  }, [])

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/jobs')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch jobs')
      setJobs(data.jobs || [])
    } catch (err: any) {
      setError(err.message)
    }
  }, [])

  const createJob = async (jobData: {
    title: string
    description: string
    requiredSkills: string[]
    experienceRequired: number
    location?: string
  }) => {
    try {
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      })
      if (!res.ok) throw new Error('Failed to create job')
      await fetchJobs()
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  const getMatches = async (jobId: string) => {
    try {
      const res = await fetch(`/api/match/${jobId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch matches')
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    }
  }

  const getCandidateById = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/candidates/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch candidate')
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchCandidates(), fetchJobs()])
      setLoading(false)
    }
    init()
  }, [fetchCandidates, fetchJobs])

  return {
    candidates,
    jobs,
    loading,
    error,
    createJob,
    getMatches,
    getCandidateById,
    refreshCandidates: fetchCandidates,
    refreshJobs: fetchJobs
  }
}
