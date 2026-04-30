import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, RefreshCw, CloudOff, Cloud, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import offlineSync from '@/lib/offlineSync'

export default function NetworkStatus() {
  const [state, setState] = useState(offlineSync.getState())
  const [showBanner, setShowBanner] = useState(false)
  const [justSynced, setJustSynced] = useState(false)

  useEffect(() => {
    const unsub = offlineSync.subscribe((newState) => {
      setState(newState)
      if (!newState.isOnline) setShowBanner(true)
      if (newState.isOnline && newState.pendingCount === 0 && !newState.isSyncing) {
        // Show "synced" for 3s then hide
        setJustSynced(true)
        setTimeout(() => { setJustSynced(false); setShowBanner(false) }, 3000)
      }
    })
    return unsub
  }, [])

  // Don't render if everything is fine
  if (state.isOnline && !showBanner && !state.isSyncing && state.pendingCount === 0) return null

  return (
    <AnimatePresence>
      {(showBanner || !state.isOnline || state.isSyncing || state.pendingCount > 0) && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999]"
        >
          <div className={cn(
            'flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-bold shadow-lg transition-colors',
            !state.isOnline
              ? 'bg-red-600 text-white'
              : state.isSyncing
                ? 'bg-amber-500 text-white'
                : justSynced
                  ? 'bg-green-500 text-white'
                  : state.pendingCount > 0
                    ? 'bg-amber-500 text-white'
                    : 'bg-green-500 text-white'
          )}>
            {!state.isOnline ? (
              <>
                <WifiOff className="w-4 h-4" />
                <span>You're offline — changes will be saved locally and synced when reconnected</span>
                {state.pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-black">
                    {state.pendingCount} pending
                  </span>
                )}
              </>
            ) : state.isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Syncing {state.pendingCount} queued request(s) to server...</span>
              </>
            ) : justSynced ? (
              <>
                <Check className="w-4 h-4" />
                <span>All data synced successfully!</span>
              </>
            ) : state.pendingCount > 0 ? (
              <>
                <CloudOff className="w-4 h-4" />
                <span>{state.pendingCount} request(s) pending sync</span>
                <button onClick={() => offlineSync.flush()}
                  className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-black transition">
                  Sync Now
                </button>
              </>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
