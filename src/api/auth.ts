import { supabase } from "@/lib/supabase";
import type { UserProfile, UserRole } from "@/types";

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUpWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
  return data;
}

/** Try to sign in. If user exists but email is unconfirmed, attempt to auto-confirm via admin API or return a helpful error. */
export async function trySignIn(email: string, password: string) {
  // First try normal sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // If email not confirmed, try to use the session directly
    if (
      error.message?.includes("Email not confirmed") ||
      error.message?.includes("email_not_confirmed")
    ) {
      throw new Error(
        "Your email is not confirmed. Please check your inbox or go to Supabase Dashboard → Authentication → Settings → disable 'Confirm email' requirement.",
      );
    }
    throw error;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  // getSession() reads from localStorage — instant, no network call, never hangs
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const user = session.user;
  const role: UserRole = user.email?.toLowerCase().endsWith('@kesariprojects.com')
    ? 'editor'
    : 'viewer';

  return { id: user.id, email: user.email ?? "", role };
}
