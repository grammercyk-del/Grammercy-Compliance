import { Download, FileSpreadsheet } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { useCompliances } from '@/hooks/useCompliances'
import { fetchCriticalAlerts } from '@/api/alerts'
import { fetchOwnerRiskScores } from '@/api/alerts'
import { exportCompliances, exportAlerts, exportRiskScores } from '@/utils/export'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/common/Toast'
import { useEffect, useState } from 'react'
import type { CriticalAlert, OwnerRiskScore } from '@/types'

interface ReportOption {
  title: string
  description: string
  icon: React.ReactNode
  action: () => Promise<void>
  disabled?: boolean
}

export function ReportsPage() {
  const { data: compliances } = useCompliances()
  const { toasts, push, dismiss } = useToast()
  const [alerts, setAlerts] = useState<CriticalAlert[]>([])
  const [risks, setRisks] = useState<OwnerRiskScore[]>([])

  useEffect(() => {
    Promise.all([
      fetchCriticalAlerts().then(setAlerts),
      fetchOwnerRiskScores().then(setRisks),
    ]).catch(() => { /* noop */ })
  }, [])

  const reports: ReportOption[] = [
    {
      title: 'All Compliances',
      description: 'Export complete compliance database with all details',
      icon: <FileSpreadsheet size={24} />,
      action: async () => {
        await exportCompliances(compliances, 'all_compliances')
        push(`Exported ${compliances.length} compliances`, 'success')
      },
      disabled: compliances.length === 0,
    },
    {
      title: 'Critical Alerts',
      description: 'Export all overdue and expired compliances',
      icon: <FileSpreadsheet size={24} />,
      action: async () => {
        await exportAlerts(alerts)
        push(`Exported ${alerts.length} alerts`, 'success')
      },
      disabled: alerts.length === 0,
    },
    {
      title: 'Owner Risk Scores',
      description: 'Export risk assessment by owner',
      icon: <FileSpreadsheet size={24} />,
      action: async () => {
        await exportRiskScores(risks)
        push(`Exported risk scores`, 'success')
      },
      disabled: risks.length === 0,
    },
  ]

  const handleExport = async (action: () => Promise<void>) => {
    try {
      await action()
    } catch (err) {
      push(err instanceof Error ? err.message : 'Export failed', 'error')
    }
  }

  return (
    <AppShell title="Reports">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Reports & Exports</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Generate and export compliance reports in Excel format
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report, i) => (
            <div key={i} className="card p-6 flex flex-col gap-4 hover:shadow-card-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="text-slate-400 dark:text-slate-500">{report.icon}</div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">{report.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{report.description}</p>
              </div>

              <button
                className="btn-primary gap-2 mt-auto justify-center"
                onClick={() => handleExport(report.action)}
                disabled={report.disabled}
              >
                <Download size={15} /> Export
              </button>
            </div>
          ))}
        </div>

        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </div>
    </AppShell>
  )
}
