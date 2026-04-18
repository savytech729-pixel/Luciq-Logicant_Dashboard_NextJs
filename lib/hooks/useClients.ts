import { useState, useEffect, useCallback } from 'react'

export function useClients() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProvisioning, setIsProvisioning] = useState(false)

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/clients')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch clients')
      setClients(data.clients || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const provisionClient = async (clientData: { name: string; region: string; plan: string }) => {
    setIsProvisioning(true)
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      })
      if (!res.ok) throw new Error('Failed to provision client')
      await fetchClients()
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setIsProvisioning(null as any) // Resetting state
      setIsProvisioning(false)
    }
  }

  return {
    clients,
    loading,
    error,
    isProvisioning,
    provisionClient,
    refresh: fetchClients
  }
}
