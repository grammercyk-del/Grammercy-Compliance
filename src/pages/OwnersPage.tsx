import { AppShell } from '@/components/layout/AppShell'
import { EmptyState } from '@/components/common/EmptyState'
import { Users } from 'lucide-react'

export function OwnersPage() {
  return (
    <AppShell title="Owners">
      <div className="max-w-full mx-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Owners Management</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Manage compliance owners and contacts
          </p>
        </div>

        <div className="card p-8">
          <EmptyState
            title="Owners management interface coming soon"
            description="You'll be able to create, edit, and manage owners from here."
            icon={<Users size={24} className="text-slate-300" />}
          />
        </div>
      </div>
    </AppShell>
  )
}
