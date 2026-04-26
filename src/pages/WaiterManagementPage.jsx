import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, Plus, Star, TrendingUp, Clock, Award, Coins,
  ArrowUpRight, ArrowDownRight, Phone, Mail, Calendar, X, ChevronRight,
  BarChart3, Target, Zap, Gift, Crown, Medal, Shield, Edit3, Trash2,
  CheckCircle, XCircle, Eye, Filter, UserCheck, Coffee, Timer, HandCoins
} from 'lucide-react'
import { formatCurrency, cn, getInitials } from '@/lib/utils'
import useUIStore from '@/store/uiStore'

/* ─────────────────────────────────────────────────────────
   MOCK DATA — replace with API calls in production
───────────────────────────────────────────────────────── */
const MOCK_WAITERS = [
  { id: 1,  name: 'Raju Verma',     phone: '+91 98765 43210', email: 'raju@restaurant.com',   role: 'Senior Waiter', shift: 'Morning', status: 'active',   avatar: '👨', joinDate: '2024-03-15', rating: 4.8, ordersToday: 18, ordersMonth: 342, revenueMonth: 142000, rewardPoints: 2850, tips: 4200, tables: ['T1', 'T2', 'T5', 'T8'], attendance: 96 },
  { id: 2,  name: 'Suresh Kumar',   phone: '+91 87654 32109', email: 'suresh@restaurant.com', role: 'Waiter',        shift: 'Morning', status: 'active',   avatar: '👨', joinDate: '2024-06-01', rating: 4.5, ordersToday: 15, ordersMonth: 298, revenueMonth: 118000, rewardPoints: 2100, tips: 3500, tables: ['T3', 'T4', 'T6'],       attendance: 92 },
  { id: 3,  name: 'Amit Sharma',    phone: '+91 76543 21098', email: 'amit@restaurant.com',   role: 'Waiter',        shift: 'Evening', status: 'active',   avatar: '👨', joinDate: '2024-08-20', rating: 4.7, ordersToday: 12, ordersMonth: 265, revenueMonth: 96000,  rewardPoints: 1780, tips: 2900, tables: ['T7', 'T9', 'T10'],     attendance: 94 },
  { id: 4,  name: 'Deepak Singh',   phone: '+91 65432 10987', email: 'deepak@restaurant.com', role: 'Waiter',        shift: 'Evening', status: 'active',   avatar: '👨', joinDate: '2025-01-10', rating: 4.3, ordersToday: 10, ordersMonth: 210, revenueMonth: 82000,  rewardPoints: 1200, tips: 2100, tables: ['T11', 'T12'],          attendance: 88 },
  { id: 5,  name: 'Priya Patel',    phone: '+91 54321 09876', email: 'priya@restaurant.com',  role: 'Head Waiter',   shift: 'Morning', status: 'active',   avatar: '👩', joinDate: '2023-11-05', rating: 4.9, ordersToday: 22, ordersMonth: 410, revenueMonth: 186000, rewardPoints: 4200, tips: 6100, tables: ['T1', 'T2', 'T3', 'T4'], attendance: 98 },
  { id: 6,  name: 'Neha Gupta',     phone: '+91 43210 98765', email: 'neha@restaurant.com',   role: 'Waiter',        shift: 'Split',   status: 'active',   avatar: '👩', joinDate: '2025-02-15', rating: 4.6, ordersToday: 14, ordersMonth: 280, revenueMonth: 105000, rewardPoints: 1650, tips: 3200, tables: ['T5', 'T6', 'T13'],     attendance: 91 },
  { id: 7,  name: 'Vikram Rao',     phone: '+91 32109 87654', email: 'vikram@restaurant.com', role: 'Waiter',        shift: 'Morning', status: 'on_leave', avatar: '👨', joinDate: '2024-10-12', rating: 4.4, ordersToday: 0,  ordersMonth: 180, revenueMonth: 68000,  rewardPoints: 980,  tips: 1800, tables: [],                     attendance: 85 },
  { id: 8,  name: 'Kavita Devi',    phone: '+91 21098 76543', email: 'kavita@restaurant.com', role: 'Trainee',       shift: 'Evening', status: 'active',   avatar: '👩', joinDate: '2026-01-20', rating: 4.1, ordersToday: 6,  ordersMonth: 120, revenueMonth: 42000,  rewardPoints: 450,  tips: 900,  tables: ['T14', 'T15'],          attendance: 90 },
]

const MOCK_REWARD_HISTORY = [
  { id: 1, waiter: 'Priya Patel',   type: 'earn',   points: 50,  reason: '5-star customer review',    time: '10 min ago' },
  { id: 2, waiter: 'Raju Verma',    type: 'earn',   points: 30,  reason: 'Upselling bonus',           time: '25 min ago' },
  { id: 3, waiter: 'Suresh Kumar',  type: 'redeem', points: 500, reason: 'Redeemed: Extra Day Off',   time: '1 hr ago' },
  { id: 4, waiter: 'Amit Sharma',   type: 'earn',   points: 20,  reason: 'Perfect attendance week',   time: '2 hrs ago' },
  { id: 5, waiter: 'Neha Gupta',    type: 'earn',   points: 100, reason: 'Monthly top performer',     time: '3 hrs ago' },
  { id: 6, waiter: 'Deepak Singh',  type: 'deduct', points: 25,  reason: 'Late arrival penalty',      time: '5 hrs ago' },
  { id: 7, waiter: 'Priya Patel',   type: 'earn',   points: 40,  reason: 'Table turnover bonus',      time: '6 hrs ago' },
  { id: 8, waiter: 'Raju Verma',    type: 'redeem', points: 300, reason: 'Redeemed: ₹500 Bonus',     time: '1 day ago' },
]

const REWARD_CATALOG = [
  { id: 1, name: 'Extra Day Off',     points: 500,  icon: '🏖️', category: 'time_off' },
  { id: 2, name: '₹500 Cash Bonus',   points: 300,  icon: '💰', category: 'cash' },
  { id: 3, name: '₹1000 Cash Bonus',  points: 550,  icon: '💵', category: 'cash' },
  { id: 4, name: 'Free Meal Coupon',   points: 100,  icon: '🍽️', category: 'food' },
  { id: 5, name: 'Employee of Month',  points: 1000, icon: '🏆', category: 'recognition' },
  { id: 6, name: 'Uniform Upgrade',    points: 400,  icon: '👔', category: 'perk' },
  { id: 7, name: 'Skill Training',     points: 750,  icon: '📚', category: 'growth' },
  { id: 8, name: 'Weekend Bonus Shift', points: 200, icon: '⏰', category: 'earning' },
]

const SHIFT_COLORS = {
  Morning: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  Evening: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400',
  Split:   'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
  Night:   'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
}

const STATUS_CONFIG = {
  active:   { label: 'Active',   color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400', dot: 'bg-green-500' },
  on_leave: { label: 'On Leave', color: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  inactive: { label: 'Inactive', color: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',         dot: 'bg-red-500' },
}

/* ─────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────── */
export default function WaiterManagementPage() {
  const [activeTab, setActiveTab] = useState('team')
  const [search, setSearch] = useState('')
  const [shiftFilter, setShiftFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedWaiter, setSelectedWaiter] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAdjustPoints, setShowAdjustPoints] = useState(null)
  const [addForm, setAddForm] = useState({ name: '', phone: '', email: '', role: 'Waiter', shift: 'Morning' })
  const [pointsForm, setPointsForm] = useState({ points: '', reason: '' })
  const [waiters, setWaiters] = useState(MOCK_WAITERS)

  const { addNotification, confirmAction } = useUIStore()

  // Computed
  const totalWaiters = waiters.length
  const activeWaiters = waiters.filter(w => w.status === 'active').length
  const totalRewardPoints = waiters.reduce((s, w) => s + w.rewardPoints, 0)
  const avgRating = (waiters.reduce((s, w) => s + w.rating, 0) / totalWaiters).toFixed(1)
  const todayOrders = waiters.reduce((s, w) => s + w.ordersToday, 0)
  const monthRevenue = waiters.reduce((s, w) => s + w.revenueMonth, 0)

  const filtered = waiters.filter(w => {
    const matchSearch = w.name.toLowerCase().includes(search.toLowerCase()) || w.phone.includes(search)
    const matchShift = shiftFilter === 'all' || w.shift === shiftFilter
    const matchStatus = statusFilter === 'all' || w.status === statusFilter
    return matchSearch && matchShift && matchStatus
  }).sort((a, b) => b.ordersMonth - a.ordersMonth)

  const handleAddWaiter = (e) => {
    e.preventDefault()
    const newWaiter = {
      id: Date.now(),
      ...addForm,
      status: 'active', avatar: '👤', joinDate: new Date().toISOString().split('T')[0],
      rating: 0, ordersToday: 0, ordersMonth: 0, revenueMonth: 0,
      rewardPoints: 0, tips: 0, tables: [], attendance: 100
    }
    setWaiters([newWaiter, ...waiters])
    setShowAddModal(false)
    setAddForm({ name: '', phone: '', email: '', role: 'Waiter', shift: 'Morning' })
    addNotification({ type: 'success', title: 'Waiter Added', message: `${newWaiter.name} has been registered` })
  }

  const handleAdjustPoints = (type) => {
    if (!pointsForm.points || Number(pointsForm.points) <= 0) return
    const pts = type === 'add' ? Number(pointsForm.points) : -Number(pointsForm.points)
    setWaiters(waiters.map(w => w.id === showAdjustPoints.id
      ? { ...w, rewardPoints: Math.max(0, w.rewardPoints + pts) }
      : w
    ))
    addNotification({
      type: pts > 0 ? 'success' : 'info',
      title: 'Points Updated',
      message: `${showAdjustPoints.name}: ${pts > 0 ? '+' : ''}${pts} pts — ${pointsForm.reason || 'Manual adjustment'}`
    })
    setShowAdjustPoints(null)
    setPointsForm({ points: '', reason: '' })
  }

  const handleDeleteWaiter = async (waiter) => {
    const ok = await confirmAction({
      title: 'Remove Waiter',
      message: `Are you sure you want to remove ${waiter.name}?`,
      confirmText: 'Remove'
    })
    if (ok) {
      setWaiters(waiters.filter(w => w.id !== waiter.id))
      if (selectedWaiter?.id === waiter.id) setSelectedWaiter(null)
      addNotification({ type: 'success', title: 'Waiter Removed', message: waiter.name })
    }
  }

  const TABS = [
    { id: 'team',       label: 'Team',       icon: Users },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'rewards',    label: 'Reward Points', icon: Award },
  ]

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-blue-500" />
            Waiter Management
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">Manage your floor staff, track performance & rewards</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
          <Plus className="w-4 h-4 mr-1" /> Add Waiter
        </button>
      </div>

      {/* ═══ STATS BAR ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Staff',     value: totalWaiters,                    icon: Users,       color: 'from-blue-500 to-blue-600' },
          { label: 'Active Now',      value: activeWaiters,                   icon: CheckCircle, color: 'from-green-500 to-green-600' },
          { label: 'Orders Today',    value: todayOrders,                     icon: Target,      color: 'from-violet-500 to-violet-600' },
          { label: 'Month Revenue',   value: formatCurrency(monthRevenue),    icon: TrendingUp,  color: 'from-emerald-500 to-emerald-600' },
          { label: 'Avg Rating',      value: `${avgRating} ★`,               icon: Star,        color: 'from-amber-500 to-amber-600' },
          { label: 'Reward Pool',     value: totalRewardPoints.toLocaleString() + ' pts', icon: Coins, color: 'from-rose-500 to-rose-600' },
        ].map((stat, i) => (
          <div key={i} className="card p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-surface-500 uppercase tracking-wider font-semibold">{stat.label}</p>
              <p className="text-base font-extrabold text-surface-900 dark:text-white truncate">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ TABS ═══ */}
      <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
              activeTab === tab.id
                ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm'
                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <AnimatePresence mode="wait">
        {/* ─── TEAM TAB ─── */}
        {activeTab === 'team' && (
          <motion.div key="team" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or phone..." className="input pl-10" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {['all', 'Morning', 'Evening', 'Split'].map(shift => (
                  <button key={shift} onClick={() => setShiftFilter(shift)}
                    className={cn('px-3 py-2 rounded-lg text-xs font-bold transition-all',
                      shiftFilter === shift
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                    )}>
                    {shift === 'all' ? '🕐 All Shifts' : `${shift === 'Morning' ? '🌅' : shift === 'Evening' ? '🌆' : '🔄'} ${shift}`}
                  </button>
                ))}
                <div className="w-px h-6 bg-surface-200 dark:bg-surface-700 mx-1" />
                {['all', 'active', 'on_leave'].map(st => (
                  <button key={st} onClick={() => setStatusFilter(st)}
                    className={cn('px-3 py-2 rounded-lg text-xs font-bold transition-all',
                      statusFilter === st
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
                    )}>
                    {st === 'all' ? 'All' : STATUS_CONFIG[st]?.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Waiter Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((waiter, i) => {
                const st = STATUS_CONFIG[waiter.status] || STATUS_CONFIG.active
                return (
                  <motion.div
                    key={waiter.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedWaiter(waiter)}
                    className="card p-5 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
                  >
                    {/* Status dot */}
                    <div className={cn('absolute top-4 right-4 w-3 h-3 rounded-full', st.dot)} />

                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-2xl shadow-md">
                        {waiter.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-surface-900 dark:text-white truncate">{waiter.name}</h3>
                        <p className="text-xs text-surface-500">{waiter.role}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', SHIFT_COLORS[waiter.shift] || SHIFT_COLORS.Morning)}>
                            {waiter.shift}
                          </span>
                          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', st.color)}>
                            {st.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: 'Today', value: waiter.ordersToday, accent: false },
                        { label: 'Month', value: waiter.ordersMonth, accent: false },
                        { label: 'Rating', value: `${waiter.rating}★`, accent: true },
                        { label: 'Points', value: waiter.rewardPoints, accent: true },
                      ].map((m, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-surface-50 dark:bg-surface-800">
                          <p className="text-[9px] text-surface-500 uppercase tracking-wider">{m.label}</p>
                          <p className={cn('text-sm font-extrabold font-mono', m.accent && 'text-amber-600 dark:text-amber-400')}>
                            {typeof m.value === 'number' ? m.value.toLocaleString() : m.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {waiter.tables.slice(0, 4).map(t => (
                          <span key={t} className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                            {t}
                          </span>
                        ))}
                        {waiter.tables.length > 4 && (
                          <span className="text-[9px] text-surface-400">+{waiter.tables.length - 4}</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowAdjustPoints(waiter) }}
                        className="px-3 py-1.5 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold text-[10px] rounded-lg hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors border border-violet-100 dark:border-violet-500/20"
                      >
                        <Coins className="w-3 h-3 inline mr-1" />Points
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-surface-400">
                <Users className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-base font-semibold">No waiters found</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── PERFORMANCE TAB ─── */}
        {activeTab === 'performance' && (
          <motion.div key="performance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Leaderboard */}
            <div className="card p-6">
              <h3 className="text-base font-bold dark:text-white mb-5 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                Performance Leaderboard
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="pb-3 text-xs font-bold text-surface-500 uppercase tracking-wider">Rank</th>
                      <th className="pb-3 text-xs font-bold text-surface-500 uppercase tracking-wider">Waiter</th>
                      <th className="pb-3 text-xs font-bold text-surface-500 uppercase tracking-wider">Shift</th>
                      <th className="pb-3 text-xs font-bold text-surface-500 uppercase tracking-wider text-center">Orders (Month)</th>
                      <th className="pb-3 text-xs font-bold text-surface-500 uppercase tracking-wider text-center">Revenue</th>
                      <th className="pb-3 text-xs font-bold text-surface-500 uppercase tracking-wider text-center">Rating</th>
                      <th className="pb-3 text-xs font-bold text-surface-500 uppercase tracking-wider text-center">Attendance</th>
                      <th className="pb-3 text-xs font-bold text-surface-500 uppercase tracking-wider text-center">Tips</th>
                      <th className="pb-3 text-xs font-bold text-surface-500 uppercase tracking-wider text-center">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                    {[...waiters]
                      .sort((a, b) => {
                        const scoreA = a.ordersMonth * 0.3 + a.rating * 20 + a.attendance * 0.5
                        const scoreB = b.ordersMonth * 0.3 + b.rating * 20 + b.attendance * 0.5
                        return scoreB - scoreA
                      })
                      .map((w, i) => {
                        const score = Math.round(w.ordersMonth * 0.3 + w.rating * 20 + w.attendance * 0.5)
                        return (
                          <tr key={w.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                            <td className="py-3.5 pr-3">
                              <div className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold',
                                i === 0 && 'bg-amber-100 dark:bg-amber-900/20 text-amber-600',
                                i === 1 && 'bg-gray-100 dark:bg-gray-900/20 text-gray-500',
                                i === 2 && 'bg-orange-100 dark:bg-orange-900/20 text-orange-600',
                                i > 2 && 'bg-surface-100 dark:bg-surface-800 text-surface-500'
                              )}>
                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                              </div>
                            </td>
                            <td className="py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-lg">
                                  {w.avatar}
                                </div>
                                <div>
                                  <p className="text-sm font-bold dark:text-white">{w.name}</p>
                                  <p className="text-xs text-surface-500">{w.role}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5">
                              <span className={cn('px-2 py-1 rounded-full text-[10px] font-bold', SHIFT_COLORS[w.shift])}>
                                {w.shift}
                              </span>
                            </td>
                            <td className="py-3.5 text-center">
                              <span className="text-sm font-bold font-mono">{w.ordersMonth}</span>
                            </td>
                            <td className="py-3.5 text-center">
                              <span className="text-sm font-bold font-mono text-green-600 dark:text-green-400">{formatCurrency(w.revenueMonth)}</span>
                            </td>
                            <td className="py-3.5 text-center">
                              <span className="text-sm font-bold font-mono text-amber-600">
                                {w.rating} <Star className="w-3 h-3 inline -mt-0.5 fill-amber-500 text-amber-500" />
                              </span>
                            </td>
                            <td className="py-3.5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                                  <div className={cn('h-full rounded-full', w.attendance >= 95 ? 'bg-green-500' : w.attendance >= 90 ? 'bg-amber-500' : 'bg-red-500')}
                                    style={{ width: `${w.attendance}%` }} />
                                </div>
                                <span className="text-xs font-mono font-bold">{w.attendance}%</span>
                              </div>
                            </td>
                            <td className="py-3.5 text-center">
                              <span className="text-sm font-bold font-mono text-violet-600 dark:text-violet-400">{formatCurrency(w.tips)}</span>
                            </td>
                            <td className="py-3.5 text-center">
                              <div className={cn(
                                'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold',
                                score >= 200 ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                                score >= 150 ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' :
                                'bg-surface-100 dark:bg-surface-800 text-surface-600'
                              )}>
                                <Zap className="w-3 h-3" />{score}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-5 border-l-4 border-green-500">
                <h4 className="text-sm font-bold text-green-700 dark:text-green-400 mb-2">🎯 Top Performer</h4>
                <p className="text-xl font-extrabold dark:text-white">
                  {[...waiters].sort((a, b) => b.ordersMonth - a.ordersMonth)[0]?.name}
                </p>
                <p className="text-xs text-surface-500 mt-1">
                  {[...waiters].sort((a, b) => b.ordersMonth - a.ordersMonth)[0]?.ordersMonth} orders this month
                </p>
              </div>
              <div className="card p-5 border-l-4 border-amber-500">
                <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-2">⭐ Highest Rated</h4>
                <p className="text-xl font-extrabold dark:text-white">
                  {[...waiters].sort((a, b) => b.rating - a.rating)[0]?.name}
                </p>
                <p className="text-xs text-surface-500 mt-1">
                  {[...waiters].sort((a, b) => b.rating - a.rating)[0]?.rating} / 5.0 rating
                </p>
              </div>
              <div className="card p-5 border-l-4 border-violet-500">
                <h4 className="text-sm font-bold text-violet-700 dark:text-violet-400 mb-2">💰 Top Earner (Tips)</h4>
                <p className="text-xl font-extrabold dark:text-white">
                  {[...waiters].sort((a, b) => b.tips - a.tips)[0]?.name}
                </p>
                <p className="text-xs text-surface-500 mt-1">
                  {formatCurrency([...waiters].sort((a, b) => b.tips - a.tips)[0]?.tips)} in tips
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── REWARDS TAB ─── */}
        {activeTab === 'rewards' && (
          <motion.div key="rewards" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Rewards Banner */}
            <div className="card p-6 bg-gradient-to-r from-violet-500 to-purple-600 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-20 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />
              <div className="relative">
                <h3 className="text-xl font-extrabold flex items-center gap-2">
                  <Award className="w-6 h-6" />
                  Staff Reward Point System
                </h3>
                <p className="text-sm opacity-80 mt-1">Motivate your team with points for performance, attendance, and customer satisfaction</p>
                <div className="flex items-center gap-8 mt-4">
                  <div>
                    <p className="text-2xl font-extrabold">{totalRewardPoints.toLocaleString()}</p>
                    <p className="text-xs opacity-70">Total Points Active</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold">{REWARD_CATALOG.length}</p>
                    <p className="text-xs opacity-70">Redeemable Rewards</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold">23</p>
                    <p className="text-xs opacity-70">Redeemed This Month</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Points Leaderboard */}
              <div className="lg:col-span-2 card p-6">
                <h3 className="text-base font-bold dark:text-white mb-4 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  Points Leaderboard
                </h3>
                <div className="space-y-3">
                  {[...waiters].sort((a, b) => b.rewardPoints - a.rewardPoints).map((w, i) => (
                    <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0',
                        i === 0 && 'bg-amber-100 text-amber-600',
                        i === 1 && 'bg-gray-100 text-gray-500',
                        i === 2 && 'bg-orange-100 text-orange-600',
                        i > 2 && 'bg-surface-100 dark:bg-surface-700 text-surface-500'
                      )}>
                        {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-base flex-shrink-0">
                        {w.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold dark:text-white truncate">{w.name}</p>
                        <p className="text-[10px] text-surface-500">{w.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold font-mono text-amber-600 dark:text-amber-400">{w.rewardPoints.toLocaleString()}</p>
                        <p className="text-[9px] text-surface-400">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Feed */}
              <div className="lg:col-span-3 card p-6">
                <h3 className="text-base font-bold dark:text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Points Activity
                </h3>
                <div className="space-y-2 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
                  {MOCK_REWARD_HISTORY.map((act) => (
                    <div key={act.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                        act.type === 'earn'   && 'bg-green-100 dark:bg-green-900/20',
                        act.type === 'redeem' && 'bg-violet-100 dark:bg-violet-900/20',
                        act.type === 'deduct' && 'bg-red-100 dark:bg-red-900/20',
                      )}>
                        {act.type === 'earn' && <ArrowUpRight className="w-5 h-5 text-green-600" />}
                        {act.type === 'redeem' && <Gift className="w-5 h-5 text-violet-600" />}
                        {act.type === 'deduct' && <ArrowDownRight className="w-5 h-5 text-red-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold dark:text-white truncate">{act.waiter}</p>
                        <p className="text-xs text-surface-500">{act.reason}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={cn(
                          'text-sm font-bold font-mono',
                          act.type === 'earn' ? 'text-green-600' : act.type === 'redeem' ? 'text-violet-600' : 'text-red-600'
                        )}>
                          {act.type === 'earn' ? '+' : '-'}{act.points} pts
                        </p>
                        <p className="text-[10px] text-surface-400">{act.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rewards Catalog */}
            <div className="card p-6">
              <h3 className="text-base font-bold dark:text-white mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5 text-violet-500" />
                Redeemable Rewards
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {REWARD_CATALOG.map((reward, i) => (
                  <motion.div key={reward.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer border-2 border-transparent hover:border-violet-200 dark:hover:border-violet-500/30 text-center"
                  >
                    <div className="text-3xl mb-2">{reward.icon}</div>
                    <h4 className="text-xs font-bold dark:text-white leading-tight">{reward.name}</h4>
                    <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                      <Coins className="w-3 h-3" />
                      <span className="text-xs font-extrabold font-mono">{reward.points}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ WAITER DETAIL DRAWER ═══ */}
      <AnimatePresence>
        {selectedWaiter && (
          <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedWaiter(null)}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-white dark:bg-surface-900 shadow-2xl overflow-y-auto"
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-700 text-white relative">
                <button onClick={() => setSelectedWaiter(null)} className="absolute top-4 right-4 p-2 rounded-xl bg-white/20 hover:bg-white/30">
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl backdrop-blur-sm">
                    {selectedWaiter.avatar}
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold">{selectedWaiter.name}</h3>
                    <p className="text-sm opacity-80">{selectedWaiter.role}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-sm">
                        {selectedWaiter.shift} Shift
                      </span>
                      <span className={cn('px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm',
                        selectedWaiter.status === 'active' ? 'bg-green-500/30' : 'bg-amber-500/30'
                      )}>
                        {STATUS_CONFIG[selectedWaiter.status]?.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Contact */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-surface-400" />
                    <span className="dark:text-surface-300">{selectedWaiter.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-surface-400" />
                    <span className="dark:text-surface-300">{selectedWaiter.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-surface-400" />
                    <span className="dark:text-surface-300">Joined: {selectedWaiter.joinDate}</span>
                  </div>
                </div>

                {/* Points Balance */}
                <div className="text-center p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200/50 dark:border-amber-500/20">
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Reward Points</p>
                  <p className="text-4xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
                    {selectedWaiter.rewardPoints.toLocaleString()}
                  </p>
                  <button onClick={() => setShowAdjustPoints(selectedWaiter)}
                    className="mt-3 px-5 py-2 bg-violet-600 text-white font-bold text-sm rounded-xl hover:bg-violet-700 active:scale-95 transition-all shadow-lg shadow-violet-500/25">
                    <Coins className="w-4 h-4 inline mr-1.5" />Adjust Points
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Orders Today', value: selectedWaiter.ordersToday, icon: Target },
                    { label: 'Orders (Month)', value: selectedWaiter.ordersMonth, icon: BarChart3 },
                    { label: 'Revenue (Month)', value: formatCurrency(selectedWaiter.revenueMonth), icon: TrendingUp },
                    { label: 'Tips Earned', value: formatCurrency(selectedWaiter.tips), icon: HandCoins },
                    { label: 'Customer Rating', value: `${selectedWaiter.rating} / 5.0`, icon: Star },
                    { label: 'Attendance', value: `${selectedWaiter.attendance}%`, icon: CheckCircle },
                  ].map((stat, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                      <div className="flex items-center gap-1.5 mb-1">
                        <stat.icon className="w-3 h-3 text-surface-400" />
                        <p className="text-[10px] text-surface-500 uppercase tracking-wider">{stat.label}</p>
                      </div>
                      <p className="text-base font-extrabold font-mono dark:text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Assigned Tables */}
                <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                  <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Assigned Tables</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedWaiter.tables.length > 0 ? selectedWaiter.tables.map(t => (
                      <span key={t} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold text-sm rounded-lg border border-blue-100 dark:border-blue-500/20">
                        {t}
                      </span>
                    )) : <p className="text-sm text-surface-400">No tables assigned</p>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button onClick={() => handleDeleteWaiter(selectedWaiter)}
                    className="flex-1 py-3 rounded-xl border-2 border-red-200 dark:border-red-800 text-red-500 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 transition-all">
                    <Trash2 className="w-4 h-4 inline mr-1" />Remove
                  </button>
                  <button className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-blue-500/25">
                    <Edit3 className="w-4 h-4 inline mr-1" />Edit Details
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ ADD WAITER MODAL ═══ */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-md p-6 border border-surface-200 dark:border-surface-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-500" />Add Waiter
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddWaiter} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block dark:text-surface-300">Full Name *</label>
                  <input required placeholder="e.g. Raju Verma" className="input"
                    value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block dark:text-surface-300">Phone *</label>
                    <input required type="tel" placeholder="+91..." className="input"
                      value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block dark:text-surface-300">Email</label>
                    <input type="email" placeholder="email@..." className="input"
                      value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block dark:text-surface-300">Role</label>
                    <select className="input" value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })}>
                      <option>Trainee</option>
                      <option>Waiter</option>
                      <option>Senior Waiter</option>
                      <option>Head Waiter</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block dark:text-surface-300">Shift</label>
                    <select className="input" value={addForm.shift} onChange={e => setAddForm({ ...addForm, shift: e.target.value })}>
                      <option>Morning</option>
                      <option>Evening</option>
                      <option>Split</option>
                      <option>Night</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full btn-primary mt-2">Register Waiter</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ ADJUST POINTS MODAL ═══ */}
      <AnimatePresence>
        {showAdjustPoints && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => { setShowAdjustPoints(null); setPointsForm({ points: '', reason: '' }) }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-md p-6 border border-surface-200 dark:border-surface-800">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold dark:text-white">Adjust Reward Points</h3>
                  <p className="text-sm text-surface-500">for {showAdjustPoints.name}</p>
                </div>
                <button onClick={() => { setShowAdjustPoints(null); setPointsForm({ points: '', reason: '' }) }}
                  className="p-2 rounded-lg text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center p-4 bg-surface-50 dark:bg-surface-800 rounded-xl mb-4">
                <p className="text-sm text-surface-500 mb-1">Current Balance</p>
                <p className="text-3xl font-black text-violet-600 dark:text-violet-400 font-mono">{showAdjustPoints.rewardPoints.toLocaleString()}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block dark:text-surface-300">Points</label>
                  <input type="number" min="1" placeholder="e.g. 50" className="input"
                    value={pointsForm.points} onChange={e => setPointsForm({ ...pointsForm, points: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block dark:text-surface-300">Reason</label>
                  <input type="text" placeholder="e.g. Upselling bonus" className="input"
                    value={pointsForm.reason} onChange={e => setPointsForm({ ...pointsForm, reason: e.target.value })} />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['5-star review', 'Upselling', 'Perfect attendance', 'Late penalty', 'Monthly bonus'].map(r => (
                      <button key={r} type="button" onClick={() => setPointsForm({ ...pointsForm, reason: r })}
                        className={cn('px-2 py-1 rounded-lg text-[10px] font-bold transition-all',
                          pointsForm.reason === r
                            ? 'bg-violet-500 text-white'
                            : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                        )}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => handleAdjustPoints('deduct')} disabled={!pointsForm.points}
                    className="flex-1 py-3 text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition disabled:opacity-40 border border-red-100 dark:border-red-500/20">
                    – Deduct
                  </button>
                  <button onClick={() => handleAdjustPoints('add')} disabled={!pointsForm.points}
                    className="flex-1 py-3 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition disabled:opacity-40 border border-emerald-100 dark:border-emerald-500/20">
                    + Add
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
