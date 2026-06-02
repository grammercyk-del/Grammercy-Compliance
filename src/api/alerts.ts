import { supabase } from '@/lib/supabase'
import type { CriticalAlert, OwnerRiskScore } from '@/types'

export async function fetchCriticalAlerts(): Promise<CriticalAlert[]> {
  const { data, error } = await supabase
    .from('critical_alerts')
    .select('*')
    .order('days_remaining', { ascending: true, nullsFirst: true })
  if (error) throw new Error(error.message || 'Failed to load critical alerts')
  return (data ?? []) as CriticalAlert[]
}

export async function fetchOwnerRiskScores(): Promise<OwnerRiskScore[]> {
  const { data, error } = await supabase
    .from('owner_risk_scores')
    .select('*')
    .order('risk_score', { ascending: false })
  if (error) throw new Error(error.message || 'Failed to load owner risk scores')
  return (data ?? []) as OwnerRiskScore[]
}
