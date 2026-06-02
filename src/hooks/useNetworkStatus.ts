import { useState, useEffect } from 'react'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [justReconnected, setJustReconnected] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setJustReconnected(true)
    }
    const handleOffline = () => {
      setIsOnline(false)
      setJustReconnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-dismiss the "back online" notice after 3 seconds
  useEffect(() => {
    if (!justReconnected) return
    const id = setTimeout(() => setJustReconnected(false), 3_000)
    return () => clearTimeout(id)
  }, [justReconnected])

  return { isOnline, justReconnected }
}
