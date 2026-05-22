import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Edit2, Trash2, Clock } from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/date'
import { statusBadgeClass, daysLabel, daysColor } from '@/utils/status'
import { TableSkeleton } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import type { ComplianceRow, SortState } from '@/types'

interface ComplianceTableProps {
  data: ComplianceRow[]
  loading: boolean
  sort: SortState
  onSort: (col: keyof ComplianceRow) => void
  onEdit: (row: ComplianceRow) => void
  onDelete: (row: ComplianceRow) => void
  onAudit: (row: ComplianceRow) => void
  canEdit: boolean
}

const COLUMNS: { key: keyof ComplianceRow; label: string; sortable: boolean }[] = [
  { key: 'certificate_no',    label: 'Cert. No',    sortable: true  },
  { key: 'certificate_name',  label: 'Name',        sortable: true  },
  { key: 'owner_name',        label: 'Owner',       sortable: true  },
  { key: 'category_name',     label: 'Category',    sortable: true  },
  { key: 'department_name',   label: 'Department',  sortable: false },
  { key: 'renewal_frequency', label: 'Frequency',   sortable: false },
  { key: 'next_renewal_date', label: 'Next Renewal',sortable: true  },
  { key: 'status',            label: 'Status',      sortable: true  },
  { key: 'days_remaining',    label: 'Days Left',   sortable: true  },
]

function SortIcon({ column, sort }: { column: keyof ComplianceRow; sort: SortState }) {
  if (sort.column !== column) return <ChevronsUpDown size={13} className="text-slate-300" />
  return sort.direction === 'asc'
    ? <ChevronUp size={13} className="text-brand-600" />
    : <ChevronDown size={13} className="text-brand-600" />
}

export function ComplianceTable({
  data, loading, sort, onSort, onEdit, onDelete, onAudit, canEdit,
}: ComplianceTableProps) {
  const [visibleCols, setVisibleCols] = useState<Set<string>>(
    new Set(COLUMNS.map((c) => c.key)),
  )

  const toggleCol = (key: string) => {
    setVisibleCols((prev) => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      return next
    })
  }

  const [showColMenu, setShowColMenu] = useState(false)

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
                <label key={c.key} className="flex items-center gap-2 py-1 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
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
                    className={cn('table-th', col.sortable && 'cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-dark-200')}
                    onClick={() => col.sortable && onSort(col.key)}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && <SortIcon column={col.key} sort={sort} />}
                    </span>
                  </th>
                ))}
                <th className="table-th w-24">Actions</th>
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
                data.map((row) => (
                  <tr key={row.compliance_id} className="table-tr">
                    {visibleCols.has('certificate_no') && (
                      <td className="table-td font-mono text-xs text-slate-500">{row.certificate_no}</td>
                    )}
                    {visibleCols.has('certificate_name') && (
                      <td className="table-td font-medium text-slate-800 dark:text-white max-w-xs truncate">
                        {row.certificate_name}
                      </td>
                    )}
                    {visibleCols.has('owner_name') && (
                      <td className="table-td">{row.owner_name}</td>
                    )}
                    {visibleCols.has('category_name') && (
                      <td className="table-td">{row.category_name}</td>
                    )}
                    {visibleCols.has('department_name') && (
                      <td className="table-td">{row.department_name}</td>
                    )}
                    {visibleCols.has('renewal_frequency') && (
                      <td className="table-td">
                        <span className="badge-gray">{row.renewal_frequency}</span>
                      </td>
                    )}
                    {visibleCols.has('next_renewal_date') && (
                      <td className="table-td text-xs">{formatDate(row.next_renewal_date)}</td>
                    )}
                    {visibleCols.has('status') && (
                      <td className="table-td">
                        <span className={statusBadgeClass(row.status)}>{row.status}</span>
                      </td>
                    )}
                    {visibleCols.has('days_remaining') && (
                      <td className={cn('table-td text-xs', daysColor(row.days_remaining))}>
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
                              title="Edit"
                            >
                              <Edit2 size={14} />
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
