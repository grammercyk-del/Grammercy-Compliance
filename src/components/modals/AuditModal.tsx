import { useEffect, useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { fetchComplianceAudit } from '@/api/compliances'
import { formatDate } from '@/utils/date'
import { Skeleton } from '@/components/common/Skeleton'
import type { AuditEntry, ComplianceRow } from '@/types'

interface AuditModalProps {
  open: boolean
  onClose: () => void
  compliance: ComplianceRow | null
}

const opColor = {
  INSERT: 'badge-green',
  UPDATE: 'badge-blue',
  DELETE: 'badge-red',
}

export function AuditModal({ open, onClose, compliance }: AuditModalProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && compliance) {
      setLoading(true)
      fetchComplianceAudit(compliance.compliance_id)
        .then((data) => setEntries(data as AuditEntry[]))
        .finally(() => setLoading(false))
    }
  }, [open, compliance])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Audit History — ${compliance?.certificate_name ?? ''}`}
      size="lg"
    >
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-72" />
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No audit history found.</p>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="space-y-5">
            {entries.map((e) => (
              <div key={e.audit_id} className="flex gap-4 relative">
                {/* Dot */}
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white dark:bg-surface-dark-50 border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center z-10">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      e.operation === 'INSERT' ? 'bg-green-500' :
                      e.operation === 'DELETE' ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                  />
                </div>

                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={opColor[e.operation] ?? 'badge-gray'}>{e.operation}</span>
                    <span className="text-xs text-slate-400">
                      {formatDate(e.changed_at)} {new Date(e.changed_at).toLocaleTimeString()}
                    </span>
                    {e.changed_by && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        by <strong className="font-medium">{e.changed_by}</strong>
                      </span>
                    )}
                  </div>

                  {e.operation === 'UPDATE' && e.old_values && e.new_values && (
                    <div className="text-xs space-y-1 bg-slate-50 dark:bg-surface-dark-100 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700">
                      {Object.entries(e.new_values).map(([key, newVal]) => {
                        const oldVal = e.old_values?.[key]
                        if (oldVal === newVal) return null
                        return (
                          <div key={key} className="flex gap-2 flex-wrap">
                            <span className="font-medium text-slate-600 dark:text-slate-300 capitalize">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="line-through text-red-400">{String(oldVal ?? '—')}</span>
                            <span className="text-green-600 dark:text-green-400">{String(newVal ?? '—')}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}
