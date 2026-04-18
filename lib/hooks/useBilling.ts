import { useState, useEffect, useCallback } from 'react'

export function useBilling() {
  const [placements, setPlacements] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/billing')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch billing data')
      setPlacements(data.placements || [])
      setInvoices(data.invoices || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const generateInvoice = async (placementId: string) => {
    setIsProcessing(placementId)
    try {
      const res = await fetch('/api/admin/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placementId, type: 'GENERATE_INVOICE' })
      })
      if (!res.ok) throw new Error('Failed to generate invoice')
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessing(null)
    }
  }

  const markAsPaid = async (placementId: string) => {
    setIsProcessing(placementId)
    try {
      const res = await fetch('/api/admin/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placementId, type: 'MARK_PAID' })
      })
      if (!res.ok) throw new Error('Failed to mark as paid')
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessing(null)
    }
  }

  return {
    placements,
    invoices,
    loading,
    error,
    isProcessing,
    generateInvoice,
    markAsPaid,
    refresh: fetchData
  }
}
