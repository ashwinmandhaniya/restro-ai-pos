import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, IndianRupee, ShoppingCart, Users, UtensilsCrossed,
  ArrowUpRight, ArrowDownRight, Eye, ChefHat, Clock, Zap, Target, Ticket, Timer, Bell
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { formatCurrency, formatNumber } from '@/lib/utils'
import useTokenStore from '@/store/tokenStore'
import useAnalyticsStore from '@/store/analyticsStore'

export default function DashboardPage() {
  const [chartPeriod, setChartPeriod] = useState('week')
  const [customRange, setCustomRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  
  const { stats: tokenStats, fetchStats: fetchTokenStats } = useTokenStore()
  const { stats, aiInsights, isLoading, fetchDashboardStats, fetchAIInsights } = useAnalyticsStore()

  useEffect(() => {
    const filters = { period: chartPeriod }
    if (chartPeriod === 'custom') {
      filters.startDate = customRange.start
      filters.endDate = customRange.end
    }
    
    fetchDashboardStats(filters)
    fetchAIInsights()
    fetchTokenStats()
    
    // Auto-refresh every 2 minutes ONLY for "Today" view
    let interval;
    if (chartPeriod === 'today') {
      interval = setInterval(() => {
        fetchDashboardStats({ period: 'today' })
        fetchAIInsights()
        fetchTokenStats()
      }, 120000)
    }
    
    return () => clearInterval(interval)
  }, [chartPeriod, customRange, fetchDashboardStats, fetchAIInsights, fetchTokenStats])

  const dashboardData = stats || {
    summary: {
      todayRevenue: 0, yesterdayRevenue: 0, todayOrders: 0, yesterdayOrders: 0,
      avgOrderValue: 0, activeOrders: 0
    },
    weeklyRevenue: [],
    paymentBreakdown: [],
    topSellingItems: []
  }

  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? '100.0' : '0.0'
    return (((current - previous) / previous) * 100).toFixed(1)
  }

  const statCards = [
    {
      label: chartPeriod === 'today' ? "Today's Revenue" : "Period Revenue",
      value: dashboardData.summary.todayRevenue,
      change: calculateChange(dashboardData.summary.todayRevenue, dashboardData.summary.yesterdayRevenue),
      comparisonLabel: chartPeriod === 'today' ? 'vs yesterday' : 'vs prev period',
      icon: IndianRupee,
      format: 'currency',
      color: 'from-primary-500 to-primary-600',
      bgLight: 'bg-primary-50',
      bgDark: 'dark:bg-primary-950/30',
    },
    {
      label: chartPeriod === 'today' ? "Orders Today" : "Total Orders",
      value: dashboardData.summary.todayOrders,
      change: calculateChange(dashboardData.summary.todayOrders, dashboardData.summary.yesterdayOrders),
      comparisonLabel: chartPeriod === 'today' ? 'vs yesterday' : 'vs prev period',
      icon: ShoppingCart,
      format: 'number',
      color: 'from-secondary-500 to-secondary-600',
      bgLight: 'bg-secondary-50',
      bgDark: 'dark:bg-secondary-950/30',
    },
    {
      label: "Avg Order Value",
      value: dashboardData.summary.avgOrderValue,
      icon: Target,
      format: 'currency',
      color: 'from-accent-500 to-accent-600',
      bgLight: 'bg-accent-50',
      bgDark: 'dark:bg-accent-950/30',
    },
    {
      label: "Active Orders",
      value: dashboardData.summary.activeOrders,
      icon: Clock,
      format: 'number',
      color: 'from-amber-500 to-amber-600',
      bgLight: 'bg-amber-50',
      bgDark: 'dark:bg-amber-950/30',
      live: true,
    },
  ]

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-surface-500 font-medium">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            {chartPeriod === 'today' ? "Welcome back! Here's what's happening today." : `Performance analysis for ${chartPeriod} view.`}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Custom Date Range Picker */}
          {chartPeriod === 'custom' && (
            <div className="flex items-center gap-2 bg-white dark:bg-surface-800 p-1.5 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm animate-in fade-in slide-in-from-right-2">
              <input 
                type="date" 
                value={customRange.start}
                onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-transparent border-none text-xs font-bold text-surface-700 dark:text-surface-200 focus:ring-0 p-1 cursor-pointer"
              />
              <span className="text-surface-400 text-[10px] font-bold">TO</span>
              <input 
                type="date" 
                value={customRange.end}
                onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-transparent border-none text-xs font-bold text-surface-700 dark:text-surface-200 focus:ring-0 p-1 cursor-pointer"
              />
            </div>
          )}

          {/* Range Selectors */}
          <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1 shadow-inner">
            {['Today', 'Week', 'Month', 'Custom'].map(p => (
              <button
                key={p}
                onClick={() => setChartPeriod(p.toLowerCase())}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  chartPeriod === p.toLowerCase()
                    ? 'bg-white dark:bg-surface-700 shadow-lg text-primary-600 dark:text-primary-400 scale-105'
                    : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-5 relative overflow-hidden group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-surface-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold font-mono text-surface-900 dark:text-white">
                  {stat.format === 'currency' ? formatCurrency(stat.value) : formatNumber(stat.value)}
                </p>
                {stat.change && (
                  <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${
                    parseFloat(stat.change) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {parseFloat(stat.change) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(parseFloat(stat.change))}% {stat.comparisonLabel}
                  </div>
                )}
                {stat.live && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">Live</span>
                  </div>
                )}
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            {/* Decorative gradient */}
            <div className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full ${stat.bgLight} ${stat.bgDark} opacity-50`} />
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-surface-900 dark:text-white">Revenue Overview</h3>
              <p className="text-xs text-surface-500 mt-0.5">Weekly revenue trend</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dashboardData.weeklyRevenue}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f9162b" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f9162b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-100 dark:text-surface-800" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="currentColor" className="text-surface-400" />
              <YAxis tick={{ fontSize: 12 }} stroke="currentColor" className="text-surface-400" tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'var(--tooltip-bg, #1e293b)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '12px' }}
                formatter={(value) => [formatCurrency(value), 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#f9162b" strokeWidth={3} fill="url(#revenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Breakdown */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Payment Methods</h3>
          {dashboardData.paymentBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={dashboardData.paymentBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="amount"
                  >
                    {dashboardData.paymentBreakdown.map((entry) => (
                      <Cell key={entry.method} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {dashboardData.paymentBreakdown.map((p) => (
                  <div key={p.method} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                      <span className="text-xs font-medium text-surface-600 dark:text-surface-400">{p.method}</span>
                    </div>
                    <span className="text-xs font-semibold font-mono">{p.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[260px] text-surface-400 italic text-xs">
              No payments today yet
            </div>
          )}
        </div>
      </div>

      {/* Token Queue Overview Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="card p-5 lg:col-span-1 bg-white dark:bg-surface-900 border-primary-500/10 dark:border-primary-500/20 shadow-xl overflow-hidden relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary-500 text-white">
                <Ticket className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-surface-900 dark:text-white cursor-pointer hover:text-primary-500 transition-colors" onClick={() => window.location.href='/tokens'}>Token Management</h3>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-surface-500 uppercase font-black">Waiting</p>
                <p className="text-3xl font-black text-surface-900 dark:text-white">{tokenStats?.waiting || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-surface-500 uppercase font-black">Ready</p>
                <p className="text-3xl font-black text-green-600 dark:text-green-500">{tokenStats?.ready || 0}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-surface-100 dark:border-surface-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1">
                  <Timer className="w-3 h-3 text-amber-500" /> Avg. Wait Time
                </span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-500">{tokenStats?.avgWaitMinutes || 0}m</span>
              </div>
              <div className="w-full bg-surface-100 dark:bg-surface-800 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full transition-all duration-1000" 
                  style={{ width: `${Math.min((tokenStats?.avgWaitMinutes || 0) * 10, 100)}%` }} 
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-700/50 mt-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                <span className="text-[10px] font-bold text-surface-600 dark:text-surface-300 uppercase">Today's Total</span>
              </div>
              <span className="text-sm font-black text-surface-900 dark:text-white">{tokenStats?.totalToday || 0}</span>
            </div>
          </div>

          {/* Background Ticket Icon */}
          <Ticket className="absolute -right-8 -bottom-8 w-32 h-32 text-surface-900/[0.03] dark:text-white/5 rotate-12" />
        </div>

        {/* Top Selling Items (rest of the row) */}
        <div className="lg:col-span-3 card p-5">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Top Selling Items</h3>
          {dashboardData.topSellingItems.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.topSellingItems.slice(0, 6).map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-surface-400 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-xs text-surface-500">{item.orders} orders</p>
                  </div>
                  <span className="text-sm font-bold font-mono text-surface-900 dark:text-white">{formatCurrency(item.revenue)}</span>
                  <span className={`text-xs font-semibold ${
                    item.trend === 'up' ? 'text-green-500' : item.trend === 'down' ? 'text-red-500' : 'text-surface-400'
                  }`}>
                    {item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-surface-400 italic text-xs">
              No sales recorded for today
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="card p-5 border-accent-200 dark:border-accent-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 text-white">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-surface-900 dark:text-white">AI Insights</h3>
            <span className="badge bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 text-[10px]">SMART</span>
          </div>
          <div className="space-y-3">
            {aiInsights.length > 0 ? (
              aiInsights.slice(0, 4).map((insight) => (
                <div key={insight.id} className="flex items-start gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                  <span className="text-lg">{insight.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900 dark:text-white">{insight.title}</p>
                    <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{insight.description}</p>
                  </div>
                  <span className={`badge text-[10px] ${
                    insight.impact === 'critical' ? 'badge-danger' :
                    insight.impact === 'high' ? 'badge-warning' :
                    insight.impact === 'medium' ? 'badge-info' : 'badge-success'
                  }`}>
                    {insight.impact}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-surface-400 italic">No AI insights for today.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
