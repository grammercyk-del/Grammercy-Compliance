'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { ComplianceFormData } from '@/types/database';

interface Props {
  onClose: () => void;
  onAdd: (data: ComplianceFormData) => Promise<any>;
}

export default function AddComplianceModal({ onClose, onAdd }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ComplianceFormData>({
    department: '',
    compliance_category: '',
    particulars: '',
    frequency: 'Yearly',
    due_date: '',
    scope_applicable: true,
    remarks: '',
  });

  const departments = [
    'Fire',
    'Environmental',
    'Structural',
    'Electrical',
    'PESO',
    'MPCB',
    'Safety',
    'Legal',
    'HR',
  ];

  const frequencies: ComplianceFormData['frequency'][] = [
    'Monthly',
    'Quarterly',
    'Half-yearly',
    'Yearly',
    'One-time',
    'As required',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onAdd(formData);
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to add compliance');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add New Compliance</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department *
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compliance Category *
            </label>
            <input
              type="text"
              name="compliance_category"
              value={formData.compliance_category}
              onChange={handleChange}
              placeholder="e.g., Fire Safety, License Renewal"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Particulars */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Particulars *
            </label>
            <input
              type="text"
              name="particulars"
              value={formData.particulars}
              onChange={handleChange}
              placeholder="Detailed description of the compliance requirement"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Frequency & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency *
              </label>
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                {frequencies.map(freq => (
                  <option key={freq} value={freq}>{freq}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Scope Applicable */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="scope_applicable"
              name="scope_applicable"
              checked={formData.scope_applicable}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="scope_applicable" className="ml-2 text-sm text-gray-700">
              Scope Applicable
            </label>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows={3}
              placeholder="Additional notes or comments"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Compliance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
