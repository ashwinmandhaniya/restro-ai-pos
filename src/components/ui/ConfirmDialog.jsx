import { AnimatePresence, motion } from 'framer-motion'
import useUIStore from '@/store/uiStore'
import { AlertCircle, X } from 'lucide-react'

export default function ConfirmDialog() {
  const { confirmState } = useUIStore()

  if (!confirmState.isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-surface-200 dark:border-surface-800"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex-shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">
                {confirmState.title}
              </h3>
              <p className="text-sm text-surface-500 mb-6">
                {confirmState.message}
              </p>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={confirmState.onCancel}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800 transition-colors"
                >
                  {confirmState.cancelText}
                </button>
                <button 
                  onClick={confirmState.onConfirm}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 transition-all active:scale-95"
                >
                  {confirmState.confirmText}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
