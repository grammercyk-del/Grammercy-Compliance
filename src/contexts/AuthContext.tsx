import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { UserProfile, UserRole } from "@/types";

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  isEditor: boolean;
  isViewer: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isEditor: false,
  isViewer: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // onAuthStateChange fires INITIAL_SESSION immediately on mount —
    // handles the initial load without a separate getCurrentUser() call
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        if (!cancelled) { setUser(null); setLoading(false); }
      } else {
        const email = session.user.email ?? '';
        const role = email.toLowerCase().endsWith('@kesariprojects.com') ? 'editor' : 'viewer';
        const profile: UserProfile = { id: session.user.id, email, role: role as UserRole };
        if (!cancelled) { setUser(profile); setLoading(false); }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isEditor: !!user && user.email.toLowerCase().endsWith('@kesariprojects.com'),
        isViewer: !!user && !user.email.toLowerCase().endsWith('@kesariprojects.com'),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
