'use client';

import { useState } from 'react';
import { Compliance } from '@/types/database';
import { format } from 'date-fns';
import { Pencil, Trash2, ExternalLink } from 'lucide-react';

interface Props {
  compliances: Compliance[];
  canEdit: boolean;
  onUpdate: (id: string, data: any) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
}

export default function ComplianceTable({ compliances, canEdit, onUpdate, onDelete }: Props) {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      compliant: 'badge-compliant',
      due_60: 'badge-due-60',
      due_30: 'badge-due-30',
      due_7: 'badge-due-7',
      expired: 'badge-expired',
      pending: 'badge-pending',
    };
    
    const labels: Record<string, string> = {
      compliant: 'Compliant',
      due_60: 'Due 60d',
      due_30: 'Due 30d',
      due_7: 'Due 7d',
      expired: 'Expired',
      pending: 'Pending',
    };

    return (
      <span className={`badge ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const filteredCompliances = compliances
    .filter(c => {
      if (filter === 'all') return true;
      return c.status === filter;
    })
    .filter(c => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        c.particulars.toLowerCase().includes(searchLower) ||
        c.department.toLowerCase().includes(searchLower) ||
        c.compliance_category.toLowerCase().includes(searchLower)
      );
    });

  const handleDelete = async (id: string, particulars: string) => {
    if (confirm(`Are you sure you want to delete: ${particulars}?`)) {
      try {
        await onDelete(id);
      } catch (error) {
        alert('Failed to delete compliance');
      }
    }
  };

  return (
    <div className="card">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search compliances..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        />
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        >
          <option value="all">All Status</option>
          <option value="compliant">Compliant</option>
          <option value="due_60">Due in 60 Days</option>
          <option value="due_30">Due in 30 Days</option>
          <option value="due_7">Due in 7 Days</option>
          <option value="expired">Expired</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Department
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Particulars
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Frequency
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Remarks
              </th>
              {canEdit && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCompliances.map((compliance) => (
              <tr key={compliance.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-4 whitespace-nowrap">
                  {getStatusBadge(compliance.status)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {compliance.department}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {compliance.compliance_category}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {compliance.particulars}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                  {compliance.frequency}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(compliance.due_date), 'MMM dd, yyyy')}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {compliance.remarks || '-'}
                </td>
                {canEdit && (
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(compliance.id, compliance.particulars)}
                        className="p-1 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCompliances.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No compliances found</p>
            <p className="text-sm mt-1">
              {search || filter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Add your first compliance to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
        Showing {filteredCompliances.length} of {compliances.length} compliances
      </div>
    </div>
  );
}
