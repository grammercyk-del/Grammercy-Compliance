import { supabase } from '@/lib/supabase'
import type {
  ComplianceRow,
  CreateCompliancePayload,
  UpdateCompliancePayload,
  ComplianceFilters,
} from '@/types'

/** Fetch all compliances from the reporting view, with optional filters applied client-side */
export async function fetchCompliances(): Promise<ComplianceRow[]> {
  const { data, error } = await supabase
    .from('compliances_with_status')
    .select('*')
    .order('next_renewal_date', { ascending: true, nullsFirst: false })

  if (error) throw error
  return (data ?? []) as ComplianceRow[]
}

/** Apply all active filters to a compliance list (client-side, for flexibility) */
export function applyFilters(
  rows: ComplianceRow[],
  filters: ComplianceFilters,
): ComplianceRow[] {
  let result = [...rows]
  const q = filters.search.trim().toLowerCase()

  if (q) {
    result = result.filter(
      (r) =>
        r.certificate_no.toLowerCase().includes(q) ||
        r.certificate_name.toLowerCase().includes(q) ||
        r.owner_name.toLowerCase().includes(q),
    )
  }
  if (filters.owner_id)        result = result.filter((r) => r.owner_id === filters.owner_id)
  if (filters.category_id)     result = result.filter((r) => r.category_id === filters.category_id)
  if (filters.department_id)   result = result.filter((r) => r.department_id === filters.department_id)
  if (filters.status)          result = result.filter((r) => r.status === filters.status)
  if (filters.renewal_frequency) result = result.filter((r) => r.renewal_frequency === filters.renewal_frequency)
  if (filters.overdue_only)    result = result.filter((r) => r.status === 'Overdue')
  if (filters.due_soon_only)   result = result.filter((r) => r.status === 'Due Soon')

  if (filters.date_from) {
    result = result.filter(
      (r) => r.next_renewal_date && r.next_renewal_date >= filters.date_from,
    )
  }
  if (filters.date_to) {
    result = result.filter(
      (r) => r.next_renewal_date && r.next_renewal_date <= filters.date_to,
    )
  }

  return result
}

export async function createCompliance(payload: CreateCompliancePayload): Promise<ComplianceRow> {
  const { data, error } = await supabase
    .from('compliances')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as ComplianceRow
}

export async function updateCompliance(
  complianceId: string,
  payload: UpdateCompliancePayload,
): Promise<ComplianceRow> {
  const { data, error } = await supabase
    .from('compliances')
    .update(payload)
    .eq('compliance_id', complianceId)
    .select()
    .single()

  if (error) throw error
  return data as ComplianceRow
}

export async function softDeleteCompliance(complianceId: string): Promise<void> {
  const { error } = await supabase.rpc('soft_delete_compliance', {
    p_compliance_id: complianceId,
  })
  if (error) throw error
}

export async function fetchComplianceAudit(complianceId: string) {
  const { data, error } = await supabase
    .from('compliances_audit')
    .select('*')
    .eq('compliance_id', complianceId)
    .order('changed_at', { ascending: false })

  if (error) throw error
  return data ?? []
}
