import { supabase } from "@/lib/supabase";
import type {
  ComplianceRow,
  CreateCompliancePayload,
  UpdateCompliancePayload,
  ComplianceFilters,
} from "@/types";

export async function fetchCompliances(): Promise<ComplianceRow[]> {
  const { data, error } = await supabase
    .from("compliances_with_status")
    .select("*")
    .order("next_renewal_date", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message || "Failed to load compliance records");
  return (data ?? []) as ComplianceRow[];
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
  const { error } = await supabase
    .from("compliances")
    .update({ [field]: value })
    .eq("compliance_id", complianceId);

  if (error) throw new Error(error.message || "Failed to update compliance field");
}

export async function duplicateCompliance(complianceId: string): Promise<void> {
  const { data: original, error: fetchError } = await supabase
    .from("compliances")
    .select("*")
    .eq("compliance_id", complianceId)
    .single();

  if (fetchError) throw new Error(fetchError.message || "Failed to fetch original compliance");

  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(original)) {
    if (
      key !== "compliance_id" &&
      key !== "created_at" &&
      key !== "updated_at"
    ) {
      rest[key] = value;
    }
  }

  const { error: insertError } = await supabase
    .from("compliances")
    .insert(rest);

  if (insertError) throw new Error(insertError.message || "Failed to duplicate compliance");
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
  const { data, error } = await supabase
    .from("compliances")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message || "Failed to create compliance");
  return data as ComplianceRow;
}

export async function updateCompliance(
  complianceId: string,
  payload: UpdateCompliancePayload,
): Promise<ComplianceRow> {
  const { data, error } = await supabase
    .from("compliances")
    .update(payload)
    .eq("compliance_id", complianceId)
    .select()
    .single();

  if (error) throw new Error(error.message || "Failed to update compliance");
  return data as ComplianceRow;
}

export async function softDeleteCompliance(
  complianceId: string,
): Promise<void> {
  const { error } = await supabase.rpc("soft_delete_compliance", {
    p_compliance_id: complianceId,
  });
  if (error) throw new Error(error.message || "Failed to delete compliance");
}

export async function fetchComplianceAudit(complianceId: string) {
  const { data, error } = await supabase
    .from("compliances_audit")
    .select("*")
    .eq("compliance_id", complianceId)
    .order("changed_at", { ascending: false });

  if (error) throw new Error(error.message || "Failed to fetch audit history");
  return data ?? [];
}

export async function fetchGlobalAudit(limit = 300) {
  const { data, error } = await supabase
    .from("compliances_audit")
    .select("*")
    .order("changed_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message || "Failed to fetch audit log");
  return data ?? [];
}
