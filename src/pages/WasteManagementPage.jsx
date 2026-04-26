import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trash2, Plus, Search, AlertTriangle, TrendingDown, Package,
  BarChart3, RefreshCw, X, Filter, Leaf, Flame, Droplets,
  ArrowDown, DollarSign, CheckCircle2, ChevronRight, Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import useUIStore from '@/store/uiStore'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

// ---- Mock Data ----
const WASTE_LOGS = [
  { id: 1, item: 'Tomatoes', category: 'Vegetables', qty: 3.5, unit: 'kg', reason: 'Spoilage', cost: 105, date: '2026-04-26', stage: 'Storage', icon: '🍅' },
  { id: 2, item: 'Paneer', category: 'Dairy', qty: 1.2, unit: 'kg', reason: 'Over-prepared', cost: 312, date: '2026-04-26', stage: 'Kitchen', icon: '🧀' },
  { id: 3, item: 'Rice', category: 'Grains', qty: 5, unit: 'kg', reason: 'Over-cooked', cost: 150, date: '2026-04-25', stage: 'Kitchen', icon: '🍚' },
  { id: 4, item: 'Chicken', category: 'Meat', qty: 0.8, unit: 'kg', reason: 'Order cancelled', cost: 240, date: '2026-04-25', stage: 'Service', icon: '🍗' },
  { id: 5, item: 'Bread', category: 'Bakery', qty: 12, unit: 'pcs', reason: 'Expired', cost: 60, date: '2026-04-24', stage: 'Storage', icon: '🍞' },
  { id: 6, item: 'Daal', category: 'Pulses', qty: 2, unit: 'kg', reason: 'Over-prepared', cost: 80, date: '2026-04-24', stage: 'Kitchen', icon: '🫘' },
  { id: 7, item: 'Milk', category: 'Dairy', qty: 4, unit: 'ltr', reason: 'Spoilage', cost: 200, date: '2026-04-23', stage: 'Storage', icon: '🥛' },
  { id: 8, item: 'Naan', category: 'Bakery', qty: 20, unit: 'pcs', reason: 'Plate return', cost: 100, date: '2026-04-23', stage: 'Service', icon: '🫓' },
]

const WEEKLY_WASTE = [
  { day: 'Mon', kg: 4.2, cost: 380 },
  { day: 'Tue', kg: 2.8, cost: 210 },
  { day: 'Wed', kg: 6.1, cost: 520 },
  { day: 'Thu', kg: 3.5, cost: 295 },
  { day: 'Fri', kg: 8.2, cost: 710 },
  { day: 'Sat', kg: 5.4, cost: 480 },
  { day: 'Sun', kg: 3.9, cost: 330 },
]

const CATEGORY_COLORS = {
  Vegetables: '#10b981',
  Dairy: '#3b82f6',
  Grains: '#f59e0b',
  Meat: '#ef4444',
  Bakery: '#8b5cf6',
  Pulses: '#06b6d4',
}

const STAGE_REASONS = ['Spoilage', 'Over-prepared', 'Over-cooked', 'Order cancelled', 'Expired', 'Plate return', 'Quality rejection', 'Other']
const UNITS = ['kg', 'ltr', 'pcs', 'box']
const STAGES = ['Storage', 'Kitchen', 'Service']
const CATEGORIES = ['Vegetables', 'Dairy', 'Grains', 'Meat', 'Bakery', 'Pulses', 'Other']

const EMPTY_FORM = { item: '', category: '', qty: '', unit: 'kg', reason: '', stage: 'Kitchen', cost: '' }

export default function WasteManagementPage() {
  const { addNotification } = useUIStore()
  const [logs, setLogs] = useState(WASTE_LOGS)
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [activeTab, setActiveTab] = useState('log') // 'log' | 'analytics'

  // Derived stats
  const totalCost = useMemo(() => logs.reduce((s, l) => s + l.cost, 0), [logs])
  const totalKg = useMemo(() => logs.reduce((s, l) => s + (l.unit === 'kg' || l.unit === 'ltr' ? l.qty : 0), 0).toFixed(1), [logs])
  const topWasteItem = useMemo(() => {
    const grouped = logs.reduce((acc, l) => { acc[l.item] = (acc[l.item] || 0) + l.cost; return acc }, {})
    return Object.entries(grouped).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
  }, [logs])

  // Category breakdown for pie
  const categoryData = useMemo(() => {
    const grouped = logs.reduce((acc, l) => {
      acc[l.category] = (acc[l.category] || 0) + l.cost
      return acc
    }, {})
    return Object.entries(grouped).map(([name, value]) => ({ name, value }))
  }, [logs])

  const filtered = logs.filter(l => {
    const matchSearch = l.item.toLowerCase().includes(search.toLowerCase()) || l.reason.toLowerCase().includes(search.toLowerCase())
    const matchStage = filterStage === 'all' || l.stage === filterStage
    return matchSearch && matchStage
  })

  const handleLog = (e) => {
    e.preventDefault()
    const entry = {
      id: Date.now(),
      ...form,
      qty: parseFloat(form.qty),
      cost: parseFloat(form.cost),
      date: new Date().toISOString().split('T')[0],
      icon: '📦'
    }
    setLogs([entry, ...logs])
    setForm(EMPTY_FORM)
    setShowModal(false)
    addNotification({ type: 'success', title: 'Waste Logged', message: `${form.item} has been recorded in the waste log.` })
  }

  const handleDelete = (id) => {
    setLogs(prev => prev.filter(l => l.id !== id))
    addNotification({ type: 'info', title: 'Entry Removed', message: 'Waste log entry has been deleted.' })
  }

  const RECS = [
    { text: `Reduce ${topWasteItem} prep quantity by 15% on weekdays`, icon: TrendingDown, color: 'text-emerald-500' },
    { text: 'Batch-cook rice in 3 smaller portions to cut over-cooking waste', icon: Flame, color: 'text-amber-500' },
    { text: 'Set a FIFO reminder for dairy stock — milk turning daily', icon: Droplets, color: 'text-blue-500' },
    { text: 'Enable low-demand alerts on Friday to prevent over-ordering bread', icon: AlertTriangle, color: 'text-red-500' },
  ]

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
              Waste Management
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Track · Detect · Reduce food waste across all stages
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm shadow-sm shadow-emerald-500/30 transition-all active:scale-[0.97]"
        >
          <Plus className="w-4 h-4" /> Log Waste
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Total Waste Cost', value: formatCurrency(totalCost), sub: 'all time', icon: DollarSign, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-500/20' },
          { label: 'Weight Wasted', value: `${totalKg} kg`, sub: 'approx.', icon: Package, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/20' },
          { label: 'Top Waste Item', value: topWasteItem, sub: 'by cost', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-500/20' },
          { label: 'Entries Logged', value: logs.length, sub: 'events', icon: BarChart3, color: 'text-violet-500', bg: 'bg-violet-100 dark:bg-violet-500/20' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">{kpi.label}</p>
              <div className={cn('p-2 rounded-xl', kpi.bg)}>
                <kpi.icon className={cn('w-4 h-4', kpi.color)} />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white truncate">{kpi.value}</p>
            <p className="text-[10px] md:text-xs text-slate-400 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        {[['log', 'Waste Log'], ['analytics', 'Analytics']].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              activeTab === tab
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            )}>
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'log' ? (
          <motion.div key="log" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search item or reason..."
                  className="input pl-10 w-full"
                />
              </div>
              <div className="flex gap-1.5">
                {['all', ...STAGES].map(s => (
                  <button key={s} onClick={() => setFilterStage(s)}
                    className={cn(
                      'px-3 py-2 text-xs font-semibold rounded-lg capitalize transition-all',
                      filterStage === s
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      {['Item', 'Category', 'Qty', 'Reason', 'Stage', 'Est. Cost', 'Date', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    <AnimatePresence>
                      {filtered.map((log, i) => (
                        <motion.tr key={log.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{log.icon}</span>
                              <span className="text-sm font-semibold text-slate-800 dark:text-white">{log.item}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-1 rounded-full font-semibold"
                              style={{ backgroundColor: `${CATEGORY_COLORS[log.category]}20`, color: CATEGORY_COLORS[log.category] }}>
                              {log.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-slate-600 dark:text-slate-400">{log.qty} {log.unit}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{log.reason}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              'text-[10px] font-bold px-2 py-1 rounded-lg',
                              log.stage === 'Storage' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                                log.stage === 'Kitchen' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                                  'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'
                            )}>{log.stage}</span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-red-500">{formatCurrency(log.cost)}</td>
                          <td className="px-4 py-3 text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />{log.date}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleDelete(log.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="py-12 text-center text-slate-500">
                    <Trash2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No waste entries found. Keep it green! 🌱</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Weekly bar chart */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">Weekly Waste Cost</h3>
                <p className="text-xs text-slate-500 mb-5">Estimated cost of waste per day this week</p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={WEEKLY_WASTE} barSize={22}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.08} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 10, color: '#fff', fontSize: 12 }}
                        formatter={(v) => [`₹${v}`, 'Waste Cost']}
                      />
                      <Bar dataKey="cost" fill="#ef4444" radius={[6, 6, 0, 0]} fillOpacity={0.85} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category pie */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">By Category</h3>
                <p className="text-xs text-slate-500 mb-3">Waste cost distribution</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                        {categoryData.map(entry => (
                          <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 10, color: '#fff', fontSize: 12 }}
                        formatter={(v) => [`₹${v}`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 mt-2">
                  {categoryData.map(cd => (
                    <div key={cd.name} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cd.name] || '#94a3b8' }} />
                      <span className="text-slate-600 dark:text-slate-400 truncate flex-1">{cd.name}</span>
                      <span className="font-semibold text-slate-800 dark:text-white">₹{cd.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">AI Waste Reduction Tips</h3>
                  <p className="text-xs text-slate-500">Based on your waste patterns</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {RECS.map((rec, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <rec.icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', rec.color)} />
                    <p className="text-sm text-slate-700 dark:text-slate-300">{rec.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log Waste Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Log Waste Entry</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleLog} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">Item Name *</label>
                    <input required value={form.item} onChange={e => setForm({ ...form, item: e.target.value })}
                      placeholder="e.g. Tomatoes" className="input w-full" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">Category *</label>
                    <select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input w-full">
                      <option value="">Select...</option>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">Stage *</label>
                    <select required value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} className="input w-full">
                      {STAGES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">Quantity *</label>
                    <input required type="number" step="0.1" min="0" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })}
                      placeholder="0.0" className="input w-full" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">Unit</label>
                    <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="input w-full">
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">Reason *</label>
                    <select required value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="input w-full">
                      <option value="">Select...</option>
                      {STAGE_REASONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">Est. Cost (₹) *</label>
                    <input required type="number" min="0" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })}
                      placeholder="0" className="input w-full" />
                  </div>
                </div>
                <button type="submit" className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all">
                  <CheckCircle2 className="w-4 h-4" /> Log Waste Entry
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
