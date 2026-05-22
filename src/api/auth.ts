import { supabase } from '@/lib/supabase'
import type { UserProfile, UserRole } from '@/types'

export async function signInWithEmail(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (error) {
    // Default to viewer if no role row found
    return { id: user.id, email: user.email ?? '', role: 'viewer' }
  }

  return {
    id: user.id,
    email: user.email ?? '',
    role: (data?.role ?? 'viewer') as UserRole,
  }
}
