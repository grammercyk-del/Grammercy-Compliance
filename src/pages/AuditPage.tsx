import { useEffect, useState, useMemo } from 'react'
import { RefreshCw, ScrollText } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/Skeleton'
import { fetchGlobalAudit } from '@/api/compliances'
import { formatDate } from '@/utils/date'
import { cn } from '@/utils/cn'
import type { AuditEntry } from '@/types'

const OP_BADGE: Record<string, string> = {
  INSERT: 'badge-green',
  UPDATE: 'badge-blue',
  DELETE: 'badge-red',
}

const OP_DOT: Record<string, string> = {
  INSERT: 'bg-green-500',
  UPDATE: 'bg-blue-500',
  DELETE: 'bg-red-500',
}

function diffSummary(entry: AuditEntry): string {
  if (entry.operation === 'INSERT') {
    const name = entry.new_values?.certificate_name ?? entry.new_values?.owner_name ?? entry.new_values?.category_name ?? ''
    return name ? `Created: ${String(name)}` : 'Record created'
  }
  if (entry.operation === 'DELETE') {
    const name = entry.old_values?.certificate_name ?? entry.old_values?.owner_name ?? ''
    return name ? `Deleted: ${String(name)}` : 'Record deleted'
  }
  if (!entry.old_values || !entry.new_values) return 'Updated'
  const changed: string[] = []
  for (const [key, newVal] of Object.entries(entry.new_values)) {
    const oldVal = entry.old_values[key]
    if (oldVal !== newVal) {
      changed.push(key.replace(/_/g, ' '))
    }
  }
  return changed.length ? `Changed: ${changed.slice(0, 3).join(', ')}${changed.length > 3 ? ` +${changed.length - 3} more` : ''}` : 'No changes'
}

function ChangedFields({ entry }: { entry: AuditEntry }) {
  if (entry.operation !== 'UPDATE' || !entry.old_values || !entry.new_values) return null

  const diffs = Object.entries(entry.new_values)
    .filter(([key, newVal]) => entry.old_values?.[key] !== newVal)
    .map(([key, newVal]) => ({ key, old: entry.old_values?.[key], new: newVal }))

  if (diffs.length === 0) return null

  return (
    <div className="mt-2 text-xs space-y-1 bg-slate-50 dark:bg-surface-dark-100 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700">
      {diffs.map(({ key, old: oldVal, new: newVal }) => (
        <div key={key} className="flex flex-wrap gap-x-2 gap-y-0.5">
          <span className="font-medium text-slate-600 dark:text-slate-300 capitalize min-w-[80px]">
            {key.replace(/_/g, ' ')}
          </span>
          <span className="line-through text-red-400 dark:text-red-500">{String(oldVal ?? '—')}</span>
          <span className="text-green-600 dark:text-green-400">{String(newVal ?? '—')}</span>
        </div>
      ))}
    </div>
  )
}

export function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [opFilter, setOpFilter] = useState<string>('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchGlobalAudit(300)
      setEntries(data as AuditEntry[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const filtered = useMemo(() => {
    let result = entries
    if (opFilter) result = result.filter((e) => e.operation === opFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((e) =>
        e.compliance_id.toLowerCase().includes(q) ||
        (e.changed_by ?? '').toLowerCase().includes(q) ||
        diffSummary(e).toLowerCase().includes(q),
      )
    }
    return result
  }, [entries, opFilter, search])

  return (
    <AppShell title="Audit Logs">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Global Audit Trail</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Showing last {entries.length} changes across all compliances
            </p>
          </div>
          <button
            className="btn-secondary gap-2 text-sm"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            placeholder="Search by compliance ID, user, or change…"
            className="input max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input w-40"
            value={opFilter}
            onChange={(e) => setOpFilter(e.target.value)}
          >
            <option value="">All operations</option>
            <option value="INSERT">Insert</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
          </select>
        </div>

        {/* Content */}
        {error ? (
          <ErrorMessage message={error} onRetry={load} />
        ) : loading ? (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">When</th>
                  <th className="table-th">Operation</th>
                  <th className="table-th">Compliance</th>
                  <th className="table-th">Changed By</th>
                  <th className="table-th">Summary</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={5}><TableSkeleton rows={8} /></td></tr>
              </tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No audit entries found"
            description={search || opFilter ? 'Try adjusting your filters.' : 'Audit entries will appear here as changes are made.'}
            icon={<ScrollText size={24} className="text-slate-300" />}
          />
        ) : (
          <div className="card overflow-hidden">
            {/* Timeline view */}
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filtered.map((entry) => {
                const isOpen = expanded.has(entry.audit_id)
                const hasDetails = entry.operation === 'UPDATE' && entry.old_values && entry.new_values
                return (
                  <div
                    key={entry.audit_id}
                    className={cn(
                      'px-4 py-3 transition-colors',
                      hasDetails ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40' : '',
                    )}
                    onClick={() => hasDetails && toggleExpand(entry.audit_id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Op dot */}
                      <div className={cn('mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0', OP_DOT[entry.operation] ?? 'bg-slate-400')} />

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={OP_BADGE[entry.operation] ?? 'badge-gray'}>
                            {entry.operation}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {formatDate(entry.changed_at)}{' '}
                            <span className="tabular-nums">
                              {new Date(entry.changed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </span>
                          {entry.changed_by && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              by <strong className="font-medium">{entry.changed_by}</strong>
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-300 dark:text-slate-600 truncate max-w-[140px]" title={entry.compliance_id}>
                            {entry.compliance_id.slice(0, 8)}…
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                          {diffSummary(entry)}
                        </p>

                        {isOpen && <ChangedFields entry={entry} />}
                      </div>

                      {hasDetails && (
                        <span className="text-[10px] text-slate-300 dark:text-slate-600 flex-shrink-0 mt-1">
                          {isOpen ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <p className="text-xs text-slate-400 text-center">
            {filtered.length} entr{filtered.length === 1 ? 'y' : 'ies'} shown
            {entries.length >= 300 && ' · showing most recent 300'}
          </p>
        )}
      </div>
    </AppShell>
  )
}
