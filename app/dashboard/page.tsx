import { createSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-10 text-center">
          <p className="text-slate-300">
            Configure Supabase environment variables in <code className="rounded bg-slate-800 px-2 py-1 text-xs">.env.local</code>.
          </p>
        </div>
      </main>
    );
  }

  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-10 text-center">
          <p className="text-slate-300">You need to sign in to view the dashboard.</p>
          <Link
            className="mt-6 inline-flex rounded-full bg-sky-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-sky-400"
            href="/login"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-800 bg-slate-900/90 p-10 shadow-2xl shadow-slate-950/30">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Protected Dashboard</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">
              Welcome back, {data.session.user.email ?? 'compliance user'}
            </h1>
          </div>
          <Link
            className="rounded-full border border-slate-700 px-5 py-3 text-slate-200 transition hover:border-slate-500"
            href="/login"
          >
            Manage session
          </Link>
        </div>
      </div>
    </main>
  );
}
