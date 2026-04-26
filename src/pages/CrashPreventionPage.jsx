import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, AlertTriangle, Activity, Wifi, WifiOff, RefreshCw,
  CheckCircle2, XCircle, Clock, Cpu, Zap, Bell, BellOff,
  TrendingUp, Eye, Play, Pause, Monitor, Printer,
  RotateCcw, Info, Flame, Thermometer, HardDrive,
  BatteryCharging, Signal, CreditCard, ChefHat, Tablet, Router,
  Database, Globe, Power, PlugZap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import useUIStore from '@/store/uiStore'
import useCrashPreventionStore from '@/store/crashPreventionStore'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'

// Health history buffer size for the live chart
const HISTORY_SIZE = 30

// Map service IDs to icons
const SERVICE_ICONS = {
  mongodb: Database,
  internet: Globe,
  websocket: Zap,
  printer: Printer,
  disk: HardDrive,
  ups: Power,
}

const STATUS_COLOR = { online: 'text-emerald-500', degraded: 'text-amber-500', offline: 'text-red-500' }
const STATUS_BG = { online: 'bg-emerald-100 dark:bg-emerald-500/20', degraded: 'bg-amber-100 dark:bg-amber-500/20', offline: 'bg-red-100 dark:bg-red-500/20' }
const STATUS_DOT = { online: 'bg-emerald-500', degraded: 'bg-amber-500 animate-pulse', offline: 'bg-red-500 animate-pulse' }
const STATUS_LABEL = { online: 'Online', degraded: 'Degraded', offline: 'Offline' }
const LOG_ICON = { error: XCircle, warning: AlertTriangle, info: Info }

export default function CrashPreventionPage() {
  const { addNotification } = useUIStore()
  const store = useCrashPreventionStore()

  const [monitoring, setMonitoring] = useState(true)
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [logFilter, setLogFilter] = useState('all')
  const [expandedLog, setExpandedLog] = useState(null)
  const [resolvingId, setResolvingId] = useState(null)
  const [restartingId, setRestartingId] = useState(null)

  // Rolling history for the live chart
  const [healthHistory, setHealthHistory] = useState([])

  // ─── Initial fetch ───
  useEffect(() => {
    store.fetchHealth()
    store.fetchServices()
    store.fetchLogs({ limit: 50 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Live polling: health every 10s, services every 30s, logs every 60s ───
  useEffect(() => {
    if (!monitoring) return

    const healthInterval = setInterval(() => { store.fetchHealth() }, 10000)
    const servicesInterval = setInterval(() => { store.fetchServices() }, 30000)
    const logsInterval = setInterval(() => { store.fetchLogs({ limit: 50 }) }, 60000)

    return () => {
      clearInterval(healthInterval)
      clearInterval(servicesInterval)
      clearInterval(logsInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monitoring])

  // ─── Append health snapshot to chart history ───
  useEffect(() => {
    if (!store.health) return
    setHealthHistory(prev => {
      const next = [
        ...prev,
        {
          t: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          cpu: store.health.cpu ?? 0,
          ram: store.health.ram ?? 0,
          temp: store.health.temp ?? 0,
          disk: store.health.disk ?? 0,
        },
      ]
      return next.slice(-HISTORY_SIZE)
    })
  }, [store.health])

  // ─── Derived KPIs ───
  const h = store.health || {}
  const activeErrors = store.logs.filter(l => !l.resolved && l.level === 'error').length
  const activeWarnings = store.logs.filter(l => !l.resolved && l.level === 'warning').length
  const offlineSvc = store.services.filter(s => s.status === 'offline').length
  const degradedSvc = store.services.filter(s => s.status === 'degraded').length

  const alertLevel = activeErrors > 0 || offlineSvc > 0 ? 'critical'
    : activeWarnings > 0 || degradedSvc > 0 ? 'warning' : 'healthy'

  // ─── Color helpers ───
  const cpuColor = (h.cpu ?? 0) > 80 ? 'text-red-500' : (h.cpu ?? 0) > 60 ? 'text-amber-500' : 'text-emerald-500'
  const ramColor = (h.ram ?? 0) > 85 ? 'text-red-500' : (h.ram ?? 0) > 70 ? 'text-amber-500' : 'text-emerald-500'
  const tempVal = h.temp ?? null
  const tempColor = tempVal === null ? 'text-slate-400' : tempVal > 75 ? 'text-red-500' : tempVal > 60 ? 'text-amber-500' : 'text-emerald-500'
  const diskColor = (h.disk ?? 0) > 90 ? 'text-red-500' : (h.disk ?? 0) > 75 ? 'text-amber-500' : 'text-emerald-500'

  // ─── Event handlers ───
  const handleResolve = useCallback(async (id) => {
    setResolvingId(id)
    const ok = await store.resolveEvent(id)
    setResolvingId(null)
    if (ok) addNotification({ type: 'success', title: 'Issue Resolved', message: 'Event marked as resolved.' })
    else addNotification({ type: 'error', title: 'Failed', message: 'Could not resolve the event.' })
  }, [store, addNotification])

  const handleRestart = useCallback(async (svc) => {
    setRestartingId(svc.id)
    addNotification({ type: 'info', title: `Reconnecting ${svc.name}`, message: 'Attempting to re-establish...' })
    const ok = await store.restartService(svc.id)
    // Re-fetch services after a delay to see updated status
    setTimeout(() => { store.fetchServices(); setRestartingId(null) }, 2000)
    if (!ok) addNotification({ type: 'error', title: 'Failed', message: 'Could not restart the service.' })
  }, [store, addNotification])

  const handleRecovery = useCallback(async (action, label) => {
    addNotification({ type: 'info', title: label, message: 'Action initiated...' })
    const ok = await store.triggerRecovery(action)
    if (ok) {
      addNotification({ type: 'success', title: label, message: 'Completed successfully.' })
      store.fetchLogs({ limit: 50 })
    } else {
      addNotification({ type: 'error', title: label, message: 'Action failed.' })
    }
  }, [store, addNotification])

  // ─── Filter logs client-side ───
  const filteredLogs = store.logs.filter(l =>
    logFilter === 'all' ? true :
      logFilter === 'active' ? !l.resolved :
        l.level === logFilter
  )

  // ─── Loading state ───
  if (!store.health && store.healthLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Scanning system health...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg',
            alertLevel === 'critical' ? 'bg-gradient-to-br from-red-500 to-red-700' :
              alertLevel === 'warning' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                'bg-gradient-to-br from-emerald-500 to-teal-600'
          )}>
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
              Crash Prevention System
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {h.hostname || 'Machine'} · {h.cpuModel || ''} · {h.cpuCores || '?'} cores
              </p>
              {monitoring && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className={cn(
            'px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border',
            alertLevel === 'critical' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30' :
              alertLevel === 'warning' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' :
                'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
          )}>
            {alertLevel === 'critical' ? <Flame className="w-3.5 h-3.5" /> :
              alertLevel === 'warning' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                <CheckCircle2 className="w-3.5 h-3.5" />}
            {alertLevel === 'critical' ? 'ISSUES DETECTED' : alertLevel === 'warning' ? 'WARNINGS ACTIVE' : 'ALL SYSTEMS OK'}
          </div>

          <button
            onClick={() => { setMonitoring(m => !m); addNotification({ type: 'info', title: monitoring ? 'Monitoring Paused' : 'Monitoring Resumed', message: '' }) }}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all',
              monitoring ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100' :
                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            )}
          >
            {monitoring ? <><Pause className="w-4 h-4" /> Live</> : <><Play className="w-4 h-4" /> Paused</>}
          </button>

          <button
            onClick={() => setAlertsEnabled(a => !a)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            {alertsEnabled ? <Bell className="w-4 h-4 text-amber-500" /> : <BellOff className="w-4 h-4" />}
            Alerts
          </button>
        </div>
      </div>

      {/* KPI Row — REAL data */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            label: 'CPU Usage', value: `${h.cpu ?? '--'}%`, sub: `${h.cpuCores || '?'} cores · ${h.cpuSpeed || '?'} GHz`,
            icon: Cpu, color: cpuColor, bg: 'bg-blue-100 dark:bg-blue-500/20'
          },
          {
            label: 'RAM Usage', value: `${h.ram ?? '--'}%`, sub: `${h.usedMemGB || '?'} / ${h.totalMemGB || '?'} GB`,
            icon: HardDrive, color: ramColor, bg: 'bg-violet-100 dark:bg-violet-500/20'
          },
          {
            label: 'Temperature', value: tempVal !== null ? `${tempVal}°C` : 'N/A', sub: h.tempMax ? `Max: ${h.tempMax}°C` : 'sensor data',
            icon: Thermometer, color: tempColor, bg: 'bg-orange-100 dark:bg-orange-500/20'
          },
          {
            label: 'Disk Usage', value: `${h.disk ?? '--'}%`, sub: h.diskUsed && h.diskTotal ? `${h.diskUsed} / ${h.diskTotal}` : 'storage',
            icon: Activity, color: diskColor, bg: 'bg-teal-100 dark:bg-teal-500/20'
          },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">{kpi.label}</p>
              <div className={cn('p-2 rounded-xl', kpi.bg)}>
                <kpi.icon className={cn('w-4 h-4', kpi.color)} />
              </div>
            </div>
            <p className={cn('text-2xl md:text-3xl font-bold', kpi.color)}>{kpi.value}</p>
            <p className="text-[10px] md:text-xs text-slate-400 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Extra stats row — battery + network + uptime */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <BatteryCharging className="w-4 h-4 text-green-500" />
            <p className="text-xs text-slate-500 font-medium">Power / Battery</p>
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-white">
            {h.hasBattery ? `${h.batteryPercent ?? '--'}%` : 'Mains'}
          </p>
          <p className="text-[10px] text-slate-400">
            {h.hasBattery ? (h.acConnected ? 'Plugged in · Charging' : 'On battery') : 'No battery detected'}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Wifi className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-slate-500 font-medium">Network</p>
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-white">
            {h.networkDownKBs !== undefined ? `↓${h.networkDownKBs} KB/s` : '--'}
          </p>
          <p className="text-[10px] text-slate-400">
            {h.networkUpKBs !== undefined ? `↑${h.networkUpKBs} KB/s` : 'measuring...'}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-violet-500" />
            <p className="text-xs text-slate-500 font-medium">Uptime</p>
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-white">
            {h.uptime ? `${Math.floor(h.uptime / 3600)}h ${Math.floor((h.uptime % 3600) / 60)}m` : '--'}
          </p>
          <p className="text-[10px] text-slate-400">{h.platform || ''} · {h.distro || ''}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className={cn('w-4 h-4', activeErrors > 0 ? 'text-red-500' : 'text-emerald-500')} />
            <p className="text-xs text-slate-500 font-medium">Open Issues</p>
          </div>
          <p className={cn('text-xl font-bold', activeErrors > 0 ? 'text-red-500' : 'text-emerald-500')}>
            {activeErrors + activeWarnings}
          </p>
          <p className="text-[10px] text-slate-400">{activeErrors} errors · {activeWarnings} warnings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Chart + Logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Health Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-white">Live System Metrics</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Polling every 3s from {h.hostname || 'your machine'}
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px] md:text-xs font-medium flex-wrap">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />CPU</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" />RAM</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" />Temp</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-500" />Disk</span>
              </div>
            </div>
            <div className="h-52">
              {healthHistory.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={healthHistory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.08} />
                    <XAxis dataKey="t" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 10, color: '#fff', fontSize: 12 }}
                      itemStyle={{ color: '#e2e8f0' }}
                      formatter={(v, name) => [
                        name === 'temp' ? `${v}°C` : `${v}%`,
                        name === 'cpu' ? 'CPU' : name === 'ram' ? 'RAM' : name === 'disk' ? 'Disk' : 'Temp'
                      ]}
                    />
                    <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="ram" stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="disk" stroke="#14b8a6" strokeWidth={1.5} dot={false} strokeDasharray="4 4" isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Collecting data points...
                </div>
              )}
            </div>
          </div>

          {/* Event Log — from MongoDB */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-violet-500" />
                Event Log
                <span className="text-[10px] font-semibold text-slate-400 ml-1">({store.totalLogs} total)</span>
              </h3>
              <div className="flex items-center gap-1.5">
                {['all', 'active', 'error', 'warning', 'info'].map(f => (
                  <button key={f} onClick={() => setLogFilter(f)}
                    className={cn(
                      'px-2 py-1 text-[10px] md:text-xs font-semibold rounded-lg capitalize transition-all',
                      logFilter === f
                        ? 'bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-80 overflow-y-auto">
              {store.logsLoading && store.logs.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Loading event logs...</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                  <p className="text-sm">
                    {logFilter === 'all' ? 'No events recorded yet.' : 'No events match this filter.'}
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredLogs.map(log => {
                    const logId = log._id || log.id
                    const Icon = LOG_ICON[log.level]
                    const timeStr = log.createdAt
                      ? new Date(log.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
                      : log.time || ''
                    return (
                      <motion.div
                        key={logId}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className={cn(
                          'px-4 md:px-6 py-3 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50',
                          log.resolved && 'opacity-50'
                        )}
                        onClick={() => setExpandedLog(expandedLog === logId ? null : logId)}
                      >
                        <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0',
                          log.level === 'error' ? 'text-red-500' :
                            log.level === 'warning' ? 'text-amber-500' : 'text-blue-500'
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-400 uppercase">{log.source}</span>
                            <span className="text-xs text-slate-400">{timeStr}</span>
                            {log.resolved && <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded font-semibold">RESOLVED</span>}
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5 truncate">{log.message}</p>
                          {expandedLog === logId && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                                Device: {log.source} · Severity: {log.level.toUpperCase()} · ID: {logId}
                                {log.resolvedAt && ` · Resolved: ${new Date(log.resolvedAt).toLocaleString()}`}
                              </p>
                            </motion.div>
                          )}
                        </div>
                        {!log.resolved && (
                          <button
                            onClick={e => { e.stopPropagation(); handleResolve(logId) }}
                            disabled={resolvingId === logId}
                            className="flex-shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                          >
                            {resolvingId === logId ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            Fix
                          </button>
                        )}
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

        {/* Right — Service Watchdog */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-white">
                System Watchdog
              </h3>
              {store.servicesLoading && <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
            </div>
            <p className="text-xs text-slate-500 mb-4">Live dependency health checks</p>
            <div className="space-y-3">
              {store.services.length === 0 && !store.servicesLoading && (
                <p className="text-xs text-slate-400 text-center py-4">No services reported.</p>
              )}
              {store.services.map(svc => {
                const SvcIcon = SERVICE_ICONS[svc.id] || Activity
                const status = svc.status || 'online'
                return (
                  <div key={svc.id} className={cn(
                    'p-3 rounded-xl border flex items-center gap-3 transition-all',
                    status === 'offline' ? 'border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5' :
                      status === 'degraded' ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5' :
                        'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                  )}>
                    <div className={cn('p-2 rounded-lg', STATUS_BG[status])}>
                      <SvcIcon className={cn('w-4 h-4', STATUS_COLOR[status])} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_DOT[status])} />
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{svc.name}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {svc.detail || ''}
                        {svc.latency !== null && svc.latency !== undefined ? ` · ${svc.latency}ms` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', STATUS_BG[status], STATUS_COLOR[status])}>
                        {STATUS_LABEL[status]}
                      </span>
                      {status !== 'online' && (
                        <button
                          onClick={() => handleRestart(svc)}
                          disabled={restartingId === svc.id}
                          className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
                        >
                          {restartingId === svc.id ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <RotateCcw className="w-2.5 h-2.5" />}
                          Reconnect
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Troubleshooting */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Quick Troubleshooting
            </h3>
            <div className="space-y-2">
              {[
                { action: 'test-print', label: 'Test Print Receipt', icon: Printer, severity: 'info' },
                { action: 'ping-devices', label: 'Ping All Services', icon: Signal, severity: 'info' },
                { action: 'reconnect-card', label: 'Reconnect Card Machine', icon: CreditCard, severity: 'warning' },
                { action: 'restart-kds', label: 'Restart KDS Display', icon: Tablet, severity: 'warning' },
                { action: 'reboot-pos', label: 'Force Reboot POS', icon: Monitor, severity: 'danger' },
              ].map(item => (
                <button
                  key={item.action}
                  onClick={() => handleRecovery(item.action, item.label)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all border',
                    item.severity === 'danger'
                      ? 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20'
                      : item.severity === 'warning'
                        ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                        : 'border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
