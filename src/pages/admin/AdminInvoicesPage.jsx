import React, { useEffect, useState } from 'react';
import useAdminInvoiceStore from '@/store/adminInvoiceStore';
import { 
  FileText, 
  IndianRupee, 
  Clock, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Receipt,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function AdminInvoicesPage() {
  const { invoices, stats, pagination, isLoading, error, fetchInvoices, fetchStats, updateInvoiceStatus } = useAdminInvoiceStore();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchStats();
    fetchInvoices({ status: filter, search: debouncedSearch, page: 1 });
  }, [fetchStats, fetchInvoices, filter, debouncedSearch]);

  const handlePageChange = (newPage) => {
    fetchInvoices({ status: filter, search: debouncedSearch, page: newPage });
  };

  const handleExportCSV = () => {
    if (invoices.length === 0) return;
    const headers = ["Invoice Number", "Tenant", "Amount", "Status", "Date"];
    const rows = invoices.map(inv => [
      inv.invoiceNumber,
      inv.restaurantId?.name || "Unknown",
      inv.total,
      inv.status,
      format(new Date(inv.issueDate), 'yyyy-MM-dd')
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `invoices_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStatusChange = async (id, newStatus) => {
    if (confirm(`Mark this transaction as ${newStatus}?`)) {
      await updateInvoiceStatus(id, { status: newStatus });
    }
  };

  const totalPaid = stats?.byStatus?.paid?.total ?? 0;
  const totalPending = (stats?.byStatus?.sent?.total ?? 0) + (stats?.byStatus?.overdue?.total ?? 0);
  const overdueCount = stats?.overdueCount ?? 0;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400"><CheckCircle size={11} /> Paid</span>;
      case 'overdue':   return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400"><AlertCircle size={11} /> Overdue</span>;
      case 'sent':      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-400"><Clock size={11} /> Pending</span>;
      case 'cancelled': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-700 text-slate-400"><XCircle size={11} /> Cancelled</span>;
      default:          return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-700 text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-violet-600 rounded-xl text-white shadow-lg shadow-violet-500/25">
              <Receipt size={22} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">Transaction Management</h1>
          </div>
          <p className="text-slate-400 ml-[46px]">Platform-wide billing reconciliation and subscription tracking.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            disabled={invoices.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-semibold text-sm hover:border-violet-500/50 hover:text-white transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            <FileText size={16} /> Export CSV
          </button>
          <button
            onClick={() => { fetchStats(); fetchInvoices({ status: filter, search: debouncedSearch, page: pagination?.page || 1 }); }}
            className="p-2.5 bg-violet-600 text-white rounded-xl shadow-lg shadow-violet-500/25 hover:bg-violet-700 transition-all active:scale-95"
          >
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Total Collected',     value: `₹${totalPaid.toLocaleString()}`,   icon: IndianRupee, color: 'emerald', badge: '+Lifetime' },
          { label: 'Outstanding Payout',  value: `₹${totalPending.toLocaleString()}`, icon: Clock,       color: 'blue',   badge: 'Awaiting'  },
          { label: 'Overdue Invoices',    value: overdueCount,                        icon: AlertCircle, color: 'red',    badge: 'Attention' },
        ].map((stat, i) => {
          const iconColors  = { emerald: 'bg-emerald-500/15 text-emerald-400', blue: 'bg-blue-500/15 text-blue-400', red: 'bg-red-500/15 text-red-400' };
          const badgeColors = { emerald: 'bg-emerald-500/10 text-emerald-400', blue: 'bg-blue-500/10 text-blue-400', red: 'bg-red-500/10 text-red-400' };
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
                  {stat.badge}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-4xl font-black text-white tabular-nums">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
      >
        {/* Toolbar */}
        <div className="px-8 py-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search invoice number..."
              className="bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all w-full sm:w-72"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-500">
              <Filter size={16} />
            </div>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-4 pr-9 text-sm font-semibold text-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none cursor-pointer appearance-none"
            >
              <option value="all">All Transactions</option>
              <option value="paid">Paid</option>
              <option value="sent">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-950/50 border-b border-slate-800">
              <tr>
                <th className="px-8 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Transaction ID</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Tenant</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading && invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-600">
                      <RefreshCw size={32} className="animate-spin text-violet-500/60" />
                      <p className="text-xs font-bold uppercase tracking-widest">Syncing ledger…</p>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-600">
                      <FileText size={36} />
                      <p className="font-semibold">No transactions found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {invoices.map((inv, idx) => (
                    <motion.tr
                      layout
                      key={inv._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.025 }}
                      className="group hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-8 py-5">
                        <p className="font-bold text-white group-hover:text-violet-400 transition-colors text-sm">{inv.invoiceNumber}</p>
                        {inv.transactionId && (
                          <p className="text-[10px] text-slate-600 font-mono mt-0.5">Ref: {inv.transactionId.slice(-10)}</p>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-semibold text-white text-sm">{inv.restaurantId?.name || 'Unknown Tenant'}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{inv.restaurantId?.email}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm text-slate-400">
                          {format(new Date(inv.issueDate), 'MMM dd, yyyy')}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <p className="text-base font-black text-white tabular-nums">₹{inv.total.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {getStatusBadge(inv.status)}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                            <button
                              title="Mark as Paid"
                              onClick={() => handleStatusChange(inv._id, 'paid')}
                              className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all active:scale-90"
                            >
                              <CheckCircle size={17} />
                            </button>
                          )}
                          {inv.status !== 'cancelled' && (
                            <button
                              title="Cancel Invoice"
                              onClick={() => handleStatusChange(inv._id, 'cancelled')}
                              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all active:scale-90"
                            >
                              <XCircle size={17} />
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
              Page <span className="text-white font-bold">{pagination.page}</span> of{' '}
              <span className="text-white font-bold">{pagination.pages}</span> &nbsp;·&nbsp;{' '}
              <span className="text-white font-bold">{pagination.total}</span> total
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1 || isLoading}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.pages || isLoading}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
