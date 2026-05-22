import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { Toast as ToastItem } from '@/hooks/useToast'

interface ToastContainerProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

const icons = {
  success: <CheckCircle size={16} className="text-green-500" />,
  error:   <XCircle    size={16} className="text-red-500" />,
  info:    <Info       size={16} className="text-blue-500" />,
  warning: <AlertTriangle size={16} className="text-yellow-500" />,
}

const styles = {
  success: 'border-green-200 dark:border-green-800',
  error:   'border-red-200   dark:border-red-800',
  info:    'border-blue-200  dark:border-blue-800',
  warning: 'border-yellow-200 dark:border-yellow-800',
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 p-3.5 rounded-xl shadow-card-lg',
            'bg-white dark:bg-surface-dark-50 border animate-slide-in',
            styles[t.type],
          )}
        >
          <span className="mt-0.5 flex-shrink-0">{icons[t.type]}</span>
          <p className="flex-1 text-sm text-slate-700 dark:text-slate-200">{t.message}</p>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
