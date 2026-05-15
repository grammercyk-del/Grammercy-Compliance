// Supabase Client Configuration
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper to get current user profile
export async function getCurrentUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  return profile;
}

// Helper to check if user is KIPL
export async function isKIPLUser() {
  const profile = await getCurrentUserProfile();
  return profile?.organization === 'KIPL';
}

// Helper to check if user can edit
export async function canEdit() {
  const profile = await getCurrentUserProfile();
  return profile?.role === 'kipl_admin' || 
         profile?.role === 'kipl_user' || 
         profile?.role === 'super_admin';
}
