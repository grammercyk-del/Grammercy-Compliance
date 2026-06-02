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
      query = query.or(
        `certificate_no.ilike.%${q}%,certificate_name.ilike.%${q}%,owner_name.ilike.%${q}%`,
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

export function autoAssignOwner(categoryName: string): string {
  if (categoryName === "MoEF & CC / MPCB") {
    return "Ankit Devadiga";
  }
  return "Mayank Jain";
}

export function calculateNextRenewal(
  lastRenewed: string | null,
  frequency: string,
): string | null {
  if (!lastRenewed) return null;
  const date = new Date(lastRenewed);
  if (isNaN(date.getTime())) return null;

  switch (frequency) {
    case "Monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "Quarterly":
      date.setMonth(date.getMonth() + 3);
      break;
    case "Half-Yearly":
      date.setMonth(date.getMonth() + 6);
      break;
    case "Yearly":
      date.setFullYear(date.getFullYear() + 1);
      break;
    case "Bi-Yearly":
      date.setFullYear(date.getFullYear() + 2);
      break;
    case "One-Time":
      return null;
    default:
      return null;
  }

  return date.toISOString().split("T")[0];
}

export async function inlineUpdateCompliance(
  complianceId: string,
  field: string,
  value: unknown,
): Promise<void> {
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

  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(original)) {
    if (key !== "compliance_id" && key !== "created_at" && key !== "updated_at") {
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

export function applyFilters(
  rows: ComplianceRow[],
  filters: ComplianceFilters,
): ComplianceRow[] {
  let result = [...rows];
  const q = filters.search.trim().toLowerCase();

  if (q) {
    result = result.filter(
      (r) =>
        r.certificate_no.toLowerCase().includes(q) ||
        r.certificate_name.toLowerCase().includes(q) ||
        r.owner_name.toLowerCase().includes(q),
    );
  }
  if (filters.owner_id)
    result = result.filter((r) => r.owner_id === filters.owner_id);
  if (filters.category_id)
    result = result.filter((r) => r.category_id === filters.category_id);
  if (filters.department_id)
    result = result.filter((r) => r.department_id === filters.department_id);
  if (filters.status)
    result = result.filter((r) => r.status === filters.status);
  if (filters.renewal_frequency)
    result = result.filter(
      (r) => r.renewal_frequency === filters.renewal_frequency,
    );
  if (filters.overdue_only)
    result = result.filter((r) => r.status === "Overdue");
  if (filters.due_soon_only)
    result = result.filter((r) => r.status === "Due Soon");

  if (filters.date_from) {
    result = result.filter(
      (r) => r.next_renewal_date && r.next_renewal_date >= filters.date_from,
    );
  }
  if (filters.date_to) {
    result = result.filter(
      (r) => r.next_renewal_date && r.next_renewal_date <= filters.date_to,
    );
  }

  return result;
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

