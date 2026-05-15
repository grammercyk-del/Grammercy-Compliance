'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCompliances, useAlerts, useUserProfile } from '@/hooks/useRealtime';
import DashboardStats from '@/components/DashboardStats';
import ComplianceTable from '@/components/ComplianceTable';
import AlertCenter from '@/components/AlertCenter';
import AddComplianceModal from '@/components/AddComplianceModal';
import { LogOut, Plus, Bell } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { profile, loading: profileLoading, canEdit, isKIPL } = useUserProfile();
  const { compliances, loading: compliancesLoading, addCompliance, updateCompliance, deleteCompliance } = useCompliances();
  const { alerts, unacknowledgedCount, acknowledgeAlert } = useAlerts();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/');
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (profileLoading || compliancesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            Your account is not set up yet. Please contact KIPL admin to create your user profile.
          </p>
          <button onClick={handleLogout} className="btn-secondary">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                KIPL Compliance Portal
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {profile.organization} • {profile.role.replace('_', ' ').toUpperCase()}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Alert Bell */}
              <button
                onClick={() => setShowAlerts(!showAlerts)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unacknowledgedCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unacknowledgedCount}
                  </span>
                )}
              </button>

              {/* User Info */}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {profile.full_name || profile.email}
                </p>
                <p className="text-xs text-gray-500">{profile.email}</p>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <DashboardStats compliances={compliances} />

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Compliance Records
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isKIPL ? 'Manage and track' : 'View-only access to'} compliance status
            </p>
          </div>

          {canEdit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Compliance
            </button>
          )}
        </div>

        {/* Live Indicator */}
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live tracking enabled • Updates in real-time</span>
        </div>

        {/* Compliance Table */}
        <ComplianceTable
          compliances={compliances}
          canEdit={canEdit}
          onUpdate={updateCompliance}
          onDelete={deleteCompliance}
        />
      </main>

      {/* Alert Sidebar */}
      {showAlerts && (
        <AlertCenter
          alerts={alerts}
          onClose={() => setShowAlerts(false)}
          onAcknowledge={acknowledgeAlert}
        />
      )}

      {/* Add Compliance Modal */}
      {showAddModal && (
        <AddComplianceModal
          onClose={() => setShowAddModal(false)}
          onAdd={addCompliance}
        />
      )}
    </div>
  );
}
