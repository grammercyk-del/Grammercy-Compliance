"use client";

import { useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import IsEditorContext from './isEditorContext';
import { getBrowserSupabaseClient } from '@/lib/supabase/client';

type ComplianceRow = {
  compliance_id: string;
  certificate_no: string;
  certificate_name: string;
  category_id: string | null;
  department_id: string | null;
  owner_id: string | null;
  frequency: string | null;
  frequency_months: number | null;
  remarks: string | null;
  last_renewed_date: string | null;
  next_renewal_date: string | null;
  days_remaining: number | null;
  status: 'critical' | 'high' | 'medium' | 'normal' | string;
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
  type: 'text' | 'date' | 'select' | 'datalist' | 'readonly' | 'textarea';
  options?: SelectOption[];
  onSave: (rowId: string, field: string, value: string, extraLabel?: string) => Promise<string | null>;
};

const statusClasses: Record<string, string> = {
  normal: 'bg-green-100 text-green-700 ring-green-300',
  due_soon: 'bg-yellow-100 text-yellow-700 ring-yellow-300',
  critical: 'bg-red-100 text-red-700 ring-red-300',
  expired: 'bg-red-200 text-red-800 ring-red-400',
  unknown: 'bg-gray-100 text-gray-600 ring-gray-300',
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
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-800 outline-none ring-1 ring-transparent transition focus:border-green-500 focus:ring-green-500"
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
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-800 outline-none ring-1 ring-transparent transition focus:border-green-500 focus:ring-green-500"
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
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-800 outline-none ring-1 ring-transparent transition focus:border-green-500 focus:ring-green-500"
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
            <div className="relative flex items-center gap-1">
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                list={`datalist-${field}`}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-800 outline-none ring-1 ring-transparent transition focus:border-green-500 focus:ring-green-500"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                disabled={saving}
                placeholder="Type or select..."
              />
              <datalist id={`datalist-${field}`}> 
                {options?.map((option) => (
                  <option key={option.value} value={option.label} />
                ))}
              </datalist>
              {isEditor && (
                <button
                  type="button"
                  className="ml-1 rounded-full border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-600 transition hover:border-red-500 hover:bg-red-100"
                  title="Delete value"
                  onClick={async (e) => {
                    e.preventDefault();
                    const label = draft.trim();
                    if (!label) return;
                    if (!confirm(`Delete '${label}' from lookup table?`)) return;
                    const supabase = getBrowserSupabaseClient();
                    const nameColumn = field === 'category_id' ? 'category_name' : 'department_name';
                    let table = field === 'category_id' ? 'categories' : field === 'department_id' ? 'departments' : null;
                    if (!table) return;
                    const { error } = await supabase
                      .from(table)
                      .delete()
                      .eq(nameColumn, label);
                    if (error) alert('Error deleting: ' + error.message);
                  }}
                >
                  🗑
                </button>
              )}
            </div>
          )}
          {type === 'textarea' && (
            <textarea
              ref={inputRef as unknown as React.RefObject<HTMLTextAreaElement>}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-800 outline-none ring-1 ring-transparent transition focus:border-green-500 focus:ring-green-500"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={handleSave}
              rows={2}
              disabled={saving}
              placeholder="Remarks..."
            />
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="w-full text-left text-gray-700 transition hover:text-gray-900"
        >
          {displayValue}
        </button>
      )}
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
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
  const [darkMode, setDarkMode] = useState(false);

  const refreshCompliances = async () => {
    const supabase = getBrowserSupabaseClient();
    setIsLoading(true);
    setLoadError(null);

    const result = await supabase
      .from('compliances_with_status')
      .select(
        'compliance_id, certificate_no, certificate_name, category_id, department_id, owner_id, frequency, frequency_months, remarks, last_renewed_date, next_renewal_date, days_remaining, status'
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

  const refreshOwnerRiskScores = () => {
    const ownerMap: Record<string, { owner_name: string; total_active: number; critical_count: number; high_count: number; medium_count: number; normal_count: number; risk_score: number }> = {};

    compliances.forEach((row) => {
      if (!row.owner_id) return;
      const ownerName = owners.find((o) => o.value === row.owner_id)?.label || 'Unknown';
      if (!ownerMap[row.owner_id]) {
        ownerMap[row.owner_id] = { owner_name: ownerName, total_active: 0, critical_count: 0, high_count: 0, medium_count: 0, normal_count: 0, risk_score: 0 };
      }
      const o = ownerMap[row.owner_id];
      o.total_active += 1;
      if (row.status === 'critical') o.critical_count += 1;
      else if (row.status === 'due_soon') o.medium_count += 1;
      else if (row.status === 'expired') o.high_count += 1;
      else if (row.status === 'normal') o.normal_count += 1;
    });

    const scores = Object.values(ownerMap).map((o) => ({
      ...o,
      risk_score: Number(((o.critical_count * 3 + o.high_count * 2 + o.medium_count * 1) / Math.max(o.total_active, 1)).toFixed(2)),
    })).sort((a, b) => b.risk_score - a.risk_score);

    setOwnerRiskScores(scores);
  };

  const loadAuditHistory = async () => {
    if (!auditHistoryCollapsed) return;
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
        supabase.from('owners').select('owner_id, owner_name'),
        supabase.from('categories').select('category_id, category_name'),
        supabase.from('departments').select('department_id, department_name'),
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

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'compliances' }, () => {
        refreshCompliances();
        refreshAlerts();
      })
      .subscribe();

    loadOptions();
    refreshCompliances();
    refreshAlerts();
    intervalId = window.setInterval(() => {
      refreshCompliances();
      refreshAlerts();
    }, 60000);

    return () => {
      mounted = false;
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    refreshOwnerRiskScores();
  }, [compliances, owners]);

  const handleSave = async (rowId: string, field: string, value: string, extraLabel?: string) => {
    const supabase = getBrowserSupabaseClient();
    const originalRow = compliances.find((row) => row.compliance_id === rowId);
    if (!originalRow) {
      return 'Row not found';
    }

    const updatedRow: Partial<ComplianceRow> = { [field]: value } as Partial<ComplianceRow>;
    const payload: Record<string, unknown> = {};

    if (field === 'category_id' || field === 'department_id') {
      const lookup = field === 'category_id' ? categories : departments;
      let label = value;
      let id = lookup.find((c) => c.label.toLowerCase() === label.toLowerCase())?.value;
      if (!id) {
        const table = field === 'category_id' ? 'categories' : 'departments';
        const nameColumn = field === 'category_id' ? 'category_name' : 'department_name';
        const idColumn = field === 'category_id' ? 'category_id' : 'department_id';
        const { data, error } = await supabase.from(table).insert([{ [nameColumn]: label }]).select(idColumn);
        if (error || !data?.[0] || !(idColumn in data[0])) {
          return error?.message || 'Failed to insert new value';
        }
        id = (data[0] as Record<string, string>)[idColumn];
        if (field === 'category_id') setCategories((prev) => [...prev, { value: id!, label }]);
        else setDepartments((prev) => [...prev, { value: id!, label }]);
      }
      updatedRow[field] = id;
      payload[field] = id;
    } else if (field === 'owner_id') {
      let id = owners.find((o) => o.label.toLowerCase() === value.toLowerCase())?.value;
      if (!id) {
        const { data, error } = await supabase.from('owners').insert([{ owner_name: value }]).select('owner_id');
        if (error || !data?.[0]?.owner_id) {
          return error?.message || 'Failed to insert new owner';
        }
        id = data[0].owner_id;
        setOwners((prev) => [...prev, { value: id!, label: value }]);
      }
      updatedRow.owner_id = id;
      payload.owner_id = id;
    } else if (field === 'frequency') {
      updatedRow.frequency = value;
      payload.frequency = value;
      if (value === 'Custom' && typeof extraLabel === 'string') {
        payload.frequency_months = Number(extraLabel);
        updatedRow.frequency_months = Number(extraLabel);
      } else {
        const freqMap: Record<string, number> = {
          'Monthly': 1,
          'Quarterly': 3,
          'Half-Yearly': 6,
          'Annual': 12,
          'Bi-Annual': 24,
          'Every 3 years': 36,
          'Every 5 years': 60,
        };
        payload.frequency_months = freqMap[value] || null;
        updatedRow.frequency_months = freqMap[value] || null;
      }
    } else if (field === 'remarks') {
      updatedRow.remarks = value;
      payload.remarks = value;
    } else {
      (updatedRow as any)[field] = value;
      (payload as any)[field] = value;
    }

    setCompliances((current) =>
      current.map((row) => (row.compliance_id === rowId ? { ...row, ...updatedRow } : row))
    );

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
      department_id: departments[0]?.value ?? null,
      owner_id: owners[0]?.value ?? null,
      last_renewed_date: null,
      next_renewal_date: null,
      days_remaining: null,
      status: 'normal',
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
      last_renewed_date: newCompliance.last_renewed_date,
      next_renewal_date: newCompliance.next_renewal_date,
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

    const { error } = await supabase
      .from('compliances')
      .update({ deleted_at: new Date().toISOString() })
      .eq('compliance_id', rowId);
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
      last_renewed_date: sourceRow.last_renewed_date,
      next_renewal_date: sourceRow.next_renewal_date,
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
  const dueSoonCount = filteredCompliances.filter((row) => row.status === 'due_soon').length;
  const criticalCount = filteredCompliances.filter((row) => row.status === 'critical').length;
  const expiredCount = filteredCompliances.filter((row) => row.status === 'expired').length;

  const alertGroups = {
    critical: alerts.filter((alert) => alert.status?.toLowerCase() === 'critical'),
    high: alerts.filter((alert) => alert.status?.toLowerCase() === 'due_soon'),
    medium: alerts.filter((alert) => alert.status?.toLowerCase() === 'expired'),
  };

  const totalAlerts = alerts.length;

  const alertSectionMeta: Record<'critical' | 'high' | 'medium', { label: string; ringClass: string; bgClass: string; textClass: string }> = {
    critical: {
      label: '🔴 Critical',
      ringClass: 'ring-red-300',
      bgClass: 'bg-red-50',
      textClass: 'text-red-700',
    },
    high: {
      label: '🟡 Due Soon',
      ringClass: 'ring-yellow-300',
      bgClass: 'bg-yellow-50',
      textClass: 'text-yellow-700',
    },
    medium: {
      label: '🔴 Expired',
      ringClass: 'ring-red-400',
      bgClass: 'bg-red-200',
      textClass: 'text-red-800',
    },
  };

  const exportCSV = () => {
    const headers = [
      "Certificate No", "Certificate Name", "Category", "Department", "Owner",
      "Frequency", "Remarks", "Last Renewed", "Next Renewal", "Days Remaining", "Status"
    ];

    const data = filteredCompliances.map(r => [
      r.certificate_no,
      r.certificate_name,
      categories.find(c => c.value === r.category_id)?.label || '',
      departments.find(d => d.value === r.department_id)?.label || '',
      owners.find(o => o.value === r.owner_id)?.label || '',
      r.frequency || '',
      r.remarks || '',
      r.last_renewed_date || '',
      r.next_renewal_date || '',
      r.days_remaining?.toString() || '',
      r.status || '',
    ]);

    const csv = [headers, ...data].map(e => e.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compliance_data.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleAlertCollapse = (status: 'critical' | 'high' | 'medium') => {
    setAlertsCollapsed((current) => ({
      ...current,
      [status]: !current[status],
    }));
  };

  return (
    <main className="min-h-screen px-6 py-10" style={{ backgroundColor: '#F5F8F4' }}>
      {/* Dark mode wrapper */}
      <div className={`${darkMode ? 'dark' : ''}`}>
      {deleteTargetId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800">Archive this record?</h3>
            <p className="mt-3 text-sm text-gray-600">It will be removed from the table.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelDelete}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
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
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-green-700 font-medium">Protected Dashboard</p>
              <h1 className="mt-2 text-3xl font-semibold text-gray-800">Welcome back, compliance user</h1>
              <p className="mt-2 text-sm text-gray-500">Role: {isEditor === null ? 'Loading...' : isEditor ? 'Editor' : 'Viewer'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportCSV}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
              >
                📥 Export CSV
              </button>
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
              >
                {darkMode ? '☀️ Light' : '🌙 Dark'}
              </button>
              <Link
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                href="/login"
              >
                Manage session
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Total Certifications</p>
              <p className="mt-3 text-3xl font-semibold text-green-700">{totalCertifications}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-700">Normal</p>
              <p className="mt-3 text-3xl font-semibold text-emerald-700">{normalCount}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-700">Due Soon</p>
              <p className="mt-3 text-3xl font-semibold text-amber-700">{dueSoonCount}</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.3em] text-red-700">Critical</p>
              <p className="mt-3 text-3xl font-semibold text-red-700">{criticalCount}</p>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
            {totalAlerts === 0 ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 font-medium">
                All certifications are on track
              </div>
            ) : (
              <div className="space-y-4">
                {(['critical', 'high', 'medium'] as const).map((status) => {
                  const group = alertGroups[status];
                  const meta = alertSectionMeta[status];
                  const isCollapsed = alertsCollapsed[status];
                  return (
                    <div key={status} className={`rounded-xl border ${meta.ringClass} ${meta.bgClass} p-4`}>
                      <button
                        type="button"
                        onClick={() => toggleAlertCollapse(status)}
                        className="flex w-full items-center justify-between text-left"
                      >
                        <div>
                          <p className={`text-sm uppercase tracking-[0.3em] ${meta.textClass}`}>{meta.label}</p>
                          <p className={`mt-1 text-lg font-semibold ${meta.textClass}`}>{group.length} alert{group.length === 1 ? '' : 's'}</p>
                        </div>
                        <span className="text-gray-500">{isCollapsed ? '▸' : '▾'}</span>
                      </button>
                      {!isCollapsed ? (
                        <div className="mt-4 space-y-3">
                          {group.map((alert, index) => {
                            const overdue = alert.days_remaining < 0;
                            return (
                              <div key={`${alert.certificate_name}-${index}`} className="rounded-xl border border-gray-200 bg-white p-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="space-y-1">
                                    <p className="font-semibold text-gray-800">{alert.certificate_name}</p>
                                    <p className="text-sm text-gray-500">{alert.owner_name} • {alert.category_name}</p>
                                  </div>
                                  <div className="text-right">
                                    {overdue ? (
                                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-red-600">
                                        <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                                        {Math.abs(alert.days_remaining)} days overdue
                                      </p>
                                    ) : (
                                      <p className="text-sm text-gray-500">Due in {alert.days_remaining} days</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {group.length === 0 ? (
                            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-400">
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
                <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Compliance table</p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-800">Compliance records</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-gray-400">View is backed by compliances_with_status; editors may click editable cells.</p>
                {isEditor ? (
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-800"
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
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-800 outline-none ring-1 ring-transparent transition focus:border-green-500 focus:ring-green-500"
            />

            <div>
              <label className="sr-only" htmlFor="filter-owner">
                Owner filter
              </label>
              <select
                id="filter-owner"
                value={filterOwner}
                onChange={(event) => setFilterOwner(event.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-800 outline-none ring-1 ring-transparent transition focus:border-green-500 focus:ring-green-500"
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
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-800 outline-none ring-1 ring-transparent transition focus:border-green-500 focus:ring-green-500"
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
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-800 outline-none ring-1 ring-transparent transition focus:border-green-500 focus:ring-green-500"
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
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-800 outline-none ring-1 ring-transparent transition focus:border-green-500 focus:ring-green-500"
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
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Clear
            </button>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">Loading compliances...</div>
          ) : loadError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-red-600">{loadError}</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="min-w-full border-collapse text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium min-w-[140px]">Certificate No</th>
                    <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium min-w-[180px]">Certificate Name</th>
                    <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium min-w-[150px]">Category</th>
                    <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium min-w-[150px]">Department</th>
                    <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium min-w-[150px]">Owner</th>
                    <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium min-w-[130px]">Frequency</th>
                    <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium min-w-[200px]">Remarks</th>
                    <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium min-w-[140px]">Last Renewed</th>
                    <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium min-w-[140px]">Next Renewal</th>
                    <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium min-w-[120px]">Days Remaining</th>
                    <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium min-w-[100px]">Status</th>
                    <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium min-w-[140px]">Notes</th>
                    {isEditor ? <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium min-w-[120px]">Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {filteredCompliances.map((row) => (
                    <tr key={row.compliance_id} className="even:bg-gray-50 hover:bg-gray-100">
                      <td className="border-b border-gray-200 px-4 py-3 text-gray-600">{row.certificate_no}</td>
                      <td className="border-b border-gray-200 px-4 py-3">
                        <EditableCell
                          row={row}
                          field="certificate_name"
                          value={row.certificate_name}
                          isEditor={isEditor}
                          type="text"
                          onSave={handleSave}
                        />
                      </td>
                      <td className="border-b border-gray-200 px-4 py-3">
                        <EditableCell
                          row={row}
                          field="category_id"
                          value={categories.find((c) => c.value === row.category_id)?.label || ''}
                          isEditor={isEditor}
                          type="datalist"
                          options={categories}
                          onSave={handleSave}
                        />
                      </td>
                      <td className="border-b border-gray-200 px-4 py-3">
                        <EditableCell
                          row={row}
                          field="department_id"
                          value={departments.find((d) => d.value === row.department_id)?.label || ''}
                          isEditor={isEditor}
                          type="datalist"
                          options={departments}
                          onSave={handleSave}
                        />
                      </td>
                      <td className="border-b border-gray-200 px-4 py-3">
                        <EditableCell
                          row={row}
                          field="owner_id"
                          value={owners.find((o) => o.value === row.owner_id)?.label || ''}
                          isEditor={isEditor}
                          type="datalist"
                          options={owners}
                          onSave={handleSave}
                        />
                      </td>
                      <td className="border-b border-gray-200 px-4 py-3">
                        <select
                          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-800 outline-none ring-1 ring-transparent transition focus:border-green-500 focus:ring-green-500"
                          value={row.frequency || ''}
                          disabled={!isEditor}
                          onChange={async (e) => {
                            const val = e.target.value;
                            let months = '';
                            if (val === 'Custom') {
                              months = prompt('Enter custom frequency in months:', row.frequency_months?.toString() || '') || '';
                            }
                            await handleSave(row.compliance_id, 'frequency', val, months);
                          }}
                        >
                          <option value="">Choose…</option>
                          <option value="Monthly">Monthly (1)</option>
                          <option value="Quarterly">Quarterly (3)</option>
                          <option value="Half-Yearly">Half-Yearly (6)</option>
                          <option value="Annual">Annual (12)</option>
                          <option value="Bi-Annual">Bi-Annual (24)</option>
                          <option value="Every 3 years">Every 3 years (36)</option>
                          <option value="Every 5 years">Every 5 years (60)</option>
                          <option value="Custom">Custom…</option>
                        </select>
                      </td>
                      <td className="border-b border-gray-200 px-4 py-3">
                        <EditableCell
                          row={row}
                          field="remarks"
                          value={row.remarks}
                          isEditor={isEditor}
                          type="textarea"
                          onSave={handleSave}
                        />
                      </td>
                      <td className="border-b border-gray-200 px-4 py-3">
                        <EditableCell
                          row={row}
                          field="last_renewed_date"
                          value={row.last_renewed_date}
                          isEditor={isEditor}
                          type="date"
                          onSave={handleSave}
                        />
                      </td>
                      <td className="border-b border-gray-200 px-4 py-3">
                        <EditableCell
                          row={row}
                          field="next_renewal_date"
                          value={row.next_renewal_date}
                          isEditor={isEditor}
                          type="date"
                          onSave={handleSave}
                        />
                      </td>
                      <td className="border-b border-gray-200 px-4 py-3 text-gray-600">{row.days_remaining ?? '—'}</td>
                      <td className="border-b border-gray-200 px-4 py-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClasses[row.status] ?? statusClasses.normal}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="border-b border-gray-200 px-4 py-3">
                        <EditableCell
                          row={row}
                          field={"remarks" as keyof ComplianceRow}
                          value={(row as any).notes}
                          isEditor={isEditor}
                          type="text"
                          onSave={handleSave}
                        />
                      </td>
                      {isEditor ? (
                        <td className="border-b border-gray-200 px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleDuplicateRow(row.compliance_id)}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 transition hover:bg-gray-100"
                            >
                              Duplicate
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmDeleteRow(row.compliance_id)}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600 transition hover:bg-red-100"
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
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Owner Analytics</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-800">Owner Risk Scores</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-gray-400">Risk score range: 0.00 (low) to 3.00 (high)</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full border-collapse text-left text-sm text-gray-700">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium">Owner Name</th>
                  <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium text-center">Total Active</th>
                  <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium text-center">
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Critical</span>
                  </th>
                  <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium text-center">
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" /> High</span>
                  </th>
                  <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium text-center">
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Medium</span>
                  </th>
                  <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium text-center">
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Normal</span>
                  </th>
                  <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium">Risk Score</th>
                  <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium">Risk Bar</th>
                </tr>
              </thead>
              <tbody>
                {ownerRiskScores.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border-b border-gray-200 px-4 py-8 text-center text-gray-400">
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
                      <tr key={`${owner.owner_name}-${index}`} className="even:bg-gray-50 hover:bg-gray-100">
                        <td className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-800">{owner.owner_name || '—'}</td>
                        <td className="border-b border-gray-200 px-4 py-3 text-center text-gray-600">{owner.total_active ?? 0}</td>
                        <td className="border-b border-gray-200 px-4 py-3 text-center">
                          <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                            {owner.critical_count ?? 0}
                          </span>
                        </td>
                        <td className="border-b border-gray-200 px-4 py-3 text-center">
                          <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                            {owner.high_count ?? 0}
                          </span>
                        </td>
                        <td className="border-b border-gray-200 px-4 py-3 text-center">
                          <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            {owner.medium_count ?? 0}
                          </span>
                        </td>
                        <td className="border-b border-gray-200 px-4 py-3 text-center">
                          <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            {owner.normal_count ?? 0}
                          </span>
                        </td>
                        <td className="border-b border-gray-200 px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            owner.risk_score >= 3.00 ? 'bg-red-100 text-red-700 ring-red-300' :
                            owner.risk_score >= 2.00 ? 'bg-orange-100 text-orange-700 ring-orange-300' :
                            owner.risk_score >= 1.00 ? 'bg-amber-100 text-amber-700 ring-amber-300' :
                            'bg-emerald-100 text-emerald-700 ring-emerald-300'
                          }`}>
                            {owner.risk_score?.toFixed(2) ?? '0.00'}
                          </span>
                        </td>
                        <td className="border-b border-gray-200 px-4 py-3">
                          <div className="h-2.5 w-full rounded-full bg-gray-200">
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
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <button
            type="button"
            onClick={toggleAuditHistory}
            className="flex w-full items-center justify-between text-left"
          >
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Audit History</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-800">All Records (Including Deleted)</h2>
            </div>
            <span className="text-gray-500">{auditHistoryCollapsed ? '▸' : '▾'}</span>
          </button>

          {!auditHistoryCollapsed && (
            <div className="mt-6">
              {auditHistoryLoading ? (
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
                  Loading audit history...
                </div>
              ) : auditHistory.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-400">
                  No audit history available
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                  <table className="min-w-full border-collapse text-left text-sm text-gray-700">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium">Certificate No</th>
                        <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium">Certificate Name</th>
                        <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium text-center">Status</th>
                        <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium">Owner</th>
                        <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium">Category</th>
                        <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium">Department</th>
                        <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium">Last Renewed</th>
                        <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium">Next Renewal</th>
                        <th className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-medium">Deleted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditHistory.map((row) => {
                        const isDeleted = row.status === 'deleted';
                        return (
                          <tr
                            key={row.compliance_id}
                            className={`even:bg-gray-50 ${isDeleted ? 'opacity-60' : 'hover:bg-gray-100'}`}
                          >
                            <td className={`border-b border-gray-200 px-4 py-3 ${isDeleted ? 'text-gray-400' : 'text-gray-600'}`}>
                              {row.certificate_no}
                            </td>
                            <td className={`border-b border-gray-200 px-4 py-3 ${isDeleted ? 'text-gray-400 line-through' : 'font-semibold text-gray-800'}`}>
                              {row.certificate_name}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-center">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                                isDeleted ? 'bg-gray-100 text-gray-400 ring-gray-300' :
                                statusClasses[row.status] ?? statusClasses.normal
                              }`}>
                                {row.status}
                              </span>
                            </td>
                            <td className={`border-b border-gray-200 px-4 py-3 ${isDeleted ? 'text-gray-400' : 'text-gray-600'}`}>
                              {row.owner_name || '—'}
                            </td>
                            <td className={`border-b border-gray-200 px-4 py-3 ${isDeleted ? 'text-gray-400' : 'text-gray-600'}`}>
                              {row.category_name || '—'}
                            </td>
                            <td className={`border-b border-gray-200 px-4 py-3 ${isDeleted ? 'text-gray-400' : 'text-gray-600'}`}>
                              {row.department_name || '—'}
                            </td>
                            <td className={`border-b border-gray-200 px-4 py-3 ${isDeleted ? 'text-gray-400' : 'text-gray-600'}`}>
                              {row.last_renewed_date || '—'}
                            </td>
                            <td className={`border-b border-gray-200 px-4 py-3 ${isDeleted ? 'text-gray-400' : 'text-gray-600'}`}>
                              {row.next_renewal_date || '—'}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3">
                              {isDeleted && row.deleted_at ? (
                                <span className="text-gray-400">{row.deleted_at}</span>
                              ) : (
                                <span className="text-gray-300">—</span>
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
    </div>
    </main>
  );
}
