import { format, parseISO, isValid } from 'date-fns'

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const d = parseISO(dateStr)
    return isValid(d) ? format(d, 'dd MMM yyyy') : '—'
  } catch {
    return '—'
  }
}

export function toInputDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    const d = parseISO(dateStr)
    return isValid(d) ? format(d, 'yyyy-MM-dd') : ''
  } catch {
    return ''
  }
}

export function normalizeDate(value: string): string | null {
  if (!value) return null
  try {
    const d = parseISO(value)
    return isValid(d) ? format(d, 'yyyy-MM-dd') : null
  } catch {
    return null
  }
}
