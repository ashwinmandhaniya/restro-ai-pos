import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ─────────────────────────────────────────────────────────
   DEFAULT KEYBOARD SHORTCUTS
   
   key format: modifier keys separated by +, then the key
   For letters use UPPERCASE: 'Alt+D'
   For special keys: 'F11', 'Enter', 'Escape'
   For symbols: use the key name from event.key  
───────────────────────────────────────────────────────── */
const DEFAULT_SHORTCUTS = [
  // Navigation — Alt + letter (doesn't conflict with browser)
  { id: 'nav_dashboard',     label: 'Go to Dashboard',           keys: 'Alt+D',       action: 'navigate', target: '/dashboard',         category: 'Navigation' },
  { id: 'nav_pos',           label: 'Go to POS Billing',         keys: 'Alt+P',       action: 'navigate', target: '/pos',               category: 'Navigation' },
  { id: 'nav_touch_pos',     label: 'Go to Touch Screen POS',    keys: 'Alt+T',       action: 'navigate', target: '/touch-pos',         category: 'Navigation' },
  { id: 'nav_orders',        label: 'Go to Orders',              keys: 'Alt+O',       action: 'navigate', target: '/orders',            category: 'Navigation' },
  { id: 'nav_tables',        label: 'Go to Tables',              keys: 'Alt+B',       action: 'navigate', target: '/tables',            category: 'Navigation' },
  { id: 'nav_kitchen',       label: 'Go to Kitchen Display',     keys: 'Alt+K',       action: 'navigate', target: '/kitchen',           category: 'Navigation' },
  { id: 'nav_menu',          label: 'Go to Menu',                keys: 'Alt+M',       action: 'navigate', target: '/menu',              category: 'Navigation' },
  { id: 'nav_inventory',     label: 'Go to Inventory',           keys: 'Alt+I',       action: 'navigate', target: '/inventory',         category: 'Navigation' },
  { id: 'nav_customers',     label: 'Go to Customers',           keys: 'Alt+C',       action: 'navigate', target: '/customers',         category: 'Navigation' },
  { id: 'nav_reports',       label: 'Go to Reports',             keys: 'Alt+R',       action: 'navigate', target: '/reports',           category: 'Navigation' },
  { id: 'nav_settings',      label: 'Go to Settings',            keys: 'Alt+S',       action: 'navigate', target: '/settings',          category: 'Navigation' },

  // POS Actions — Ctrl+Shift to avoid browser conflicts
  { id: 'pos_new_order',     label: 'New Order / Clear Cart',    keys: 'Ctrl+Shift+N', action: 'function', target: 'newOrder',          category: 'POS Actions' },
  { id: 'pos_hold_order',    label: 'Hold Current Order',        keys: 'Ctrl+Shift+H', action: 'function', target: 'holdOrder',         category: 'POS Actions' },
  { id: 'pos_pay',           label: 'Payment / Checkout',        keys: 'Ctrl+Enter',   action: 'function', target: 'payment',           category: 'POS Actions' },
  { id: 'pos_print_bill',    label: 'Print Bill',                keys: 'Ctrl+Shift+P', action: 'function', target: 'printBill',         category: 'POS Actions' },
  { id: 'pos_search_item',   label: 'Search Menu Item',          keys: 'Alt+F',        action: 'function', target: 'searchItem',        category: 'POS Actions' },
  { id: 'pos_apply_discount',label: 'Apply Discount',            keys: 'Ctrl+Shift+C', action: 'function', target: 'applyDiscount',     category: 'POS Actions' },
  { id: 'pos_generate_kot',  label: 'Generate KOT',              keys: 'Ctrl+Shift+K', action: 'function', target: 'generateKOT',      category: 'POS Actions' },

  // Quick Actions
  { id: 'toggle_sidebar',    label: 'Toggle Sidebar',            keys: 'Ctrl+B',       action: 'toggle',   target: 'sidebar',           category: 'Quick Actions' },
  { id: 'toggle_darkmode',   label: 'Toggle Dark Mode',          keys: 'Ctrl+Shift+D', action: 'toggle',   target: 'darkMode',          category: 'Quick Actions' },
  { id: 'toggle_fullscreen', label: 'Toggle Fullscreen',         keys: 'F11',          action: 'toggle',   target: 'fullscreen',        category: 'Quick Actions' },
  { id: 'show_shortcuts',    label: 'Show Keyboard Shortcuts',   keys: 'Shift+/',      action: 'toggle',   target: 'shortcutHelp',      category: 'Quick Actions' },
  { id: 'voice_billing',     label: 'Open Voice Billing',        keys: 'Ctrl+Shift+V', action: 'toggle',   target: 'voiceBilling',      category: 'Quick Actions' },
  { id: 'ai_copilot',        label: 'Open AI Copilot',           keys: 'Ctrl+Shift+A', action: 'toggle',   target: 'aiCopilot',         category: 'Quick Actions' },
  { id: 'quick_search',      label: 'Global Search',             keys: 'Ctrl+Shift+F', action: 'function', target: 'globalSearch',      category: 'Quick Actions' },
]

/* ─────────────────────────────────────────────────────────
   KEY CODE MAP: Maps letter keys to their event.code values
   This is critical because event.key can return unexpected
   characters when Alt is pressed on Windows
───────────────────────────────────────────────────────── */
const LETTER_CODE_MAP = {}
for (let i = 65; i <= 90; i++) {
  const letter = String.fromCharCode(i) // A-Z
  LETTER_CODE_MAP[letter] = `Key${letter}`
}

/* ─────────────────────────────────────────────────────────
   HELPER: parse key combo string into match-check object
───────────────────────────────────────────────────────── */
export function parseKeys(combo) {
  // Handle edge case: combo might have more than 2 parts with +
  const parts = []
  const raw = combo.split('+')
  for (const part of raw) {
    const trimmed = part.trim()
    if (trimmed) parts.push(trimmed)
  }

  return {
    ctrl: parts.includes('Ctrl'),
    alt: parts.includes('Alt'),
    shift: parts.includes('Shift'),
    meta: parts.includes('Meta'),
    key: parts.filter(p => !['Ctrl', 'Alt', 'Shift', 'Meta'].includes(p))[0] || '',
  }
}

/* ─────────────────────────────────────────────────────────
   HELPER: Check if a keyboard event matches a parsed combo
   Uses event.code for letter keys (robust on all OS/layouts)
   Uses event.key for special keys (Enter, F11, symbols)
───────────────────────────────────────────────────────── */
export function matchEvent(event, parsed) {
  // Check modifiers first (quick bail)
  if (event.ctrlKey !== parsed.ctrl) return false
  if (event.altKey !== parsed.alt) return false
  if (event.shiftKey !== parsed.shift) return false
  if (event.metaKey !== parsed.meta) return false

  const targetKey = parsed.key.toUpperCase()

  // For single letter keys: use event.code (layout-independent, works with Alt)
  if (targetKey.length === 1 && targetKey >= 'A' && targetKey <= 'Z') {
    return event.code === `Key${targetKey}`
  }

  // For F-keys
  if (/^F\d{1,2}$/.test(targetKey)) {
    return event.key === parsed.key || event.code === parsed.key
  }

  // For number keys
  if (targetKey.length === 1 && targetKey >= '0' && targetKey <= '9') {
    return event.code === `Digit${targetKey}` || event.key === parsed.key
  }

  // For special keys
  const specialKeyMap = {
    'ENTER': () => event.key === 'Enter',
    'ESCAPE': () => event.key === 'Escape',
    'ESC': () => event.key === 'Escape',
    'SPACE': () => event.key === ' ' || event.code === 'Space',
    'TAB': () => event.key === 'Tab',
    'BACKSPACE': () => event.key === 'Backspace',
    'DELETE': () => event.key === 'Delete',
    'ARROWUP': () => event.key === 'ArrowUp',
    'ARROWDOWN': () => event.key === 'ArrowDown',
    'ARROWLEFT': () => event.key === 'ArrowLeft',
    'ARROWRIGHT': () => event.key === 'ArrowRight',
  }

  if (specialKeyMap[targetKey]) {
    return specialKeyMap[targetKey]()
  }

  // For symbols (/, ?, \, etc.) — compare event.key directly
  // Handle Shift+/ which produces '?' on US keyboards
  if (parsed.key === '/') {
    // Shift+/ = '?' on US keyboard, also check event.key === '/'
    return event.key === '/' || (event.shiftKey && event.key === '?')
  }

  // Default: compare event.key (case-insensitive)
  return event.key.toUpperCase() === targetKey
}

export function formatKeysForDisplay(combo) {
  return combo
    .replace('Ctrl', '⌃')
    .replace('Alt', '⌥')
    .replace('Shift', '⇧')
    .replace('Meta', '⌘')
    .replace('Enter', '↵')
    .replace('Escape', 'Esc')
    .replace(/\+/g, ' ')
}

/* ─────────────────────────────────────────────────────────
   STORE
───────────────────────────────────────────────────────── */
const useKeyboardStore = create(
  persist(
    (set, get) => ({
      shortcuts: DEFAULT_SHORTCUTS.map(s => ({ ...s })),
      enabled: true,
      showHelp: false,

      // Get all (merged with defaults for new shortcuts in updates)
      getShortcuts: () => {
        const custom = get().shortcuts
        return DEFAULT_SHORTCUTS.map(def => {
          const found = custom.find(c => c.id === def.id)
          return found ? { ...def, keys: found.keys } : { ...def }
        })
      },

      // Toggle help overlay
      toggleHelp: () => set(s => ({ showHelp: !s.showHelp })),
      setShowHelp: (val) => set({ showHelp: val }),

      // Toggle global on/off
      toggleEnabled: () => set(s => ({ enabled: !s.enabled })),

      // Update a single shortcut's key binding
      updateShortcutKeys: (id, newKeys) => {
        set(s => ({
          shortcuts: s.shortcuts.map(sc =>
            sc.id === id ? { ...sc, keys: newKeys } : sc
          )
        }))
      },

      // Reset single shortcut to default
      resetShortcut: (id) => {
        const def = DEFAULT_SHORTCUTS.find(d => d.id === id)
        if (def) {
          set(s => ({
            shortcuts: s.shortcuts.map(sc =>
              sc.id === id ? { ...sc, keys: def.keys } : sc
            )
          }))
        }
      },

      // Reset all shortcuts to defaults
      resetAllShortcuts: () => {
        set({ shortcuts: DEFAULT_SHORTCUTS.map(s => ({ ...s })) })
      },

      // Check for conflicts
      getConflicts: (id, newKeys) => {
        return get().shortcuts.filter(s => s.id !== id && s.keys === newKeys)
      },
    }),
    {
      name: 'keyboard-shortcuts',
      partialize: (state) => ({ shortcuts: state.shortcuts, enabled: state.enabled }),
    }
  )
)

export { DEFAULT_SHORTCUTS }
export default useKeyboardStore
