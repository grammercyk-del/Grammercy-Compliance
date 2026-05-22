import { useMemo } from 'react'
import { AlertTriangle, TrendingUp } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { StatCard } from '@/components/dashboard/StatCard'
import { StatusPieChart } from '@/components/charts/StatusPieChart'
import { RenewalBarChart } from '@/components/charts/RenewalBarChart'
import { CardSkeleton } from '@/components/common/Skeleton'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { useCompliances } from '@/hooks/useCompliances'

export function DashboardPage() {
  const { data, loading, error, refetch } = useCompliances()

  const stats = useMemo(() => {
    if (!data.length) return { total: 0, active: 0, dueSoon: 0, overdue: 0 }
    return {
      total: data.length,
      active: data.filter((r) => r.status === 'Active').length,
      dueSoon: data.filter((r) => r.status === 'Due Soon').length,
      overdue: data.filter((r) => r.status === 'Overdue').length,
    }
  }, [data])

  const criticalCount = data.filter((r) => r.status === 'Overdue' || r.status === 'Expired').length

  return (
    <AppShell title="Dashboard">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
              <CardSkeleton /> <CardSkeleton /> <CardSkeleton /> <CardSkeleton />
            </>
          ) : error ? (
            <div className="col-span-full">
              <ErrorMessage message="Failed to load dashboard" onRetry={refetch} />
            </div>
          ) : (
            <>
              <StatCard
                label="Total Compliances"
                value={stats.total}
                icon={<TrendingUp size={18} />}
                color="blue"
                loading={loading}
              />
              <StatCard
                label="Active"
                value={stats.active}
                subtext={`${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% of total`}
                icon={<TrendingUp size={18} />}
                color="green"
                loading={loading}
              />
              <StatCard
                label="Due Soon"
                value={stats.dueSoon}
                icon={<TrendingUp size={18} />}
                color="yellow"
                loading={loading}
              />
              <StatCard
                label="Overdue"
                value={stats.overdue}
                icon={<AlertTriangle size={18} />}
                color="red"
                loading={loading}
              />
            </>
          )}
        </div>

        {/* Charts Grid */}
        {!loading && data.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
                Compliance Status Distribution
              </h3>
              <StatusPieChart data={data} />
            </div>

            {/* Upcoming Renewals */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
                Upcoming Renewals (6 Months)
              </h3>
              <RenewalBarChart data={data} />
            </div>
          </div>
        )}

        {/* Critical Alerts Banner */}
        {criticalCount > 0 && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {criticalCount} compliance{criticalCount === 1 ? '' : 's'} overdue or expired
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                Immediate action required. Visit the Alerts page for details.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
