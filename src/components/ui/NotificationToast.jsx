import { AnimatePresence, motion } from 'framer-motion'
import useUIStore from '@/store/uiStore'
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react'

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const colors = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
}

export default function NotificationToast() {
  const { notifications, dismissToast } = useUIStore()

  // Only show active toasts, limit to max 5 at a time
  const activeToasts = notifications.filter(n => n.isToast).slice(-5)

  return (
    <div className="fixed top-20 right-6 z-50 space-y-2 max-w-sm pointer-events-none">
      <AnimatePresence>
        {activeToasts.map((n) => {
          const Icon = icons[n.type] || Info
          return (
            <motion.div
              layout
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-lg pointer-events-auto"
            >
              <div className={`p-1 rounded-full ${colors[n.type] || colors.info}`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-sm font-semibold text-surface-900 dark:text-white">{n.title}</p>
                {n.message && <p className="text-xs text-surface-500 mt-0.5">{n.message}</p>}
              </div>
              <button 
                onClick={() => dismissToast && dismissToast(n.id)}
                className="p-1 text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
