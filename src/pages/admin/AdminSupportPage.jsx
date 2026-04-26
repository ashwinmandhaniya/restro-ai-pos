import { useEffect, useState } from 'react';
import { HeadphonesIcon, MessageSquare, Clock, AlertTriangle, User } from 'lucide-react';
import useAdminSupportStore from '@/store/adminSupportStore';
import { cn } from '@/lib/utils';

const priorityColors = { critical: 'bg-red-500/20 text-red-400', high: 'bg-orange-500/20 text-orange-400', medium: 'bg-amber-500/20 text-amber-400', low: 'bg-slate-500/20 text-slate-400' };
const statusColors = { open: 'bg-blue-500/20 text-blue-400', in_progress: 'bg-violet-500/20 text-violet-400', waiting_on_customer: 'bg-amber-500/20 text-amber-400', resolved: 'bg-emerald-500/20 text-emerald-400', closed: 'bg-slate-500/20 text-slate-400' };

export default function AdminSupportPage() {
  const { tickets, stats, selectedTicket, fetchTickets, fetchStats, getTicket, updateTicket, replyToTicket, isLoading } = useAdminSupportStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [replyText, setReplyText] = useState('');

  useEffect(() => { fetchTickets(); fetchStats(); }, []);
  useEffect(() => { statusFilter !== undefined && fetchTickets({ status: statusFilter || undefined }); }, [statusFilter]);

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    await replyToTicket(selectedTicket._id, replyText);
    setReplyText('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Support</h1>
          <p className="text-slate-400 mt-1">Manage tenant support tickets</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className={cn('rounded-xl bg-slate-900 border p-4 text-center transition-all', statusFilter === s ? 'border-violet-500 ring-1 ring-violet-500/30' : 'border-slate-800')}>
              <p className="text-2xl font-bold text-white font-mono">{stats.byStatus?.[s] || 0}</p>
              <p className="text-xs text-slate-400 capitalize mt-1">{s.replace(/_/g, ' ')}</p>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden max-h-[70vh] flex flex-col">
          <div className="p-4 border-b border-slate-800"><h3 className="text-sm font-semibold text-white">Tickets</h3></div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? <p className="text-center py-8 text-slate-500">Loading...</p> :
              tickets.length === 0 ? <p className="text-center py-8 text-slate-500">No tickets</p> :
              tickets.map(t => (
                <button key={t._id} onClick={() => getTicket(t._id)}
                  className={cn('w-full text-left px-4 py-3.5 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors', selectedTicket?._id === t._id && 'bg-violet-600/10 border-l-2 border-l-violet-500')}>
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-white truncate pr-2">{t.subject}</p>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize flex-shrink-0', priorityColors[t.priority])}>{t.priority}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{t.restaurantId?.name || 'Unknown'} • {t.ticketNumber}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize', statusColors[t.status])}>{t.status?.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-slate-600">{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))
            }
          </div>
        </div>

        {/* Ticket Detail */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col max-h-[70vh]">
          {!selectedTicket ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">Select a ticket to view</div>
          ) : (
            <>
              <div className="p-5 border-b border-slate-800">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedTicket.subject}</h3>
                    <p className="text-xs text-slate-500 mt-1">{selectedTicket.ticketNumber} • {selectedTicket.restaurantId?.name} • Created by {selectedTicket.createdBy?.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <select value={selectedTicket.status} onChange={e => updateTicket(selectedTicket._id, { status: e.target.value })}
                      className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white">
                      {['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                    <select value={selectedTicket.priority} onChange={e => updateTicket(selectedTicket._id, { priority: e.target.value })}
                      className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white">
                      {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <p className="text-sm text-slate-300">{selectedTicket.description}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {(selectedTicket.messages || []).map((msg, i) => (
                  <div key={i} className={cn('max-w-[80%] rounded-xl p-3', msg.senderRole === 'admin' ? 'ml-auto bg-violet-600/20 border border-violet-500/30' : 'bg-slate-800')}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-white">{msg.senderName}</span>
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-medium', msg.senderRole === 'admin' ? 'bg-violet-500/30 text-violet-300' : 'bg-slate-700 text-slate-400')}>{msg.senderRole}</span>
                    </div>
                    <p className="text-sm text-slate-300">{msg.content}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{new Date(msg.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              {/* Reply */}
              <div className="p-4 border-t border-slate-800">
                <div className="flex gap-2">
                  <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type a reply..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none" onKeyDown={e => e.key === 'Enter' && handleReply()} />
                  <button onClick={handleReply} className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all">Reply</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
