import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Users } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Modal } from '@/components/common/Modal'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { TableSkeleton } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { ToastContainer } from '@/components/common/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import { fetchActiveOwners, createOwner, updateOwner, deleteOwner } from '@/api/lookups'
import type { Owner } from '@/types'

const BLANK = { owner_name: '', email: '', department: '' }

export function OwnersPage() {
  const { isEditor } = useAuth()
  const { toasts, push, dismiss } = useToast()

  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Owner | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Owner | null>(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    try {
      setError(null)
      const data = await fetchActiveOwners()
      setOwners(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load owners')
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

  const openEdit = (owner: Owner) => {
    setEditTarget(owner)
    setForm({ owner_name: owner.owner_name, email: owner.email ?? '', department: owner.department ?? '' })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        owner_name: form.owner_name.trim(),
        email: form.email.trim() || undefined,
        department: form.department.trim() || undefined,
      }
      if (editTarget) {
        await updateOwner(editTarget.owner_id, payload)
        push('Owner updated successfully', 'success')
      } else {
        await createOwner(payload)
        push('Owner created successfully', 'success')
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
      await deleteOwner(deleteTarget.owner_id)
      push(`"${deleteTarget.owner_name}" deactivated`, 'success')
      setDeleteTarget(null)
      load()
    } catch (err) {
      push(err instanceof Error ? err.message : 'Delete failed', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = owners.filter((o) =>
    o.owner_name.toLowerCase().includes(search.toLowerCase()) ||
    (o.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (o.department ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <AppShell title="Owners">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Owners Management</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {owners.length} active owner{owners.length !== 1 ? 's' : ''}
            </p>
          </div>
          {isEditor && (
            <button className="btn-primary gap-2 text-sm" onClick={openAdd}>
              <Plus size={15} /> Add Owner
            </button>
          )}
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Search owners by name, email, or department…"
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
                  <th className="table-th">Name</th>
                  <th className="table-th">Email</th>
                  <th className="table-th">Department</th>
                  {isEditor && <th className="table-th w-24">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isEditor ? 4 : 3}>
                      <TableSkeleton rows={5} />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isEditor ? 4 : 3}>
                      <EmptyState
                        title={search ? 'No owners match your search' : 'No owners yet'}
                        description={search ? 'Try a different search term.' : 'Add your first owner to get started.'}
                        icon={<Users size={24} className="text-slate-300" />}
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((owner) => (
                    <tr key={owner.owner_id} className="table-tr">
                      <td className="table-td font-medium text-slate-800 dark:text-white">
                        {owner.owner_name}
                      </td>
                      <td className="table-td text-slate-500 dark:text-slate-400">
                        {owner.email ?? <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="table-td">
                        {owner.department ? (
                          <span className="badge-gray">{owner.department}</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      {isEditor && (
                        <td className="table-td">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(owner)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(owner)}
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
        title={editTarget ? 'Edit Owner' : 'Add Owner'}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowForm(false)} disabled={saving}>Cancel</button>
            <button form="owner-form" type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editTarget ? 'Save changes' : 'Create owner'}
            </button>
          </>
        }
      >
        <form id="owner-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Owner Name *</label>
            <input
              className="input"
              required
              placeholder="e.g. Ankit Devadiga"
              value={form.owner_name}
              onChange={(e) => setForm((f) => ({ ...f, owner_name: e.target.value }))}
              disabled={saving}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="owner@company.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              disabled={saving}
            />
          </div>
          <div>
            <label className="label">Department</label>
            <input
              className="input"
              placeholder="e.g. Environmental"
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
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
        title="Deactivate Owner"
        message={`Are you sure you want to deactivate "${deleteTarget?.owner_name}"? They will no longer appear in new compliance forms.`}
        confirmLabel="Deactivate"
        loading={deleting}
      />

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </AppShell>
  )
}
