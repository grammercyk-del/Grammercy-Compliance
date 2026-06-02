import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
          <div className="max-w-md w-full text-center space-y-5">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle size={32} className="text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                Something went wrong
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                An unexpected error occurred. Refreshing the page usually fixes this.
              </p>
            </div>
            {this.state.error?.message && (
              <p className="text-xs text-slate-400 dark:text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 break-all">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors"
            >
              <RefreshCw size={14} />
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
