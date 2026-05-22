import { useState, useEffect } from 'react'
import { Modal } from '@/components/common/Modal'
import { createCompliance, updateCompliance } from '@/api/compliances'
import { normalizeDate, toInputDate } from '@/utils/date'
import type { ComplianceRow, CreateCompliancePayload, Owner, Category, Department, RenewalFrequency } from '@/types'

interface ComplianceFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
  owners: Owner[]
  categories: Category[]
  departments: Department[]
  editRow?: ComplianceRow | null
}

const FREQUENCIES: RenewalFrequency[] = [
  'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'Bi-Yearly', 'One-Time',
]

const BLANK = {
  certificate_name: '',
  category_id: '',
  department_id: '',
  owner_id: '',
  renewal_frequency: '' as RenewalFrequency | '',
  last_renewed_date: '',
  next_renewal_date: '',
  notes: '',
}

export function ComplianceFormModal({
  open, onClose, onSuccess, onError, owners, categories, departments, editRow,
}: ComplianceFormModalProps) {
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (editRow) {
        setForm({
          certificate_name:  editRow.certificate_name,
          category_id:       editRow.category_id,
          department_id:     editRow.department_id,
          owner_id:          editRow.owner_id,
          renewal_frequency: editRow.renewal_frequency,
          last_renewed_date: toInputDate(editRow.last_renewed_date),
          next_renewal_date: toInputDate(editRow.next_renewal_date),
          notes:             editRow.notes ?? '',
        })
      } else {
        setForm(BLANK)
      }
    }
  }, [open, editRow])

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.renewal_frequency) { onError('Please select a renewal frequency'); return }

    setSaving(true)
    try {
      const payload: CreateCompliancePayload = {
        certificate_name:  form.certificate_name.trim(),
        category_id:       form.category_id,
        department_id:     form.department_id,
        owner_id:          form.owner_id,
        renewal_frequency: form.renewal_frequency as RenewalFrequency,
        last_renewed_date: normalizeDate(form.last_renewed_date),
        next_renewal_date: normalizeDate(form.next_renewal_date),
        notes:             form.notes.trim() || null,
      }

      if (editRow) {
        await updateCompliance(editRow.compliance_id, payload)
        onSuccess('Compliance updated successfully')
      } else {
        await createCompliance(payload)
        onSuccess('Compliance created successfully')
      }
      onClose()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editRow ? 'Edit Compliance' : 'New Compliance'}
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button form="compliance-form" type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editRow ? 'Save changes' : 'Create compliance'}
          </button>
        </>
      }
    >
      <form id="compliance-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Certificate Name */}
        <div className="sm:col-span-2">
          <label className="label">Certificate Name *</label>
          <input
            className="input"
            required
            placeholder="e.g. Fire NOC — Block A"
            value={form.certificate_name}
            onChange={(e) => update('certificate_name', e.target.value)}
          />
        </div>

        {/* Owner */}
        <div>
          <label className="label">Owner *</label>
          <select className="input" required value={form.owner_id} onChange={(e) => update('owner_id', e.target.value)}>
            <option value="">Select owner</option>
            {owners.map((o) => <option key={o.owner_id} value={o.owner_id}>{o.owner_name}</option>)}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="label">Category *</label>
          <select className="input" required value={form.category_id} onChange={(e) => update('category_id', e.target.value)}>
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
          </select>
        </div>

        {/* Department */}
        <div>
          <label className="label">Department *</label>
          <select className="input" required value={form.department_id} onChange={(e) => update('department_id', e.target.value)}>
            <option value="">Select department</option>
            {departments.map((d) => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
          </select>
        </div>

        {/* Renewal Frequency */}
        <div>
          <label className="label">Renewal Frequency *</label>
          <select className="input" required value={form.renewal_frequency} onChange={(e) => update('renewal_frequency', e.target.value)}>
            <option value="">Select frequency</option>
            {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        {/* Last Renewed */}
        <div>
          <label className="label">Last Renewed Date</label>
          <input type="date" className="input" value={form.last_renewed_date} onChange={(e) => update('last_renewed_date', e.target.value)} />
        </div>

        {/* Next Renewal */}
        <div>
          <label className="label">Next Renewal Date</label>
          <input type="date" className="input" value={form.next_renewal_date} onChange={(e) => update('next_renewal_date', e.target.value)} />
        </div>

        {/* Notes */}
        <div className="sm:col-span-2">
          <label className="label">Notes</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Any additional notes…"
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
          />
        </div>
      </form>
    </Modal>
  )
}
