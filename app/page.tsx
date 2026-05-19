import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/80 p-10 shadow-2xl shadow-slate-950/20 backdrop-blur">
        <h1 className="text-4xl font-semibold text-white">Gramercy Dashboard</h1>
        <p className="mt-4 text-slate-400">
          Compliance dashboard for KIPL with Supabase auth and App Router support.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            className="rounded-full bg-sky-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-sky-400"
            href="/login"
          >
            Sign in
          </Link>
          <Link
            className="rounded-full border border-slate-700 px-6 py-3 text-slate-200 transition hover:border-slate-500"
            href="/dashboard"
          >
            View dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
