import { create } from 'zustand'

const useUIStore = create((set, get) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  darkMode: localStorage.getItem('theme') === 'dark', // Default to false (light) if not set to 'dark'
  currentPage: 'dashboard',
  searchQuery: '',
  showPaymentModal: false,
  showKOTPreview: false,
  showSplitBill: false,
  showVoiceBilling: false,
  showCopilot: false,
  notifications: [],
  selectedFloor: 'ground',
  confirmState: { isOpen: false, title: '', message: '', confirmText: 'Confirm', cancelText: 'Cancel', onConfirm: null, onCancel: null },

  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  toggleSidebarCollapse: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
  toggleDarkMode: () => {
    const newMode = !get().darkMode
    localStorage.setItem('theme', newMode ? 'dark' : 'light')
    set({ darkMode: newMode })
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  },
  setCurrentPage: (page) => set({ currentPage: page }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setShowPaymentModal: (show) => set({ showPaymentModal: show }),
  setShowKOTPreview: (show) => set({ showKOTPreview: show }),
  setShowSplitBill: (show) => set({ showSplitBill: show }),
  setShowVoiceBilling: (show) => set({ showVoiceBilling: show }),
  setShowCopilot: (show) => set({ showCopilot: show }),
  toggleVoiceBilling: () => set({ showVoiceBilling: !get().showVoiceBilling }),
  toggleCopilot: () => set({ showCopilot: !get().showCopilot }),
  setSelectedFloor: (floor) => set({ selectedFloor: floor }),
  
  confirmAction: ({ title, message, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    return new Promise((resolve) => {
      set({
        confirmState: {
          isOpen: true,
          title,
          message,
          confirmText,
          cancelText,
          onConfirm: () => {
            set({ confirmState: { ...get().confirmState, isOpen: false } })
            resolve(true)
          },
          onCancel: () => {
            set({ confirmState: { ...get().confirmState, isOpen: false } })
            resolve(false)
          }
        }
      })
    })
  },

  addNotification: (notification) => {
    const state = get()
    // Deduplication check to prevent duplicate fires (same title/message within 5s)
    const duplicate = state.notifications.find(
      n => n.title === notification.title && 
           n.message === notification.message && 
           n.type === notification.type && 
           Date.now() - n.id < 5000
    )
    if (duplicate) return

    const id = Date.now()
    const newNotif = { ...notification, id, isToast: true }
    
    // Keep max 50 notifications in history
    set({ notifications: [...state.notifications, newNotif].slice(-50) })
    // Auto-dismiss from display after 3 seconds
    setTimeout(() => {
      set({ 
        notifications: get().notifications.map(n => 
          n.id === id ? { ...n, isToast: false } : n
        ) 
      })
    }, 3000)
  },
  
  dismissToast: (id) => {
    set({
      notifications: get().notifications.map(n => 
        n.id === id ? { ...n, isToast: false } : n
      )
    })
  },
  
  clearNotifications: () => set({ notifications: [] }),
}))

export default useUIStore
