import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ShieldCheck, Bell, BarChart3,
  ScrollText, Users, Tag, Building2, FileSpreadsheet,
  Settings, ChevronLeft, ChevronRight, X,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useState } from 'react'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
}

const NAV: NavItem[] = [
  { label: 'Dashboard',     path: '/',            icon: <LayoutDashboard size={18} /> },
  { label: 'Compliances',   path: '/compliances', icon: <ShieldCheck size={18} /> },
  { label: 'Alerts',        path: '/alerts',       icon: <Bell size={18} /> },
  { label: 'Risk Analytics',path: '/risk',         icon: <BarChart3 size={18} /> },
  { label: 'Audit Logs',    path: '/audit',        icon: <ScrollText size={18} /> },
  { label: 'Owners',        path: '/owners',       icon: <Users size={18} /> },
  { label: 'Categories',    path: '/categories',   icon: <Tag size={18} /> },
  { label: 'Departments',   path: '/departments',  icon: <Building2 size={18} /> },
  { label: 'Reports',       path: '/reports',      icon: <FileSpreadsheet size={18} /> },
  { label: 'Settings',      path: '/settings',     icon: <Settings size={18} /> },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside
        className={cn(
          'hidden md:flex flex-col h-screen sticky top-0',
          'bg-white dark:bg-surface-dark-50',
          'border-r border-slate-200 dark:border-slate-700',
          'transition-all duration-200 z-20',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onLinkClick={() => {}}
          collapseToggle={
            <button
              onClick={() => setCollapsed(c => !c)}
              className="flex items-center justify-center h-10 border-t border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          }
        />
      </aside>

      {/* ── Mobile drawer ───────────────────────────────────── */}
      <aside
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-40 w-72',
          'flex flex-col',
          'bg-white dark:bg-surface-dark-50',
          'border-r border-slate-200 dark:border-slate-700',
          'transition-transform duration-200 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarContent
          collapsed={false}
          onLinkClick={onClose}
          collapseToggle={
            <button
              onClick={onClose}
              className="flex items-center justify-center h-10 border-t border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          }
        />
      </aside>
    </>
  )
}

interface SidebarContentProps {
  collapsed: boolean
  onLinkClick: () => void
  collapseToggle: React.ReactNode
}

function SidebarContent({ collapsed, onLinkClick, collapseToggle }: SidebarContentProps) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <ShieldCheck size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-white leading-tight truncate">
              Grammercy
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
            onClick={onLinkClick}
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

      {collapseToggle}
    </>
  )
}
