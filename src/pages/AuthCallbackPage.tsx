import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase automatically handles the token from URL
        // Just check the session
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          // User is authenticated, redirect to dashboard
          navigate('/', { replace: true })
        } else {
          // No session, redirect to login
          navigate('/login', { replace: true })
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        navigate('/login', { replace: true })
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-dark">
      <div className="text-center">
        <div className="inline-block animate-spin">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full"></div>
        </div>
        <p className="mt-4 text-slate-600 dark:text-slate-300">Signing you in...</p>
      </div>
    </div>
  )
}
