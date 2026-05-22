import { useEffect, useState } from 'react'
import { Download, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { AppShell } from '@/components/layout/AppShell'
import { fetchOwnerRiskScores } from '@/api/alerts'
import { exportRiskScores } from '@/utils/export'
import { CardSkeleton } from '@/components/common/Skeleton'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { EmptyState } from '@/components/common/EmptyState'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/common/Toast'
import type { OwnerRiskScore } from '@/types'

export function RiskPage() {
  const [scores, setScores] = useState<OwnerRiskScore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toasts, push, dismiss } = useToast()

  const load = async () => {
    try {
      setError(null)
      const data = await fetchOwnerRiskScores()
      setScores(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load risk scores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleExport = async () => {
    try {
      await exportRiskScores(scores)
      push(`Exported risk scores for ${scores.length} owner${scores.length === 1 ? '' : 's'}`, 'success')
    } catch (err) {
      push(err instanceof Error ? err.message : 'Export failed', 'error')
    }
  }

  const riskLevel = (score: number) => {
    if (score >= 80) return { label: 'Critical', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' }
    if (score >= 60) return { label: 'High', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' }
    if (score >= 40) return { label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' }
    return { label: 'Low', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' }
  }

  return (
    <AppShell title="Risk Analytics">
      <div className="max-w-full mx-auto space-y-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Owner Risk Analysis</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Risk assessment based on overdue and due-soon compliances
            </p>
          </div>
          <button className="btn-secondary gap-2 text-sm" onClick={handleExport} disabled={scores.length === 0}>
            <Download size={15} /> Export
          </button>
        </div>

        {error ? (
          <ErrorMessage message={error} onRetry={load} />
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : scores.length === 0 ? (
          <EmptyState
            title="No risk data available"
            description="No owners with compliances found."
            icon={<TrendingUp size={24} className="text-slate-300" />}
          />
        ) : (
          <>
            {/* Chart */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Risk Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scores} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="owner_name" tick={{ fontSize: 11, fill: '#94a3b8' }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Legend />
                  <Bar dataKey="overdue_count" name="Overdue" fill="#ef4444" />
                  <Bar dataKey="due_soon_count" name="Due Soon" fill="#f59e0b" />
                  <Bar dataKey="active_count" name="Active" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Scores Table */}
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">Owner</th>
                    <th className="table-th">Total</th>
                    <th className="table-th">Overdue</th>
                    <th className="table-th">Due Soon</th>
                    <th className="table-th">Active</th>
                    <th className="table-th">Risk Score</th>
                    <th className="table-th">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((score) => {
                    const risk = riskLevel(score.risk_score)
                    return (
                      <tr key={score.owner_id} className="table-tr">
                        <td className="table-td font-medium text-slate-800 dark:text-white">
                          {score.owner_name}
                        </td>
                        <td className="table-td">{score.total_compliances}</td>
                        <td className="table-td">
                          <span className="badge-red">{score.overdue_count}</span>
                        </td>
                        <td className="table-td">
                          <span className="badge-yellow">{score.due_soon_count}</span>
                        </td>
                        <td className="table-td">
                          <span className="badge-green">{score.active_count}</span>
                        </td>
                        <td className="table-td text-right font-semibold">{score.risk_score}</td>
                        <td className="table-td">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${risk.bg} ${risk.color}`}
                          >
                            {risk.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </div>
    </AppShell>
  )
}
