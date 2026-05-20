'use client';

import { useState } from 'react';
import { getBrowserSupabaseClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = getBrowserSupabaseClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Check your email for a magic link to continue.');
  };

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F8F4' }}>
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/kipl-logo.svg"
            alt="KIPL Logo"
            className="mx-auto h-16 w-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-green-800">
            Kesari Infrabuild Pvt. Ltd.
          </h1>
          <p className="text-gray-600 mt-1">
            Compliance dashboard by KIPL for Grammercy
          </p>
        </div>

        <h2 className="text-xl font-semibold text-gray-800">Sign in</h2>
        <p className="mt-1 text-sm text-gray-500">Enter your email to receive a magic link.</p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm text-gray-600">Email address</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-600/20"
              placeholder="you@example.com"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full justify-center rounded-lg bg-green-700 px-4 py-2.5 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send magic link'}
          </button>
        </form>

        {message ? (
          <p className="mt-5 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">{message}</p>
        ) : null}
      </div>
    </main>
  );
}