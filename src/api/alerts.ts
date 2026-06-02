import { supabase } from '@/lib/supabase'
import { createTimeoutSignal, toApiError } from '@/utils/timeout'
import type { CriticalAlert, OwnerRiskScore } from '@/types'

export async function fetchCriticalAlerts(): Promise<CriticalAlert[]> {
  const { signal, clear } = createTimeoutSignal()
  try {
    const { data, error } = await supabase
      .from('critical_alerts')
      .select('*')
      .order('days_remaining', { ascending: true, nullsFirst: true })
      .abortSignal(signal)
    if (error) throw new Error(error.message || 'Failed to load critical alerts')
    return (data ?? []) as CriticalAlert[]
  } catch (e) {
    throw toApiError(e, 'Failed to load critical alerts')
  } finally {
    clear()
  }
}

export async function fetchOwnerRiskScores(): Promise<OwnerRiskScore[]> {
  const { signal, clear } = createTimeoutSignal()
  try {
    const { data, error } = await supabase
      .from('owner_risk_scores')
      .select('*')
      .order('risk_score', { ascending: false })
      .abortSignal(signal)
    if (error) throw new Error(error.message || 'Failed to load owner risk scores')
    return (data ?? []) as OwnerRiskScore[]
  } catch (e) {
    throw toApiError(e, 'Failed to load owner risk scores')
  } finally {
    clear()
  }
}
