import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download, FileSpreadsheet, FileText, Calendar, 
  TrendingUp, PieChart, BarChart3, Users, IndianRupee, 
  ShoppingBag, Percent, ArrowUpRight, Award, ChevronRight,
  RefreshCw, Star, Receipt, ArrowLeft
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts'
import { formatCurrency, cn } from '@/lib/utils'
import {
  downloadCSV, printToPDF,
  buildSalesRows, buildItemwiseRows, buildGSTRows, buildLoyaltyRows
} from '@/lib/exportUtils'
import useReportsStore from '@/store/reportsStore'
import useUIStore from '@/store/uiStore'

const PERIOD_LABELS = { today: 'Today', week: 'This Week', month: 'This Month' }

export default function ReportsPage() {
  const { reportData, loading, period, fetchReports } = useReportsStore()
  const { addNotification } = useUIStore()
  const [activeMetric, setActiveMetric] = useState('revenue')
  const [activeReportId, setActiveReportId] = useState(null)

  useEffect(() => { fetchReports('month') }, [])

  // ── Export helpers ────────────────────────────────────────────────────────
  const getExportData = (reportId) => {
    const trends  = reportData?.trends  || []
    const items   = reportData?.topItems || []
    const summary = reportData?.summary  || {}
    const loyalty = reportData?.loyalty  || {}
    const label   = PERIOD_LABELS[period] || 'Report'

    switch (reportId) {
      case 'sales':   return { rows: buildSalesRows(trends, summary),   title: `Sales Report — ${label}` }
      case 'itemwise':return { rows: buildItemwiseRows(items),           title: `Item-wise Report — ${label}` }
      case 'gst':     return { rows: buildGSTRows(trends, summary),      title: `GST Report — ${label}` }
      case 'loyalty': return { rows: buildLoyaltyRows(loyalty),          title: `Loyalty Performance — ${label}` }
      case 'staff':   return { rows: [['Name','Role','Orders','Revenue (₹)'],['No staff data available','','','']], title: `Staff Performance — ${label}` }
      case 'pnl':     return { rows: buildSalesRows(trends, summary),    title: `Profit & Loss — ${label}` }
      default:        return { rows: buildSalesRows(trends, summary),    title: `Report — ${label}` }
    }
  }

  const handlePDF = (reportId, reportLabel) => {
    const { rows, title } = getExportData(reportId)
    const periodLabel = PERIOD_LABELS[period] || 'Last 30 Days'
    printToPDF(title, rows, {
      subtitle: reportLabel,
      period: periodLabel
    })
    addNotification({ title: 'PDF View Opened', message: `${reportLabel} ready — click "Save as PDF" or use Print dialog.`, type: 'success' })
  }

  const handleExcel = (reportId, reportLabel) => {
    const { rows, title } = getExportData(reportId)
    // Use a simple, predictable filename — no special characters
    const filename = `${reportId}_report_${period}`
    downloadCSV(rows, filename)
    addNotification({ title: 'CSV Downloaded', message: `${reportLabel} saved as .csv file.`, type: 'success' })
  }

  const handleMasterExport = () => {
    const trends  = reportData?.trends  || []
    const summary = reportData?.summary  || {}
    downloadCSV(buildSalesRows(trends, summary), `Master_Report_${period}`)
    addNotification({ title: 'Export Started', message: 'Master sales report downloaded.', type: 'success' })
  }

  // ── UI helpers ────────────────────────────────────────────────────────────
  const handlePeriodChange = (p) => fetchReports(p)

  const stats  = reportData?.summary || { totalRevenue: 0, totalOrders: 0, totalGst: 0, avgBill: 0 }
  const trends = reportData?.trends  || []
  const items  = reportData?.topItems || []
  const loyalty = reportData?.loyalty || {}

  const chartColor = activeMetric === 'revenue' ? '#8b5cf6' : '#0ea5e9'

  const reportTypes = [
    { id: 'sales',    label: 'Sales Report',        icon: TrendingUp,    description: 'Revenue, orders, and payment breakdown',        color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { id: 'itemwise', label: 'Item-wise Report',     icon: PieChart,      description: 'Performance of each menu item by quantity & revenue', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'loyalty',  label: 'Loyalty Performance',  icon: Award,         description: 'Point accrual, redemption & member analytics', color: 'text-amber-500',  bg: 'bg-amber-500/10'  },
    { id: 'gst',      label: 'GST Report',           icon: Receipt,       description: 'CGST & SGST breakdown for tax filing',          color: 'text-blue-500',   bg: 'bg-blue-500/10'   },
    { id: 'staff',    label: 'Staff Performance',    icon: Users,         description: 'Waiter orders, tips, and ratings',              color: 'text-rose-500',   bg: 'bg-rose-500/10'   },
    { id: 'pnl',      label: 'Profit & Loss',        icon: FileSpreadsheet, description: 'Revenue vs expenses summary',                color: 'text-slate-500',  bg: 'bg-slate-500/10'  },
  ]

  if (activeReportId) {
    return (
      <DedicatedDashboard
        reportId={activeReportId}
        getExportData={getExportData}
        reportTypes={reportTypes}
        handlePDF={handlePDF}
        handleExcel={handleExcel}
        onBack={() => setActiveReportId(null)}
        periodLabel={PERIOD_LABELS[period]}
        reportData={reportData}
      />
    )
  }

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-primary-500/10 text-primary-500">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Reports Hub</h1>
          </div>
          <p className="text-sm text-slate-500">Intelligence & Business Performance Analytics</p>
        </div>

        {/* Period selector + master export */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {Object.entries(PERIOD_LABELS).map(([id, label]) => (
            <button
              key={id}
              onClick={() => handlePeriodChange(id)}
              className={cn(
                'px-4 py-1.5 text-xs font-bold rounded-xl transition-all',
                period === id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              )}
            >
              {label}
            </button>
          ))}
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
          <button
            onClick={handleMasterExport}
            title="Download master CSV"
            className="p-1.5 bg-violet-600 rounded-xl text-white hover:bg-violet-700 transition shadow-lg shadow-violet-500/20"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />)}
          </motion.div>
        ) : (
          <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue',  value: formatCurrency(stats.totalRevenue),         icon: IndianRupee, color: 'from-violet-500 to-indigo-600', trend: null },
              { label: 'Total Orders',   value: stats.totalOrders,                          icon: ShoppingBag, color: 'from-blue-500 to-cyan-600',    trend: null },
              { label: 'Avg Bill Value', value: formatCurrency(Math.round(stats.avgBill)),  icon: TrendingUp,  color: 'from-emerald-500 to-teal-600',  trend: null },
              { label: 'Tax Collected',  value: formatCurrency(stats.totalGst),             icon: Percent,     color: 'from-rose-500 to-pink-600',     trend: null },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="relative overflow-hidden group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{s.value}</p>
                  </div>
                  <div className={cn('p-2.5 rounded-xl bg-gradient-to-br text-white shadow-lg', s.color)}>
                    <s.icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Period: {PERIOD_LABELS[period]}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chart + Top Items ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Area chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/70 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <RefreshCw className="w-7 h-7 text-violet-500 animate-spin" />
            </div>
          )}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Performance Trend</h3>
              <p className="text-xs text-slate-500">Daily business metrics</p>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {[{ id: 'revenue', label: 'Revenue' }, { id: 'orders', label: 'Orders' }].map(m => (
                <button key={m.id} onClick={() => setActiveMetric(m.id)}
                  className={cn('px-4 py-1.5 text-xs font-bold rounded-lg transition-all',
                    activeMetric === m.id
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500'
                  )}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {trends.length === 0 && !loading ? (
            <div className="h-[300px] flex flex-col items-center justify-center opacity-30">
              <BarChart3 className="w-14 h-14 mb-3" />
              <p className="text-sm font-bold uppercase tracking-widest">No data for this period</p>
              <p className="text-xs mt-1">Process orders to see trends here</p>
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="gradMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={chartColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                  <XAxis dataKey="_id" axisLine={false} tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600 }}
                    tickFormatter={v => v.split('-').slice(1).join('/')} />
                  <YAxis axisLine={false} tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600 }}
                    tickFormatter={v => activeMetric === 'revenue'
                      ? `₹${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`
                      : v} />
                  <Tooltip
                    cursor={{ stroke: chartColor, strokeWidth: 1.5, strokeDasharray: '4 4' }}
                    contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12 }}
                    itemStyle={{ color: chartColor }}
                    formatter={v => [activeMetric === 'revenue' ? formatCurrency(v) : v,
                      activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)]}
                  />
                  <Area type="monotone" dataKey={activeMetric} stroke={chartColor} strokeWidth={3}
                    fillOpacity={1} fill="url(#gradMetric)" animationDuration={800} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top items */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Top Items</h3>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-5 font-medium">Ranked by revenue contribution</p>

          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            {items.length > 0 ? items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className="w-7 h-7 shrink-0 rounded-md bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-xs font-black text-slate-400 group-hover:text-violet-500 transition-colors">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-500">{item.count} sold</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(item.revenue)}</p>
                  <div className="w-14 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.revenue / (items[0]?.revenue || 1)) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-violet-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 opacity-30">
                <ShoppingBag className="w-10 h-10 mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">No Sales Data</p>
              </div>
            )}
          </div>

          <button
            onClick={() => handleExcel('itemwise', 'Item-wise Report')}
            className="w-full mt-4 py-2.5 text-xs font-bold text-violet-600 bg-violet-600/5 rounded-xl hover:bg-violet-600/10 transition-all border border-violet-600/10 flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Item Data
          </button>
        </div>
      </div>

      {/* ── Reporting Categories Grid ───────────────────────────────────── */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reporting Categories</h2>
          <p className="text-xs text-slate-400 font-medium">Click PDF or Excel to download real data</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={(e) => {
                // If they didn't click inside a button, open the dedicated dashboard
                if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                  setActiveReportId(report.id)
                }
              }}
              className="group relative cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-500 transition-all shadow-sm overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div className={cn('p-3 rounded-xl transition-all group-hover:scale-110 duration-200', report.bg, report.color)}>
                  <report.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-violet-600 transition-colors">
                    {report.label}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-medium">{report.description}</p>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handlePDF(report.id, report.label)}
                      className="flex-1 py-1.5 bg-red-50 dark:bg-red-500/10 rounded-lg text-[10px] font-bold text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3 h-3" /> PDF
                    </button>
                    <button
                      onClick={() => handleExcel(report.id, report.label)}
                      className="flex-1 py-1.5 bg-green-50 dark:bg-green-500/10 rounded-lg text-[10px] font-bold text-green-700 dark:text-green-400 hover:bg-green-500 hover:text-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-3 h-3" /> EXCEL
                    </button>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all mt-1 shrink-0" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  )
}

/* ── Dedicated Dashboard Component ───────────────────────────────────────── */
function DedicatedDashboard({ reportId, getExportData, reportTypes, handlePDF, handleExcel, onBack, periodLabel, reportData }) {
  const reportDef = reportTypes.find(r => r.id === reportId) || reportTypes[0];
  const { rows, title } = getExportData(reportId);
  const headers = rows[0] || [];
  const rawDataRows = rows.slice(1);
  
  // Filter out any blank spacer lines generated for the export CSV
  const dataRows = rawDataRows.filter(row => row.length > 1 || (row[0] && row[0].trim() !== ''));

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={cn("p-1.5 rounded-lg", reportDef.bg, reportDef.color)}>
                <reportDef.icon className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">{reportDef.label}</h1>
            </div>
            <p className="text-sm text-slate-500 font-medium">Interactive Data Dashboard — {periodLabel}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button 
            onClick={() => handlePDF(reportId, reportDef.label)} 
            className="px-4 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
          <button 
            onClick={() => handleExcel(reportId, reportDef.label)} 
            className="px-4 py-1.5 text-xs font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 rounded-xl hover:bg-green-500 hover:text-white transition-all flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>
      
      {/* Visualizations (Optional based on report logic, can be expanded) */}
      {reportId === 'sales' && reportData?.trends?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Revenue Trend</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData.trends}>
                <defs>
                  <linearGradient id="gradDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} tickFormatter={v => v.split('-').slice(1).join('/')} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
                <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#gradDash)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <reportDef.icon className="w-5 h-5 text-violet-500" />
            Generated Data Records
          </h3>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{dataRows.length} Rows</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                {headers.map((h, i) => (
                  <th key={i} className={cn(
                    "py-4 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap border-b border-slate-200 dark:border-slate-800",
                    i > 0 && "text-right"
                  )}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {dataRows.length > 0 ? dataRows.map((row, i) => {
                const isSummary = row[0] && row[0].toString().toUpperCase() === 'TOTAL';
                return (
                  <tr key={i} className={cn(
                    "hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors",
                    isSummary ? "bg-violet-50/50 dark:bg-violet-900/10" : ""
                  )}>
                    {row.map((cell, j) => (
                      <td key={j} className={cn(
                        "py-3.5 px-5 text-sm",
                        isSummary 
                          ? "font-black text-violet-700 dark:text-violet-400" 
                          : "font-medium text-slate-700 dark:text-slate-300",
                        j > 0 && "text-right"
                      )}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={headers.length} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                        <ShoppingBag className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No data available for this report period.</p>
                      <p className="text-xs font-medium text-slate-500 mt-1">Try changing the date period or processing more orders.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
