import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface StatCardProps {
  label: string
  value: number | string
  subtext?: string
  icon: ReactNode
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'slate'
  loading?: boolean
}

const colorMap = {
  green:  { icon: 'bg-green-100  dark:bg-green-900/30  text-green-600  dark:text-green-400', value: 'text-green-700  dark:text-green-300' },
  yellow: { icon: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400', value: 'text-yellow-700 dark:text-yellow-300' },
  red:    { icon: 'bg-red-100    dark:bg-red-900/30    text-red-600    dark:text-red-400',    value: 'text-red-700    dark:text-red-300' },
  blue:   { icon: 'bg-blue-100   dark:bg-blue-900/30   text-blue-600   dark:text-blue-400',   value: 'text-blue-700   dark:text-blue-300' },
  slate:  { icon: 'bg-slate-100  dark:bg-slate-700     text-slate-600  dark:text-slate-300',  value: 'text-slate-700  dark:text-slate-200' },
}

export function StatCard({ label, value, subtext, icon, color = 'slate', loading }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', c.icon)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
        {loading ? (
          <div className="h-7 w-16 mt-1 rounded bg-slate-200 dark:bg-slate-700 animate-skeleton" />
        ) : (
          <p className={cn('text-2xl font-bold leading-tight mt-0.5', c.value)}>{value}</p>
        )}
        {subtext && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtext}</p>}
      </div>
    </div>
  )
}
