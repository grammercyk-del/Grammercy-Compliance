import { AppShell } from '@/components/layout/AppShell'
import { EmptyState } from '@/components/common/EmptyState'
import { Building2 } from 'lucide-react'

export function DepartmentsPage() {
  return (
    <AppShell title="Departments">
      <div className="max-w-full mx-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Departments Management</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Manage organizational departments and divisions
          </p>
        </div>

        <div className="card p-8">
          <EmptyState
            title="Departments management interface coming soon"
            description="You'll be able to create, edit, and manage departments from here."
            icon={<Building2 size={24} className="text-slate-300" />}
          />
        </div>
      </div>
    </AppShell>
  )
}
