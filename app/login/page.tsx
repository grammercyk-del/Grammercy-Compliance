import Link from 'next/link';
import { getBrowserSupabaseClient } from '@/lib/supabase/client';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const supabase = getBrowserSupabaseClient();

  return (
    <main className="min-h-screen px-6 py-10" style={{ backgroundColor: '#F5F8F4' }}>
      <div className="mx-auto max-w-3xl">
        <section className="rounded-2xl bg-white p-8 shadow-sm border border-[#E2EAE0]">
          <p className="text-sm uppercase tracking-[0.3em] text-[#2E7D32] font-medium">Session</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#1A1F1A]">Login</h1>
          <p className="mt-2 text-sm text-[#5A6B5A]">
            Sign in with your email. Only <span className="font-semibold">@kesariprojects.com</span> users can edit.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-[#1A1F1A]">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="name@kesariprojects.com"
              className="w-full rounded-xl border border-[#E2EAE0] bg-white px-4 py-3 text-sm text-[#1A1F1A] outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20"
            />

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
            {sent ? (
              <p className="text-sm font-medium text-emerald-700">Magic link sent. Check your inbox.</p>
            ) : null}

            <button
              type="button"
              disabled={loading || !email}
              onClick={async () => {
                setError(null);
                setSent(false);
                setLoading(true);
                const { error } = await supabase.auth.signInWithOtp({
                  email,
                  options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                  },
                });
                setLoading(false);
                if (error) setError(error.message);
                else setSent(true);
              }}
              className="w-full rounded-xl bg-[#2E7D32] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1B5E20] transition disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send magic link'}
            </button>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/dashboard"
                className="rounded-xl border border-[#E2EAE0] bg-white px-5 py-3 text-sm font-semibold text-[#1A1F1A] hover:bg-gray-50 transition text-center"
              >
                Continue to Dashboard
              </Link>
              <Link
                href="/"
                className="rounded-xl bg-[#2E7D32] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1B5E20] transition text-center"
              >
                Back Home
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}


