import { supabase } from "@/lib/supabase";
import { createTimeoutSignal, toApiError } from "@/utils/timeout";
import type {
  ComplianceRow,
  CreateCompliancePayload,
  UpdateCompliancePayload,
  ComplianceFilters,
  SortState,
} from "@/types";

export async function fetchCompliances(): Promise<ComplianceRow[]> {
  const { signal, clear } = createTimeoutSignal()
  try {
    const { data, error } = await supabase
      .from("compliances_with_status")
      .select("*")
      .order("next_renewal_date", { ascending: true, nullsFirst: false })
      .abortSignal(signal)
    if (error) throw new Error(error.message || "Failed to load compliance records")
    return (data ?? []) as ComplianceRow[]
  } catch (e) {
    throw toApiError(e, "Failed to load compliance records")
  } finally {
    clear()
  }
}

/** Server-side paginated fetch with filters and sort. Used by CompliancesPage. */
export async function fetchCompliancesPaginated(
  filters: ComplianceFilters,
  sort: SortState,
  page: number,
  pageSize: number,
): Promise<{ data: ComplianceRow[]; total: number }> {
  const { signal, clear } = createTimeoutSignal()
  try {
    let query = supabase
      .from("compliances_with_status")
      .select("*", { count: "exact" })

    const q = filters.search.trim()
    if (q) {
      // Quote each pattern and escape embedded quotes/backslashes so commas,
      // parentheses, etc. in the search term are treated literally rather than
      // as PostgREST filter syntax (audit M10).
      const safe = q.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
      query = query.or(
        `certificate_no.ilike."%${safe}%",certificate_name.ilike."%${safe}%",owner_name.ilike."%${safe}%"`,
      )
    }

    if (filters.owner_id) query = query.eq("owner_id", filters.owner_id)
    if (filters.category_id) query = query.eq("category_id", filters.category_id)
    if (filters.department_id) query = query.eq("department_id", filters.department_id)
    if (filters.renewal_frequency) query = query.eq("renewal_frequency", filters.renewal_frequency)
    if (filters.date_from) query = query.gte("next_renewal_date", filters.date_from)
    if (filters.date_to) query = query.lte("next_renewal_date", filters.date_to)

    // overdue_only / due_soon_only take precedence over status
    if (filters.overdue_only) {
      query = query.eq("status", "Overdue")
    } else if (filters.due_soon_only) {
      query = query.eq("status", "Due Soon")
    } else if (filters.status) {
      query = query.eq("status", filters.status)
    }

    const col = (sort.column ?? "next_renewal_date") as string
    query = query.order(col, { ascending: sort.direction !== "desc", nullsFirst: false })

    const from = (page - 1) * pageSize
    query = query.range(from, from + pageSize - 1)

    const { data, error, count } = await query.abortSignal(signal)
    if (error) throw new Error(error.message || "Failed to load compliance records")
    return { data: (data ?? []) as ComplianceRow[], total: count ?? 0 }
  } catch (e) {
    throw toApiError(e, "Failed to load compliance records")
  } finally {
    clear()
  }
}

/** Columns that may be edited inline from the table. Anything else is rejected. */
const INLINE_EDITABLE_FIELDS = new Set([
  "certificate_no",
  "certificate_name",
  "renewal_frequency",
  "last_renewed_date",
  "next_renewal_date",
  "notes",
])

export async function inlineUpdateCompliance(
  complianceId: string,
  field: string,
  value: unknown,
): Promise<void> {
  if (!INLINE_EDITABLE_FIELDS.has(field)) {
    throw new Error(`Field "${field}" cannot be edited inline`)
  }
  const { signal, clear } = createTimeoutSignal()
  try {
    const { error } = await supabase
      .from("compliances")
      .update({ [field]: value })
      .eq("compliance_id", complianceId)
      .abortSignal(signal)
    if (error) throw new Error(error.message || "Failed to update compliance field")
  } catch (e) {
    throw toApiError(e, "Failed to update compliance field")
  } finally {
    clear()
  }
}

export async function duplicateCompliance(complianceId: string): Promise<void> {
  const { signal: s1, clear: c1 } = createTimeoutSignal()
  let original: Record<string, unknown>
  try {
    const { data, error } = await supabase
      .from("compliances")
      .select("*")
      .eq("compliance_id", complianceId)
      .abortSignal(s1)
      .single()
    if (error) throw new Error(error.message || "Failed to fetch original compliance")
    original = data
  } catch (e) {
    throw toApiError(e, "Failed to fetch original compliance")
  } finally {
    c1()
  }

  // Exclude generated / identity columns. certificate_no and is_deleted are
  // dropped so the copy gets a fresh auto-generated cert number and is never
  // created already-deleted (audit M11).
  const SKIP = new Set([
    "compliance_id",
    "created_at",
    "updated_at",
    "certificate_no",
    "is_deleted",
  ]);
  const rest: Record<string, unknown> = { is_deleted: false };
  for (const [key, value] of Object.entries(original)) {
    if (!SKIP.has(key)) {
      rest[key] = value;
    }
  }

  const { signal: s2, clear: c2 } = createTimeoutSignal()
  try {
    const { error } = await supabase.from("compliances").insert(rest).abortSignal(s2)
    if (error) throw new Error(error.message || "Failed to duplicate compliance")
  } catch (e) {
    throw toApiError(e, "Failed to duplicate compliance")
  } finally {
    c2()
  }
}

export async function createCompliance(
  payload: CreateCompliancePayload,
): Promise<ComplianceRow> {
  const { signal, clear } = createTimeoutSignal()
  try {
    const { data, error } = await supabase
      .from("compliances")
      .insert(payload)
      .select()
      .abortSignal(signal)
      .single()
    if (error) throw new Error(error.message || "Failed to create compliance")
    return data as ComplianceRow
  } catch (e) {
    throw toApiError(e, "Failed to create compliance")
  } finally {
    clear()
  }
}

export async function updateCompliance(
  complianceId: string,
  payload: UpdateCompliancePayload,
): Promise<ComplianceRow> {
  const { signal, clear } = createTimeoutSignal()
  try {
    const { data, error } = await supabase
      .from("compliances")
      .update(payload)
      .eq("compliance_id", complianceId)
      .select()
      .abortSignal(signal)
      .single()
    if (error) throw new Error(error.message || "Failed to update compliance")
    return data as ComplianceRow
  } catch (e) {
    throw toApiError(e, "Failed to update compliance")
  } finally {
    clear()
  }
}

export async function softDeleteCompliance(
  complianceId: string,
): Promise<void> {
  const { signal, clear } = createTimeoutSignal()
  try {
    const { error } = await supabase
      .rpc("soft_delete_compliance", { p_compliance_id: complianceId })
      .abortSignal(signal)
    if (error) throw new Error(error.message || "Failed to delete compliance")
  } catch (e) {
    throw toApiError(e, "Failed to delete compliance")
  } finally {
    clear()
  }
}

export async function fetchComplianceAudit(complianceId: string) {
  const { signal, clear } = createTimeoutSignal()
  try {
    const { data, error } = await supabase
      .from("compliances_audit")
      .select("*")
      .eq("compliance_id", complianceId)
      .order("changed_at", { ascending: false })
      .abortSignal(signal)
    if (error) throw new Error(error.message || "Failed to fetch audit history")
    return data ?? []
  } catch (e) {
    throw toApiError(e, "Failed to fetch audit history")
  } finally {
    clear()
  }
}

export async function fetchGlobalAudit(limit = 300) {
  const { signal, clear } = createTimeoutSignal()
  try {
    const { data, error } = await supabase
      .from("compliances_audit")
      .select("*")
      .order("changed_at", { ascending: false })
      .limit(limit)
      .abortSignal(signal)
    if (error) throw new Error(error.message || "Failed to fetch audit log")
    return data ?? []
  } catch (e) {
    throw toApiError(e, "Failed to fetch audit log")
  } finally {
    clear()
  }
}

