import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Monitor, Plus, X, Power, PowerOff, Users, Clock, ShoppingCart,
  Hash, Trash2, Pencil, ExternalLink,
  Activity, IndianRupee, Zap, LayoutGrid, Brain, AlertTriangle, CheckCircle2, ShieldAlert
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import useUIStore from '@/store/uiStore'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'

const counterStatusConfig = {
  active:   { label: 'Active',   color: 'emerald', dot: 'bg-emerald-500', ring: 'ring-emerald-500/20' },
  idle:     { label: 'Idle',     color: 'amber',   dot: 'bg-amber-500',   ring: 'ring-amber-500/20' },
  offline:  { label: 'Offline',  color: 'red',     dot: 'bg-red-500',     ring: 'ring-red-500/20' },
  closed:   { label: 'Closed',   color: 'surface', dot: 'bg-surface-400', ring: 'ring-surface-400/20' },
}

// No more client-side ID generation — backend handles it

export default function MultiCounterPage() {
  const { addNotification, confirmAction } = useUIStore()
  const { user } = useAuthStore()

  const [counters, setCounters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editCounter, setEditCounter] = useState(null)
  const [selectedCounter, setSelectedCounter] = useState(null)
  const [activeTab, setActiveTab] = useState('list')
  const [insights, setInsights] = useState(null)

  const [form, setForm] = useState({
    name: '',
    type: 'billing',
    location: '',
    assignedStaff: ''
  })

  // ── Data fetching ──
  useEffect(() => {
    fetchCounters()
  }, [])

  const fetchCounters = async () => {
    try {
      setLoading(true)
      const res = await api.get('/tenant/counters')
      if (res.data?.success) setCounters(res.data.data)
    } catch (e) {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to fetch counters' })
    } finally {
      setLoading(false)
    }
  }

  const fetchInsights = async () => {
    try {
      const res = await api.get('/tenant/counters/insights')
      if (res.data?.success) setInsights(res.data.data)
    } catch (e) {
      console.error('Failed to fetch counter insights:', e)
    }
  }

  // ── CRUD ──
  const handleSaveCounter = async () => {
    if (!form.name.trim()) {
      addNotification({ type: 'warning', title: 'Required', message: 'Counter name is required.' })
      return
    }
    try {
      if (editCounter) {
        const res = await api.patch(`/tenant/counters/${editCounter._id}`, form)
        if (res.data?.success) {
          setCounters(counters.map(c => c._id === editCounter._id ? res.data.data : c))
          addNotification({ type: 'success', title: 'Updated', message: `${form.name} updated.` })
        }
      } else {
        const res = await api.post('/tenant/counters', form)
        if (res.data?.success) {
          setCounters([...counters, res.data.data])
          addNotification({ type: 'success', title: 'Created', message: `${form.name} is ready.` })
        }
      }
    } catch (e) {
      addNotification({ type: 'error', title: 'Error', message: e.response?.data?.message || 'Failed to save counter' })
    }
    setShowAddModal(false)
    setEditCounter(null)
    setForm({ name: '', type: 'billing', location: '', assignedStaff: '' })
  }

  const handleDelete = (counter) => {
    confirmAction({
      title: 'Delete Counter',
      message: `Are you sure you want to delete "${counter.name}"?`,
      onConfirm: async () => {
        try {
          await api.delete(`/tenant/counters/${counter._id}`)
          setCounters(counters.filter(c => c._id !== counter._id))
          if (selectedCounter?._id === counter._id) setSelectedCounter(null)
          addNotification({ type: 'success', title: 'Deleted', message: `${counter.name} removed.` })
        } catch (e) {
          addNotification({ type: 'error', title: 'Error', message: 'Failed to delete counter' })
        }
      }
    })
  }

  const handleToggleStatus = async (counter) => {
    let newStatus = 'closed'
    if (counter.status === 'closed' || counter.status === 'offline') newStatus = 'idle'
    else if (counter.status === 'idle') newStatus = 'active'
    else if (counter.status === 'active') newStatus = 'closed'
    try {
      const res = await api.patch(`/tenant/counters/${counter._id}`, { status: newStatus })
      if (res.data?.success) {
        setCounters(counters.map(c => c._id === counter._id ? res.data.data : c))
        addNotification({
          type: newStatus === 'active' ? 'success' : newStatus === 'idle' ? 'info' : 'warning',
          title: `Counter ${counterStatusConfig[newStatus].label}`,
          message: `${counter.name} is now ${newStatus}.`
        })
      }
    } catch (e) {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to update status' })
    }
  }

  const openEdit = (counter) => {
    setForm({ name: counter.name, type: counter.type, location: counter.location, assignedStaff: counter.assignedStaff || '' })
    setEditCounter(counter)
    setShowAddModal(true)
  }

  // ── Stats ──
  const activeCount = counters.filter(c => c.status === 'active').length
  const totalOrders = counters.reduce((sum, c) => sum + (c.ordersProcessed || 0), 0)
  const totalRevenue = counters.reduce((sum, c) => sum + (c.totalRevenue || 0), 0)

  const formatTime = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    const now = new Date()
    const diff = Math.floor((now - d) / 60000)
    if (diff < 1) return 'Just now'
    if (diff < 60) return `${diff}m ago`
    return `${Math.floor(diff / 60)}h ${diff % 60}m ago`
  }

  const getSessionDuration = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    const now = new Date()
    const mins = Math.floor((now - d) / 60000)
    const hrs = Math.floor(mins / 60)
    const m = mins % 60
    return hrs > 0 ? `${hrs}h ${m}m` : `${m}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-primary-500" />
            Multi Counter
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">Manage POS screens across multiple billing counters</p>
        </div>
        <button
          onClick={() => {
            setEditCounter(null)
            setForm({ name: '', type: 'billing', location: '', assignedStaff: '' })
            setShowAddModal(true)
          }}
          className="btn-primary btn-sm"
        >
          <Plus className="w-4 h-4" /> Add Counter
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Counters', value: counters.length, icon: Monitor, iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
          { label: 'Active Now', value: activeCount, icon: Zap, iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Orders Today', value: totalOrders, icon: ShoppingCart, iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400' },
          { label: 'Revenue Today', value: formatCurrency(totalRevenue), icon: IndianRupee, iconBg: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600 dark:text-violet-400' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 flex items-center gap-4">
            <div className={cn('p-3 rounded-xl', stat.iconBg, stat.iconColor)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-surface-500">{stat.label}</p>
              <p className="text-xl font-bold text-surface-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit">
        {[['list', 'Counter List'], ['ai', '🧠 AI Brain']].map(([tab, label]) => (
          <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'ai' && !insights) fetchInsights() }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              activeTab === tab
                ? 'bg-white dark:bg-surface-900 text-surface-900 dark:text-white shadow-sm'
                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
            )}>
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
      {activeTab === 'list' ? (
      <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      {/* Counters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <AnimatePresence>
          {counters.map((counter) => {
            const sc = counterStatusConfig[counter.status] || counterStatusConfig.closed
            return (
              <motion.div
                key={counter._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -3 }}
                onClick={() => setSelectedCounter(counter)}
                className={cn(
                  'card p-0 overflow-hidden cursor-pointer transition-shadow duration-200',
                  selectedCounter?._id === counter._id && 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/10'
                )}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between p-4 pb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      counter.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                      counter.status === 'idle' ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                      'bg-surface-100 dark:bg-surface-800 text-surface-400'
                    )}>
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-surface-900 dark:text-white truncate">{counter.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Hash className="w-3 h-3 text-surface-400" />
                        <span className="text-xs text-surface-400 font-mono">{counter.counterId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full ring-2',
                    `ring-${sc.color}-500/20`,
                    sc.ring
                  )}>
                    <span className={cn('w-2 h-2 rounded-full', sc.dot, counter.status === 'active' && 'animate-pulse')} />
                    <span className={cn('text-[10px] font-bold uppercase tracking-wider',
                      `text-${sc.color}-600 dark:text-${sc.color}-400`
                    )}>
                      {sc.label}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-4 pb-4 space-y-3">
                  {/* Info Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-surface-50 dark:bg-surface-800/60 rounded-lg p-2.5">
                      <p className="text-[10px] text-surface-400 uppercase tracking-wider mb-0.5">Type</p>
                      <p className="text-xs font-semibold text-surface-700 dark:text-surface-300 capitalize">{counter.type}</p>
                    </div>
                    <div className="bg-surface-50 dark:bg-surface-800/60 rounded-lg p-2.5">
                      <p className="text-[10px] text-surface-400 uppercase tracking-wider mb-0.5">Staff</p>
                      <p className="text-xs font-semibold text-surface-700 dark:text-surface-300 truncate">
                        {counter.assignedStaff || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Session Metrics (only if active or idle) */}
                  {(counter.status === 'active' || counter.status === 'idle') && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-surface-50 dark:bg-surface-800/60 rounded-lg">
                        <p className="text-lg font-bold text-surface-900 dark:text-white">{counter.ordersProcessed}</p>
                        <p className="text-[10px] text-surface-400">Orders</p>
                      </div>
                      <div className="text-center p-2 bg-surface-50 dark:bg-surface-800/60 rounded-lg">
                        <p className="text-lg font-bold text-surface-900 dark:text-white">{formatCurrency(counter.totalRevenue)}</p>
                        <p className="text-[10px] text-surface-400">Revenue</p>
                      </div>
                      <div className="text-center p-2 bg-surface-50 dark:bg-surface-800/60 rounded-lg">
                        <p className="text-lg font-bold text-surface-900 dark:text-white">{getSessionDuration(counter.sessionStart)}</p>
                        <p className="text-[10px] text-surface-400">Session</p>
                      </div>
                    </div>
                  )}

                  {/* Location and Last Activity */}
                  <div className="flex items-center justify-between text-xs text-surface-500">
                    <span className="truncate">{counter.location || 'No location set'}</span>
                    <span className="flex-shrink-0 flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {formatTime(counter.lastActivity)}
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex border-t border-surface-100 dark:border-surface-800 divide-x divide-surface-100 dark:divide-surface-800">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleStatus(counter) }}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors',
                      counter.status === 'active'
                        ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
                        : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'
                    )}
                  >
                    {counter.status === 'active' ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                    {counter.status === 'active' ? 'Close' : counter.status === 'idle' ? 'Activate' : 'Open'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(counter) }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(counter) }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Empty Add Card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setEditCounter(null)
            setForm({ name: '', type: 'billing', location: '', assignedStaff: '' })
            setShowAddModal(true)
          }}
          className="border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-2xl
                     flex flex-col items-center justify-center gap-3 py-16
                     text-surface-400 hover:border-primary-300 hover:text-primary-500
                     dark:hover:border-primary-500/40 dark:hover:text-primary-400 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-sm font-semibold">Add New Counter</span>
        </motion.button>
      </div>

      {/* ── Selected Counter Detail Panel ── */}
      <AnimatePresence>
        {selectedCounter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-surface-900 dark:text-white">{selectedCounter.name}</h2>
                    <p className="text-xs text-surface-500">{selectedCounter.counterId} · {selectedCounter.location || 'No location'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/pos?counter=${selectedCounter.counterId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary btn-sm"
                  >
                    <ExternalLink className="w-4 h-4" /> Open POS Screen
                  </a>
                  <button onClick={() => setSelectedCounter(null)} className="p-2 rounded-lg text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Status', value: (counterStatusConfig[selectedCounter.status] || counterStatusConfig.closed).label },
                  { label: 'Assigned Staff', value: selectedCounter.assignedStaff || 'Unassigned' },
                  { label: 'Session Started', value: selectedCounter.sessionStart ? new Date(selectedCounter.sessionStart).toLocaleTimeString() : '—' },
                  { label: 'Last Activity', value: formatTime(selectedCounter.lastActivity) },
                  { label: 'Orders Processed', value: selectedCounter.ordersProcessed },
                  { label: 'Revenue Collected', value: formatCurrency(selectedCounter.totalRevenue) },
                  { label: 'Counter Type', value: selectedCounter.type, capitalize: true },
                  { label: 'Session Duration', value: getSessionDuration(selectedCounter.sessionStart) },
                ].map((item) => (
                  <div key={item.label} className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4">
                    <p className="text-[10px] text-surface-400 uppercase tracking-wider mb-1">{item.label}</p>
                    <p className={cn('text-sm font-bold text-surface-900 dark:text-white', item.capitalize && 'capitalize')}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
      ) : activeTab === 'ai' ? (
      <motion.div key="ai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
        {insights ? (<>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Utilization Gauge */}
            <div className="card p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-sm font-semibold text-surface-500 mb-4 uppercase tracking-wider">Counter Utilization</h3>
              <div className="relative w-32 h-32 flex items-center justify-center mb-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" className="stroke-surface-100 dark:stroke-surface-800" strokeWidth="8" fill="none" />
                  <motion.circle initial={{ strokeDasharray: '0 251' }} animate={{ strokeDasharray: `${(insights.utilizationPct / 100) * 251} 251` }} transition={{ duration: 1.5, ease: 'easeOut' }} cx="50" cy="50" r="40" className={cn('stroke-current', insights.utilizationPct > 80 ? 'text-emerald-500' : insights.utilizationPct > 40 ? 'text-amber-500' : 'text-red-500')} strokeWidth="8" fill="none" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold dark:text-white">{insights.utilizationPct}%</span>
                </div>
              </div>
              <p className="text-xs text-surface-500 mt-1">{insights.metrics.active} of {insights.metrics.total} counters active</p>
            </div>
            {/* AI Recommendations */}
            <div className="md:col-span-2 card p-6">
              <div className="flex items-center gap-2 mb-6">
                <Brain className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold dark:text-white">AI Recommendations</h3>
              </div>
              <div className="space-y-4">
                {insights.recommendations.map(rec => (
                  <motion.div key={rec.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    className={cn('p-4 rounded-xl border flex gap-3',
                      rec.type === 'danger' ? 'bg-red-50 border-red-100 dark:bg-red-500/10 dark:border-red-500/20' :
                      rec.type === 'warning' ? 'bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20' :
                      rec.type === 'success' ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20' :
                      'bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20'
                    )}>
                    {rec.type === 'danger' ? <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" /> :
                     rec.type === 'warning' ? <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-500" /> :
                     rec.type === 'success' ? <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-500" /> :
                     <Zap className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-500" />}
                    <div>
                      <p className="text-sm font-bold text-surface-900 dark:text-white">{rec.title}</p>
                      <p className="text-xs text-surface-600 dark:text-surface-400 mt-1 leading-relaxed">{rec.message}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </>) : (
          <div className="text-center py-12 text-surface-400">
            <Brain className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No insights available yet. Add counters to get started.</p>
          </div>
        )}
      </motion.div>
      ) : null}
      </AnimatePresence>

      {/* ── Add / Edit Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-md p-6 border border-surface-200 dark:border-surface-800"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold dark:text-white">{editCounter ? 'Edit Counter' : 'Add New Counter'}</h3>
                <button onClick={() => { setShowAddModal(false); setEditCounter(null) }} className="text-surface-400 hover:text-surface-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block dark:text-surface-300">Counter Name</label>
                  <input
                    placeholder="e.g. Main Counter"
                    className="input"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block dark:text-surface-300">Counter Type</label>
                    <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      <option value="billing">Billing</option>
                      <option value="bar">Bar</option>
                      <option value="takeaway">Takeaway</option>
                      <option value="drive-through">Drive-Through</option>
                      <option value="delivery">Delivery</option>
                      <option value="cashier">Cashier</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block dark:text-surface-300">Assigned Staff</label>
                    <input
                      placeholder="e.g. Rahul S."
                      className="input"
                      value={form.assignedStaff}
                      onChange={e => setForm({ ...form, assignedStaff: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block dark:text-surface-300">Location / Description</label>
                  <input
                    placeholder="e.g. Ground Floor - Entrance"
                    className="input"
                    value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setShowAddModal(false); setEditCounter(null) }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-surface-600 border border-surface-200 dark:border-surface-700 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCounter}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-600/20 transition-colors"
                  >
                    {editCounter ? 'Update Counter' : 'Create Counter'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
