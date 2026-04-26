import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, IndianRupee, Users, TrendingUp, TrendingDown, AlertTriangle, CreditCard, Activity } from 'lucide-react';
import useAdminAnalyticsStore from '@/store/adminAnalyticsStore';
import { cn } from '@/lib/utils';

const formatINR = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0';

export default function AdminDashboardPage() {
  const { overview, fetchOverview, fetchTenantAnalytics, tenantAnalytics, isLoading } = useAdminAnalyticsStore();

  useEffect(() => {
    fetchOverview();
    fetchTenantAnalytics();
  }, []);

  if (isLoading && !overview) return <div className="flex items-center justify-center h-[60vh] text-slate-500"><Activity className="w-8 h-8 animate-spin" /></div>;

  const t = overview?.tenants || {};
  const r = overview?.revenue || {};
  const s = overview?.subscriptions || {};

  const kpis = [
    { label: 'Monthly Revenue (MRR)', value: formatINR(r.mrr), icon: IndianRupee, color: 'from-emerald-500 to-teal-600', sub: `ARR ${formatINR(r.arr)}` },
    { label: 'Active Restaurants', value: t.active || 0, icon: Building2, color: 'from-violet-500 to-fuchsia-600', sub: `${t.pending || 0} pending approval` },
    { label: 'Active Subscriptions', value: s.active || 0, icon: CreditCard, color: 'from-blue-500 to-cyan-600', sub: `${s.trialing || 0} on trial` },
    { label: 'Churn Rate', value: `${overview?.churnRate || 0}%`, icon: overview?.churnRate > 5 ? TrendingDown : TrendingUp, color: overview?.churnRate > 5 ? 'from-red-500 to-orange-600' : 'from-green-500 to-emerald-600', sub: `${t.churned || 0} churned total` },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Command Center</h1>
        <p className="text-slate-400 mt-1">Global overview of the RestroAI platform</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-5"
          >
            <div className={cn('absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 bg-gradient-to-br', kpi.color)} />
            <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3', kpi.color)}>
              <kpi.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white font-mono">{kpi.value}</p>
            <p className="text-sm text-slate-400 mt-1">{kpi.label}</p>
            <p className="text-xs text-slate-500 mt-2">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Grid: Alerts + Top Tenants */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Status */}
        <div className="lg:col-span-1 rounded-2xl bg-slate-900 border border-slate-800 p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Platform Status</h3>
          <div className="space-y-3">
            {[
              { label: 'Total Tenants', value: t.total || 0, dot: 'bg-violet-500' },
              { label: 'Suspended', value: t.suspended || 0, dot: 'bg-red-500' },
              { label: 'Signups This Month', value: overview?.growth?.signupsThisMonth || 0, dot: 'bg-emerald-500' },
              { label: 'Total Platform Users', value: overview?.users?.total || 0, dot: 'bg-blue-500' },
              { label: 'Revenue This Month', value: formatINR(r.thisMonth), dot: 'bg-amber-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', item.dot)} />
                  <span className="text-sm text-slate-400">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-white font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Restaurants */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Top Restaurants</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Name', 'City', 'Revenue', 'Orders', 'Health', 'Plan'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs text-slate-500 font-semibold uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(tenantAnalytics?.topTenants || []).slice(0, 8).map((tenant) => (
                  <tr key={tenant._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-white">{tenant.name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{tenant.region?.city || '—'}</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400">{formatINR(tenant.metadata?.totalRevenue)}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{tenant.metadata?.totalOrders || 0}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                          <div className={cn('h-full rounded-full', tenant.healthScore > 70 ? 'bg-emerald-500' : tenant.healthScore > 40 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${tenant.healthScore}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{tenant.healthScore}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-medium">
                        {tenant.currentPlanId?.name || 'None'}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!tenantAnalytics?.topTenants || tenantAnalytics.topTenants.length === 0) && (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-500">No tenant data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* City Distribution */}
      {tenantAnalytics?.tenantsByCity?.length > 0 && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Tenants by City</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {tenantAnalytics.tenantsByCity.map((c) => (
              <div key={c._id} className="rounded-xl bg-slate-800/60 p-3 text-center">
                <p className="text-xl font-bold text-white font-mono">{c.count}</p>
                <p className="text-xs text-slate-400 mt-1 capitalize">{c._id || 'Unknown'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
