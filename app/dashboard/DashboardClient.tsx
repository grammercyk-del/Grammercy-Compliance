"use client";

import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import IsEditorContext from './isEditorContext';
import { getBrowserSupabaseClient } from '@/lib/supabase/client';

type ComplianceRow = {
  compliance_id: string;
  certificate_no: string;
  certificate_name: string;
  category_name: string;
  department_name: string;
  owner_name: string;
  renewal_frequency: string | null;
  last_renewed_date: string | null;
  next_renewal_date: string | null;
  days_remaining: number | null;
  status: 'critical' | 'high' | 'medium' | 'normal' | string;
  notes: string | null;
};

const statusClasses: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-300 ring-red-500/30',
  high: 'bg-orange-500/15 text-orange-300 ring-orange-500/30',
  medium: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  normal: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
};

export default function DashboardClient() {
  const isEditor = useContext(IsEditorContext);
  const [compliances, setCompliances] = useState<ComplianceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    let mounted = true;
    let intervalId: number | undefined;
    const channel = supabase.channel('compliances_changes');

    async function loadCompliances() {
      setIsLoading(true);
      setLoadError(null);

      const result = await supabase
        .from('compliances_with_status')
        .select(
          'compliance_id, certificate_no, certificate_name, category_name, department_name, owner_name, renewal_frequency, last_renewed_date, next_renewal_date, days_remaining, status, notes'
        );

      if (!mounted) return;

      if (result.error) {
        console.error('Error loading compliances:', result.error);
        setLoadError(result.error.message || 'Unable to load compliances');
        setCompliances([]);
      } else {
        setCompliances((result.data ?? []) as ComplianceRow[]);
      }

      setIsLoading(false);
    }

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'compliances' }, () => {
        loadCompliances();
      })
      .subscribe();

    loadCompliances();
    intervalId = window.setInterval(loadCompliances, 60000);

    return () => {
      mounted = false;
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-10 shadow-2xl shadow-slate-950/30">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Protected Dashboard</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Welcome back, compliance user</h1>
              <p className="mt-2 text-sm text-slate-300">Role: {isEditor === null ? 'Loading...' : isEditor ? 'Editor' : 'Viewer'}</p>
            </div>
            <Link
              className="rounded-full border border-slate-700 px-5 py-3 text-slate-200 transition hover:border-slate-500"
              href="/login"
            >
              Manage session
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/30">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Compliance table</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Compliance records</h2>
            </div>
            <p className="text-sm text-slate-400">Read-only view from compliances_with_status</p>
          </div>

          {isLoading ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8 text-slate-300">Loading compliances...</div>
          ) : loadError ? (
            <div className="rounded-3xl border border-red-700 bg-red-950/20 p-8 text-red-300">{loadError}</div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
              <table className="min-w-full border-collapse text-left text-sm text-slate-200">
                <thead className="bg-slate-900/90 text-slate-400">
                  <tr>
                    <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Certificate No</th>
                    <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Certificate Name</th>
                    <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Category</th>
                    <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Department</th>
                    <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Owner</th>
                    <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Frequency</th>
                    <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Last Renewed</th>
                    <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Next Renewal</th>
                    <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Days Remaining</th>
                    <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Status</th>
                    <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {compliances.map((row) => (
                    <tr key={row.compliance_id} className="even:bg-slate-950/70 hover:bg-slate-900/80">
                      <td className="border-b border-slate-800 px-4 py-3 text-slate-300">{row.certificate_no}</td>
                      <td className="border-b border-slate-800 px-4 py-3 text-slate-300">{row.certificate_name}</td>
                      <td className="border-b border-slate-800 px-4 py-3 text-slate-300">{row.category_name}</td>
                      <td className="border-b border-slate-800 px-4 py-3 text-slate-300">{row.department_name}</td>
                      <td className="border-b border-slate-800 px-4 py-3 text-slate-300">{row.owner_name}</td>
                      <td className="border-b border-slate-800 px-4 py-3 text-slate-300">{row.renewal_frequency ?? '—'}</td>
                      <td className="border-b border-slate-800 px-4 py-3 text-slate-300">{row.last_renewed_date ?? '—'}</td>
                      <td className="border-b border-slate-800 px-4 py-3 text-slate-300">{row.next_renewal_date ?? '—'}</td>
                      <td className="border-b border-slate-800 px-4 py-3 text-slate-300">{row.days_remaining ?? '—'}</td>
                      <td className="border-b border-slate-800 px-4 py-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClasses[row.status] ?? statusClasses.normal}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="border-b border-slate-800 px-4 py-3 text-slate-300">{row.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
