import { AppShell } from '@/components/layout/AppShell'
import { EmptyState } from '@/components/common/EmptyState'
import { Tag } from 'lucide-react'

export function CategoriesPage() {
  return (
    <AppShell title="Categories">
      <div className="max-w-full mx-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Categories Management</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Manage compliance categories and classifications
          </p>
        </div>

        <div className="card p-8">
          <EmptyState
            title="Categories management interface coming soon"
            description="You'll be able to create, edit, and manage categories from here."
            icon={<Tag size={24} className="text-slate-300" />}
          />
        </div>
      </div>
    </AppShell>
  )
}
