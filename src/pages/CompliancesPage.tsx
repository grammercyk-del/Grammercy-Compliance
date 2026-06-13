import { useMemo, useState, useEffect, useCallback } from "react";
import { Plus, Download } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useCompliancesPaginated } from "@/hooks/useCompliances";
import { useLookups } from "@/hooks/useLookups";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import { FilterBar } from "@/components/filters/FilterBar";
import { ComplianceTable } from "@/components/compliance/ComplianceTable";
import { Pagination } from "@/components/compliance/Pagination";
import { ComplianceFormModal } from "@/components/modals/ComplianceFormModal";
import { AuditModal } from "@/components/modals/AuditModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { ToastContainer } from "@/components/common/Toast";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { softDeleteCompliance, duplicateCompliance, fetchCompliancesPaginated } from "@/api/compliances";
import { exportCompliances } from "@/utils/export";
import type { ComplianceRow, ComplianceFilters, SortState } from "@/types";
import { DEFAULT_FILTERS } from "@/types";

export function CompliancesPage() {
  const { owners, categories, departments, loading: lookupsLoading } = useLookups();
  const { isEditor } = useAuth();
  const { toasts, push, dismiss } = useToast();

  const [filters, setFilters] = useState<ComplianceFilters>(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState(DEFAULT_FILTERS.search);
  const [sort, setSort] = useState<SortState>({ column: "next_renewal_date", direction: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState<ComplianceRow | null>(null);
  const [auditRow, setAuditRow] = useState<ComplianceRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<ComplianceRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search so we don't fire an API call on every keystroke
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(filters.search), 300)
    return () => clearTimeout(id)
  }, [filters.search])

  // Merge debounced search back into the active filters used for the API call
  const activeFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  )

  const { data, total, loading, error, refetch } = useCompliancesPaginated(
    activeFilters,
    sort,
    page,
    pageSize,
  );

  const handleFilterChange = (f: ComplianceFilters) => {
    setFilters(f);
    setPage(1);
  };

  const handleSort = (col: keyof ComplianceRow) => {
    setSort((s) =>
      s.column === col
        ? { column: col, direction: s.direction === "asc" ? "desc" : "asc" }
        : { column: col, direction: "asc" },
    );
    setPage(1);
  };

  const handleEdit = (row: ComplianceRow) => {
    setEditRow(row);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteRow) return;
    setDeleting(true);
    try {
      await softDeleteCompliance(deleteRow.compliance_id);
      push("Compliance deleted successfully", "success");
      setDeleteRow(null);
      refetch();
    } catch (err) {
      push(err instanceof Error ? err.message : "Delete failed", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async (row: ComplianceRow) => {
    try {
      await duplicateCompliance(row.compliance_id);
      push(`Duplicated "${row.certificate_name}"`, "success");
      refetch();
    } catch (err) {
      push(err instanceof Error ? err.message : "Duplicate failed", "error");
    }
  };

  const handleExport = useCallback(async () => {
    try {
      // Fetch all matching records for export (up to 10 000)
      const { data: allRows } = await fetchCompliancesPaginated(activeFilters, sort, 1, 10_000);
      await exportCompliances(allRows, `compliances_${new Date().toISOString().slice(0, 10)}`);
      push(`Exported ${allRows.length} compliance${allRows.length === 1 ? "" : "s"}`, "success");
    } catch (err) {
      push(err instanceof Error ? err.message : "Export failed", "error");
    }
  }, [activeFilters, sort, push]);

  return (
    <AppShell title="Compliances">
      <div className="max-w-full mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            Compliance Management
          </h2>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary gap-2 text-sm"
              onClick={handleExport}
              disabled={total === 0}
            >
              <Download size={15} /> Export
            </button>
            {isEditor && (
              <button
                className="btn-primary gap-2 text-sm"
                onClick={() => { setEditRow(null); setShowForm(true); }}
              >
                <Plus size={15} /> New Compliance
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {!lookupsLoading && (
          <FilterBar
            filters={filters}
            onChange={handleFilterChange}
            owners={owners}
            categories={categories}
            departments={departments}
          />
        )}

        {/* Search bar */}
        <div>
          <input
            type="search"
            placeholder="Search by certificate no, name, or owner…"
            className="input max-w-xs"
            value={filters.search}
            onChange={(e) => {
              setFilters((f) => ({ ...f, search: e.target.value }));
              setPage(1);
            }}
          />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {total} result{total === 1 ? "" : "s"}
          </p>
        </div>

        {/* Table */}
        {error ? (
          <ErrorMessage message="Failed to load compliances" onRetry={refetch} />
        ) : (
          <>
            <ComplianceTable
              data={data}
              loading={loading}
              sort={sort}
              onSort={handleSort}
              onEdit={handleEdit}
              onDelete={(r) => setDeleteRow(r)}
              onAudit={(r) => setAuditRow(r)}
              onDuplicate={handleDuplicate}
              canEdit={isEditor}
              onInlineSaved={refetch}
              onInlineError={(msg) => push(msg, "error")}
            />

            {!loading && total > 0 && (
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              />
            )}
          </>
        )}

        {/* Modals */}
        <ComplianceFormModal
          open={showForm}
          onClose={() => { setShowForm(false); setEditRow(null); }}
          onSuccess={(msg) => {
            push(msg, "success");
            setShowForm(false);
            setEditRow(null);
            refetch();
          }}
          onError={(msg) => push(msg, "error")}
          owners={owners}
          categories={categories}
          departments={departments}
          editRow={editRow}
        />

        <AuditModal
          open={!!auditRow}
          onClose={() => setAuditRow(null)}
          compliance={auditRow}
        />

        <ConfirmModal
          open={!!deleteRow}
          onClose={() => setDeleteRow(null)}
          onConfirm={handleDelete}
          title="Delete Compliance"
          message={`Are you sure you want to delete "${deleteRow?.certificate_name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          loading={deleting}
        />

        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </div>
    </AppShell>
  );
}
