export const dynamic = 'force-dynamic';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import DashboardClient from './DashboardClient';

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

  return <DashboardClient />;
}
