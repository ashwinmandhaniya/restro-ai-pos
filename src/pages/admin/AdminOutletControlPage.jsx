import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  Store, 
  CheckCircle, 
  XCircle, 
  Search, 
  Settings2,
  TrendingUp, 
  Layers,
  RefreshCw,
  Loader2,
  AlertCircle,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ── Toggle Switch ── */
const StatusToggle = ({ enabled, loading, onClick }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={cn(
      "relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900",
      enabled ? "bg-emerald-500" : "bg-slate-700",
      loading && "opacity-50 cursor-not-allowed"
    )}
  >
    <span
      className={cn(
        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm",
        enabled ? "translate-x-6" : "translate-x-1"
      )}
    />
  </button>
);

/* ── Skeleton ── */
const Skeleton = ({ className }) => (
  <div className={cn("animate-pulse bg-slate-800 rounded-xl", className)} />
);

export default function AdminOutletControlPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [limitInput, setLimitInput] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/outlets/overview');
      setData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFeature = async (tenantId, currentState) => {
    const action = currentState ? 'disable' : 'enable';
    setUpdatingId(tenantId);
    try {
      await api.post(`/admin/outlets/tenant/${tenantId}/${action}`);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle feature');
    } finally {
      setUpdatingId(null);
    }
  };

  const updateLimits = async (e) => {
    e.preventDefault();
    if (!selectedTenant) return;
    setIsUpdating(true);
    try {
      await api.patch(`/admin/outlets/tenant/${selectedTenant.restaurantId}/limits`, { 
        maxOutlets: Number(limitInput) 
      });
      setSelectedTenant(null);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update limit');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredTenants = data?.tenants.filter(t => 
    t.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.restaurantId?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (error) return (
    <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh]">
      <div className="p-6 bg-red-900/20 text-red-400 rounded-3xl mb-6">
        <AlertCircle size={48} />
      </div>
      <h2 className="text-2xl font-black text-white mb-2">Something went wrong</h2>
      <p className="text-slate-400 mb-8 max-w-sm">{error}</p>
      <button onClick={fetchData} className="px-6 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-all active:scale-95">
        Try Again
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* ── Header ── */}
      <motion.div 
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-violet-600 rounded-xl text-white shadow-lg shadow-violet-500/25">
              <Layers size={22} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">Multi-Outlet Control</h1>
          </div>
          <p className="text-slate-400 ml-[46px]">Manage outlet infrastructure and tenant scaling limits.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={fetchData}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-semibold text-sm hover:border-violet-500/50 hover:text-white transition-all"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'Syncing…' : 'Refresh'}
        </motion.button>
      </motion.div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Network Nodes', value: data?.totalOutletsGlobal, icon: Store, color: 'violet', meta: 'Total active' },
          { label: 'Multi-Outlet Tenants', value: data?.tenantsWithFeatureEnabled, icon: Activity, color: 'emerald',
            meta: `${data?.tenants ? Math.round((data.tenantsWithFeatureEnabled / data.tenants.length) * 100) : 0}% of total` },
          { label: 'Avg Scale Factor', value: data?.tenants?.length > 0 ? (data.totalOutletsGlobal / data.tenants.length).toFixed(1) : '0', 
            icon: TrendingUp, color: 'blue', meta: 'Outlets/tenant' },
        ].map((stat, i) => {
          const iconColors = { violet: 'bg-violet-500/15 text-violet-400', emerald: 'bg-emerald-500/15 text-emerald-400', blue: 'bg-blue-500/15 text-blue-400' };
          const badgeColors = { violet: 'bg-violet-500/10 text-violet-400', emerald: 'bg-emerald-500/10 text-emerald-400', blue: 'bg-blue-500/10 text-blue-400' };
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn("p-3 rounded-xl", iconColors[stat.color])}>
                  <stat.icon size={22} />
                </div>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg", badgeColors[stat.color])}>
                  {stat.meta}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              {isLoading ? <Skeleton className="h-9 w-20 mt-1" /> : (
                <p className="text-4xl font-black text-white tabular-nums">{stat.value ?? '—'}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── Main Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
      >
        {/* Table Header */}
        <div className="px-8 py-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80">
          <div>
            <h2 className="text-lg font-bold text-white">Tenant Directory</h2>
            <p className="text-sm text-slate-500">Real-time status and allocation control</p>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all w-full sm:w-72"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-950/50">
              <tr className="border-b border-slate-800">
                <th className="px-8 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Tenant</th>
                <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest">Feature Access</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Capacity</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                [1,2,3,4].map(i => (
                  <tr key={i} className="border-b border-slate-800/60">
                    <td className="px-8 py-5"><Skeleton className="h-12 w-56" /></td>
                    <td className="px-6 py-5 text-center"><Skeleton className="h-8 w-20 mx-auto" /></td>
                    <td className="px-6 py-5"><Skeleton className="h-8 w-full" /></td>
                    <td className="px-6 py-5 text-right"><Skeleton className="h-9 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-600">
                      <Search size={36} />
                      <p className="font-semibold">No tenants found {searchTerm && `for "${searchTerm}"`}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredTenants.map((t, idx) => (
                    <motion.tr
                      layout
                      key={t.restaurantId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Tenant */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-violet-500/20 flex-shrink-0">
                            {t.restaurantName?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-violet-400 transition-colors">{t.restaurantName}</p>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">ID: {t.restaurantId?.slice(-8)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Toggle */}
                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <StatusToggle
                            enabled={t.isEnabled}
                            loading={updatingId === t.restaurantId}
                            onClick={() => toggleFeature(t.restaurantId, t.isEnabled)}
                          />
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            t.isEnabled ? "text-emerald-400" : "text-slate-500"
                          )}>
                            {updatingId === t.restaurantId ? '...' : t.isEnabled ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                      </td>

                      {/* Capacity Bar */}
                      <td className="px-6 py-5">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-500">Outlets</span>
                            <span className={t.outletCount >= t.maxOutlets ? "text-red-400" : "text-slate-300"}>
                              {t.outletCount} / {t.maxOutlets}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, Math.max(2, (t.outletCount / t.maxOutlets) * 100))}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className={cn(
                                "h-full rounded-full",
                                t.outletCount >= t.maxOutlets
                                  ? 'bg-gradient-to-r from-red-500 to-orange-400'
                                  : 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                              )}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => { setSelectedTenant(t); setLimitInput(t.maxOutlets); }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold hover:border-violet-500/50 hover:text-violet-400 transition-all active:scale-95"
                        >
                          <Settings2 size={14} /> Edit Limit
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Edit Limit Modal ── */}
      <AnimatePresence>
        {selectedTenant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setSelectedTenant(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-800">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-violet-600 rounded-xl text-white shadow-lg shadow-violet-500/25">
                    <Settings2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Edit Outlet Limit</h3>
                    <p className="text-sm text-slate-400">{selectedTenant.restaurantName}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Set the maximum number of outlets this tenant can create. Current usage: <span className="text-white font-bold">{selectedTenant.outletCount}</span>
                </p>
              </div>

              {/* Modal Body */}
              <form onSubmit={updateLimits} className="p-8 space-y-6">
                <div className="bg-slate-950/50 rounded-xl p-6 border border-slate-800">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 text-center">Max Outlets</label>
                  <div className="flex items-center justify-center gap-6">
                    <button
                      type="button"
                      onClick={() => setLimitInput(v => Math.max(1, Number(v) - 1))}
                      className="w-12 h-12 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-xl text-2xl font-black text-slate-300 hover:border-violet-500 hover:text-violet-400 transition-all active:scale-90"
                    >−</button>
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={limitInput}
                      onChange={e => setLimitInput(e.target.value)}
                      className="w-24 bg-transparent border-none text-center text-5xl font-black text-white focus:ring-0 outline-none tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() => setLimitInput(v => Number(v) + 1)}
                      className="w-12 h-12 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-xl text-2xl font-black text-slate-300 hover:border-violet-500 hover:text-violet-400 transition-all active:scale-90"
                    >+</button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedTenant(null)}
                    className="flex-1 py-3 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-500/25 hover:bg-violet-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
