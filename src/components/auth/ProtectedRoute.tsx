import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Skeleton } from '@/components/common/Skeleton'

interface ProtectedRouteProps {
  children: ReactNode
  requireEditor?: boolean
}

export function ProtectedRoute({ children, requireEditor = false }: ProtectedRouteProps) {
  const { user, loading, isEditor } = useAuth()

  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-8 max-w-md mx-auto mt-20">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
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
        <p className="text-xs text-slate-400 mt-1">Contact your administrator to request editor access.</p>
      </div>
    )
  }

  return <>{children}</>
}
