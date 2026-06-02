import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  requireEditor?: boolean
}

export function ProtectedRoute({ children, requireEditor = false }: ProtectedRouteProps) {
  const { user, loading, isEditor } = useAuth()

  // While auth state is being resolved (initial load or mid-logout), render
  // nothing — this prevents any flash of protected content before the redirect.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-400 dark:text-slate-500">Verifying access…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (requireEditor && !isEditor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          You don't have permission to access this page.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Contact your administrator to request editor access.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
