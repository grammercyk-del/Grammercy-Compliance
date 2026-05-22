import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/api/auth'
import type { UserProfile } from '@/types'

interface AuthContextValue {
  user: UserProfile | null
  loading: boolean
  isEditor: boolean
  isViewer: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isEditor: false,
  isViewer: false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then((profile) => {
      setUser(profile)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
      } else {
        const profile = await getCurrentUser()
        setUser(profile)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isEditor: user?.role === 'editor',
        isViewer: user?.role === 'viewer',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
