import { useState } from 'react'
import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { OfflineBanner } from '@/components/common/OfflineBanner'
import { InstallPrompt } from '@/components/Shared/InstallPrompt'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { cn } from '@/utils/cn'

interface AppShellProps {
  children: ReactNode
  title?: string
}

export function AppShell({ children, title }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { isOnline } = useNetworkStatus()

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-dark">
      {/* Mobile backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar title={title} onMenuClick={() => setDrawerOpen(true)} />

        {/* Offline / reconnected banner sits directly below the navbar */}
        <OfflineBanner />

        <main
          className={cn(
            'flex-1 overflow-y-auto p-6',
            !isOnline && 'pointer-events-none select-none opacity-60',
          )}
          aria-disabled={!isOnline}
        >
          {children}
        </main>
      </div>

      <InstallPrompt />
    </div>
  )
}
