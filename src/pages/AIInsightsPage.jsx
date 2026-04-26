import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, TrendingUp, Package, Mic, Users, Shield, MessageSquare, Eye,
  Sparkles, BarChart3, AlertTriangle, RefreshCw
} from 'lucide-react'
import api from '@/lib/api'
import useUIStore from '@/store/uiStore'
import { useAIGate } from '@/hooks/useAIGate'
import AIKeyRequired from '@/components/ai/AIKeyRequired'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import { cn } from '@/lib/utils'

// Mapping DB feature flag keys to UI details
const MODULE_CONFIG = {
  ai_sales_prediction: { icon: TrendingUp, color: 'from-blue-500 to-blue-600' },
  ai_menu_optimization: { icon: BarChart3, color: 'from-green-500 to-green-600' },
  ai_inventory: { icon: Package, color: 'from-amber-500 to-amber-600' },
  ai_voice_billing: { icon: Mic, color: 'from-purple-500 to-purple-600' },
  ai_customer_insights: { icon: Users, color: 'from-pink-500 to-pink-600' },
  ai_fraud_detection: { icon: Shield, color: 'from-red-500 to-red-600' },
  ai_copilot: { icon: MessageSquare, color: 'from-indigo-500 to-indigo-600' },
  ai_recommendations: { icon: Sparkles, color: 'from-cyan-500 to-cyan-600' },
  ai_wait_time: { icon: Eye, color: 'from-teal-500 to-teal-600' }
};

export default function AIInsightsPage() {
  const { setShowVoiceBilling, setShowCopilot } = useUIStore()
  const { isReady: aiReady, isLoading: aiLoading } = useAIGate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const res = await api.get('/tenant/ai/dashboard')
      setData(res.data.data)
    } catch (err) {
      console.error('Failed to fetch AI dashboard:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-[60vh]">
        <RefreshCw className="w-8 h-8 md:w-10 md:h-10 text-violet-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Analyzing restaurant data...</p>
      </div>
    )
  }

  // Gate: tenant must have their own Gemini API key configured
  if (!aiLoading && !aiReady) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <AIKeyRequired featureName="AI Intelligence Hub" />
      </div>
    )
  }

  const { modules = [], predictionData = [], alerts = [], stats = {} } = data || {}
  const safeModules = Array.isArray(modules) ? modules : [];
  const safePredictionData = Array.isArray(predictionData) ? predictionData : [];
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const activeModulesCount = safeModules.filter(m => m.enabled).length

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2 md:gap-3">
            <Brain className="w-6 h-6 md:w-8 md:h-8 text-violet-500" />
            AI Intelligence Hub
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
            Predictive analytics and automated operations
          </p>
        </div>

        <div className="flex gap-2">
          {safeModules.some(m => m.key === 'ai_copilot' && m.enabled) && (
            <button
              onClick={() => setShowCopilot(true)}
              className="flex-1 md:flex-none items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors font-medium shadow-sm text-sm hidden md:flex"
            >
              <MessageSquare className="w-4 h-4" />
              Ask Copilot
            </button>
          )}
          {safeModules.some(m => m.key === 'ai_voice_billing' && m.enabled) && (
            <button
              onClick={() => setShowVoiceBilling(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium shadow-sm shadow-violet-500/20 text-sm"
            >
              <Mic className="w-4 h-4" />
              Voice Bill
            </button>
          )}
        </div>
      </div>

      {/* AI Performance Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">Model Accuracy</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
              {stats?.accuracy || 'N/A'}
            </span>
          </div>
          <p className="text-[10px] md:text-xs text-emerald-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Target {'>'}90%
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">Active Modules</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">{activeModulesCount}</span>
            <span className="text-xs md:text-sm text-slate-500">/ {safeModules.length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">Data Points Analyzed</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">{stats?.dataPoints || 0}</span>
          </div>
          <p className="text-[10px] md:text-xs text-slate-500 mt-1">Past periods</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">Current Kitchen Load</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={cn('text-2xl md:text-3xl font-bold text-slate-800 dark:text-white', (stats?.activeOrders || 0) > 10 ? 'text-amber-500' : '')}>
              {stats?.activeOrders || 0}
            </span>
          </div>
           <p className="text-[10px] md:text-xs text-slate-500 mt-1">Active orders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Alerts & Chart */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          
          {/* Smart Alerts */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-violet-500" />
                Actionable Insights
              </h3>
              <span className="px-2 py-1 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-bold rounded-lg truncate">
                {safeAlerts.length} NEW
              </span>
            </div>

            <div className="space-y-3 md:space-y-4">
              {safeAlerts.length === 0 ? (
                <div className="text-center py-8 text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>All clear! The AI is monitoring for new insights.</p>
                </div>
              ) : (
                safeAlerts.map((alert) => (
                  <div key={alert.id} className="group relative overflow-hidden bg-slate-50 dark:bg-slate-800/50 p-3 md:p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-violet-200 dark:hover:border-violet-500/30 transition-colors">
                    <div className={cn(
                      "absolute left-0 top-0 bottom-0 w-1",
                      alert.impact === 'critical' ? 'bg-red-500' :
                      alert.impact === 'high' ? 'bg-amber-500' :
                      alert.impact === 'medium' ? 'bg-blue-500' : 'bg-slate-400'
                    )} />
                    <div className="flex items-start gap-3 md:gap-4 ml-2">
                      <div className={cn(
                        "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0",
                        alert.impact === 'critical' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' :
                        alert.impact === 'high' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                        alert.impact === 'medium' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                        'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      )}>
                        {alert.type === 'prediction' && <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />}
                        {alert.type === 'menu' && <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />}
                        {alert.type === 'operations' && <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />}
                        {alert.type === 'upsell' && <Sparkles className="w-4 h-4 md:w-5 md:h-5" />}
                        {alert.type === 'inventory' && <Package className="w-4 h-4 md:w-5 md:h-5" />}
                        {alert.type === 'fraud' && <Shield className="w-4 h-4 md:w-5 md:h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm md:text-base font-bold text-slate-800 dark:text-white truncate">{alert.title}</h4>
                        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 md:line-clamp-none">{alert.description}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sales Prediction Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-white">Sales Forecast</h3>
                <p className="text-xs md:text-sm text-slate-500 mt-1">Based on historical trends and current factors</p>
              </div>
              <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                  <span className="text-slate-600 dark:text-slate-400 hidden sm:inline">Actual</span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-violet-500"></div>
                  <span className="text-slate-600 dark:text-slate-400 hidden sm:inline">Predicted</span>
                </div>
              </div>
            </div>

            <div className="h-[250px] md:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={safePredictionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#475569" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#475569" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--tw-colors-slate-200)" strokeOpacity={0.1} />
                   <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    dy={10} 
                  />
                  <YAxis 
                    hide 
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                    itemStyle={{ color: '#e2e8f0' }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                    formatter={(value) => [`₹${value}`, ""]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#64748b" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorActual)" 
                    isAnimationActive={false}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fillOpacity={1} 
                    fill="url(#colorPredicted)" 
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Platform Modules */}
        <div className="col-span-1 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-4 md:p-6 shadow-sm overflow-hidden flex flex-col">
          <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-white mb-1">Available Modules</h3>
          <p className="text-xs md:text-sm text-slate-500 mb-4 md:mb-6">AI features powering your restaurant</p>
          
          <div className="space-y-3 md:space-y-4 overflow-y-auto pr-2 no-scrollbar flex-1">
            {safeModules.map((mod) => {
              const config = MODULE_CONFIG[mod.key] || { icon: Brain, color: 'from-slate-500 to-slate-600' }
              const Icon = config.icon

              return (
                <div 
                  key={mod.key} 
                  className={cn(
                    "p-3 rounded-xl border transition-all flex items-center gap-3 md:gap-4",
                    mod.enabled 
                      ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50" 
                      : "bg-slate-50/50 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-800/50 opacity-60 grayscale"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0",
                    mod.enabled ? `bg-gradient-to-br ${config.color} text-white` : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                  )}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm md:text-base truncate">{mod.label}</h4>
                      {mod.isPremium && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-bold tracking-wider bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                          PRO
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={cn(
                    "text-[10px] md:text-xs font-semibold px-2 py-1 rounded-md shrink-0",
                    mod.enabled 
                      ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  )}>
                    {mod.enabled ? 'ACTIVE' : 'OFF'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
