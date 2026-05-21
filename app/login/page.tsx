import Link from 'next/link';

export default function LoginPage() {
  // Auth is temporarily disabled; keep a stable route.
  return (
    <main className="min-h-screen px-6 py-10" style={{ backgroundColor: '#F5F8F4' }}>
      <div className="mx-auto max-w-3xl">
        <section className="rounded-2xl bg-white p-8 shadow-sm border border-[#E2EAE0]">
          <p className="text-sm uppercase tracking-[0.3em] text-[#2E7D32] font-medium">Session</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#1A1F1A]">Login</h1>
          <p className="mt-2 text-sm text-[#5A6B5A]">
            Authentication is temporarily disabled for stabilization.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/dashboard"
              className="rounded-xl bg-[#2E7D32] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1B5E20] transition"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-[#E2EAE0] bg-white px-5 py-3 text-sm font-semibold text-[#1A1F1A] hover:bg-gray-50 transition"
            >
              Back Home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

