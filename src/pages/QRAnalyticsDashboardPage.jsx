import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, TrendingUp, QrCode, Zap, IndianRupee, Users, Clock,
  ShoppingCart, Flame, ArrowLeft, RefreshCw
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

export default function QRAnalyticsDashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchDashboard = async () => {
    setIsLoading(true)
    try {
      const res = await api.get('/qr/analytics/dashboard')
      setData(res.data.data)
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchDashboard() }, [])

  const formatCurrency = (v) => `₹${(v || 0).toLocaleString()}`

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-surface-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No analytics data available</p>
        <p className="text-xs mt-1">Generate QR codes and let customers scan them</p>
      </div>
    )
  }

  const { overview, weeklyTrend, topItems, topTables, hourlyDistribution } = data

  // Find peak hour
  const peakHour = hourlyDistribution?.length > 0
    ? hourlyDistribution.reduce((max, h) => h.scans > max.scans ? h : max, hourlyDistribution[0])
    : null

  // Max values for bar chart scaling
  const maxWeeklyScans = Math.max(...(weeklyTrend?.map(w => w.scans) || [1]))
  const maxHourlyScans = Math.max(...(hourlyDistribution?.map(h => h.scans) || [1]))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/qr-codes')} className="p-2 rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">QR Analytics</h1>
            <p className="text-sm text-surface-500">Insights from your contactless ordering system</p>
          </div>
        </div>
        <button onClick={fetchDashboard} className="btn-secondary btn-sm">
          <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Scans', value: overview.totalScans, icon: QrCode, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'QR Orders', value: overview.totalQROrders, icon: ShoppingCart, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'QR Revenue', value: formatCurrency(overview.totalQRRevenue), icon: IndianRupee, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Conversion', value: `${overview.conversionRate}%`, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((stat, i) => (
          <motion.div key={stat.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card p-5">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', stat.bg)}>
              <stat.icon className={cn('w-5 h-5', stat.color)} />
            </div>
            <p className={cn('text-2xl font-bold font-mono', stat.color)}>{stat.value}</p>
            <p className="text-[11px] text-surface-500 font-semibold uppercase tracking-wider mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Today's Scans", value: overview.todayScans, icon: Users },
          { label: "Today's Orders", value: overview.todayOrders, icon: Zap },
          { label: 'Avg Order Value', value: formatCurrency(overview.avgOrderValue), icon: IndianRupee },
          { label: 'Peak Hour', value: peakHour ? `${peakHour.label}` : 'N/A', icon: Clock },
        ].map(stat => (
          <div key={stat.label} className="card p-4 flex items-center gap-3">
            <stat.icon className="w-4 h-4 text-surface-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-surface-900 dark:text-white font-mono">{stat.value}</p>
              <p className="text-[10px] text-surface-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Scan Trend */}
        <div className="card p-6">
          <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" /> Weekly Trend (Scans vs Orders)
          </h3>
          <div className="space-y-2">
            {weeklyTrend?.map(day => {
              const date = new Date(day._id)
              const dayName = date.toLocaleDateString('en', { weekday: 'short', day: 'numeric' })
              return (
                <div key={day._id} className="flex items-center gap-3">
                  <span className="text-xs text-surface-500 w-14 flex-shrink-0">{dayName}</span>
                  <div className="flex-1 flex gap-1 h-6">
                    <div className="bg-blue-500/30 rounded-r-full h-full transition-all"
                      style={{ width: `${(day.scans / maxWeeklyScans) * 100}%` }} />
                    <div className="bg-green-500/50 rounded-r-full h-full transition-all"
                      style={{ width: `${(day.orders / maxWeeklyScans) * 100}%` }} />
                  </div>
                  <span className="text-xs text-surface-400 font-mono w-16 text-right">{day.scans}/{day.orders}</span>
                </div>
              )
            })}
            <div className="flex items-center gap-4 mt-3 pt-2 border-t border-surface-100 dark:border-surface-800">
              <div className="flex items-center gap-1.5 text-[10px] text-surface-500">
                <div className="w-3 h-3 rounded bg-blue-500/30" /> Scans
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-surface-500">
                <div className="w-3 h-3 rounded bg-green-500/50" /> Orders
              </div>
            </div>
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="card p-6">
          <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" /> Peak Hours (Last 30 Days)
          </h3>
          <div className="flex items-end gap-1 h-40">
            {Array.from({ length: 24 }, (_, h) => {
              const entry = hourlyDistribution?.find(e => e.hour === h)
              const scans = entry?.scans || 0
              const height = maxHourlyScans > 0 ? (scans / maxHourlyScans) * 100 : 0
              const isPeak = peakHour?.hour === h
              return (
                <div key={h} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className={cn(
                      'w-full rounded-t transition-all duration-300',
                      isPeak ? 'bg-amber-500' : 'bg-primary-500/30 group-hover:bg-primary-500/50'
                    )}
                    style={{ height: `${Math.max(2, height)}%` }}
                  />
                  {h % 4 === 0 && (
                    <span className="text-[8px] text-surface-500">{h}</span>
                  )}
                  {/* Tooltip */}
                  <div className="absolute -top-8 bg-surface-900 text-white text-[10px] px-2 py-1 rounded hidden group-hover:block whitespace-nowrap z-10">
                    {h}:00 — {scans} scans
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Items */}
        <div className="card p-6">
          <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" /> Top QR-Ordered Items
          </h3>
          <div className="space-y-2.5">
            {topItems?.length > 0 ? topItems.map((item, i) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-[10px] font-bold text-surface-500 flex-shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-surface-900 dark:text-white font-medium truncate">{item.name}</span>
                <span className="text-xs text-surface-400 font-mono">{item.count} sold</span>
                <span className="text-xs text-green-500 font-mono font-bold">{formatCurrency(item.revenue)}</span>
              </div>
            )) : (
              <p className="text-sm text-surface-500 text-center py-4">No data yet</p>
            )}
          </div>
        </div>

        {/* Top Tables */}
        <div className="card p-6">
          <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-blue-500" /> Most Scanned Tables
          </h3>
          <div className="space-y-2.5">
            {topTables?.length > 0 ? topTables.map((table, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-[10px] font-bold text-surface-500 flex-shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-surface-900 dark:text-white font-medium">{table.name} <span className="text-surface-400 text-xs">({table.floor})</span></span>
                <span className="text-xs text-blue-500 font-mono font-bold">{table.scans} scans</span>
              </div>
            )) : (
              <p className="text-sm text-surface-500 text-center py-4">No scan data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
