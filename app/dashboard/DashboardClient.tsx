"use client";

import { useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import IsEditorContext from './isEditorContext';
import { getBrowserSupabaseClient } from '@/lib/supabase/client';

type ComplianceRow = {
  compliance_id: string;
  certificate_no: string;
  certificate_name: string;
  category_name: string;
  category_id: string | null;
  department_name: string;
  department_id: string | null;
  owner_name: string;
  owner_id: string | null;
  renewal_frequency: string | null;
  last_renewed_date: string | null;
  next_renewal_date: string | null;
  days_remaining: number | null;
  status: 'critical' | 'high' | 'medium' | 'normal' | string;
  notes: string | null;
};

type SelectOption = { value: string; label: string };

type EditableCellProps = {
  row: ComplianceRow;
  field: keyof ComplianceRow;
  value: string | number | null;
  isEditor: boolean | null;
  type: 'text' | 'date' | 'select' | 'readonly';
  options?: SelectOption[];
  onSave: (rowId: string, field: string, value: string, extraLabel?: string) => Promise<string | null>;
};

const statusClasses: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-300 ring-red-500/30',
  high: 'bg-orange-500/15 text-orange-300 ring-orange-500/30',
  medium: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  normal: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
};

function EditableCell({ row, field, value, isEditor, type, options, onSave }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<string>(String(value ?? ''));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const originRef = useRef<string>(String(value ?? ''));
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  const displayValue = value === null || value === undefined || value === '' ? '—' : String(value);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if ((type === 'text' || type === 'date') && 'select' in inputRef.current) {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  useEffect(() => {
    if (!isEditing) {
      setDraft(String(value ?? ''));
      originRef.current = String(value ?? '');
    }
  }, [value, isEditing]);

  const handleCancel = () => {
    setDraft(originRef.current);
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!isEditing) return;
    const newValue = draft ?? '';
    if (newValue === originRef.current) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    const extraLabel = type === 'select' ? options?.find((item) => item.value === newValue)?.label : undefined;
    const saveError = await onSave(row.compliance_id, String(field), newValue, extraLabel);
    setSaving(false);

    if (saveError) {
      setDraft(originRef.current);
      setError(saveError);
    } else {
      originRef.current = newValue;
      setError(null);
      setIsEditing(false);
    }
  };

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement>) => {
    if (event.key === 'Enter' && type !== 'select') {
      event.preventDefault();
      await handleSave();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handleCancel();
    }
  };

  const renderReadOnly = () => <span>{displayValue}</span>;

  if (!isEditor || type === 'readonly') {
    return <span>{displayValue}</span>;
  }

  return (
    <div className="space-y-1">
      {isEditing ? (
        <div>
          {type === 'text' && (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 outline-none ring-1 ring-transparent transition focus:border-slate-500 focus:ring-slate-500"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              disabled={saving}
            />
          )}
          {type === 'date' && (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="date"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 outline-none ring-1 ring-transparent transition focus:border-slate-500 focus:ring-slate-500"
              value={draft ?? ''}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              disabled={saving}
            />
          )}
          {type === 'select' && (
            <select
              ref={inputRef as React.RefObject<HTMLSelectElement>}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 outline-none ring-1 ring-transparent transition focus:border-slate-500 focus:ring-slate-500"
              value={draft ?? ''}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              disabled={saving}
            >
              <option value="">Choose…</option>
              {options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="w-full text-left text-slate-200 transition hover:text-white"
        >
          {displayValue}
        </button>
      )}
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}

export default function DashboardClient() {
  const isEditor = useContext(IsEditorContext);
  const [compliances, setCompliances] = useState<ComplianceRow[]>([]);
  const [owners, setOwners] = useState<SelectOption[]>([]);
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [departments, setDepartments] = useState<SelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    let mounted = true;
    let intervalId: number | undefined;
    const channel = supabase.channel('compliances_changes');

    async function loadOptions() {
      const [ownersResult, categoriesResult, departmentsResult] = await Promise.all([
        supabase.from('active_owners').select('owner_id, owner_name'),
        supabase.from('active_categories').select('category_id, category_name'),
        supabase.from('active_departments').select('department_id, department_name'),
      ]);

      if (!mounted) return;

      if (ownersResult.error) {
        console.error('Error loading owners:', ownersResult.error);
      } else {
        setOwners((ownersResult.data ?? []).map((item: any) => ({ value: item.owner_id, label: item.owner_name })));
      }

      if (categoriesResult.error) {
        console.error('Error loading categories:', categoriesResult.error);
      } else {
        setCategories((categoriesResult.data ?? []).map((item: any) => ({ value: item.category_id, label: item.category_name })));
      }

      if (departmentsResult.error) {
        console.error('Error loading departments:', departmentsResult.error);
      } else {
        setDepartments((departmentsResult.data ?? []).map((item: any) => ({ value: item.department_id, label: item.department_name })));
      }
    }

    async function loadCompliances() {
      setIsLoading(true);
      setLoadError(null);

      const result = await supabase
        .from('compliances_with_status')
        .select(
          'compliance_id, certificate_no, certificate_name, category_name, category_id, department_name, department_id, owner_name, owner_id, renewal_frequency, last_renewed_date, next_renewal_date, days_remaining, status, notes'
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

    loadOptions();
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

  const handleSave = async (rowId: string, field: string, value: string, extraLabel?: string) => {
    const supabase = getBrowserSupabaseClient();
    const originalRow = compliances.find((row) => row.compliance_id === rowId);
    if (!originalRow) {
      return 'Row not found';
    }

    const updatedRow: Partial<ComplianceRow> = { [field]: value } as Partial<ComplianceRow>;

    if (field === 'owner_id' && extraLabel) {
      updatedRow.owner_name = extraLabel;
    }
    if (field === 'category_id' && extraLabel) {
      updatedRow.category_name = extraLabel;
    }
    if (field === 'department_id' && extraLabel) {
      updatedRow.department_name = extraLabel;
    }

    setCompliances((current) =>
      current.map((row) => (row.compliance_id === rowId ? { ...row, ...updatedRow } : row))
    );

    const payload: Record<string, unknown> = { [field]: value };

    const { error } = await supabase.from('compliances').update(payload).eq('compliance_id', rowId);

    if (error) {
      console.error('Error saving compliance:', error);
      setCompliances((current) => current.map((row) => (row.compliance_id === rowId ? originalRow : row)));
      return error.message || 'Unable to save changes';
    }

    return null;
  };

  const selectOptions = {
    owner_id: owners,
    category_id: categories,
    department_id: departments,
    renewal_frequency: [
      { value: '1 year', label: '1 year' },
      { value: '6 months', label: '6 months' },
      { value: '3 months', label: '3 months' },
      { value: '90 days', label: '90 days' },
      { value: '60 days', label: '60 days' },
      { value: '45 days', label: '45 days' },
      { value: '30 days', label: '30 days' },
    ],
  } as Record<string, SelectOption[]>;

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
            <p className="text-sm text-slate-400">View is backed by compliances_with_status; editors may click editable cells.</p>
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
                      <td className="border-b border-slate-800 px-4 py-3">
                        <EditableCell
                          row={row}
                          field="certificate_name"
                          value={row.certificate_name}
                          isEditor={isEditor}
                          type="text"
                          onSave={handleSave}
                        />
                      </td>
                      <td className="border-b border-slate-800 px-4 py-3">
                        <EditableCell
                          row={row}
                          field="category_id"
                          value={row.category_id}
                          isEditor={isEditor}
                          type="select"
                          options={categories}
                          onSave={handleSave}
                        />
                      </td>
                      <td className="border-b border-slate-800 px-4 py-3">
                        <EditableCell
                          row={row}
                          field="department_id"
                          value={row.department_id}
                          isEditor={isEditor}
                          type="select"
                          options={departments}
                          onSave={handleSave}
                        />
                      </td>
                      <td className="border-b border-slate-800 px-4 py-3">
                        <EditableCell
                          row={row}
                          field="owner_id"
                          value={row.owner_id}
                          isEditor={isEditor}
                          type="select"
                          options={owners}
                          onSave={handleSave}
                        />
                      </td>
                      <td className="border-b border-slate-800 px-4 py-3">
                        <EditableCell
                          row={row}
                          field="renewal_frequency"
                          value={row.renewal_frequency}
                          isEditor={isEditor}
                          type="select"
                          options={selectOptions.renewal_frequency}
                          onSave={handleSave}
                        />
                      </td>
                      <td className="border-b border-slate-800 px-4 py-3">
                        <EditableCell
                          row={row}
                          field="last_renewed_date"
                          value={row.last_renewed_date}
                          isEditor={isEditor}
                          type="date"
                          onSave={handleSave}
                        />
                      </td>
                      <td className="border-b border-slate-800 px-4 py-3">
                        <EditableCell
                          row={row}
                          field="next_renewal_date"
                          value={row.next_renewal_date}
                          isEditor={isEditor}
                          type="date"
                          onSave={handleSave}
                        />
                      </td>
                      <td className="border-b border-slate-800 px-4 py-3 text-slate-300">{row.days_remaining ?? '—'}</td>
                      <td className="border-b border-slate-800 px-4 py-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClasses[row.status] ?? statusClasses.normal}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="border-b border-slate-800 px-4 py-3">
                        <EditableCell
                          row={row}
                          field="notes"
                          value={row.notes}
                          isEditor={isEditor}
                          type="text"
                          onSave={handleSave}
                        />
                      </td>
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
