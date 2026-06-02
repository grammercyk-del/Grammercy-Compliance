import { useState } from "react";
import { ShieldCheck, CheckCircle, AlertTriangle } from "lucide-react";
import { signUpWithPassword, trySignIn } from "@/api/auth";
import { useNavigate, useSearchParams } from "react-router-dom";

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get("reason") === "expired";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithPassword(email, password);
        setSuccess("Account created! Check your inbox for a confirmation email, then sign in. (If email confirmation is disabled in Supabase, you can sign in right away.)");
        setIsSignUp(false);
      } else {
        const result = await Promise.race([
          trySignIn(email, password),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Sign-in timed out. Please check your connection and try again.")),
              12000
            )
          ),
        ]);
        if (result?.session) {
          navigate("/", { replace: true });
          // Force reload to ensure auth state is picked up
          window.location.href = "/";
        } else {
          setError("Unable to sign in. Please try again.");
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-dark p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 shadow-card-lg mb-4">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Grammercy Compliance Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Compliance Dashboard by KIPL for Grammercy
          </p>
        </div>

        {/* Session expired banner */}
        {sessionExpired && (
          <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
            <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Your session has expired. Please sign in again to continue.
            </p>
          </div>
        )}

        {/* Card */}
        <div className="card p-6 shadow-card-lg">
          {success ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
                <CheckCircle
                  size={24}
                  className="text-green-600 dark:text-green-400"
                />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                Success!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {success}
              </p>
              <button
                onClick={() => {
                  setIsSignUp(false);
                  setSuccess(null);
                }}
                className="btn-primary w-full justify-center"
              >
                Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                  {isSignUp ? "Create Account" : "Sign In"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isSignUp
                    ? "Register to access the dashboard"
                    : "Enter your credentials to continue"}
                </p>
              </div>

              <div>
                <label className="label" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                  className="input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  minLength={6}
                />
              </div>

              {error && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg flex items-start gap-2">
                  <span className="mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full justify-center"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : isSignUp
                    ? "Create Account"
                    : "Sign In"}
              </button>

              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                {isSignUp
                  ? "Already have an account? "
                  : "Don't have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                  }}
                  className="text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Kesari Infrabuild Pvt. Ltd. &nbsp;·&nbsp; Compliance Platform
        </p>
      </div>
    </div>
  );
}
