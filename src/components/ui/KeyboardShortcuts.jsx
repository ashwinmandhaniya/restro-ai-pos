import { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Keyboard, Search } from 'lucide-react'
import useKeyboardStore, { parseKeys, matchEvent } from '@/store/keyboardStore'
import useUIStore from '@/store/uiStore'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────────────────
   GLOBAL KEYBOARD LISTENER
   
   Mounted once in AppLayout. Reads state directly from
   stores (not via React hooks) to avoid stale closures.
───────────────────────────────────────────────────────── */
export default function KeyboardShortcuts() {
  const navigate = useNavigate()
  const showHelp = useKeyboardStore(s => s.showHelp)
  const setShowHelp = useKeyboardStore(s => s.setShowHelp)

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Read directly from store to always get the latest state
      const { enabled, getShortcuts, toggleHelp } = useKeyboardStore.getState()
      if (!enabled) return

      // Don't fire shortcuts when typing in inputs (unless modifier combo)
      const tag = event.target.tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target.isContentEditable
      if (isInput && !event.ctrlKey && !event.altKey && !event.metaKey) return

      const shortcuts = getShortcuts()

      for (const sc of shortcuts) {
        const parsed = parseKeys(sc.keys)
        if (!matchEvent(event, parsed)) continue

        // Prevent default browser behavior
        event.preventDefault()
        event.stopPropagation()

        // Read UI store actions fresh each time
        const uiStore = useUIStore.getState()

        // Dispatch action
        switch (sc.action) {
          case 'navigate':
            navigate(sc.target)
            uiStore.addNotification({ type: 'info', title: '⌨️ Navigating', message: sc.label })
            break

          case 'toggle':
            if (sc.target === 'sidebar') uiStore.toggleSidebarCollapse()
            else if (sc.target === 'darkMode') uiStore.toggleDarkMode()
            else if (sc.target === 'fullscreen') {
              if (!document.fullscreenElement) document.documentElement.requestFullscreen?.()
              else document.exitFullscreen?.()
            }
            else if (sc.target === 'shortcutHelp') toggleHelp()
            else if (sc.target === 'voiceBilling') uiStore.toggleVoiceBilling()
            else if (sc.target === 'aiCopilot') uiStore.toggleCopilot()
            break

          case 'function':
            window.dispatchEvent(new CustomEvent('pos-shortcut', { detail: { action: sc.target } }))
            uiStore.addNotification({ type: 'info', title: '⌨️ Action', message: sc.label })
            break
        }

        return // Only fire first match
      }
    }

    window.addEventListener('keydown', handleKeyDown, true) // use capture phase
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [navigate]) // navigate is the only React dependency we need

  return <ShortcutHelpOverlay isOpen={showHelp} onClose={() => setShowHelp(false)} />
}

/* ─────────────────────────────────────────────────────────
   HELP OVERLAY — Press Shift+/ to show
───────────────────────────────────────────────────────── */
function ShortcutHelpOverlay({ isOpen, onClose }) {
  const { getShortcuts } = useKeyboardStore()
  const [search, setSearch] = useState('')
  const shortcuts = getShortcuts()

  const filtered = shortcuts.filter(sc =>
    sc.label.toLowerCase().includes(search.toLowerCase()) ||
    sc.keys.toLowerCase().includes(search.toLowerCase()) ||
    sc.category.toLowerCase().includes(search.toLowerCase())
  )

  const grouped = filtered.reduce((acc, sc) => {
    if (!acc[sc.category]) acc[sc.category] = []
    acc[sc.category].push(sc)
    return acc
  }, {})

  const categoryColors = {
    'Navigation': 'from-blue-500 to-blue-600',
    'POS Actions': 'from-emerald-500 to-emerald-600',
    'Quick Actions': 'from-violet-500 to-violet-600',
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-surface-200 dark:border-surface-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-surface-100 dark:border-surface-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-surface-900 dark:text-white">Keyboard Shortcuts</h2>
                <p className="text-xs text-surface-500">Quick actions — customize in Settings</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="px-5 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search shortcuts..."
                className="w-full pl-9 pr-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Shortcuts Grid */}
          <div className="p-5 overflow-y-auto max-h-[55vh] space-y-5 scrollbar-thin">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-surface-400 mb-2.5 flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full bg-gradient-to-br', categoryColors[category] || 'from-gray-400 to-gray-500')} />
                  {category}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {items.map((sc) => (
                    <div
                      key={sc.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors group"
                    >
                      <span className="text-sm text-surface-700 dark:text-surface-300 font-medium truncate mr-3">{sc.label}</span>
                      <kbd className="flex-shrink-0 flex items-center gap-0.5">
                        {sc.keys.split('+').map((part, i) => (
                          <span key={i}>
                            <span className="inline-block px-1.5 py-0.5 rounded-md bg-surface-200 dark:bg-surface-700 text-[10px] font-bold font-mono text-surface-600 dark:text-surface-300 shadow-sm border border-surface-300 dark:border-surface-600 min-w-[22px] text-center">
                              {part.trim() === 'Ctrl' ? 'Ctrl' : part.trim() === 'Alt' ? 'Alt' : part.trim() === 'Shift' ? '⇧' : part.trim() === 'Enter' ? '↵' : part.trim()}
                            </span>
                            {i < sc.keys.split('+').length - 1 && <span className="text-surface-300 dark:text-surface-600 mx-0.5 text-[9px]">+</span>}
                          </span>
                        ))}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {Object.keys(grouped).length === 0 && (
              <div className="py-12 text-center text-surface-400">
                <Keyboard className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No shortcuts match "{search}"</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/30 flex items-center justify-between">
            <p className="text-[10px] text-surface-400">
              Press <kbd className="px-1 py-0.5 rounded bg-surface-200 dark:bg-surface-700 text-[9px] font-mono font-bold">⇧</kbd>
              <kbd className="px-1 py-0.5 rounded bg-surface-200 dark:bg-surface-700 text-[9px] font-mono font-bold ml-0.5">/</kbd> to toggle this panel
            </p>
            <p className="text-[10px] text-surface-400">
              {shortcuts.length} shortcuts • Customize in Settings
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
