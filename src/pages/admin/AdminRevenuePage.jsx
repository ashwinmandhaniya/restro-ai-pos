import { useEffect } from 'react';
import { IndianRupee, TrendingUp, FileText, AlertTriangle } from 'lucide-react';
import useAdminAnalyticsStore from '@/store/adminAnalyticsStore';

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function AdminRevenuePage() {
  const { overview, revenueData, fetchOverview, fetchRevenue } = useAdminAnalyticsStore();

  useEffect(() => { fetchOverview(); fetchRevenue(); }, []);

  const r = overview?.revenue || {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueMonths = revenueData?.revenueByMonth || [];
  const maxRevenue = Math.max(...revenueMonths.map(m => m.revenue), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Revenue</h1>
        <p className="text-slate-400 mt-1">Financial overview and invoicing</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: 'MRR', value: formatINR(r.mrr), icon: IndianRupee, color: 'from-emerald-500 to-teal-600' },
          { label: 'ARR', value: formatINR(r.arr), icon: TrendingUp, color: 'from-violet-500 to-fuchsia-600' },
          { label: 'This Month', value: formatINR(r.thisMonth), icon: FileText, color: 'from-blue-500 to-cyan-600' },
          { label: 'Churn Rate', value: `${overview?.churnRate || 0}%`, icon: AlertTriangle, color: 'from-amber-500 to-orange-600' },
        ].map((kpi, i) => (
          <div key={kpi.label} className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center mb-3`}>
              <kpi.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white font-mono">{kpi.value}</p>
            <p className="text-sm text-slate-400 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart (Bar) */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Revenue Trend</h3>
        {revenueMonths.length === 0 ? (
          <p className="text-center text-slate-500 py-12">No revenue data yet. Invoices will appear here.</p>
        ) : (
          <div className="flex items-end gap-3 h-48">
            {revenueMonths.map((m) => (
              <div key={`${m._id.year}-${m._id.month}`} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">{formatINR(m.revenue)}</span>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-fuchsia-500 transition-all" style={{ height: `${(m.revenue / maxRevenue) * 100}%`, minHeight: 4 }} />
                <span className="text-[10px] text-slate-500">{monthNames[m._id.month - 1]} {String(m._id.year).slice(-2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revenue by Plan */}
      {revenueData?.revenueByPlan?.length > 0 && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue by Plan</h3>
          <div className="space-y-3">
            {revenueData.revenueByPlan.map((p) => {
              const pct = maxRevenue > 0 ? (p.revenue / revenueData.revenueByPlan.reduce((a, b) => a + b.revenue, 0)) * 100 : 0;
              return (
                <div key={p._id} className="flex items-center gap-4">
                  <span className="w-28 text-sm text-slate-300 font-medium">{p._id}</span>
                  <div className="flex-1 h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-mono text-emerald-400 w-28 text-right">{formatINR(p.revenue)}</span>
                  <span className="text-xs text-slate-500 w-20 text-right">{p.count} subs</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
