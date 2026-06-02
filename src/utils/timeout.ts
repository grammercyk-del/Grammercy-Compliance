export const REQUEST_TIMEOUT_MS = 15_000

/** Creates an AbortSignal that fires after `ms` ms. Always call `clear()` in a finally block. */
export function createTimeoutSignal(ms = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  return {
    signal: controller.signal,
    clear: () => clearTimeout(id),
  }
}

/** Converts any thrown value to a user-readable Error, with a specific message for timeouts. */
export function toApiError(e: unknown, fallback: string): Error {
  if (e instanceof DOMException && e.name === 'AbortError') {
    return new Error('Request timed out. Please check your connection and try again.')
  }
  if (e instanceof Error) return e
  return new Error(fallback)
}
