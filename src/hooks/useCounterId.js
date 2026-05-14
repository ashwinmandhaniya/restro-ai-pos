import { useMemo } from 'react'

/**
 * Returns the counter ID from the current URL query string (?counter=C-XXXX).
 * Used by POS pages to associate orders with a specific billing counter.
 */
export default function useCounterId() {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('counter') || null
  }, [])
}
