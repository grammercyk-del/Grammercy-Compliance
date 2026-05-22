import { X, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/utils/cn'
import type { ComplianceFilters, Owner, Category, Department } from '@/types'
import { DEFAULT_FILTERS } from '@/types'

interface FilterBarProps {
  filters: ComplianceFilters
  onChange: (f: ComplianceFilters) => void
  owners: Owner[]
  categories: Category[]
  departments: Department[]
}

export function FilterBar({ filters, onChange, owners, categories, departments }: FilterBarProps) {
  const [open, setOpen] = useState(false)

  const update = (key: keyof ComplianceFilters, value: string | boolean) =>
    onChange({ ...filters, [key]: value })

  const activeCount = [
    filters.owner_id, filters.category_id, filters.department_id,
    filters.status, filters.renewal_frequency, filters.date_from,
    filters.date_to, filters.overdue_only, filters.due_soon_only,
  ].filter(Boolean).length

  const clear = () => onChange({ ...DEFAULT_FILTERS, search: filters.search })

  const chips: { label: string; key: keyof ComplianceFilters }[] = [
    filters.owner_id       && { label: owners.find(o => o.owner_id === filters.owner_id)?.owner_name ?? '', key: 'owner_id' },
    filters.category_id    && { label: categories.find(c => c.category_id === filters.category_id)?.category_name ?? '', key: 'category_id' },
    filters.department_id  && { label: departments.find(d => d.department_id === filters.department_id)?.department_name ?? '', key: 'department_id' },
    filters.status         && { label: filters.status, key: 'status' },
    filters.renewal_frequency && { label: filters.renewal_frequency, key: 'renewal_frequency' },
    filters.overdue_only   && { label: 'Overdue only', key: 'overdue_only' },
    filters.due_soon_only  && { label: 'Due soon only', key: 'due_soon_only' },
    filters.date_from      && { label: `From: ${filters.date_from}`, key: 'date_from' },
    filters.date_to        && { label: `To: ${filters.date_to}`, key: 'date_to' },
  ].filter(Boolean) as { label: string; key: keyof ComplianceFilters }[]

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Filter drawer toggle */}
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'btn-secondary gap-2',
            activeCount > 0 && 'border-brand-500 text-brand-600 dark:text-brand-400',
          )}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeCount > 0 && (
            <span className="bg-brand-600 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {/* Active filter chips */}
        {chips.map(({ label, key }) => (
          <span
            key={key}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 text-xs font-medium border border-brand-200 dark:border-brand-800"
          >
            {label}
            <button
              onClick={() => update(key, typeof filters[key] === 'boolean' ? false : '')}
              className="text-brand-400 hover:text-brand-700 dark:hover:text-brand-200"
            >
              <X size={11} />
            </button>
          </span>
        ))}

        {activeCount > 0 && (
          <button onClick={clear} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline">
            Clear all
          </button>
        )}
      </div>

      {/* Expanded filter panel */}
      {open && (
        <div className="card p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-slide-in">
          <div>
            <label className="label">Owner</label>
            <select className="input" value={filters.owner_id} onChange={(e) => update('owner_id', e.target.value)}>
              <option value="">All owners</option>
              {owners.map((o) => <option key={o.owner_id} value={o.owner_id}>{o.owner_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={filters.category_id} onChange={(e) => update('category_id', e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Department</label>
            <select className="input" value={filters.department_id} onChange={(e) => update('department_id', e.target.value)}>
              <option value="">All departments</option>
              {departments.map((d) => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={filters.status} onChange={(e) => update('status', e.target.value)}>
              <option value="">All statuses</option>
              {['Active', 'Due Soon', 'Overdue', 'Expired', 'Pending'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Renewal Frequency</label>
            <select className="input" value={filters.renewal_frequency} onChange={(e) => update('renewal_frequency', e.target.value)}>
              <option value="">All frequencies</option>
              {['Monthly','Quarterly','Half-Yearly','Yearly','Bi-Yearly','One-Time'].map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Next Renewal From</label>
            <input type="date" className="input" value={filters.date_from} onChange={(e) => update('date_from', e.target.value)} />
          </div>
          <div>
            <label className="label">Next Renewal To</label>
            <input type="date" className="input" value={filters.date_to} onChange={(e) => update('date_to', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 justify-end">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                className="accent-brand-600 w-4 h-4"
                checked={filters.overdue_only}
                onChange={(e) => update('overdue_only', e.target.checked)}
              />
              Overdue only
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                className="accent-brand-600 w-4 h-4"
                checked={filters.due_soon_only}
                onChange={(e) => update('due_soon_only', e.target.checked)}
              />
              Due soon only
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
