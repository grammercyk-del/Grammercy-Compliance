import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Tag } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Modal } from '@/components/common/Modal'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { TableSkeleton } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { ToastContainer } from '@/components/common/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import { fetchActiveCategories, createCategory, updateCategory, deleteCategory } from '@/api/lookups'
import type { Category } from '@/types'

const BLANK = { category_name: '', description: '' }

export function CategoriesPage() {
  const { isEditor } = useAuth()
  const { toasts, push, dismiss } = useToast()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    try {
      setError(null)
      const data = await fetchActiveCategories()
      setCategories(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories')
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

  const openEdit = (cat: Category) => {
    setEditTarget(cat)
    setForm({ category_name: cat.category_name, description: cat.description ?? '' })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        category_name: form.category_name.trim(),
        description: form.description.trim() || undefined,
      }
      if (editTarget) {
        await updateCategory(editTarget.category_id, payload)
        push('Category updated successfully', 'success')
      } else {
        await createCategory(payload)
        push('Category created successfully', 'success')
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
      await deleteCategory(deleteTarget.category_id)
      push(`"${deleteTarget.category_name}" deactivated`, 'success')
      setDeleteTarget(null)
      load()
    } catch (err) {
      push(err instanceof Error ? err.message : 'Delete failed', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = categories.filter((c) =>
    c.category_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <AppShell title="Categories">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Categories Management</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {categories.length} active categor{categories.length !== 1 ? 'ies' : 'y'}
            </p>
          </div>
          {isEditor && (
            <button className="btn-primary gap-2 text-sm" onClick={openAdd}>
              <Plus size={15} /> Add Category
            </button>
          )}
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Search categories…"
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
                  <th className="table-th">Category Name</th>
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
                        title={search ? 'No categories match your search' : 'No categories yet'}
                        description={search ? 'Try a different search term.' : 'Add your first category to get started.'}
                        icon={<Tag size={24} className="text-slate-300" />}
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((cat) => (
                    <tr key={cat.category_id} className="table-tr">
                      <td className="table-td font-medium text-slate-800 dark:text-white">
                        {cat.category_name}
                      </td>
                      <td className="table-td text-slate-500 dark:text-slate-400">
                        {cat.description ?? <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      {isEditor && (
                        <td className="table-td">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(cat)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(cat)}
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
        title={editTarget ? 'Edit Category' : 'Add Category'}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowForm(false)} disabled={saving}>Cancel</button>
            <button form="category-form" type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editTarget ? 'Save changes' : 'Create category'}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Category Name *</label>
            <input
              className="input"
              required
              placeholder="e.g. MoEF & CC / MPCB"
              value={form.category_name}
              onChange={(e) => setForm((f) => ({ ...f, category_name: e.target.value }))}
              disabled={saving}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Brief description of this category…"
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
        title="Deactivate Category"
        message={`Are you sure you want to deactivate "${deleteTarget?.category_name}"? It will no longer appear in new compliance forms.`}
        confirmLabel="Deactivate"
        loading={deleting}
      />

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </AppShell>
  )
}
