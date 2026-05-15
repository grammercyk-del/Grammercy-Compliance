'use client';

import { Compliance } from '@/types/database';
import { CheckCircle, Clock, AlertTriangle, XCircle, FileText, AlertOctagon } from 'lucide-react';

interface Props {
  compliances: Compliance[];
}

export default function DashboardStats({ compliances }: Props) {
  const stats = {
    total: compliances.length,
    compliant: compliances.filter(c => c.status === 'compliant').length,
    due_60: compliances.filter(c => c.status === 'due_60').length,
    due_30: compliances.filter(c => c.status === 'due_30').length,
    due_7: compliances.filter(c => c.status === 'due_7').length,
    expired: compliances.filter(c => c.status === 'expired').length,
    pending: compliances.filter(c => c.status === 'pending').length,
  };

  const cards = [
    {
      label: 'Total Compliances',
      value: stats.total,
      icon: FileText,
      color: 'text-gray-600',
      bg: 'bg-gray-100',
    },
    {
      label: 'Compliant',
      value: stats.compliant,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Due in 60 Days',
      value: stats.due_60,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
    {
      label: 'Due in 30 Days',
      value: stats.due_30,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
    {
      label: 'Due in 7 Days',
      value: stats.due_7,
      icon: AlertOctagon,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
    {
      label: 'Expired',
      value: stats.expired,
      icon: XCircle,
      color: 'text-red-800',
      bg: 'bg-red-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            </div>
            <div className={`${card.bg} p-3 rounded-full`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
