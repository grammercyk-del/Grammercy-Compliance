import { useState } from 'react'
import { ShieldCheck, Mail, CheckCircle } from 'lucide-react'
import { signInWithEmail } from '@/api/auth'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signInWithEmail(email)
      setEmailSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send login link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-dark p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 shadow-card-lg mb-4">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gramercy Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Compliance Management — KIPL</p>
        </div>

        {/* Card */}
        <div className="card p-6 shadow-card-lg">
          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="email">Email address</label>
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

              {error && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg flex items-start gap-2">
                  <span className="mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
                {loading ? 'Sending…' : 'Send me a login link'}
              </button>

              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                We'll email you a secure link to sign in. No password needed.
              </p>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
                <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Check your email</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                We've sent a login link to <strong>{email}</strong>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click the link in your email to sign in. The link expires in 24 hours.
              </p>
              <button
                onClick={() => {
                  setEmailSent(false)
                  setEmail('')
                }}
                className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 mt-4"
              >
                ← Back to login
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Krishnapatnam Infrastructure Pvt. Ltd. &nbsp;·&nbsp; Compliance Platform
        </p>
      </div>
    </div>
  )
}
