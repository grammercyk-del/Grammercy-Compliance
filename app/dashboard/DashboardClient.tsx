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

type TableRow = ComplianceRow & {
  isNew?: boolean;
};

type AlertRow = {
  certificate_name: string;
  owner_name: string;
  category_name: string;
  days_remaining: number;
  status: 'critical' | 'high' | 'medium' | string;
};

type OwnerRiskScore = {
  owner_name: string;
  total_active: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  normal_count: number;
  risk_score: number;
};

type AuditHistoryRow = {
  compliance_id: string;
  certificate_no: string;
  certificate_name: string;
  category_name: string;
  department_name: string;
  owner_name: string;
  last_renewed_date: string | null;
  next_renewal_date: string | null;
  status: 'critical' | 'high' | 'medium' | 'normal' | 'deleted' | string;
  deleted_at: string | null;
};

type SelectOption = { value: string; label: string; defaultOwnerId?: string | null };

type EditableCellProps = {
  row: TableRow;
  field: keyof ComplianceRow;
  value: string | number | null;
  isEditor: boolean | null;
  type: 'text' | 'date' | 'select' | 'datalist' | 'readonly';
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
          {type === 'datalist' && (
            <div className="relative">
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                list={`datalist-${field}-${row.compliance_id}`}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 outline-none ring-1 ring-transparent transition focus:border-slate-500 focus:ring-slate-500"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                disabled={saving}
                placeholder="Type or select..."
              />
              <datalist id={`datalist-${field}-${row.compliance_id}`}>
                {options?.map((option) => (
                  <option key={option.value} value={option.label} />
                ))}
              </datalist>
            </div>
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
  const [compliances, setCompliances] = useState<TableRow[]>([]);
  const [owners, setOwners] = useState<SelectOption[]>([]);
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [departments, setDepartments] = useState<SelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [alertsCollapsed, setAlertsCollapsed] = useState({ critical: false, high: false, medium: false });
  const [ownerRiskScores, setOwnerRiskScores] = useState<OwnerRiskScore[]>([]);
  const [auditHistory, setAuditHistory] = useState<AuditHistoryRow[]>([]);
  const [auditHistoryCollapsed, setAuditHistoryCollapsed] = useState(true);
  const [auditHistoryLoading, setAuditHistoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const refreshCompliances = async () => {
    const supabase = getBrowserSupabaseClient();
    setIsLoading(true);
    setLoadError(null);

    const result = await supabase
      .from('compliances_with_status')
      .select(
        'compliance_id, certificate_no, certificate_name, category_name, category_id, department_name, department_id, owner_name, owner_id, renewal_frequency, last_renewed_date, next_renewal_date, days_remaining, status, notes'
      );

    if (result.error) {
      console.error('Error loading compliances:', result.error);
      setLoadError(result.error.message || 'Unable to load compliances');
      setCompliances([]);
    } else {
      setCompliances((result.data ?? []) as TableRow[]);
    }

    setIsLoading(false);
  };

  const refreshAlerts = async () => {
    const supabase = getBrowserSupabaseClient();
    const result = await supabase
      .from('critical_alerts')
      .select('certificate_name, owner_name, category_name, days_remaining, status');

    if (result.error) {
      console.error('Error loading critical alerts:', result.error);
      setAlerts([]);
      return;
    }

    setAlerts((result.data ?? []) as AlertRow[]);
  };

  const refreshOwnerRiskScores = async () => {
    const supabase = getBrowserSupabaseClient();
    const result = await supabase
      .from('owner_risk_scores')
      .select('owner_name, total_active, critical_count, high_count, medium_count, normal_count, risk_score');

    if (result.error) {
      console.error('Error loading owner risk scores:', result.error);
      setOwnerRiskScores([]);
      return;
    }

    const sortedData = ((result.data ?? []) as OwnerRiskScore[]).sort((a, b) => b.risk_score - a.risk_score);
    setOwnerRiskScores(sortedData);
  };

  const loadAuditHistory = async () => {
    if (!auditHistoryCollapsed) return; // already expanded, don't refetch
    setAuditHistoryLoading(true);
    const supabase = getBrowserSupabaseClient();
    const result = await supabase
      .from('compliances_with_status_all')
      .select('compliance_id, certificate_no, certificate_name, category_name, department_name, owner_name, last_renewed_date, next_renewal_date, status, deleted_at')
      .order('updated_at', { ascending: false });

    if (result.error) {
      console.error('Error loading audit history:', result.error);
      setAuditHistory([]);
    } else {
      setAuditHistory((result.data ?? []) as AuditHistoryRow[]);
    }
    setAuditHistoryLoading(false);
  };

  const toggleAuditHistory = async () => {
    if (auditHistoryCollapsed) {
      await loadAuditHistory();
    }
    setAuditHistoryCollapsed(!auditHistoryCollapsed);
  };

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    let mounted = true;
    let intervalId: number | undefined;
    const channel = supabase.channel('compliances_changes');

    async function loadOptions() {
      const [ownersResult, categoriesResult, departmentsResult] = await Promise.all([
        supabase.from('active_owners').select('owner_id, owner_name'),
        supabase.from('active_categories').select('category_id, category_name, default_owner_id'),
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
        setCategories((categoriesResult.data ?? []).map((item: any) => ({
          value: item.category_id,
          label: item.category_name,
          defaultOwnerId: item.default_owner_id,
        })));
      }

      if (departmentsResult.error) {
        console.error('Error loading departments:', departmentsResult.error);
      } else {
        setDepartments((departmentsResult.data ?? []).map((item: any) => ({ value: item.department_id, label: item.department_name })));
      }
    }

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'compliances' }, () => {
        refreshCompliances();
        refreshAlerts();
        refreshOwnerRiskScores();
      })
      .subscribe();

    loadOptions();
    refreshCompliances();
    refreshAlerts();
    refreshOwnerRiskScores();
    intervalId = window.setInterval(() => {
      refreshCompliances();
      refreshAlerts();
      refreshOwnerRiskScores();
    }, 60000);

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

    // For datalist fields, resolve text label to ID
    if (field === 'category_id') {
      // extraLabel is the typed text, value is the ID for select mode
      const categoryName = extraLabel || '';
      const matchedCategory = categories.find((c) => c.label.toLowerCase() === categoryName.toLowerCase());
      if (matchedCategory) {
        updatedRow.category_id = matchedCategory.value;
        updatedRow.category_name = matchedCategory.label;
        if (matchedCategory.defaultOwnerId) {
          const defaultOwner = owners.find((o) => o.value === matchedCategory.defaultOwnerId);
          updatedRow.owner_id = matchedCategory.defaultOwnerId;
          updatedRow.owner_name = defaultOwner?.label ?? '';
        }
      } else {
        // No match found, keep the text as category_name but no ID
        updatedRow.category_name = categoryName;
        updatedRow.category_id = null;
      }
    }
    if (field === 'department_id') {
      const deptName = extraLabel || '';
      const matchedDept = departments.find((d) => d.label.toLowerCase() === deptName.toLowerCase());
      if (matchedDept) {
        updatedRow.department_id = matchedDept.value;
        updatedRow.department_name = matchedDept.label;
      } else {
        updatedRow.department_name = deptName;
        updatedRow.department_id = null;
      }
    }
    if (field === 'renewal_frequency') {
      updatedRow.renewal_frequency = extraLabel || value;
    }
    if (field === 'owner_id' && extraLabel) {
      updatedRow.owner_name = extraLabel;
    }

    setCompliances((current) =>
      current.map((row) => (row.compliance_id === rowId ? { ...row, ...updatedRow } : row))
    );

    const payload: Record<string, unknown> = {};
    if (updatedRow.category_id !== undefined) {
      payload.category_id = updatedRow.category_id;
    }
    if (updatedRow.category_name !== undefined && field === 'category_id') {
      payload.category_name = updatedRow.category_name;
    }
    if (updatedRow.department_id !== undefined) {
      payload.department_id = updatedRow.department_id;
    }
    if (updatedRow.department_name !== undefined && field === 'department_id') {
      payload.department_name = updatedRow.department_name;
    }
    if (updatedRow.renewal_frequency !== undefined) {
      payload.renewal_frequency = updatedRow.renewal_frequency;
    }
    if (updatedRow.owner_id !== undefined && field !== 'owner_id') {
      payload.owner_id = updatedRow.owner_id;
    }
    if (updatedRow.owner_name !== undefined && field === 'owner_id') {
      payload.owner_name = updatedRow.owner_name;
    }

    const { error } = await supabase.from('compliances').update(payload).eq('compliance_id', rowId);

    if (error) {
      console.error('Error saving compliance:', error);
      setCompliances((current) => current.map((row) => (row.compliance_id === rowId ? originalRow : row)));
      return error.message || 'Unable to save changes';
    }

    return null;
  };

  const handleAddRow = async () => {
    const supabase = getBrowserSupabaseClient();
    const newCompliance: Partial<ComplianceRow> = {
      certificate_no: 'TBD',
      certificate_name: 'New compliance',
      category_id: categories[0]?.value ?? null,
      category_name: categories[0]?.label ?? '',
      department_id: departments[0]?.value ?? null,
      department_name: departments[0]?.label ?? '',
      owner_id: categories[0]?.defaultOwnerId ?? owners[0]?.value ?? null,
      owner_name: owners.find((owner) => owner.value === (categories[0]?.defaultOwnerId ?? owners[0]?.value))?.label ?? '',
      renewal_frequency: null,
      last_renewed_date: null,
      next_renewal_date: null,
      days_remaining: null,
      status: 'normal',
      notes: '',
    };

    const tempRow: TableRow = {
      compliance_id: `new-${Date.now()}`,
      ...newCompliance,
      isNew: true,
    } as TableRow;

    setCompliances((current) => [tempRow, ...current]);

    const { data, error } = await supabase.from('compliances').insert([{
      certificate_name: newCompliance.certificate_name,
      category_id: newCompliance.category_id,
      department_id: newCompliance.department_id,
      owner_id: newCompliance.owner_id,
      renewal_frequency: newCompliance.renewal_frequency,
      last_renewed_date: newCompliance.last_renewed_date,
      next_renewal_date: newCompliance.next_renewal_date,
      notes: newCompliance.notes,
    }]).select('compliance_id');

    if (error) {
      console.error('Error adding compliance row:', error);
      setCompliances((current) => current.filter((row) => row.compliance_id !== tempRow.compliance_id));
      return;
    }

    if (data?.[0]?.compliance_id) {
      await refreshCompliances();
    }
  };

  const confirmDeleteRow = (rowId: string) => {
    setDeleteTargetId(rowId);
  };

  const cancelDelete = () => {
    setDeleteTargetId(null);
  };

  const handleDeleteRow = async (rowId: string) => {
    const supabase = getBrowserSupabaseClient();
    const originalRows = compliances;
    setCompliances((current) => current.filter((row) => row.compliance_id !== rowId));

    const { error } = await supabase.rpc('soft_delete_compliance', { compliance_id: rowId });
    if (error) {
      console.error('Error deleting compliance row:', error);
      setCompliances(originalRows);
    }
  };

  const handleDuplicateRow = async (rowId: string) => {
    const supabase = getBrowserSupabaseClient();
    const sourceRow = compliances.find((row) => row.compliance_id === rowId);
    if (!sourceRow) return;

    const payload: Partial<ComplianceRow> = {
      certificate_name: sourceRow.certificate_name,
      certificate_no: `${sourceRow.certificate_no || 'COPY'}-COPY`,
      category_id: sourceRow.category_id,
      department_id: sourceRow.department_id,
      owner_id: sourceRow.owner_id,
      renewal_frequency: sourceRow.renewal_frequency,
      last_renewed_date: sourceRow.last_renewed_date,
      next_renewal_date: sourceRow.next_renewal_date,
      notes: sourceRow.notes,
    };

    const { data, error } = await supabase.from('compliances').insert([payload]).select('compliance_id');
    if (error) {
      console.error('Error duplicating compliance row:', error);
      return;
    }

    if (data?.[0]?.compliance_id) {
      await refreshCompliances();
    }
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

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'normal', label: 'Normal' },
  ];

  const filteredCompliances = compliances.filter((row) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (normalizedQuery && !row.certificate_name?.toLowerCase().includes(normalizedQuery)) {
      return false;
    }

    if (filterOwner && row.owner_id !== filterOwner) {
      return false;
    }

    if (filterCategory && row.category_id !== filterCategory) {
      return false;
    }

    if (filterDepartment && row.department_id !== filterDepartment) {
      return false;
    }

    if (filterStatus !== 'all' && row.status?.toLowerCase() !== filterStatus) {
      return false;
    }

    return true;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setFilterOwner('');
    setFilterCategory('');
    setFilterDepartment('');
    setFilterStatus('all');
  };

  const totalCertifications = filteredCompliances.length;
  const normalCount = filteredCompliances.filter((row) => row.status === 'normal').length;
  const dueSoonCount = filteredCompliances.filter((row) => row.status === 'high' || row.status === 'medium').length;
  const criticalCount = filteredCompliances.filter((row) => row.status === 'critical').length;

  const alertGroups = {
    critical: alerts.filter((alert) => alert.status?.toLowerCase() === 'critical'),
    high: alerts.filter((alert) => alert.status?.toLowerCase() === 'high'),
    medium: alerts.filter((alert) => alert.status?.toLowerCase() === 'medium'),
  };

  const totalAlerts = alerts.length;

  const alertSectionMeta: Record<'critical' | 'high' | 'medium', { label: string; ringClass: string; bgClass: string; textClass: string }> = {
    critical: {
      label: '🔴 Critical',
      ringClass: 'ring-red-500/30',
      bgClass: 'bg-red-950/60',
      textClass: 'text-red-200',
    },
    high: {
      label: '🟠 High',
      ringClass: 'ring-orange-500/30',
      bgClass: 'bg-orange-950/60',
      textClass: 'text-orange-200',
    },
    medium: {
      label: '🟡 Medium',
      ringClass: 'ring-amber-500/30',
      bgClass: 'bg-amber-950/60',
      textClass: 'text-amber-200',
    },
  };

  const toggleAlertCollapse = (status: 'critical' | 'high' | 'medium') => {
    setAlertsCollapsed((current) => ({
      ...current,
      [status]: !current[status],
    }));
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10">
      {deleteTargetId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-8 text-slate-100 shadow-2xl shadow-black/40">
            <h3 className="text-xl font-semibold text-white">Archive this record?</h3>
            <p className="mt-3 text-sm text-slate-300">It will be removed from the table.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelDelete}
                className="rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!deleteTargetId) return;
                  await handleDeleteRow(deleteTargetId);
                  setDeleteTargetId(null);
                }}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
            <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-5 shadow-sm shadow-slate-950/10">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Total Certifications</p>
              <p className="mt-3 text-4xl font-semibold text-sky-300">{totalCertifications}</p>
            </div>
            <div className="rounded-3xl border border-emerald-700/40 bg-emerald-950/60 p-5 shadow-sm shadow-emerald-950/20">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">Normal</p>
              <p className="mt-3 text-4xl font-semibold text-emerald-200">{normalCount}</p>
            </div>
            <div className="rounded-3xl border border-amber-700/40 bg-amber-950/60 p-5 shadow-sm shadow-amber-950/20">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-200">Due Soon</p>
              <p className="mt-3 text-4xl font-semibold text-amber-200">{dueSoonCount}</p>
            </div>
            <div className="rounded-3xl border border-red-700/40 bg-red-950/60 p-5 shadow-sm shadow-red-950/20">
              <p className="text-sm uppercase tracking-[0.3em] text-red-200">Critical</p>
              <p className="mt-3 text-4xl font-semibold text-red-200">{criticalCount}</p>
            </div>
          </div>

          <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            {totalAlerts === 0 ? (
              <div className="rounded-3xl border border-emerald-700/40 bg-emerald-950/60 p-5 text-emerald-200">
                All certifications are on track
              </div>
            ) : (
              <div className="space-y-4">
                {(['critical', 'high', 'medium'] as const).map((status) => {
                  const group = alertGroups[status];
                  const meta = alertSectionMeta[status];
                  const isCollapsed = alertsCollapsed[status];
                  return (
                    <div key={status} className={`rounded-3xl border ${meta.ringClass} ${meta.bgClass} p-4`}>
                      <button
                        type="button"
                        onClick={() => toggleAlertCollapse(status)}
                        className="flex w-full items-center justify-between text-left"
                      >
                        <div>
                          <p className={`text-sm uppercase tracking-[0.3em] ${meta.textClass}`}>{meta.label}</p>
                          <p className={`mt-1 text-lg font-semibold ${meta.textClass}`}>{group.length} alert{group.length === 1 ? '' : 's'}</p>
                        </div>
                        <span className="text-slate-300">{isCollapsed ? '▸' : '▾'}</span>
                      </button>
                      {!isCollapsed ? (
                        <div className="mt-4 space-y-3">
                          {group.map((alert, index) => {
                            const overdue = alert.days_remaining < 0;
                            return (
                              <div key={`${alert.certificate_name}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="space-y-1">
                                    <p className="font-semibold text-slate-100">{alert.certificate_name}</p>
                                    <p className="text-sm text-slate-400">{alert.owner_name} • {alert.category_name}</p>
                                  </div>
                                  <div className="text-right">
                                    {overdue ? (
                                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-red-300">
                                        <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-red-400" />
                                        {Math.abs(alert.days_remaining)} days overdue
                                      </p>
                                    ) : (
                                      <p className="text-sm text-slate-300">Due in {alert.days_remaining} days</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {group.length === 0 ? (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-400">
                              No {meta.label.toLowerCase()} alerts
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Compliance table</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Compliance records</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-slate-400">View is backed by compliances_with_status; editors may click editable cells.</p>
                {isEditor ? (
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
                  >
                    Add row
                  </button>
                ) : null}
              </div>
          </div>

          <div className="mb-6 grid gap-3 lg:grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))]">
            <label className="sr-only" htmlFor="search-query">
              Search certificates
            </label>
            <input
              id="search-query"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search certificate name"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-200 outline-none ring-1 ring-transparent transition focus:border-slate-500 focus:ring-slate-500"
            />

            <div>
              <label className="sr-only" htmlFor="filter-owner">
                Owner filter
              </label>
              <select
                id="filter-owner"
                value={filterOwner}
                onChange={(event) => setFilterOwner(event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-200 outline-none ring-1 ring-transparent transition focus:border-slate-500 focus:ring-slate-500"
              >
                <option value="">Owner</option>
                {owners.map((owner) => (
                  <option key={owner.value} value={owner.value}>
                    {owner.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="sr-only" htmlFor="filter-category">
                Category filter
              </label>
              <select
                id="filter-category"
                value={filterCategory}
                onChange={(event) => setFilterCategory(event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-200 outline-none ring-1 ring-transparent transition focus:border-slate-500 focus:ring-slate-500"
              >
                <option value="">Category</option>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="sr-only" htmlFor="filter-department">
                Department filter
              </label>
              <select
                id="filter-department"
                value={filterDepartment}
                onChange={(event) => setFilterDepartment(event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-200 outline-none ring-1 ring-transparent transition focus:border-slate-500 focus:ring-slate-500"
              >
                <option value="">Department</option>
                {departments.map((department) => (
                  <option key={department.value} value={department.value}>
                    {department.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="sr-only" htmlFor="filter-status">
                Status filter
              </label>
              <select
                id="filter-status"
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-200 outline-none ring-1 ring-transparent transition focus:border-slate-500 focus:ring-slate-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-700"
            >
              Clear
            </button>
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
                    {isEditor ? <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {filteredCompliances.map((row) => (
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
                          value={row.category_name}
                          isEditor={isEditor}
                          type="datalist"
                          options={categories}
                          onSave={handleSave}
                        />
                      </td>
                      <td className="border-b border-slate-800 px-4 py-3">
                        <EditableCell
                          row={row}
                          field="department_id"
                          value={row.department_name}
                          isEditor={isEditor}
                          type="datalist"
                          options={departments}
                          onSave={handleSave}
                        />
                      </td>
                      <td className="border-b border-slate-800 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <EditableCell
                              row={row}
                              field="owner_id"
                              value={row.owner_id}
                              isEditor={isEditor}
                              type="select"
                              options={owners}
                              onSave={handleSave}
                            />
                          </div>
                          {isEditor && (
                            <div className="flex flex-col gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={async () => {
                                  const name = prompt('Enter new owner name:');
                                  if (!name || !name.trim()) return;
                                  const supabase = getBrowserSupabaseClient();
                                  const { data, error } = await supabase
                                    .from('owners')
                                    .insert([{ owner_name: name.trim() }])
                                    .select('owner_id, owner_name');
                                  if (error) {
                                    alert('Error adding owner: ' + error.message);
                                    return;
                                  }
                                  if (data?.[0]) {
                                    setOwners((prev) => [...prev, { value: data[0].owner_id, label: data[0].owner_name }]);
                                  }
                                }}
                                className="rounded-full border border-emerald-700 bg-emerald-950/60 px-2 py-1 text-xs text-emerald-300 transition hover:border-emerald-500 hover:bg-emerald-900"
                                title="Add Owner"
                              >
                                + Add
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!row.owner_id) return;
                                  if (!confirm(`Soft delete owner "${row.owner_name}"?`)) return;
                                  const supabase = getBrowserSupabaseClient();
                                  const { error } = await supabase.rpc('soft_delete_owner', { p_id: row.owner_id });
                                  if (error) {
                                    alert('Error deleting owner: ' + error.message);
                                    return;
                                  }
                                  setOwners((prev) => prev.filter((o) => o.value !== row.owner_id));
                                  await refreshCompliances();
                                }}
                                className="rounded-full border border-red-700 bg-red-950/60 px-2 py-1 text-xs text-red-300 transition hover:border-red-500 hover:bg-red-900"
                                title="Delete Owner"
                              >
                                🗑 Del
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="border-b border-slate-800 px-4 py-3">
                        <EditableCell
                          row={row}
                          field="renewal_frequency"
                          value={row.renewal_frequency}
                          isEditor={isEditor}
                          type="datalist"
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
                      {isEditor ? (
                        <td className="border-b border-slate-800 px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleDuplicateRow(row.compliance_id)}
                              className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-200 transition hover:border-slate-500 hover:bg-slate-700"
                            >
                              Duplicate
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmDeleteRow(row.compliance_id)}
                              className="rounded-full border border-red-700 bg-red-950/60 px-3 py-1 text-xs text-red-300 transition hover:border-red-500 hover:bg-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Owner Analytics Section */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/30">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Owner Analytics</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Owner Risk Scores</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-slate-400">Risk score range: 0.00 (low) to 3.00 (high)</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
            <table className="min-w-full border-collapse text-left text-sm text-slate-200">
              <thead className="bg-slate-900/90 text-slate-400">
                <tr>
                  <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Owner Name</th>
                  <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium text-center">Total Active</th>
                  <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium text-center">
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Critical</span>
                  </th>
                  <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium text-center">
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" /> High</span>
                  </th>
                  <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium text-center">
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Medium</span>
                  </th>
                  <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium text-center">
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Normal</span>
                  </th>
                  <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Risk Score</th>
                  <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Risk Bar</th>
                </tr>
              </thead>
              <tbody>
                {ownerRiskScores.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border-b border-slate-800 px-4 py-8 text-center text-slate-400">
                      No owner risk data available
                    </td>
                  </tr>
                ) : (
                  ownerRiskScores.map((owner, index) => {
                    const barWidth = Math.min((owner.risk_score / 3) * 100, 100);
                    let barColorClass = 'bg-emerald-500';
                    if (owner.risk_score >= 3.00) {
                      barColorClass = 'bg-red-500';
                    } else if (owner.risk_score >= 2.00) {
                      barColorClass = 'bg-orange-500';
                    } else if (owner.risk_score >= 1.00) {
                      barColorClass = 'bg-amber-500';
                    }

                    return (
                      <tr key={`${owner.owner_name}-${index}`} className="even:bg-slate-950/70 hover:bg-slate-900/80">
                        <td className="border-b border-slate-800 px-4 py-3 font-semibold text-slate-100">{owner.owner_name || '—'}</td>
                        <td className="border-b border-slate-800 px-4 py-3 text-center text-slate-300">{owner.total_active ?? 0}</td>
                        <td className="border-b border-slate-800 px-4 py-3 text-center">
                          <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-300">
                            {owner.critical_count ?? 0}
                          </span>
                        </td>
                        <td className="border-b border-slate-800 px-4 py-3 text-center">
                          <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-semibold text-orange-300">
                            {owner.high_count ?? 0}
                          </span>
                        </td>
                        <td className="border-b border-slate-800 px-4 py-3 text-center">
                          <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-300">
                            {owner.medium_count ?? 0}
                          </span>
                        </td>
                        <td className="border-b border-slate-800 px-4 py-3 text-center">
                          <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                            {owner.normal_count ?? 0}
                          </span>
                        </td>
                        <td className="border-b border-slate-800 px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            owner.risk_score >= 3.00 ? 'bg-red-500/15 text-red-300 ring-red-500/30' :
                            owner.risk_score >= 2.00 ? 'bg-orange-500/15 text-orange-300 ring-orange-500/30' :
                            owner.risk_score >= 1.00 ? 'bg-amber-500/15 text-amber-300 ring-amber-500/30' :
                            'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30'
                          }`}>
                            {owner.risk_score?.toFixed(2) ?? '0.00'}
                          </span>
                        </td>
                        <td className="border-b border-slate-800 px-4 py-3">
                          <div className="h-2.5 w-full rounded-full bg-slate-800">
                            <div
                              className={`h-2.5 rounded-full ${barColorClass} transition-all duration-300`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Audit History Section */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/30">
          <button
            type="button"
            onClick={toggleAuditHistory}
            className="flex w-full items-center justify-between text-left"
          >
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Audit History</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">All Records (Including Deleted)</h2>
            </div>
            <span className="text-slate-300">{auditHistoryCollapsed ? '▸' : '▾'}</span>
          </button>

          {!auditHistoryCollapsed && (
            <div className="mt-6">
              {auditHistoryLoading ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-8 text-center text-slate-300">
                  Loading audit history...
                </div>
              ) : auditHistory.length === 0 ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-8 text-center text-slate-400">
                  No audit history available
                </div>
              ) : (
                <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
                  <table className="min-w-full border-collapse text-left text-sm text-slate-200">
                    <thead className="bg-slate-900/90 text-slate-400">
                      <tr>
                        <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Certificate No</th>
                        <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Certificate Name</th>
                        <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium text-center">Status</th>
                        <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Owner</th>
                        <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Category</th>
                        <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Department</th>
                        <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Last Renewed</th>
                        <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Next Renewal</th>
                        <th className="whitespace-nowrap border-b border-slate-800 px-4 py-3 font-medium">Deleted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditHistory.map((row) => {
                        const isDeleted = row.status === 'deleted';
                        return (
                          <tr
                            key={row.compliance_id}
                            className={`even:bg-slate-950/70 ${isDeleted ? 'opacity-60' : 'hover:bg-slate-900/80'}`}
                          >
                            <td className={`border-b border-slate-800 px-4 py-3 ${isDeleted ? 'text-slate-500' : 'text-slate-300'}`}>
                              {row.certificate_no}
                            </td>
                            <td className={`border-b border-slate-800 px-4 py-3 ${isDeleted ? 'text-slate-500 line-through' : 'font-semibold text-slate-100'}`}>
                              {row.certificate_name}
                            </td>
                            <td className="border-b border-slate-800 px-4 py-3 text-center">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                                isDeleted ? 'bg-slate-500/15 text-slate-400 ring-slate-500/30' :
                                statusClasses[row.status] ?? statusClasses.normal
                              }`}>
                                {row.status}
                              </span>
                            </td>
                            <td className={`border-b border-slate-800 px-4 py-3 ${isDeleted ? 'text-slate-500' : 'text-slate-300'}`}>
                              {row.owner_name || '—'}
                            </td>
                            <td className={`border-b border-slate-800 px-4 py-3 ${isDeleted ? 'text-slate-500' : 'text-slate-300'}`}>
                              {row.category_name || '—'}
                            </td>
                            <td className={`border-b border-slate-800 px-4 py-3 ${isDeleted ? 'text-slate-500' : 'text-slate-300'}`}>
                              {row.department_name || '—'}
                            </td>
                            <td className={`border-b border-slate-800 px-4 py-3 ${isDeleted ? 'text-slate-500' : 'text-slate-300'}`}>
                              {row.last_renewed_date || '—'}
                            </td>
                            <td className={`border-b border-slate-800 px-4 py-3 ${isDeleted ? 'text-slate-500' : 'text-slate-300'}`}>
                              {row.next_renewal_date || '—'}
                            </td>
                            <td className="border-b border-slate-800 px-4 py-3">
                              {isDeleted && row.deleted_at ? (
                                <span className="text-slate-500">{row.deleted_at}</span>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
