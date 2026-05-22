import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchActiveOwners, fetchActiveCategories, fetchActiveDepartments } from '@/api/lookups'
import type { Owner, Category, Department } from '@/types'

export function useLookups() {
  const [owners, setOwners]           = useState<Owner[]>([])
  const [categories, setCategories]   = useState<Category[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading]         = useState(true)

  const load = useCallback(async () => {
    try {
      const [o, c, d] = await Promise.all([
        fetchActiveOwners(),
        fetchActiveCategories(),
        fetchActiveDepartments(),
      ])
      setOwners(o)
      setCategories(c)
      setDepartments(d)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()

    const channel = supabase
      .channel('lookups-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'owners' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, load)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [load])

  return { owners, categories, departments, loading, refetch: load }
}
