import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function Pagination({ page, pageSize, total, onChange, onPageSizeChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-1">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Rows per page:</span>
        <select
          className="input w-16 py-1 text-xs"
          value={pageSize}
          onChange={(e) => { onPageSizeChange(Number(e.target.value)); onChange(1) }}
        >
          {[10, 20, 50, 100].map((n) => <option key={n}>{n}</option>)}
        </select>
        <span>
          {total === 0 ? '0 results' : `${start}–${end} of ${total}`}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          className="btn-secondary p-1.5"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft size={15} />
        </button>

        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          let p: number
          if (totalPages <= 7) { p = i + 1 }
          else if (page <= 4) { p = i + 1 }
          else if (page >= totalPages - 3) { p = totalPages - 6 + i }
          else { p = page - 3 + i }

          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={cn(
                'w-8 h-8 text-xs rounded-lg font-medium transition-colors',
                p === page
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700',
              )}
            >
              {p}
            </button>
          )
        })}

        <button
          className="btn-secondary p-1.5"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}
