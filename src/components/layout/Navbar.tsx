import { Sun, Moon, LogOut, User } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { signOut } from '@/api/auth'
import { cn } from '@/utils/cn'

interface NavbarProps {
  title?: string
}

export function Navbar({ title }: NavbarProps) {
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()

  const handleSignOut = async () => {
    try { await signOut() } catch { /* ignore */ }
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark-50 sticky top-0 z-10">
      {/* Page title */}
      <h1 className="text-base font-semibold text-slate-800 dark:text-white">
        {title ?? 'Gramercy Dashboard'}
      </h1>

      <div className="flex items-center gap-2">
        {/* KIPL badge */}
        <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1">
          KIPL
        </span>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'p-2 rounded-lg text-slate-500 dark:text-slate-400',
            'hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors',
          )}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* User info */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <User size={13} className="text-brand-600 dark:text-brand-400" />
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-tight">
                  {user.email.split('@')[0]}
                </p>
                <p className="text-[10px] text-slate-400 capitalize leading-tight">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
