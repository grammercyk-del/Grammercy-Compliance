import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { ShieldAlert, RefreshCw } from "lucide-react";
import type { UserProfile, UserRole } from "@/types";

// Clear any cached Supabase responses held by the PWA service worker so one
// user's data is never served to the next user / after sign-out (see audit H4).
async function clearSupabaseCache() {
  if (typeof caches === "undefined") return;
  try {
    await caches.delete("supabase-cache");
  } catch {
    /* best-effort; never block sign-out on cache errors */
  }
}

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  permissionError: string | null;
  isEditor: boolean;
  isViewer: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  permissionError: null,
  isEditor: false,
  isViewer: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const intentionalSignOutRef = useRef(false);
  const wasAuthenticatedRef = useRef(false);
  const resolvedUserIdRef = useRef<string | null>(null);

  const signOut = useCallback(async () => {
    intentionalSignOutRef.current = true;
    // Set loading immediately so ProtectedRoute shows a skeleton instead of
    // briefly flashing protected content during the async sign-out gap.
    setLoading(true);
    await supabase.auth.signOut();
    await clearSupabaseCache();
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Resolve the user's role. Kept OUT of the onAuthStateChange callback below
    // and invoked via setTimeout(0): calling supabase.from(...) synchronously
    // inside that callback can contend with the auth client's internal
    // navigator.locks lock during session bootstrap and stall (see audit C3).
    const resolveSession = async (session: Session) => {
      const email = session.user.email ?? "";

      try {
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .abortSignal(AbortSignal.timeout(8000))
          .maybeSingle();

        if (cancelled) return;

        if (roleError) {
          setPermissionError(
            "Unable to load permissions. Please refresh or contact support."
          );
          setUser(null);
          setLoading(false);
          return;
        }

        // If no explicit user_roles row exists, mirror the database's
        // is_editor() rule rather than locking the user out of the whole app
        // (see audit H3): @kesariprojects.com → editor, everyone else → viewer.
        // RLS remains the real security boundary regardless of this value.
        const role: UserRole = roleData?.role
          ? (roleData.role as UserRole)
          : email.toLowerCase().endsWith("@kesariprojects.com")
            ? "editor"
            : "viewer";

        wasAuthenticatedRef.current = true;
        resolvedUserIdRef.current = session.user.id;
        setUser({ id: session.user.id, email, role });
        setPermissionError(null);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setPermissionError(
            "Connection timed out loading permissions. Please refresh."
          );
          setUser(null);
          setLoading(false);
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event as string) === "TOKEN_REFRESH_FAILED") {
        if (!cancelled) {
          wasAuthenticatedRef.current = false;
          setUser(null);
          setPermissionError(null);
          setLoading(false);
        }
        window.location.replace("/login?reason=expired");
        return;
      }

      if (!session) {
        const wasAuthenticated = wasAuthenticatedRef.current;
        const wasIntentional = intentionalSignOutRef.current;

        wasAuthenticatedRef.current = false;
        intentionalSignOutRef.current = false;
        resolvedUserIdRef.current = null;

        if (!cancelled) {
          setUser(null);
          setPermissionError(null);
          setLoading(false);
        }

        if (wasAuthenticated && !wasIntentional) {
          window.location.replace("/login?reason=expired");
        }
        return;
      }

      // A token refresh for the already-resolved user doesn't change the role —
      // skip the redundant lookup and the re-render/flicker it causes (audit M2).
      if (
        event === "TOKEN_REFRESHED" &&
        resolvedUserIdRef.current === session.user.id
      ) {
        return;
      }

      // Defer the role lookup out of the auth-state callback (see note above).
      setTimeout(() => {
        if (!cancelled) void resolveSession(session);
      }, 0);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const contextValue: AuthContextValue = {
    user,
    loading,
    permissionError,
    isEditor: !!user && user.role === "editor",
    isViewer: !!user && user.role === "viewer",
    signOut,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {permissionError ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
          <div className="max-w-md w-full text-center space-y-5">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <ShieldAlert size={32} className="text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Permission Error
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {permissionError}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors"
            >
              <RefreshCw size={14} />
              Refresh Page
            </button>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
