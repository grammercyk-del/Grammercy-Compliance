import { AppShell } from '@/components/layout/AppShell'
import { EmptyState } from '@/components/common/EmptyState'
import { ScrollText } from 'lucide-react'

export function AuditPage() {
  return (
    <AppShell title="Audit Logs">
      <div className="max-w-full mx-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Audit Logs</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            View all system changes and compliance modifications
          </p>
        </div>

        <div className="card p-8">
          <EmptyState
            title="Audit logs feature coming soon"
            description="Global audit trail will show all changes across the system."
            icon={<ScrollText size={24} className="text-slate-300" />}
          />
        </div>
      </div>
    </AppShell>
  )
}
