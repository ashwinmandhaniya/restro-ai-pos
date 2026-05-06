import React, { useEffect, useState } from 'react';
import useAdminTransactionStore from '@/store/adminTransactionStore';
import {
  FileText, IndianRupee, Clock, Search, CheckCircle, XCircle,
  AlertCircle, RefreshCw, Receipt, Filter, Plus, X, ArrowUpRight,
  ShoppingCart, RotateCcw, ArrowUp, ArrowDown, CreditCard, Banknote
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'plan_purchase', label: 'Plan Purchase' },
  { value: 'plan_renewal', label: 'Plan Renewal' },
  { value: 'plan_upgrade', label: 'Plan Upgrade' },
  { value: 'plan_downgrade', label: 'Plan Downgrade' },
  { value: 'plan_cancel', label: 'Plan Cancel' },
  { value: 'refund', label: 'Refund' },
  { value: 'addon_purchase', label: 'Add-on Purchase' },
  { value: 'manual_credit', label: 'Manual Credit' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const typeBadge = {
  plan_purchase:  { label: 'Purchase',  cls: 'bg-emerald-500/15 text-emerald-400', icon: ShoppingCart },
  plan_renewal:   { label: 'Renewal',   cls: 'bg-blue-500/15 text-blue-400',       icon: RotateCcw },
  plan_upgrade:   { label: 'Upgrade',   cls: 'bg-violet-500/15 text-violet-400',   icon: ArrowUp },
  plan_downgrade: { label: 'Downgrade', cls: 'bg-amber-500/15 text-amber-400',     icon: ArrowDown },
  plan_cancel:    { label: 'Cancel',    cls: 'bg-red-500/15 text-red-400',         icon: XCircle },
  refund:         { label: 'Refund',    cls: 'bg-orange-500/15 text-orange-400',   icon: RotateCcw },
  addon_purchase: { label: 'Add-on',    cls: 'bg-cyan-500/15 text-cyan-400',       icon: Plus },
  manual_credit:  { label: 'Credit',    cls: 'bg-teal-500/15 text-teal-400',       icon: Banknote },
};

const statusBadge = {
  completed: { label: 'Completed', cls: 'bg-emerald-500/15 text-emerald-400', icon: CheckCircle },
  pending:   { label: 'Pending',   cls: 'bg-blue-500/15 text-blue-400',       icon: Clock },
  failed:    { label: 'Failed',    cls: 'bg-red-500/15 text-red-400',         icon: XCircle },
  refunded:  { label: 'Refunded',  cls: 'bg-orange-500/15 text-orange-400',   icon: RotateCcw },
};

export default function AdminInvoicesPage() {
  const { transactions, stats, pagination, isLoading, error, fetchTransactions, fetchStats, createTransaction, updateTransaction } = useAdminTransactionStore();
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    type: 'plan_purchase', restaurantId: '', planId: '', amount: '',
    status: 'completed', paymentMethod: 'manual', billingCycle: 'monthly', notes: ''
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchStats();
    fetchTransactions({ type: typeFilter, status: statusFilter, search: debouncedSearch, page: 1 });
  }, [fetchStats, fetchTransactions, typeFilter, statusFilter, debouncedSearch]);

  const reload = () => {
    fetchStats();
    fetchTransactions({ type: typeFilter, status: statusFilter, search: debouncedSearch, page: pagination?.page || 1 });
  };

  const handlePageChange = (p) => fetchTransactions({ type: typeFilter, status: statusFilter, search: debouncedSearch, page: p });

  const handleStatusChange = async (id, newStatus) => {
    if (confirm(`Mark this transaction as ${newStatus}?`)) {
      await updateTransaction(id, { status: newStatus });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const ok = await createTransaction({ ...createForm, amount: Number(createForm.amount) });
    if (ok) { setShowCreate(false); setCreateForm({ type: 'plan_purchase', restaurantId: '', planId: '', amount: '', status: 'completed', paymentMethod: 'manual', billingCycle: 'monthly', notes: '' }); }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ["Transaction ID", "Type", "Restaurant", "Plan", "Amount", "Status", "Payment", "Date"];
    const rows = transactions.map(t => [
      t.transactionId, t.type, t.restaurantId?.name || '—', t.planId?.name || '—',
      t.amount, t.status, t.paymentMethod, format(new Date(t.createdAt), 'yyyy-MM-dd')
    ]);
    const csv = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = encodeURI(csv);
    a.download = `transactions_${format(new Date(), 'yyyyMMdd')}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalPending = stats?.totalPending ?? 0;
  const totalRefunded = stats?.totalRefunded ?? 0;
  const totalCount = stats?.totalTransactions ?? 0;

  const renderTypeBadge = (type) => {
    const b = typeBadge[type] || { label: type, cls: 'bg-slate-700 text-slate-400', icon: FileText };
    const Icon = b.icon;
    return <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold", b.cls)}><Icon size={11} /> {b.label}</span>;
  };

  const renderStatusBadge = (status) => {
    const b = statusBadge[status] || { label: status, cls: 'bg-slate-700 text-slate-400', icon: AlertCircle };
    const Icon = b.icon;
    return <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold", b.cls)}><Icon size={11} /> {b.label}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-violet-600 rounded-xl text-white shadow-lg shadow-violet-500/25"><Receipt size={22} /></div>
            <h1 className="text-3xl font-black tracking-tight text-white">Transaction Management</h1>
          </div>
          <p className="text-slate-400 ml-[46px]">SuperAdmin plan purchase & subscription transaction ledger.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/25 active:scale-95">
            <Plus size={16} /> New Transaction
          </button>
          <button onClick={handleExportCSV} disabled={transactions.length === 0} className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-semibold text-sm hover:border-violet-500/50 hover:text-white transition-all disabled:opacity-40 disabled:pointer-events-none">
            <FileText size={16} /> Export
          </button>
          <button onClick={reload} className="p-2.5 bg-violet-600 text-white rounded-xl shadow-lg shadow-violet-500/25 hover:bg-violet-700 transition-all active:scale-95">
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-900/30 text-red-400 rounded-xl font-semibold flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: 'Total Revenue',   value: `₹${totalRevenue.toLocaleString()}`,   icon: IndianRupee, color: 'emerald', badge: 'Collected' },
          { label: 'Pending',         value: `₹${totalPending.toLocaleString()}`,   icon: Clock,       color: 'blue',    badge: 'Awaiting' },
          { label: 'Refunded',        value: `₹${totalRefunded.toLocaleString()}`,  icon: RotateCcw,   color: 'orange',  badge: 'Returned' },
          { label: 'Transactions',    value: totalCount,                             icon: Receipt,     color: 'violet',  badge: 'Total' },
        ].map((stat, i) => {
          const iconColors  = { emerald: 'bg-emerald-500/15 text-emerald-400', blue: 'bg-blue-500/15 text-blue-400', orange: 'bg-orange-500/15 text-orange-400', violet: 'bg-violet-500/15 text-violet-400' };
          const badgeColors = { emerald: 'bg-emerald-500/10 text-emerald-400', blue: 'bg-blue-500/10 text-blue-400', orange: 'bg-orange-500/10 text-orange-400', violet: 'bg-violet-500/10 text-violet-400' };
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className={cn("p-3 rounded-xl", iconColors[stat.color])}><stat.icon size={22} /></div>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg", badgeColors[stat.color])}>{stat.badge}</span>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-4xl font-black text-white tabular-nums">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Table Card */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="px-8 py-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Search transaction ID…" className="bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all w-full sm:w-72"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-500"><Filter size={16} /></div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-4 pr-9 text-sm font-semibold text-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none cursor-pointer appearance-none">
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-4 pr-9 text-sm font-semibold text-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none cursor-pointer appearance-none">
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-950/50 border-b border-slate-800">
              <tr>
                <th className="px-8 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Transaction ID</th>
                <th className="px-4 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Type</th>
                <th className="px-4 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Restaurant</th>
                <th className="px-4 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Plan</th>
                <th className="px-4 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                <th className="px-4 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-4 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Payment</th>
                <th className="px-4 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading && transactions.length === 0 ? (
                <tr><td colSpan={9} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-600">
                    <RefreshCw size={32} className="animate-spin text-violet-500/60" />
                    <p className="text-xs font-bold uppercase tracking-widest">Loading transactions…</p>
                  </div>
                </td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={9} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-600">
                    <Receipt size={36} />
                    <p className="font-semibold">No transactions found</p>
                    <p className="text-xs text-slate-600">Transactions are auto-created when you assign plans.</p>
                  </div>
                </td></tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {transactions.map((txn, idx) => (
                    <motion.tr layout key={txn._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                      className="group hover:bg-slate-800/30 transition-colors">
                      <td className="px-8 py-5">
                        <p className="font-bold text-white group-hover:text-violet-400 transition-colors text-sm">{txn.transactionId}</p>
                        {txn.performedBy && <p className="text-[10px] text-slate-600 mt-0.5">by {txn.performedBy?.name}</p>}
                      </td>
                      <td className="px-4 py-5">{renderTypeBadge(txn.type)}</td>
                      <td className="px-4 py-5">
                        <p className="font-semibold text-white text-sm">{txn.restaurantId?.name || '—'}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{txn.restaurantId?.email}</p>
                      </td>
                      <td className="px-4 py-5">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">{txn.planId?.name || '—'}</span>
                      </td>
                      <td className="px-4 py-5 text-right">
                        <p className="text-base font-black text-white tabular-nums">₹{txn.amount?.toLocaleString() ?? 0}</p>
                        <p className="text-[10px] text-slate-600 capitalize">{txn.billingCycle}</p>
                      </td>
                      <td className="px-4 py-5 text-center">{renderStatusBadge(txn.status)}</td>
                      <td className="px-4 py-5"><span className="text-xs text-slate-400 capitalize">{txn.paymentMethod}</span></td>
                      <td className="px-4 py-5"><p className="text-sm text-slate-400">{format(new Date(txn.createdAt), 'MMM dd, yyyy')}</p></td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {txn.status === 'pending' && (
                            <button title="Mark Completed" onClick={() => handleStatusChange(txn._id, 'completed')}
                              className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all active:scale-90">
                              <CheckCircle size={17} />
                            </button>
                          )}
                          {txn.status === 'completed' && (
                            <button title="Mark Refunded" onClick={() => handleStatusChange(txn._id, 'refunded')}
                              className="p-2 text-slate-500 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-all active:scale-90">
                              <RotateCcw size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-8 py-5 border-t border-slate-800 flex items-center justify-between bg-slate-950/30">
            <p className="text-xs text-slate-500">
              Page <span className="text-white font-bold">{pagination.page}</span> of <span className="text-white font-bold">{pagination.pages}</span>
              &nbsp;·&nbsp;<span className="text-white font-bold">{pagination.total}</span> total
            </p>
            <div className="flex gap-2">
              <button disabled={pagination.page <= 1 || isLoading} onClick={() => handlePageChange(pagination.page - 1)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-all">Previous</button>
              <button disabled={pagination.page >= pagination.pages || isLoading} onClick={() => handlePageChange(pagination.page + 1)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-all">Next</button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Create Transaction Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6">
              <div className="flex justify-between mb-5">
                <h3 className="text-xl font-bold text-white">New Transaction</h3>
                <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs text-slate-400 mb-1 block">Type *</label>
                    <select required value={createForm.type} onChange={e => setCreateForm({ ...createForm, type: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none">
                      {TYPE_OPTIONS.filter(o => o.value !== 'all').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select></div>
                  <div><label className="text-xs text-slate-400 mb-1 block">Status</label>
                    <select value={createForm.status} onChange={e => setCreateForm({ ...createForm, status: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none">
                      {STATUS_OPTIONS.filter(o => o.value !== 'all').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select></div>
                </div>
                <div><label className="text-xs text-slate-400 mb-1 block">Restaurant ID *</label>
                  <input required placeholder="Paste MongoDB ObjectId" value={createForm.restaurantId} onChange={e => setCreateForm({ ...createForm, restaurantId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none font-mono" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs text-slate-400 mb-1 block">Plan ID</label>
                    <input placeholder="Optional MongoDB ObjectId" value={createForm.planId} onChange={e => setCreateForm({ ...createForm, planId: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none font-mono" /></div>
                  <div><label className="text-xs text-slate-400 mb-1 block">Amount (₹) *</label>
                    <input required type="number" min="0" step="0.01" placeholder="0" value={createForm.amount} onChange={e => setCreateForm({ ...createForm, amount: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none font-mono" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs text-slate-400 mb-1 block">Payment Method</label>
                    <select value={createForm.paymentMethod} onChange={e => setCreateForm({ ...createForm, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none">
                      <option value="manual">Manual</option><option value="upi">UPI</option><option value="razorpay">Razorpay</option>
                      <option value="bank_transfer">Bank Transfer</option><option value="cash">Cash</option>
                    </select></div>
                  <div><label className="text-xs text-slate-400 mb-1 block">Billing Cycle</label>
                    <select value={createForm.billingCycle} onChange={e => setCreateForm({ ...createForm, billingCycle: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none">
                      <option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="one_time">One-time</option>
                    </select></div>
                </div>
                <div><label className="text-xs text-slate-400 mb-1 block">Notes</label>
                  <textarea rows={2} placeholder="Optional description…" value={createForm.notes} onChange={e => setCreateForm({ ...createForm, notes: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none resize-none" /></div>
                <button type="submit" className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-all">Create Transaction</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
