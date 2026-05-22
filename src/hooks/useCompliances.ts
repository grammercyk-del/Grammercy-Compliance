import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchCompliances } from '@/api/compliances'
import type { ComplianceRow } from '@/types'

export function useCompliances() {
  const [data, setData] = useState<ComplianceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const rows = await fetchCompliances()
      setData(rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch compliances')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()

    // Realtime: listen to base table changes, refetch view
    const channel = supabase
      .channel('compliances-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'compliances' }, load)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [load])

  return { data, loading, error, refetch: load }
}
