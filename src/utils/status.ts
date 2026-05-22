import type { ComplianceStatus } from '@/types'

export function statusBadgeClass(status: ComplianceStatus): string {
  switch (status) {
    case 'Active':    return 'badge-green'
    case 'Due Soon':  return 'badge-yellow'
    case 'Overdue':   return 'badge-red'
    case 'Expired':   return 'badge-red'
    case 'Pending':   return 'badge-gray'
    default:          return 'badge-gray'
  }
}

export function daysLabel(days: number | null): string {
  if (days === null) return '—'
  if (days < 0)  return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Due today'
  return `${days}d left`
}

export function daysColor(days: number | null): string {
  if (days === null) return 'text-slate-400'
  if (days < 0)  return 'text-red-600 dark:text-red-400 font-medium'
  if (days <= 30) return 'text-yellow-600 dark:text-yellow-400 font-medium'
  return 'text-green-600 dark:text-green-400'
}
