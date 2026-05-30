import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Building2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Modal } from '@/components/common/Modal'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { TableSkeleton } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { ToastContainer } from '@/components/common/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import { fetchActiveDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/api/lookups'
import type { Department } from '@/types'

const BLANK = { department_name: '', description: '' }

export function DepartmentsPage() {
  const { isEditor } = useAuth()
  const { toasts, push, dismiss } = useToast()

  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Department | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    try {
      setError(null)
      const data = await fetchActiveDepartments()
      setDepartments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditTarget(null)
    setForm(BLANK)
    setShowForm(true)
  }

  const openEdit = (dept: Department) => {
    setEditTarget(dept)
    setForm({ department_name: dept.department_name, description: dept.description ?? '' })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        department_name: form.department_name.trim(),
        description: form.description.trim() || undefined,
      }
      if (editTarget) {
        await updateDepartment(editTarget.department_id, payload)
        push('Department updated successfully', 'success')
      } else {
        await createDepartment(payload)
        push('Department created successfully', 'success')
      }
      setShowForm(false)
      load()
    } catch (err) {
      push(err instanceof Error ? err.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteDepartment(deleteTarget.department_id)
      push(`"${deleteTarget.department_name}" deactivated`, 'success')
      setDeleteTarget(null)
      load()
    } catch (err) {
      push(err instanceof Error ? err.message : 'Delete failed', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = departments.filter((d) =>
    d.department_name.toLowerCase().includes(search.toLowerCase()) ||
    (d.description ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <AppShell title="Departments">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Departments Management</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {departments.length} active department{departments.length !== 1 ? 's' : ''}
            </p>
          </div>
          {isEditor && (
            <button className="btn-primary gap-2 text-sm" onClick={openAdd}>
              <Plus size={15} /> Add Department
            </button>
          )}
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Search departments…"
          className="input max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Table */}
        {error ? (
          <ErrorMessage message={error} onRetry={load} />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Department Name</th>
                  <th className="table-th">Description</th>
                  {isEditor && <th className="table-th w-24">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isEditor ? 3 : 2}>
                      <TableSkeleton rows={5} />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isEditor ? 3 : 2}>
                      <EmptyState
                        title={search ? 'No departments match your search' : 'No departments yet'}
                        description={search ? 'Try a different search term.' : 'Add your first department to get started.'}
                        icon={<Building2 size={24} className="text-slate-300" />}
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((dept) => (
                    <tr key={dept.department_id} className="table-tr">
                      <td className="table-td font-medium text-slate-800 dark:text-white">
                        {dept.department_name}
                      </td>
                      <td className="table-td text-slate-500 dark:text-slate-400">
                        {dept.description ?? <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      {isEditor && (
                        <td className="table-td">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(dept)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(dept)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Deactivate"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editTarget ? 'Edit Department' : 'Add Department'}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowForm(false)} disabled={saving}>Cancel</button>
            <button form="department-form" type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editTarget ? 'Save changes' : 'Create department'}
            </button>
          </>
        }
      >
        <form id="department-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Department Name *</label>
            <input
              className="input"
              required
              placeholder="e.g. Infrastructure"
              value={form.department_name}
              onChange={(e) => setForm((f) => ({ ...f, department_name: e.target.value }))}
              disabled={saving}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Brief description of this department…"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              disabled={saving}
            />
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Deactivate Department"
        message={`Are you sure you want to deactivate "${deleteTarget?.department_name}"? It will no longer appear in new compliance forms.`}
        confirmLabel="Deactivate"
        loading={deleting}
      />

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </AppShell>
  )
}
