import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon } from 'lucide-react'

export function SettingsPage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <AppShell title="Settings">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Section */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">Profile</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Email</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Role</p>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 capitalize">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">Display</h3>
          <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Dark Mode</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {theme === 'dark' ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">About</h3>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Gramercy Dashboard</strong> v1.0.0 — Compliance Management System by KIPL
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            Built with React, Vite, Supabase, and Tailwind CSS
          </p>
        </div>
      </div>
    </AppShell>
  )
}
