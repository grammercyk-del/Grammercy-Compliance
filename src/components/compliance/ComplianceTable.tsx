import { useState, useCallback, useRef, useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Edit2,
  Trash2,
  Clock,
  Copy,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/date";
import { statusBadgeClass, daysLabel, daysColor } from "@/utils/status";
import { TableSkeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { inlineUpdateCompliance } from "@/api/compliances";
import type { ComplianceRow, SortState } from "@/types";

interface ComplianceTableProps {
  data: ComplianceRow[];
  loading: boolean;
  sort: SortState;
  onSort: (col: keyof ComplianceRow) => void;
  onEdit: (row: ComplianceRow) => void;
  onDelete: (row: ComplianceRow) => void;
  onAudit: (row: ComplianceRow) => void;
  onDuplicate: (row: ComplianceRow) => void;
  canEdit: boolean;
  /** Called after a successful inline cell save so the page can refetch. */
  onInlineSaved?: () => void;
  /** Called when an inline cell save fails so the page can surface an error. */
  onInlineError?: (message: string) => void;
}

const COLUMNS: {
  key: keyof ComplianceRow;
  label: string;
  sortable: boolean;
  editable: boolean;
}[] = [
  { key: "certificate_no", label: "Cert. No", sortable: true, editable: true },
  { key: "certificate_name", label: "Name", sortable: true, editable: true },
  { key: "owner_name", label: "Owner", sortable: true, editable: false },
  { key: "category_name", label: "Category", sortable: true, editable: false },
  {
    key: "department_name",
    label: "Department",
    sortable: false,
    editable: false,
  },
  {
    key: "renewal_frequency",
    label: "Frequency",
    sortable: false,
    editable: true,
  },
  {
    key: "last_renewed_date",
    label: "Last Renewed",
    sortable: true,
    editable: true,
  },
  {
    key: "next_renewal_date",
    label: "Next Renewal",
    sortable: true,
    editable: true,
  },
  { key: "notes", label: "Notes", sortable: false, editable: true },
  { key: "status", label: "Status", sortable: true, editable: false },
  {
    key: "days_remaining",
    label: "Days Left",
    sortable: true,
    editable: false,
  },
];

function SortIcon({
  column,
  sort,
}: {
  column: keyof ComplianceRow;
  sort: SortState;
}) {
  if (sort.column !== column)
    return <ChevronsUpDown size={13} className="text-slate-300" />;
  return sort.direction === "asc" ? (
    <ChevronUp size={13} className="text-brand-600" />
  ) : (
    <ChevronDown size={13} className="text-brand-600" />
  );
}

interface InlineEditCellProps {
  value: string | null;
  row: ComplianceRow;
  field: string;
  onSave: (id: string, field: string, value: string) => Promise<void>;
  type?: "text" | "date";
  canEdit: boolean;
}

function InlineEditCell({
  value,
  row,
  field,
  onSave,
  type = "text",
  canEdit,
}: InlineEditCellProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = useCallback(async () => {
    if (editValue === (value ?? "")) {
      setEditing(false);
      return;
    }
    // Reject malformed dates so an inline edit can't write a garbage value
    // (audit M14). An empty date is allowed — it clears the field.
    if (type === "date" && editValue && !/^\d{4}-\d{2}-\d{2}$/.test(editValue)) {
      setEditValue(value ?? "");
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(row.compliance_id, field, editValue);
      setEditing(false);
    } catch {
      setEditValue(value ?? "");
    } finally {
      setSaving(false);
    }
  }, [editValue, value, row.compliance_id, field, onSave, type]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setEditValue(value ?? "");
      setEditing(false);
    }
  };

  // Use || (not ??) so empty strings also fall back to "—"
  const displayValue =
    type === "date" && value ? formatDate(value) : (value || "—");

  // Viewers (and anyone without edit rights) get a plain, non-interactive cell.
  // Client gating is UX only — RLS is the real boundary — but we must not
  // present an editable affordance that silently fails on save.
  if (!canEdit) {
    return (
      <td className="table-td">
        <span className={cn(type === "date" && "text-xs")}>{displayValue}</span>
      </td>
    );
  }

  if (!editing) {
    return (
      <td
        className="table-td cursor-pointer hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-colors relative group"
        onDoubleClick={() => setEditing(true)}
        onClick={() => setEditing(true)}
      >
        <span className={cn(type === "date" && "text-xs")}>{displayValue}</span>
        {saving && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">
            <Check size={12} className="text-green-500 animate-pulse" />
          </span>
        )}
      </td>
    );
  }

  return (
    <td className="table-td p-1">
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type={type === "date" ? "date" : "text"}
          className="input text-xs py-1 px-2 w-full min-w-[80px]"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={saving}
        />
        <button
          onClick={() => {
            setEditValue(value ?? "");
            setEditing(false);
          }}
          className="p-0.5 rounded text-slate-400 hover:text-red-500"
        >
          <X size={12} />
        </button>
      </div>
    </td>
  );
}

function InlineSelectCell({
  value,
  row,
  field,
  onSave,
  options,
  canEdit,
}: {
  value: string | null;
  row: ComplianceRow;
  field: string;
  onSave: (id: string, field: string, value: string) => Promise<void>;
  options: string[];
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value;
    setEditing(false);
    if (newVal === value) return;
    try {
      await onSave(row.compliance_id, field, newVal);
    } catch {
      // The page-level onInlineError surfaces the failure to the user.
    }
  };

  // Read-only cell for non-editors (see InlineEditCell note).
  if (!canEdit) {
    return (
      <td className="table-td">
        <span className="badge-gray">{value || "—"}</span>
      </td>
    );
  }

  if (!editing) {
    return (
      <td
        className="table-td cursor-pointer hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-colors"
        onClick={() => setEditing(true)}
      >
        {/* Use || (not ??) so empty strings also fall back to "—" */}
        <span className="badge-gray">{value || "—"}</span>
      </td>
    );
  }

  return (
    <td className="table-td p-1">
      <select
        className="input text-xs py-1 px-2"
        value={value ?? ""}
        onChange={handleChange}
        onBlur={() => setEditing(false)}
        autoFocus
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </td>
  );
}

export function ComplianceTable({
  data,
  loading,
  sort,
  onSort,
  onEdit,
  onDelete,
  onAudit,
  onDuplicate,
  canEdit,
  onInlineSaved,
  onInlineError,
}: ComplianceTableProps) {
  const [visibleCols, setVisibleCols] = useState<Set<string>>(
    new Set(
      COLUMNS.filter(
        (c) => c.key !== "notes" && c.key !== "last_renewed_date",
      ).map((c) => c.key),
    ),
  );

  const [showColMenu, setShowColMenu] = useState(false);
  const [savingCell, setSavingCell] = useState<string | null>(null);

  const toggleCol = (key: string) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleInlineSave = async (id: string, field: string, value: string) => {
    const cellKey = `${id}-${field}`;
    setSavingCell(cellKey);
    try {
      await inlineUpdateCompliance(id, field, value || null);
      // Refetch so view-computed columns (Status, Days Left, …) reflect the
      // new value instead of showing stale data (audit H6).
      onInlineSaved?.();
    } catch (err) {
      // Surface the failure instead of silently reverting (audit H7), then
      // rethrow so the cell restores its previous value.
      onInlineError?.(
        err instanceof Error ? err.message : "Failed to save change",
      );
      throw err;
    } finally {
      setSavingCell(null);
    }
  };

  return (
    <div className="space-y-2">
      {/* Column visibility toggle */}
      <div className="flex justify-end">
        <div className="relative">
          <button
            className="btn-ghost text-xs"
            onClick={() => setShowColMenu((s) => !s)}
          >
            Columns
          </button>
          {showColMenu && (
            <div className="absolute right-0 top-8 z-30 bg-white dark:bg-surface-dark-50 border border-slate-200 dark:border-slate-700 rounded-xl shadow-card-lg p-3 w-44 animate-slide-in">
              {COLUMNS.map((c) => (
                <label
                  key={c.key}
                  className="flex items-center gap-2 py-1 text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="accent-brand-600"
                    checked={visibleCols.has(c.key)}
                    onChange={() => toggleCol(c.key)}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {COLUMNS.filter((c) => visibleCols.has(c.key)).map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "table-th",
                      col.sortable &&
                        "cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-dark-200",
                    )}
                    onClick={() => col.sortable && onSort(col.key)}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && (
                        <SortIcon column={col.key} sort={sort} />
                      )}
                    </span>
                  </th>
                ))}
                <th className="table-th w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleCols.size + 1}>
                    <TableSkeleton rows={8} />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.size + 1}>
                    <EmptyState />
                  </td>
                </tr>
              ) : (
                data.map((row) => {
                  const isSaving = savingCell?.startsWith(row.compliance_id);
                  return (
                    <tr
                      key={row.compliance_id}
                      className={cn(
                        "table-tr",
                        isSaving && "bg-brand-50/30 dark:bg-brand-900/5",
                      )}
                    >
                      {visibleCols.has("certificate_no") && (
                        <td className="table-td font-mono text-xs text-slate-500">
                          {row.certificate_no}
                        </td>
                      )}
                      {visibleCols.has("certificate_name") && (
                        <InlineEditCell
                          value={row.certificate_name}
                          row={row}
                          field="certificate_name"
                          onSave={handleInlineSave}
                          canEdit={canEdit}
                        />
                      )}
                      {visibleCols.has("owner_name") && (
                        <td className="table-td">{row.owner_name}</td>
                      )}
                      {visibleCols.has("category_name") && (
                        <td className="table-td">{row.category_name}</td>
                      )}
                      {visibleCols.has("department_name") && (
                        <td className="table-td">{row.department_name}</td>
                      )}
                      {visibleCols.has("renewal_frequency") && (
                        <InlineSelectCell
                          value={row.renewal_frequency}
                          row={row}
                          field="renewal_frequency"
                          onSave={handleInlineSave}
                          options={[
                            "Monthly",
                            "Quarterly",
                            "Half-Yearly",
                            "Yearly",
                            "Bi-Yearly",
                            "One-Time",
                          ]}
                          canEdit={canEdit}
                        />
                      )}
                      {visibleCols.has("last_renewed_date") && (
                        <InlineEditCell
                          value={row.last_renewed_date}
                          row={row}
                          field="last_renewed_date"
                          onSave={handleInlineSave}
                          type="date"
                          canEdit={canEdit}
                        />
                      )}
                      {visibleCols.has("next_renewal_date") && (
                        <InlineEditCell
                          value={row.next_renewal_date}
                          row={row}
                          field="next_renewal_date"
                          onSave={handleInlineSave}
                          type="date"
                          canEdit={canEdit}
                        />
                      )}
                      {visibleCols.has("notes") && (
                        <InlineEditCell
                          value={row.notes}
                          row={row}
                          field="notes"
                          onSave={handleInlineSave}
                          canEdit={canEdit}
                        />
                      )}
                      {visibleCols.has("status") && (
                        <td className="table-td">
                          <span className={statusBadgeClass(row.status)}>
                            {row.status}
                          </span>
                        </td>
                      )}
                      {visibleCols.has("days_remaining") && (
                        <td
                          className={cn(
                            "table-td text-xs",
                            daysColor(row.days_remaining),
                          )}
                        >
                          {daysLabel(row.days_remaining)}
                        </td>
                      )}
                      {/* Actions */}
                      <td className="table-td">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onAudit(row)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="View audit history"
                          >
                            <Clock size={14} />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => onEdit(row)}
                                className="p-1.5 rounded-md text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                                title="Edit in form"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => onDuplicate(row)}
                                className="p-1.5 rounded-md text-slate-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                                title="Duplicate row"
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                onClick={() => onDelete(row)}
                                className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend for inline editing */}
      {canEdit && data.length > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          Click any editable cell to modify inline · Press Enter to save · Esc
          to cancel
        </p>
      )}
    </div>
  );
}
