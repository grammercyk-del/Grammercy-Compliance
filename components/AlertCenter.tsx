'use client';

import { Alert } from '@/types/database';
import { format } from 'date-fns';
import { X, CheckCircle, AlertCircle, AlertTriangle, AlertOctagon } from 'lucide-react';

interface Props {
  alerts: Alert[];
  onClose: () => void;
  onAcknowledge: (id: string) => Promise<void>;
}

export default function AlertCenter({ alerts, onClose, onAcknowledge }: Props) {
  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'urgent':
        return <AlertOctagon className="w-5 h-5 text-orange-600" />;
      case 'critical':
        return <AlertOctagon className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'info':
        return 'border-blue-200 bg-blue-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'urgent':
        return 'border-orange-200 bg-orange-50';
      case 'critical':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await onAcknowledge(id);
    } catch (error) {
      alert('Failed to acknowledge alert');
    }
  };

  const unacknowledged = alerts.filter(a => !a.acknowledged);
  const acknowledged = alerts.filter(a => a.acknowledged);

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Alert Center</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Unacknowledged Alerts */}
        {unacknowledged.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
              Active Alerts ({unacknowledged.length})
            </h3>
            <div className="space-y-3">
              {unacknowledged.map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${getAlertColor(alert.alert_level)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getAlertIcon(alert.alert_level)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {alert.alert_message}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {format(new Date(alert.created_at), 'MMM dd, yyyy • h:mm a')}
                      </p>
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="mt-3 text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark as Acknowledged
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acknowledged Alerts */}
        {acknowledged.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
              Acknowledged ({acknowledged.length})
            </h3>
            <div className="space-y-3">
              {acknowledged.map((alert) => (
                <div
                  key={alert.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50 opacity-60"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 line-through">
                        {alert.alert_message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Acknowledged on {alert.acknowledged_at && format(new Date(alert.acknowledged_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {alerts.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">All Clear!</p>
            <p className="text-sm text-gray-500 mt-1">No alerts at this time</p>
          </div>
        )}
      </div>
    </div>
  );
}
