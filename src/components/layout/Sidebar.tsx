import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ShieldCheck, Bell, BarChart3,
  ScrollText, Users, Tag, Building2, FileSpreadsheet,
  Settings, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useState } from 'react'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
}

const NAV: NavItem[] = [
  { label: 'Dashboard',    path: '/',              icon: <LayoutDashboard size={18} /> },
  { label: 'Compliances',  path: '/compliances',   icon: <ShieldCheck size={18} /> },
  { label: 'Alerts',       path: '/alerts',         icon: <Bell size={18} /> },
  { label: 'Risk Analytics', path: '/risk',         icon: <BarChart3 size={18} /> },
  { label: 'Audit Logs',   path: '/audit',          icon: <ScrollText size={18} /> },
  { label: 'Owners',       path: '/owners',         icon: <Users size={18} /> },
  { label: 'Categories',   path: '/categories',     icon: <Tag size={18} /> },
  { label: 'Departments',  path: '/departments',    icon: <Building2 size={18} /> },
  { label: 'Reports',      path: '/reports',        icon: <FileSpreadsheet size={18} /> },
  { label: 'Settings',     path: '/settings',       icon: <Settings size={18} /> },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'flex flex-col h-screen sticky top-0 bg-white dark:bg-surface-dark-50',
        'border-r border-slate-200 dark:border-slate-700 transition-all duration-200 z-20',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-200 dark:border-slate-700">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <ShieldCheck size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-white leading-tight truncate">
              Gramercy
            </p>
            <p className="text-[10px] text-slate-400 leading-tight truncate">
              Compliance Dashboard
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map(({ label, path, icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              cn(
                'sidebar-link',
                isActive && 'active',
                collapsed && 'justify-center px-2',
              )
            }
            title={collapsed ? label : undefined}
          >
            <span className="flex-shrink-0">{icon}</span>
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className={cn(
          'flex items-center justify-center h-10 border-t border-slate-200 dark:border-slate-700',
          'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors',
        )}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  )
}
