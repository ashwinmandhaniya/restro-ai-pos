import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, UserCheck, Clock, Star, Target, Coffee, Timer, Award,
  CheckCircle, AlertTriangle, Maximize, Minimize, Volume2, VolumeX,
  Zap, TrendingUp, Phone, MapPin, ShoppingBag, RefreshCw,
  ChefHat, Crown, HandCoins, ArrowUpRight, Sparkles
} from 'lucide-react'
import { cn, formatCurrency, formatTime, getInitials } from '@/lib/utils'
import useUIStore from '@/store/uiStore'
import api from '@/lib/api'

/* ─────────────────────────────────────────────────────────
   LIVE DATA — Using Backend API & Socket Events
───────────────────────────────────────────────────────── */


const STATUS_CONFIG = {
  serving:   { label: 'Serving',    bg: 'bg-primary-500',  glow: 'shadow-primary-500/40',  text: 'text-primary-600 dark:text-primary-400',  border: 'border-primary-500',  bgLight: 'bg-primary-500/10', dot: 'bg-primary-500' },
  available: { label: 'Available',  bg: 'bg-green-500',    glow: 'shadow-green-500/40',    text: 'text-green-600 dark:text-green-500',      border: 'border-green-500',    bgLight: 'bg-green-500/10',   dot: 'bg-green-500 animate-pulse' },
  on_break:  { label: 'On Break',   bg: 'bg-amber-500',    glow: 'shadow-amber-500/40',    text: 'text-amber-600 dark:text-amber-500',      border: 'border-amber-500',    bgLight: 'bg-amber-500/10',   dot: 'bg-amber-500' },
  on_leave:  { label: 'Off Duty',   bg: 'bg-surface-500',  glow: 'shadow-surface-500/20',  text: 'text-surface-600 dark:text-surface-500',  border: 'border-surface-400 dark:border-surface-600', bgLight: 'bg-surface-500/10', dot: 'bg-surface-500' },
}

const ORDER_STATUS_CONFIG = {
  new:       { label: 'New',       color: 'bg-primary-500',   text: 'text-primary-600 dark:text-primary-400' },
  preparing: { label: 'Preparing', color: 'bg-amber-500',     text: 'text-amber-600 dark:text-amber-400' },
  serving:   { label: 'Serving',   color: 'bg-violet-500',    text: 'text-violet-600 dark:text-violet-400' },
  billing:   { label: 'Billing',   color: 'bg-emerald-500',   text: 'text-emerald-600 dark:text-emerald-400' },
  served:    { label: 'Completed', color: 'bg-green-500/40',  text: 'text-green-600/60 dark:text-green-400/60' },
}

const SHIFT_STYLES = {
  Morning: { icon: '🌅', bg: 'bg-amber-100 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/20' },
  Evening: { icon: '🌆', bg: 'bg-indigo-100 dark:bg-indigo-500/15', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-500/20' },
  Split:   { icon: '🔄', bg: 'bg-emerald-100 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/20' },
  Night:   { icon: '🌙', bg: 'bg-purple-100 dark:bg-purple-500/15', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-500/20' },
}

/* ─────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────── */
export default function WaiterDisplayPage() {
  const [waiters, setWaiters] = useState([])
  const [liveOrders, setLiveOrders] = useState([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [viewMode, setViewMode] = useState('floor') // 'floor' | 'leaderboard'
  const [selectedShift, setSelectedShift] = useState('all')

  const { socket } = useUIStore()

  // Fetch initial data
  useEffect(() => {
    fetchData()
  }, [])

  // Socket IO real-time tracking
  useEffect(() => {
    if (!socket) return;
    
    const handleWaiterUpdate = (updatedWaiter) => {
      // Map schema structure flattening if it comes directly via mongoose document
      const p = updatedWaiter.waiterProfile || {};
      const mapped = {
        id: updatedWaiter._id || updatedWaiter.id,
        name: updatedWaiter.name,
        email: updatedWaiter.email,
        phone: updatedWaiter.phone || "",
        role: updatedWaiter.role,
        shift: p.shift || "Morning",
        status: p.status || "available",
        tables: p.tables || [],
        rewardPoints: p.rewardPoints || 0,
        tips: p.tips || 0,
        attendance: p.attendance || 100,
        rating: p.rating || 0,
        ordersCompleted: p.ordersCompleted || 0,
        activeOrders: p.activeOrders || 0,
        lastAction: p.lastAction || "",
        lastActionTime: p.lastActionTime || null,
        avatar: "👨"
      };

      setWaiters(prev => {
        const curIdx = prev.findIndex(w => w.id === mapped.id)
        if (curIdx > -1) {
          const nw = [...prev];
          nw[curIdx] = mapped;
          return nw;
        }
        return [...prev, mapped]
      });
    }

    const handleOrderUpdate = () => {
      fetchData(); // Simplest way to sync state consistency across the dashboard
    }

    socket.on('waiter_update', handleWaiterUpdate)
    socket.on('order:updated', handleOrderUpdate)
    socket.on('order:new', handleOrderUpdate)

    return () => {
      socket.off('waiter_update', handleWaiterUpdate)
      socket.off('order:updated', handleOrderUpdate)
      socket.off('order:new', handleOrderUpdate)
    }
  }, [socket])

  const fetchData = async () => {
    try {
      const waitRes = await api.get('/tenant/waiters')
      setWaiters(waitRes.data.data || [])

      const orderRes = await api.get('/orders?status=active')
      const ordersRaw = orderRes.data.data || []
      const orders = ordersRaw.map(o => ({
        id: o._id,
        waiter: o.waiterId?.name || 'Unassigned',
        table: o.tableId?.name || o.tableId?.number || 'T?',
        items: o.items?.length || 0,
        status: o.status === 'active' ? 'preparing' : o.status,
        time: formatTime(o.createdAt || new Date())
      }))
      setLiveOrders(orders)
    } catch (error) {
      console.error('WaiterDisplayPage fetch error:', error)
    }
  }

  // Clock updater
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Computed stats
  const filteredWaiters = useMemo(() => {
    if (selectedShift === 'all') return waiters
    return waiters.filter(w => w.shift === selectedShift)
  }, [selectedShift, waiters])

  const stats = useMemo(() => {
    const active = filteredWaiters.filter(w => w.status !== 'on_leave')
    return {
      totalOnFloor: active.length,
      available: active.filter(w => w.status === 'available').length,
      serving: active.filter(w => w.status === 'serving').length,
      onBreak: active.filter(w => w.status === 'on_break').length,
      totalOrders: active.reduce((sum, w) => sum + w.ordersCompleted, 0),
      activeOrders: active.reduce((sum, w) => sum + w.activeOrders, 0),
      avgRating: active.length > 0
        ? (active.reduce((s, w) => s + w.rating, 0) / active.length).toFixed(1)
        : '0',
    }
  }, [filteredWaiters])

  const getTimeElapsed = useCallback((time) => {
    const seconds = Math.floor((currentTime - new Date(time)) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }, [currentTime])

  const sortedByPerformance = useMemo(() => {
    return [...filteredWaiters]
      .filter(w => w.status !== 'on_leave')
      .sort((a, b) => b.ordersCompleted - a.ordersCompleted)
  }, [filteredWaiters])

  return (
    <div className="fixed inset-0 bg-surface-50 dark:bg-surface-950 z-50 flex flex-col font-sans overflow-hidden">
      <div className="flex items-center gap-1.5 translate-y-[2px]">
              <span className="relative flex h-2.5 w-2.5 mr-1">
                <span className="animate-ping bg-green-400 absolute inline-flex h-full w-full rounded-full opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-bold text-surface-500 tracking-widest uppercase">Live Socket.IO Sync</span>
            </div>

      {/* ═══ HEADER ═══ */}
      <header className="h-auto min-h-[72px] py-3 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 px-6 flex flex-col lg:flex-row items-center justify-between shadow-md dark:shadow-2xl shrink-0 gap-3">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl leading-tight uppercase tracking-tighter text-surface-900 dark:text-white">
                Waiter Display
              </h1>
              <p className="text-[9px] font-bold text-surface-500 uppercase tracking-[0.2em] leading-none">
                Floor Control Center
              </p>
            </div>
          </div>

          <div className="hidden sm:block h-10 w-px bg-surface-200 dark:bg-surface-800 mx-1" />

          {/* Shift Filters */}
          <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedShift('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                selectedShift === 'all'
                  ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/20"
                  : "bg-surface-100 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white"
              )}
            >
              All Shifts
            </button>
            {Object.entries(SHIFT_STYLES).map(([shift, style]) => (
              <button
                key={shift}
                onClick={() => setSelectedShift(shift)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 border",
                  selectedShift === shift
                    ? `${style.bg} ${style.border} ${style.text} shadow-lg`
                    : "bg-surface-100 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white"
                )}
              >
                <span>{style.icon}</span>
                {shift}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* View Mode */}
          <div className="flex bg-surface-100 dark:bg-surface-800 rounded-xl p-1 border border-surface-200 dark:border-surface-700">
            {[
              { id: 'floor', label: 'Floor View', icon: MapPin },
              { id: 'leaderboard', label: 'Leaderboard', icon: Crown },
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                  viewMode === mode.id
                    ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-md border border-surface-200/50 dark:border-surface-600"
                    : "text-surface-500 hover:text-surface-700 dark:hover:text-white"
                )}
              >
                <mode.icon size={12} className="shrink-0" />
                <span className={cn(viewMode === mode.id ? "block" : "hidden sm:block")}>{mode.label}</span>
              </button>
            ))}
          </div>

          {/* Stats Capsules */}
          <div className="hidden xl:flex items-center gap-2">
            {[
              { label: 'On Floor', value: stats.totalOnFloor, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-500/10', border: 'border-primary-200 dark:border-primary-500/20' },
              { label: 'Available', value: stats.available, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-green-200 dark:border-green-500/20' },
              { label: 'Active Orders', value: stats.activeOrders, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20' },
            ].map((s, i) => (
              <div key={i} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border", s.bg, s.border)}>
                <span className={cn("text-lg font-black font-mono", s.color)}>{s.value}</span>
                <span className="text-[9px] font-bold text-surface-500 uppercase tracking-wider">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors border",
                soundEnabled
                  ? "text-amber-500 border-amber-300 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10"
                  : "bg-surface-100 dark:bg-surface-800 text-surface-500 border-surface-200 dark:border-surface-700 hover:text-surface-900 dark:hover:text-white"
              )}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors border border-surface-200 dark:border-surface-700"
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>

            {/* Digital Clock */}
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-surface-100 dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-sm">
              <div className="flex flex-col items-end">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-surface-900 dark:text-white leading-none tracking-tighter tabular-nums">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).split(' ')[0]}
                  </span>
                  <span className="text-[10px] font-black text-primary-600 dark:text-primary-500 uppercase">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', hour12: true }).split(' ')[1]}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-surface-500 uppercase tracking-widest leading-none mt-1">
                  {currentTime.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ STATS RIBBON ═══ */}
      <div className="bg-white/60 dark:bg-surface-900/60 border-b border-surface-200 dark:border-surface-800 px-6 py-3 flex items-center gap-4 overflow-x-auto no-scrollbar shrink-0">
        {[
          { label: 'Staff on Floor', value: stats.totalOnFloor, icon: Users, color: 'from-primary-500 to-primary-600' },
          { label: 'Available Now', value: stats.available, icon: CheckCircle, color: 'from-green-500 to-green-600' },
          { label: 'Currently Serving', value: stats.serving, icon: Zap, color: 'from-violet-500 to-violet-600' },
          { label: 'On Break', value: stats.onBreak, icon: Coffee, color: 'from-amber-500 to-amber-600' },
          { label: 'Orders Completed', value: stats.totalOrders, icon: Target, color: 'from-emerald-500 to-emerald-600' },
          { label: 'Active Orders', value: stats.activeOrders, icon: ShoppingBag, color: 'from-rose-500 to-rose-600' },
          { label: 'Avg Rating', value: `${stats.avgRating} ★`, icon: Star, color: 'from-amber-400 to-orange-500' },
        ].map((stat, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700/50 shrink-0 min-w-[150px]">
            <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg", stat.color)}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] text-surface-500 uppercase tracking-wider font-bold">{stat.label}</p>
              <p className="text-lg font-black text-surface-900 dark:text-white tabular-nums leading-none mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 overflow-hidden flex">
        <AnimatePresence mode="wait">
          {viewMode === 'floor' ? (
            <motion.div
              key="floor"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex overflow-hidden"
            >
              {/* Left Panel — Waiter Cards */}
              <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-surface-300 dark:scrollbar-thumb-surface-700">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  <AnimatePresence>
                    {filteredWaiters.map((waiter, i) => {
                      const stConfig = STATUS_CONFIG[waiter.status] || STATUS_CONFIG.available
                      return (
                        <motion.div
                          key={waiter.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: i * 0.04 }}
                          className={cn(
                            "bg-white dark:bg-surface-900 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-800 shadow-lg dark:shadow-xl relative group transition-all hover:border-surface-300 dark:hover:border-surface-600 hover:shadow-xl",
                            waiter.status === 'on_leave' && "opacity-40"
                          )}
                        >
                          {/* Status Glow Bar */}
                          <div className={cn("h-1 w-full", stConfig.bg)} />

                          <div className="p-5">
                            {/* Header Row */}
                            <div className="flex items-start gap-3 mb-4">
                              <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-2xl shadow-lg shadow-primary-500/10">
                                  {waiter.avatar}
                                </div>
                                <div className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-surface-900", stConfig.dot)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-black text-surface-900 dark:text-white truncate tracking-tight">{waiter.name}</h3>
                                <p className="text-[10px] text-surface-500 font-bold">{waiter.role}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border",
                                    stConfig.bgLight, stConfig.text, stConfig.border
                                  )}>
                                    {stConfig.label}
                                  </span>
                                  {waiter.shift && (
                                    <span className={cn(
                                      "px-2 py-0.5 rounded-md text-[9px] font-bold border",
                                      SHIFT_STYLES[waiter.shift]?.bg,
                                      SHIFT_STYLES[waiter.shift]?.text,
                                      SHIFT_STYLES[waiter.shift]?.border,
                                    )}>
                                      {SHIFT_STYLES[waiter.shift]?.icon} {waiter.shift}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Current Activity */}
                            {waiter.currentTable && (
                              <div className="mb-4 p-3 rounded-xl bg-primary-50 dark:bg-primary-500/5 border border-primary-200 dark:border-primary-500/15">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
                                  <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
                                    Currently at {waiter.currentTable}
                                  </span>
                                </div>
                                <p className="text-[10px] text-surface-500 dark:text-surface-400 mt-1 ml-5.5 truncate">
                                  {waiter.lastAction} · {getTimeElapsed(waiter.lastActionTime)}
                                </p>
                              </div>
                            )}

                            {!waiter.currentTable && waiter.status !== 'on_leave' && (
                              <div className="mb-4 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700/50">
                                <p className="text-[10px] text-surface-500 truncate">
                                  {waiter.lastAction} · {getTimeElapsed(waiter.lastActionTime)}
                                </p>
                              </div>
                            )}

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { label: 'Done', value: waiter.ordersCompleted, highlight: false },
                                { label: 'Active', value: waiter.activeOrders, highlight: waiter.activeOrders > 0 },
                                { label: 'Rating', value: `${waiter.rating}★`, highlight: true },
                              ].map((stat, idx) => (
                                <div key={idx} className="text-center p-2 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-700/30">
                                  <p className="text-[8px] text-surface-500 uppercase tracking-wider font-bold">{stat.label}</p>
                                  <p className={cn(
                                    "text-sm font-black font-mono mt-0.5",
                                    stat.highlight ? 'text-amber-600 dark:text-amber-400' : 'text-surface-900 dark:text-white'
                                  )}>
                                    {stat.value}
                                  </p>
                                </div>
                              ))}
                            </div>

                            {/* Assigned Tables */}
                            {waiter.tables.length > 0 && (
                              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                                {waiter.tables.map(t => (
                                  <span
                                    key={t}
                                    className={cn(
                                      "px-2 py-0.5 text-[9px] font-bold rounded border",
                                      t === waiter.currentTable
                                        ? "bg-primary-50 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-500/30"
                                        : "bg-surface-100 dark:bg-surface-800 text-surface-500 border-surface-200 dark:border-surface-700/50"
                                    )}
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Reward Points Badge */}
                          <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/15">
                            <Award className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span className="text-[10px] font-black font-mono text-amber-600 dark:text-amber-400">{waiter.rewardPoints.toLocaleString()}</span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Panel — Live Order Feed */}
              <div className="w-[340px] 2xl:w-[400px] bg-white/50 dark:bg-surface-900/50 border-l border-surface-200 dark:border-surface-800 flex flex-col shrink-0 hidden lg:flex">
                <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-800 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                  <h2 className="text-sm font-black text-surface-900 dark:text-white uppercase tracking-widest">Live Orders</h2>
                  <span className="ml-auto bg-surface-100 dark:bg-surface-800 px-2.5 py-1 rounded-lg text-[10px] font-black text-primary-600 dark:text-primary-400 border border-surface-200 dark:border-surface-700">
                    {liveOrders.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3 no-scrollbar space-y-2.5">
              <AnimatePresence>
                {liveOrders.map(order => {
                  const orderSt = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.new
                      return (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700/50 hover:border-surface-300 dark:hover:border-surface-600 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={cn("w-2 h-2 rounded-full shrink-0", orderSt.color)} />
                              <span className="text-xs font-black text-surface-900 dark:text-white truncate">{order.waiter}</span>
                            </div>
                            <span className={cn("text-[9px] font-black uppercase tracking-wider shrink-0", orderSt.text)}>
                              {orderSt.label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-surface-500 dark:text-surface-400 flex items-center gap-1">
                                <MapPin size={10} /> {order.table}
                              </span>
                              <span className="text-[10px] font-bold text-surface-500 dark:text-surface-400 flex items-center gap-1">
                                <ShoppingBag size={10} /> {order.items} items
                              </span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-surface-400 dark:text-surface-500">{order.time}</span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ═══ LEADERBOARD VIEW ═══ */
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-surface-300 dark:scrollbar-thumb-surface-700"
            >
              <div className="max-w-6xl mx-auto space-y-6">

                {/* Top 3 Podium */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {sortedByPerformance.slice(0, 3).map((waiter, i) => {
                    const medals = ['🥇', '🥈', '🥉']
                    const gradients = [
                      'from-amber-100 dark:from-amber-500/20 to-amber-50 dark:to-amber-600/5 border-amber-300 dark:border-amber-500/30',
                      'from-gray-100 dark:from-gray-400/15 to-gray-50 dark:to-gray-500/5 border-gray-300 dark:border-gray-400/25',
                      'from-orange-100 dark:from-orange-500/15 to-orange-50 dark:to-orange-600/5 border-orange-300 dark:border-orange-500/25',
                    ]
                    const order = [1, 0, 2] // 2nd, 1st, 3rd
                    const w = sortedByPerformance[order[i]]
                    if (!w) return null
                    const isFirst = order[i] === 0
                    return (
                      <motion.div
                        key={w.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className={cn(
                          "rounded-2xl border p-6 text-center bg-gradient-to-b relative overflow-hidden",
                          gradients[order[i]],
                          isFirst && "ring-2 ring-amber-400/40 dark:ring-amber-500/30 scale-105 shadow-2xl shadow-amber-500/10"
                        )}
                      >
                        <div className="text-5xl mb-3">{medals[order[i]]}</div>
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-4xl mx-auto shadow-2xl shadow-primary-500/20 border-4 border-white dark:border-surface-800">
                          {w.avatar}
                        </div>
                        <h3 className="text-lg font-black text-surface-900 dark:text-white mt-3 tracking-tight">{w.name}</h3>
                        <p className="text-[10px] text-surface-500 font-bold uppercase tracking-wider">{w.role}</p>
                        <div className="mt-4 flex items-center justify-center gap-4">
                          <div>
                            <p className="text-2xl font-black text-surface-900 dark:text-white font-mono">{w.ordersCompleted}</p>
                            <p className="text-[9px] text-surface-500 uppercase tracking-wider font-bold">Orders</p>
                          </div>
                          <div className="w-px h-10 bg-surface-300 dark:bg-surface-700" />
                          <div>
                            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{w.rating}★</p>
                            <p className="text-[9px] text-surface-500 uppercase tracking-wider font-bold">Rating</p>
                          </div>
                          <div className="w-px h-10 bg-surface-300 dark:bg-surface-700" />
                          <div>
                            <p className="text-2xl font-black text-violet-600 dark:text-violet-400 font-mono">{w.rewardPoints.toLocaleString()}</p>
                            <p className="text-[9px] text-surface-500 uppercase tracking-wider font-bold">Points</p>
                          </div>
                        </div>

                        {/* Decorative Sparkle */}
                        {isFirst && (
                          <Sparkles className="absolute top-4 right-4 w-6 h-6 text-amber-400/30" />
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                {/* Full Leaderboard Table */}
                <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden shadow-xl dark:shadow-2xl">
                  <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-800 flex items-center gap-3">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <h3 className="text-base font-black text-surface-900 dark:text-white uppercase tracking-wider">Performance Rankings</h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-surface-200 dark:border-surface-800">
                          <th className="px-6 py-3 text-left text-[10px] font-black text-surface-500 uppercase tracking-widest">Rank</th>
                          <th className="px-6 py-3 text-left text-[10px] font-black text-surface-500 uppercase tracking-widest">Waiter</th>
                          <th className="px-6 py-3 text-center text-[10px] font-black text-surface-500 uppercase tracking-widest">Status</th>
                          <th className="px-6 py-3 text-center text-[10px] font-black text-surface-500 uppercase tracking-widest">Shift</th>
                          <th className="px-6 py-3 text-center text-[10px] font-black text-surface-500 uppercase tracking-widest">Orders</th>
                          <th className="px-6 py-3 text-center text-[10px] font-black text-surface-500 uppercase tracking-widest">Active</th>
                          <th className="px-6 py-3 text-center text-[10px] font-black text-surface-500 uppercase tracking-widest">Rating</th>
                          <th className="px-6 py-3 text-center text-[10px] font-black text-surface-500 uppercase tracking-widest">Tables</th>
                          <th className="px-6 py-3 text-center text-[10px] font-black text-surface-500 uppercase tracking-widest">Points</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-100 dark:divide-surface-800/50">
                        {sortedByPerformance.map((w, i) => {
                          const stConfig = STATUS_CONFIG[w.status] || STATUS_CONFIG.available
                          return (
                            <motion.tr
                              key={w.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04 }}
                              className="hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-black",
                                  i === 0 && 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
                                  i === 1 && 'bg-gray-100 dark:bg-gray-400/20 text-gray-500 dark:text-gray-400',
                                  i === 2 && 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400',
                                  i > 2 && 'bg-surface-100 dark:bg-surface-800 text-surface-500',
                                )}>
                                  {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-lg">
                                    {w.avatar}
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-surface-900 dark:text-white">{w.name}</p>
                                    <p className="text-[10px] text-surface-500 font-bold">{w.role}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={cn(
                                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border",
                                  stConfig.bgLight, stConfig.text, stConfig.border
                                )}>
                                  <div className={cn("w-1.5 h-1.5 rounded-full", stConfig.dot)} />
                                  {stConfig.label}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-md text-[10px] font-bold border",
                                  SHIFT_STYLES[w.shift]?.bg,
                                  SHIFT_STYLES[w.shift]?.text,
                                  SHIFT_STYLES[w.shift]?.border,
                                )}>
                                  {w.shift}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-base font-black text-surface-900 dark:text-white font-mono">{w.ordersCompleted}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={cn(
                                  "text-base font-black font-mono",
                                  w.activeOrders > 0 ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 dark:text-surface-600'
                                )}>
                                  {w.activeOrders}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                                  {w.rating} <Star className="w-3 h-3 inline -mt-0.5 fill-amber-500 dark:fill-amber-400 text-amber-500 dark:text-amber-400" />
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {w.tables.slice(0, 3).map(t => (
                                    <span key={t} className="px-1.5 py-0.5 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 text-[9px] font-bold rounded border border-surface-200 dark:border-surface-700/50">
                                      {t}
                                    </span>
                                  ))}
                                  {w.tables.length > 3 && (
                                    <span className="text-[9px] text-surface-400 dark:text-surface-600 font-bold">+{w.tables.length - 3}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Award className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                  <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">{w.rewardPoints.toLocaleString()}</span>
                                </div>
                              </td>
                            </motion.tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ FOOTER TICKER ═══ */}
      <footer className="h-14 bg-white dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800 flex items-center shrink-0 overflow-hidden">
        <div className="bg-primary-600 h-full px-6 flex items-center shrink-0 z-10 shadow-2xl">
          <span className="font-black uppercase tracking-widest text-sm text-white">Floor Update</span>
        </div>
        <div className="flex-1 relative overflow-hidden h-full flex items-center">
          <motion.div
            animate={{ x: [1200, -3000] }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            className="whitespace-nowrap flex gap-16 items-center text-surface-500 font-bold text-base"
          >
            <span>👨‍🍳 {stats.serving} waiters currently serving tables</span>
            <span>•</span>
            <span>✅ {stats.totalOrders} orders completed today across all shifts</span>
            <span>•</span>
            <span>⭐ Team average rating: {stats.avgRating}/5.0</span>
            <span>•</span>
            <span>🟢 {stats.available} waiters available for new tables</span>
            <span>•</span>
            <span>🏆 Top performer: {sortedByPerformance[0]?.name || 'N/A'} with {sortedByPerformance[0]?.ordersCompleted || 0} orders</span>
            <span>•</span>
            <span>☕ {stats.onBreak} staff currently on break</span>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}
