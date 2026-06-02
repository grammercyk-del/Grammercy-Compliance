import { WifiOff, Wifi } from 'lucide-react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

export function OfflineBanner() {
  const { isOnline, justReconnected } = useNetworkStatus()

  if (isOnline && !justReconnected) return null

  if (justReconnected) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium animate-slide-in">
        <Wifi size={15} />
        Connection restored — you are back online.
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium">
      <WifiOff size={15} className="flex-shrink-0" />
      You are offline. Changes cannot be saved until your connection is restored.
    </div>
  )
}
