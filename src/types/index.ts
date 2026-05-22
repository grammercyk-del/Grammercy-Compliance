// ─── Auth & Roles ───────────────────────────────────────────────────────────

export type UserRole = 'editor' | 'viewer'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
}

// ─── Lookup Tables ──────────────────────────────────────────────────────────

export interface Owner {
  owner_id: string
  owner_name: string
  email?: string
  department?: string
  is_active: boolean
}

export interface Category {
  category_id: string
  category_name: string
  description?: string
  is_active: boolean
}

export interface Department {
  department_id: string
  department_name: string
  description?: string
  is_active: boolean
}

// ─── Compliance ──────────────────────────────────────────────────────────────

export type ComplianceStatus = 'Active' | 'Due Soon' | 'Overdue' | 'Expired' | 'Pending'

export type RenewalFrequency =
  | 'Monthly'
  | 'Quarterly'
  | 'Half-Yearly'
  | 'Yearly'
  | 'Bi-Yearly'
  | 'One-Time'

/** Shape returned by the compliances_with_status view */
export interface ComplianceRow {
  compliance_id: string
  certificate_no: string
  certificate_name: string
  owner_id: string
  owner_name: string
  category_id: string
  category_name: string
  department_id: string
  department_name: string
  renewal_frequency: RenewalFrequency
  last_renewed_date: string | null
  next_renewal_date: string | null
  notes: string | null
  status: ComplianceStatus
  days_remaining: number | null
  created_at: string
  updated_at: string
}

/** Payload for INSERT — only writable fields */
export interface CreateCompliancePayload {
  certificate_name: string
  category_id: string
  department_id: string
  owner_id: string
  renewal_frequency: RenewalFrequency
  last_renewed_date: string | null
  next_renewal_date: string | null
  notes: string | null
}

/** Payload for UPDATE — only writable fields */
export interface UpdateCompliancePayload {
  certificate_name?: string
  category_id?: string
  department_id?: string
  owner_id?: string
  renewal_frequency?: RenewalFrequency
  last_renewed_date?: string | null
  next_renewal_date?: string | null
  notes?: string | null
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export interface AuditEntry {
  audit_id: string
  compliance_id: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  changed_by: string | null
  changed_at: string
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
}

// ─── Risk & Alerts ───────────────────────────────────────────────────────────

export interface CriticalAlert {
  compliance_id: string
  certificate_no: string
  certificate_name: string
  owner_name: string
  category_name: string
  department_name: string
  next_renewal_date: string | null
  days_remaining: number | null
  status: ComplianceStatus
}

export interface OwnerRiskScore {
  owner_id: string
  owner_name: string
  total_compliances: number
  overdue_count: number
  due_soon_count: number
  active_count: number
  risk_score: number
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  total: number
  active: number
  dueSoon: number
  overdue: number
  critical: number
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface ComplianceFilters {
  search: string
  owner_id: string
  category_id: string
  department_id: string
  status: ComplianceStatus | ''
  renewal_frequency: RenewalFrequency | ''
  date_from: string
  date_to: string
  overdue_only: boolean
  due_soon_only: boolean
}

export const DEFAULT_FILTERS: ComplianceFilters = {
  search: '',
  owner_id: '',
  category_id: '',
  department_id: '',
  status: '',
  renewal_frequency: '',
  date_from: '',
  date_to: '',
  overdue_only: false,
  due_soon_only: false,
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationState {
  page: number
  pageSize: number
}

// ─── Sort ────────────────────────────────────────────────────────────────────

export type SortDir = 'asc' | 'desc'

export interface SortState {
  column: keyof ComplianceRow | ''
  direction: SortDir
}
