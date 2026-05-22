import { useEffect, useState } from 'react'
import { AlertTriangle, Download } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { fetchCriticalAlerts } from '@/api/alerts'
import { exportAlerts } from '@/utils/export'
import { formatDate } from '@/utils/date'
import { statusBadgeClass, daysLabel, daysColor } from '@/utils/status'
import { CardSkeleton } from '@/components/common/Skeleton'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { EmptyState } from '@/components/common/EmptyState'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/common/Toast'
import type { CriticalAlert } from '@/types'

export function AlertsPage() {
  const [alerts, setAlerts] = useState<CriticalAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toasts, push, dismiss } = useToast()

  const load = async () => {
    try {
      setError(null)
      const data = await fetchCriticalAlerts()
      setAlerts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleExport = async () => {
    try {
      await exportAlerts(alerts)
      push(`Exported ${alerts.length} alert${alerts.length === 1 ? '' : 's'}`, 'success')
    } catch (err) {
      push(err instanceof Error ? err.message : 'Export failed', 'error')
    }
  }

  return (
    <AppShell title="Critical Alerts">
      <div className="max-w-full mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
              Critical Alerts & Overdue Items
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Showing {alerts.length} overdue or expired compliance{alerts.length === 1 ? '' : 'ies'}
            </p>
          </div>
          <button className="btn-secondary gap-2 text-sm" onClick={handleExport} disabled={alerts.length === 0}>
            <Download size={15} /> Export
          </button>
        </div>

        {error ? (
          <ErrorMessage message={error} onRetry={load} />
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : alerts.length === 0 ? (
          <EmptyState
            title="No critical alerts"
            description="All compliances are current. Great job!"
            icon={<AlertTriangle size={24} className="text-green-400" />}
          />
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.compliance_id}
                className="card p-5 border-l-4 border-l-red-500 flex items-start gap-4 hover:shadow-card-md transition-shadow"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        {alert.certificate_name}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                        {alert.certificate_no}
                      </p>
                    </div>
                    <span className={statusBadgeClass(alert.status)}>
                      {alert.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Owner</p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                        {alert.owner_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Category</p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                        {alert.category_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Department</p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                        {alert.department_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Status</p>
                      <p className={`text-xs font-semibold ${daysColor(alert.days_remaining)}`}>
                        {daysLabel(alert.days_remaining)}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    Next renewal: {formatDate(alert.next_renewal_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </div>
    </AppShell>
  )
}
