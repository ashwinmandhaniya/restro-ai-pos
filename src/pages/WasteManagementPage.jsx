import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trash2, Plus, Search, AlertTriangle, TrendingDown, Package,
  BarChart3, RefreshCw, X, Filter, Leaf, Flame, Droplets,
  ArrowDown, IndianRupee, CheckCircle2, ChevronRight, Clock,
  Brain, ShieldAlert, Activity, Zap, ThermometerSun
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import useUIStore from '@/store/uiStore'
import api from '@/lib/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

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
  const [logs, setLogs] = useState([])
  const [weeklyWaste, setWeeklyWaste] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [activeTab, setActiveTab] = useState('log') // 'log' | 'analytics' | 'ai'
  const [insights, setInsights] = useState(null)
  const [insightsLoading, setInsightsLoading] = useState(false)

  useEffect(() => {
    fetchWasteData()
    fetchInsights()
  }, [])

  const fetchWasteData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/tenant/waste')
      if (res.data.success) {
        setLogs(res.data.data.logs)
        // Reverse weeklyWaste so it reads Monday->Sunday or oldest->newest
        setWeeklyWaste(res.data.data.weeklyWaste.reverse())
      }
    } catch (error) {
      console.error('Failed to fetch waste data', error)
      addNotification({ type: 'error', title: 'Error', message: 'Failed to load waste records' })
    } finally {
      setLoading(false)
    }
  }

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

  const handleLog = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        qty: parseFloat(form.qty),
        cost: parseFloat(form.cost),
        date: new Date().toISOString().split('T')[0],
        icon: '📦'
      }
      
      const res = await api.post('/tenant/waste', payload)
      
      if (res.data?.success || res.data?._offline) {
        setForm(EMPTY_FORM)
        setShowModal(false)
        if (res.data?._offline) {
           addNotification({ type: 'warning', title: 'Offline Mode', message: res.data.message })
           // Optimistic UI update for offline mode
           const offlineEntry = { ...payload, _id: `offline-${Date.now()}` }
           setLogs([offlineEntry, ...logs])
        } else {
           setLogs([res.data.data, ...logs])
           addNotification({ type: 'success', title: 'Waste Logged', message: `${form.item} has been recorded in the waste log.` })
           fetchWasteData() // Refresh analytics
        }
      }
    } catch (error) {
      addNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to log waste' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tenant/waste/${id}`)
      setLogs(prev => prev.filter(l => l._id !== id && l.id !== id))
      addNotification({ type: 'info', title: 'Entry Removed', message: 'Waste log entry has been deleted.' })
      fetchWasteData() // Refresh analytics
    } catch (error) {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to delete entry' })
    }
  }

  const fetchInsights = async () => {
    setInsightsLoading(true)
    try {
      const res = await api.get('/tenant/waste/insights')
      if (res.data.success) setInsights(res.data.data)
    } catch (e) {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to load AI insights' })
    } finally {
      setInsightsLoading(false)
    }
  }

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
          { label: 'Total Waste Cost', value: formatCurrency(totalCost), sub: 'all time', icon: IndianRupee, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-500/20' },
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
        {[['log', 'Waste Log'], ['analytics', 'Analytics'], ['ai', '🧠 AI Brain']].map(([tab, label]) => (
          <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'ai' && !insights) fetchInsights() }}
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
                      {loading && logs.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-8">
                            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-slate-500 text-sm">Loading logs...</p>
                          </td>
                        </tr>
                      ) : filtered.map((log, i) => (
                        <motion.tr key={log._id || log.id}
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
                            <button onClick={() => handleDelete(log._id || log.id)}
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
        ) : activeTab === 'analytics' ? (
          <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Weekly bar chart */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">Weekly Waste Cost</h3>
                <p className="text-xs text-slate-500 mb-5">Estimated cost of waste per day this week</p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyWaste} barSize={22}>
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

            {/* AI Recommendations — now from live data */}
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
                {(insights?.recommendations || []).slice(0, 4).map((rec, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className={cn('flex items-start gap-3 p-3 rounded-xl border',
                      rec.type === 'danger' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-500/20' :
                      rec.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-500/20' :
                      rec.type === 'success' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-500/20' :
                      'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
                    )}>
                    {rec.type === 'danger' ? <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" /> :
                     rec.type === 'warning' ? <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" /> :
                     rec.type === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" /> :
                     <Zap className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />}
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{rec.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{rec.message}</p>
                    </div>
                  </motion.div>
                ))}
                {!insights && (
                  <p className="text-sm text-slate-400 col-span-2 text-center py-4">Loading AI insights...</p>
                )}
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'ai' ? (
          <motion.div key="ai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {insightsLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : insights ? (
              <>
                {/* Risk Score + Summary Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Risk Gauge */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col items-center">
                    <Brain className="w-8 h-8 text-violet-500 mb-2" />
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Waste Risk Score</p>
                    <div className="relative w-28 h-28">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                        <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(insights.riskScore / 100) * 264} 264`}
                          className={insights.riskScore > 60 ? 'text-red-500' : insights.riskScore > 35 ? 'text-amber-500' : 'text-emerald-500'} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={cn('text-3xl font-black', insights.riskScore > 60 ? 'text-red-500' : insights.riskScore > 35 ? 'text-amber-500' : 'text-emerald-500')}>
                          {insights.riskScore}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">/100</span>
                      </div>
                    </div>
                    <p className={cn('text-xs font-bold mt-2', insights.riskScore > 60 ? 'text-red-500' : insights.riskScore > 35 ? 'text-amber-500' : 'text-emerald-500')}>
                      {insights.riskScore > 60 ? 'HIGH RISK' : insights.riskScore > 35 ? 'MODERATE' : 'LOW RISK'}
                    </p>
                  </div>

                  {/* Trend Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className={cn('w-5 h-5', insights.summary.trend === 'rising' ? 'text-red-500' : insights.summary.trend === 'falling' ? 'text-emerald-500' : 'text-amber-500')} />
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Week-over-Week Trend</p>
                    </div>
                    <p className={cn('text-4xl font-black', insights.summary.trendPct > 0 ? 'text-red-500' : insights.summary.trendPct < 0 ? 'text-emerald-500' : 'text-slate-600')}>
                      {insights.summary.trendPct > 0 ? '+' : ''}{insights.summary.trendPct}%
                    </p>
                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      <p>This week: <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(insights.summary.thisWeekCost)}</span></p>
                      <p>Last week: <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(insights.summary.lastWeekCost)}</span></p>
                      <p>Avg daily: <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(insights.summary.avgDailyCost)}</span></p>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <p className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                      <ThermometerSun className="w-4 h-4 text-orange-500" /> 30-Day Summary
                    </p>
                    <div className="space-y-3">
                      {[
                        { l: 'Total Cost', v: formatCurrency(insights.summary.totalCost) },
                        { l: 'Total Weight', v: `${insights.summary.totalQty} kg` },
                        { l: 'Entries', v: insights.summary.totalEntries },
                        { l: 'Days Analyzed', v: insights.summary.daysAnalyzed },
                      ].map(s => (
                        <div key={s.l} className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">{s.l}</span>
                          <span className="text-sm font-bold text-slate-800 dark:text-white font-mono">{s.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Top Waste Items + Stage Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-500" /> Top Waste Items (by cost)
                    </h3>
                    <div className="space-y-2">
                      {(insights.topWasteItems || []).slice(0, 6).map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-400 w-4">{i + 1}.</span>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-semibold text-slate-800 dark:text-white">{item.item}</span>
                              <span className="text-xs font-bold text-red-500">{formatCurrency(item.totalCost)}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(100, (item.totalCost / (insights.topWasteItems[0]?.totalCost || 1)) * 100)}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-500" /> Waste by Stage
                    </h3>
                    <div className="space-y-3">
                      {(insights.stageAnalysis || []).map((s, i) => (
                        <div key={i}>
                          <div className="flex justify-between items-center mb-1">
                            <span className={cn('text-xs font-bold px-2 py-0.5 rounded-lg',
                              s.stage === 'Storage' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600' :
                              s.stage === 'Kitchen' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' :
                              'bg-violet-100 dark:bg-violet-500/20 text-violet-600'
                            )}>{s.stage}</span>
                            <span className="text-xs text-slate-500">{s.pct}% · {formatCurrency(s.totalCost)}</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full',
                              s.stage === 'Storage' ? 'bg-blue-400' : s.stage === 'Kitchen' ? 'bg-amber-400' : 'bg-violet-400'
                            )} style={{ width: `${s.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mt-5 mb-3 flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-500" /> Top Waste Reasons
                    </h3>
                    <div className="space-y-1.5">
                      {(insights.reasonAnalysis || []).slice(0, 5).map((r, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400">{r.reason}</span>
                          <span className="font-bold text-slate-800 dark:text-white">{r.count}× · {formatCurrency(r.totalCost)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Recommendations */}
                <div className="bg-gradient-to-br from-violet-50 to-emerald-50 dark:from-violet-900/10 dark:to-emerald-900/10 rounded-2xl border border-violet-200 dark:border-violet-500/20 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5 text-violet-600" />
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">AI Recommendations</h3>
                    <span className="text-[10px] px-2 py-0.5 bg-violet-200 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 rounded-full font-bold">
                      {insights.recommendations?.length || 0} insights
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(insights.recommendations || []).map((rec, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className={cn('flex items-start gap-3 p-4 rounded-xl border bg-white/80 dark:bg-slate-900/80 backdrop-blur',
                          rec.type === 'danger' ? 'border-red-200 dark:border-red-500/20' :
                          rec.type === 'warning' ? 'border-amber-200 dark:border-amber-500/20' :
                          rec.type === 'success' ? 'border-green-200 dark:border-green-500/20' :
                          'border-slate-200 dark:border-slate-700'
                        )}>
                        {rec.type === 'danger' ? <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" /> :
                         rec.type === 'warning' ? <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" /> :
                         rec.type === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" /> :
                         <Zap className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />}
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">{rec.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{rec.message}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Brain className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No insights available yet. Log waste entries to unlock AI analysis.</p>
              </div>
            )}
          </motion.div>
        ) : null}
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
