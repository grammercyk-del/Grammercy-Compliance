import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchCompliances, fetchCompliancesPaginated } from '@/api/compliances'
import type { ComplianceRow, ComplianceFilters, SortState } from '@/types'

/** Fetches ALL compliances with realtime subscription — used by Dashboard, Alerts, Risk. */
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
    let mounted = true

    const safeLoad = async () => {
      if (!mounted) return
      try {
        setError(null)
        const rows = await fetchCompliances()
        if (mounted) setData(rows)
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to fetch compliances')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    // Catch up on missed realtime events the moment the tab regains focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') safeLoad()
    }

    safeLoad()

    document.addEventListener('visibilitychange', handleVisibilityChange)

    const channel = supabase
      .channel('compliances-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'compliances' }, () => {
        // Skip the expensive refetch while the tab is in the background.
        // handleVisibilityChange will catch up when the user returns.
        if (document.visibilityState !== 'hidden') safeLoad()
      })
      .subscribe()

    return () => {
      mounted = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      supabase.removeChannel(channel)
    }
  }, [])

  return { data, loading, error, refetch: load }
}

/** Server-side paginated fetch — used by CompliancesPage table. */
export function useCompliancesPaginated(
  filters: ComplianceFilters,
  sort: SortState,
  page: number,
  pageSize: number,
) {
  const [data, setData] = useState<ComplianceRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    fetchCompliancesPaginated(filters, sort, page, pageSize)
      .then((result) => {
        if (mounted) {
          setData(result.data)
          setTotal(result.total)
          setLoading(false)
        }
      })
      .catch((e: unknown) => {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Failed to fetch compliances')
          setLoading(false)
        }
      })

    return () => { mounted = false }
  }, [filters, sort, page, pageSize, refreshKey])

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), [])

  return { data, total, loading, error, refetch }
}
