import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-10" style={{ backgroundColor: '#F5F8F4' }}>
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl bg-white p-8 shadow-sm border border-[#E2EAE0]">
          <p className="text-sm uppercase tracking-[0.3em] text-[#2E7D32] font-medium">Kesari Infrabuild</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#1A1F1A]">Compliance Dashboard</h1>
          <p className="mt-2 text-sm text-[#5A6B5A]">
            Track compliance certificates, renewal dates, ownership, and risk.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/dashboard"
              className="rounded-xl bg-[#2E7D32] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1B5E20] transition"
            >
              Open Dashboard
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-[#E2EAE0] bg-white px-5 py-3 text-sm font-semibold text-[#1A1F1A] hover:bg-gray-50 transition"
            >
              Manage Session
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { title: 'Alerts', desc: 'Due soon, critical, and expired records.' },
            { title: 'Editable Table', desc: 'Update certificate details with auto-insert lookups.' },
            { title: 'Owner Analytics', desc: 'Risk score summary by owner.' },
          ].map((c) => (
            <div key={c.title} className="rounded-xl bg-white p-6 shadow-sm border border-[#E2EAE0]">
              <p className="text-lg font-semibold text-[#1A1F1A]">{c.title}</p>
              <p className="mt-1 text-sm text-[#5A6B5A]">{c.desc}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

