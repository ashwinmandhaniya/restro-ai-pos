import { useState, useEffect } from 'react';
import { Crown, CheckCircle2, AlertCircle, Loader2, Calendar, CreditCard, Zap, Send, MessageSquare, Plus, ArrowLeft, Clock, ChevronRight, ArrowUpRight, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

const CATEGORIES = [
  { value: 'billing', label: 'Billing & Payments', icon: '💳' },
  { value: 'technical', label: 'Technical Issue', icon: '🔧' },
  { value: 'bug', label: 'Bug Report', icon: '🐛' },
  { value: 'feature_request', label: 'Feature Request', icon: '💡' },
  { value: 'account', label: 'Account & Access', icon: '👤' },
  { value: 'other', label: 'Other', icon: '📋' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  { value: 'high', label: 'High', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
];

const statusConfig = {
  open: { label: 'Open', class: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  in_progress: { label: 'In Progress', class: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400' },
  waiting_on_customer: { label: 'Awaiting Reply', class: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  resolved: { label: 'Resolved', class: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  closed: { label: 'Closed', class: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400' },
};

export default function TenantSubscriptionPanel() {
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/tenant/restaurant/settings');
        setRestaurant(data.data);
      } catch (err) {
        console.error('[Subscription] Failed to load:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
        <p className="text-sm text-surface-500">Loading subscription...</p>
      </div>
    );
  }

  const currentPlan = restaurant?.currentPlanId;
  const subscriptionStatus = restaurant?.subscriptionStatus || 'active';
  const endPeriod = restaurant?.subscriptionPeriodEnd;
  const billingCycle = restaurant?.billingCycle;

  const isUnlimited = (val) => val === -1 ? 'Unlimited' : val;
  const price = currentPlan?.price;
  const displayPrice = billingCycle === 'yearly'
    ? (price?.yearly ? `₹${price.yearly.toLocaleString()}/yr` : 'Custom')
    : (price?.monthly ? `₹${price.monthly.toLocaleString()}/mo` : 'Free');

  return (
    <div className="space-y-10">
      {/* ─── Plan Overview ─── */}
      {!currentPlan ? (
        <div className="py-12 text-center text-surface-500">
          <Crown className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <p className="font-medium text-surface-900 dark:text-white mb-2">No Active Subscription Detected</p>
          <p className="text-sm">Please contact support below to get started with a plan.</p>
        </div>
      ) : (
        <>
          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary-500/10 to-primary-600/5 border border-primary-500/20">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
                    <Crown className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-xl font-bold text-surface-900 dark:text-white">{currentPlan.name} Plan</h3>
                  {subscriptionStatus === 'active' ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">Active</span>
                  ) : subscriptionStatus === 'trialing' ? (
                    <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">Trial</span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">{subscriptionStatus}</span>
                  )}
                </div>
                <p className="text-sm text-surface-600 dark:text-surface-400 max-w-xl">{currentPlan.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold text-surface-900 dark:text-white">{displayPrice}</p>
                {billingCycle && <p className="text-xs text-surface-500 mt-0.5 capitalize">{billingCycle} billing</p>}
              </div>
            </div>
            {endPeriod && (
              <div className="mt-6 pt-6 border-t border-primary-500/10 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-surface-400" />
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Current billing cycle ends on <span className="font-semibold text-surface-900 dark:text-white">{new Date(endPeriod).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </p>
              </div>
            )}
          </div>

          {/* Limits */}
          {currentPlan.limits && (
            <div>
              <h4 className="text-base font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />Plan Limits
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentPlan.limits.maxOrders != null && <LimitCard label="Orders / Month" value={isUnlimited(currentPlan.limits.maxOrders)} />}
                {currentPlan.limits.maxOutlets != null && <LimitCard label="Outlets" value={isUnlimited(currentPlan.limits.maxOutlets)} />}
                {currentPlan.limits.maxUsers != null && <LimitCard label="Staff Users" value={isUnlimited(currentPlan.limits.maxUsers)} />}
                {currentPlan.limits.maxRoles != null && <LimitCard label="Roles" value={isUnlimited(currentPlan.limits.maxRoles)} />}
                {currentPlan.limits.maxMenuItems != null && <LimitCard label="Menu Items" value={isUnlimited(currentPlan.limits.maxMenuItems)} />}
                {currentPlan.limits.maxTables != null && <LimitCard label="Tables" value={isUnlimited(currentPlan.limits.maxTables)} />}
              </div>
            </div>
          )}

          {/* Features */}
          {currentPlan.features?.length > 0 && (
            <div>
              <h4 className="text-base font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />Included Features
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentPlan.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/5 border border-emerald-100 dark:border-emerald-500/10">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="capitalize">{f.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Upgrade Plan ─── */}
      {currentPlan && (
        <div className="pt-8 border-t border-surface-200 dark:border-surface-700">
          <UpgradePlanModule currentPlanId={currentPlan._id} currentPlanName={currentPlan.name} />
        </div>
      )}

      {/* ─── Contact Support ─── */}
      <div className="pt-8 border-t border-surface-200 dark:border-surface-700">
        <ContactSupportModule />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   CONTACT SUPPORT MODULE
──────────────────────────────────────────────── */
function ContactSupportModule() {
  const [view, setView] = useState('list'); // 'list' | 'create' | 'detail'
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/tenant/support');
      setTickets(data.data || []);
    } catch (err) {
      console.error('[Support] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const openTicket = async (id) => {
    try {
      const { data } = await api.get(`/tenant/support/${id}`);
      setSelectedTicket(data.data);
      setView('detail');
    } catch (err) {
      console.error('[Support] get ticket error:', err);
    }
  };

  const handleCreated = () => {
    fetchTickets();
    setView('list');
  };

  const handleReplied = (updated) => {
    setSelectedTicket(updated);
    // Update in list too
    setTickets(prev => prev.map(t => t._id === updated._id ? { ...t, status: updated.status } : t));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {view !== 'list' && (
            <button onClick={() => setView('list')} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition">
              <ArrowLeft className="w-4 h-4 text-surface-500" />
            </button>
          )}
          <div>
            <h4 className="text-base font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-500" />
              {view === 'create' ? 'New Support Ticket' : view === 'detail' ? selectedTicket?.ticketNumber : 'Contact Support'}
            </h4>
            {view === 'list' && <p className="text-xs text-surface-500 mt-0.5">Raise a ticket and our team will get back to you.</p>}
          </div>
        </div>
        {view === 'list' && (
          <button
            onClick={() => setView('create')}
            className="btn-primary btn-sm flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            New Ticket
          </button>
        )}
      </div>

      {/* Views */}
      {view === 'list' && <TicketList tickets={tickets} isLoading={isLoading} onSelect={openTicket} />}
      {view === 'create' && <CreateTicketForm onCreated={handleCreated} onCancel={() => setView('list')} />}
      {view === 'detail' && selectedTicket && <TicketDetail ticket={selectedTicket} onReplied={handleReplied} />}
    </div>
  );
}

/* ────────── Ticket List ────────── */
function TicketList({ tickets, isLoading, onSelect }) {
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <Loader2 className="w-6 h-6 text-primary-500 animate-spin mx-auto mb-2" />
        <p className="text-sm text-surface-500">Loading tickets...</p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="py-10 text-center rounded-xl border-2 border-dashed border-surface-200 dark:border-surface-700">
        <MessageSquare className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
        <p className="font-medium text-surface-900 dark:text-white mb-1">No support tickets yet</p>
        <p className="text-sm text-surface-500">Click "New Ticket" above to get help from our team.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tickets.map(t => {
        const sc = statusConfig[t.status] || statusConfig.open;
        const pc = PRIORITIES.find(p => p.value === t.priority);
        return (
          <button
            key={t._id}
            onClick={() => onSelect(t._id)}
            className="w-full text-left p-4 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-600 bg-white dark:bg-surface-900 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-surface-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{t.subject}</p>
                <p className="text-xs text-surface-500 mt-0.5 truncate">{t.ticketNumber} • {t.category?.replace(/_/g, ' ')} • {new Date(t.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {pc && <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold', pc.color)}>{pc.label}</span>}
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold', sc.class)}>{sc.label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-surface-400 group-hover:text-primary-500 transition-colors" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ────────── Create Ticket Form ────────── */
function CreateTicketForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({ subject: '', description: '', category: 'other', priority: 'medium' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      setError('Subject and description are required.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await api.post('/tenant/support', form);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Subject */}
      <div className="grid gap-1.5">
        <label className="text-sm font-semibold text-surface-700 dark:text-surface-300">Subject *</label>
        <input
          type="text"
          value={form.subject}
          onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
          className="input"
          placeholder="Brief summary of your issue..."
          maxLength={150}
        />
      </div>

      {/* Category + Priority row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-surface-700 dark:text-surface-300">Category</label>
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="input"
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-surface-700 dark:text-surface-300">Priority</label>
          <select
            value={form.priority}
            onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
            className="input"
          >
            {PRIORITIES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="grid gap-1.5">
        <label className="text-sm font-semibold text-surface-700 dark:text-surface-300">Description *</label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="input min-h-[140px]"
          placeholder="Describe your issue in detail. Include steps to reproduce, expected behavior, screenshots info, etc..."
          rows={6}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary btn-sm">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary btn-sm flex items-center gap-2">
          {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </div>
    </form>
  );
}

/* ────────── Ticket Detail + Chat Thread ────────── */
function TicketDetail({ ticket, onReplied }) {
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const sc = statusConfig[ticket.status] || statusConfig.open;
  const pc = PRIORITIES.find(p => p.value === ticket.priority);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setIsSending(true);
    try {
      const { data } = await api.post(`/tenant/support/${ticket._id}/reply`, { content: replyText });
      onReplied(data.data);
      setReplyText('');
    } catch (err) {
      console.error('[Support] reply error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  return (
    <div className="space-y-5">
      {/* Ticket header */}
      <div className="p-5 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h5 className="text-base font-bold text-surface-900 dark:text-white">{ticket.subject}</h5>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-xs text-surface-500 font-mono">{ticket.ticketNumber}</span>
              <span className="text-xs text-surface-500 capitalize">📂 {ticket.category?.replace(/_/g, ' ')}</span>
              {pc && <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold', pc.color)}>{pc.label}</span>}
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold', sc.class)}>{sc.label}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-surface-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(ticket.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap">{ticket.description}</p>
      </div>

      {/* Message Thread */}
      {ticket.messages && ticket.messages.length > 0 && (
        <div className="space-y-3 max-h-[400px] overflow-y-auto px-1">
          {ticket.messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'max-w-[85%] rounded-xl p-3.5',
                msg.senderRole === 'admin'
                  ? 'ml-auto bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-500/20'
                  : 'bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-surface-900 dark:text-white">{msg.senderName || 'Unknown'}</span>
                <span className={cn(
                  'text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase',
                  msg.senderRole === 'admin'
                    ? 'bg-primary-200 dark:bg-primary-800/50 text-primary-700 dark:text-primary-300'
                    : 'bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                )}>
                  {msg.senderRole === 'admin' ? 'Support' : 'You'}
                </span>
              </div>
              <p className="text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap">{msg.content}</p>
              <p className="text-[10px] text-surface-400 mt-1.5">{new Date(msg.createdAt).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply Input */}
      {!isClosed ? (
        <div className="flex gap-2 pt-2 border-t border-surface-200 dark:border-surface-700">
          <input
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Type your reply..."
            className="input flex-1"
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()}
          />
          <button
            onClick={handleReply}
            disabled={isSending || !replyText.trim()}
            className="btn-primary btn-sm flex items-center gap-2"
          >
            {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Reply
          </button>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-surface-100 dark:bg-surface-800 text-center">
          <p className="text-sm text-surface-500">This ticket has been {ticket.status.replace(/_/g, ' ')}. Create a new ticket if you need further help.</p>
        </div>
      )}
    </div>
  );
}

/* ────────── Upgrade Plan Module ────────── */
function UpgradePlanModule({ currentPlanId, currentPlanName }) {
  const [plans, setPlans] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [plansRes, reqRes] = await Promise.all([
          api.get('/tenant/upgrade/plans'),
          api.get('/tenant/upgrade/requests')
        ]);
        setPlans(plansRes.data.data || []);
        setRequests(reqRes.data.data || []);
      } catch (err) { console.error('[Upgrade] load error:', err); }
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  const hasPending = requests.some(r => r.status === 'pending');
  const otherPlans = plans.filter(p => p._id !== currentPlanId);

  const handleSubmit = async () => {
    if (!selectedPlan) { setError('Please select a plan.'); return; }
    setIsSubmitting(true); setError(''); setSuccess('');
    try {
      const { data } = await api.post('/tenant/upgrade/requests', {
        requestedPlanId: selectedPlan._id, preferredBillingCycle: billingCycle, reason
      });
      setRequests(prev => [data.data, ...prev]);
      setSelectedPlan(null); setReason('');
      setSuccess('Upgrade request submitted! Our team will review it shortly.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally { setIsSubmitting(false); }
  };

  const reqStatusConfig = {
    pending: { label: 'Pending', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
    approved: { label: 'Approved', cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
    rejected: { label: 'Rejected', cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  };

  if (isLoading) return <div className="py-6 text-center"><Loader2 className="w-6 h-6 text-primary-500 animate-spin mx-auto" /></div>;

  return (
    <div>
      <h4 className="text-base font-bold text-surface-900 dark:text-white mb-1 flex items-center gap-2">
        <Rocket className="w-4 h-4 text-violet-500" />Upgrade Plan
      </h4>
      <p className="text-xs text-surface-500 mb-5">Compare plans and request an upgrade. Our team will process it within 24 hours.</p>

      {error && <div className="p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">{error}</div>}
      {success && <div className="p-3 mb-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm">{success}</div>}

      {/* Billing Toggle */}
      <div className="flex items-center gap-2 mb-4">
        {['monthly', 'yearly'].map(c => (
          <button key={c} onClick={() => setBillingCycle(c)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border',
              billingCycle === c ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'border-surface-200 dark:border-surface-700 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
            )}>{c}{c === 'yearly' && <span className="ml-1 text-emerald-500 text-[10px]">Save more</span>}</button>
        ))}
      </div>

      {/* Plan Cards */}
      {otherPlans.length === 0 ? (
        <div className="py-8 text-center rounded-xl border-2 border-dashed border-surface-200 dark:border-surface-700">
          <p className="text-sm text-surface-500">No other plans available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {otherPlans.map(plan => {
            const price = billingCycle === 'yearly' ? plan.price?.yearly : plan.price?.monthly;
            const isSelected = selectedPlan?._id === plan._id;
            return (
              <button key={plan._id} onClick={() => { setSelectedPlan(plan); setError(''); setSuccess(''); }}
                className={cn('relative text-left p-5 rounded-xl border transition-all',
                  isSelected ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 ring-1 ring-primary-500/30' : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 hover:border-primary-300 dark:hover:border-primary-600'
                )}>
                {plan.isPopular && <span className="absolute top-2 right-2 text-[9px] px-2 py-0.5 rounded-full bg-violet-500 text-white font-bold">Popular</span>}
                {isSelected && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-primary-500" />}
                <p className="text-sm font-bold text-surface-900 dark:text-white mb-1">{plan.name}</p>
                <p className="text-xs text-surface-500 line-clamp-2 mb-3">{plan.description}</p>
                <p className="text-xl font-black text-surface-900 dark:text-white">₹{price?.toLocaleString() || 0}
                  <span className="text-xs font-normal text-surface-400 ml-1">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                </p>
                <div className="mt-3 space-y-1">
                  {plan.features?.slice(0, 4).map(f => (
                    <p key={f} className="text-[11px] text-surface-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                      <span className="capitalize">{f.replace(/_/g, ' ')}</span>
                    </p>
                  ))}
                  {plan.features?.length > 4 && <p className="text-[10px] text-surface-400">+{plan.features.length - 4} more</p>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Request Form */}
      {selectedPlan && !hasPending && (
        <div className="p-5 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-surface-900 dark:text-white">Request Upgrade to {selectedPlan.name}</p>
              <p className="text-xs text-surface-500">{currentPlanName} → {selectedPlan.name} ({billingCycle})</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-primary-500" />
          </div>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
            placeholder="Any notes for the admin? (optional)"
            className="input w-full" />
          <div className="flex justify-end gap-3">
            <button onClick={() => setSelectedPlan(null)} className="btn-secondary btn-sm">Cancel</button>
            <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary btn-sm flex items-center gap-2">
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
              {isSubmitting ? 'Submitting...' : 'Request Upgrade'}
            </button>
          </div>
        </div>
      )}
      {hasPending && (
        <div className="p-4 mb-6 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 flex-shrink-0" />
          You have a pending upgrade request. Please wait for it to be processed before submitting a new one.
        </div>
      )}

      {/* Request History */}
      {requests.length > 0 && (
        <div>
          <h5 className="text-sm font-bold text-surface-900 dark:text-white mb-3">Upgrade Request History</h5>
          <div className="space-y-2">
            {requests.map(r => {
              const sc = reqStatusConfig[r.status] || reqStatusConfig.pending;
              return (
                <div key={r._id} className="p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-surface-900 dark:text-white">
                        {r.currentPlanId?.name || '?'} → {r.requestedPlanId?.name || '?'}
                      </p>
                      <p className="text-xs text-surface-500 mt-0.5">
                        {r.requestNumber} • {r.preferredBillingCycle} • {new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      {r.adminNote && <p className="text-xs text-surface-500 mt-1 italic">Admin: {r.adminNote}</p>}
                    </div>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0', sc.cls)}>{sc.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────── Limit Card (unchanged) ────────── */
function LimitCard({ label, value }) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm">
      <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-bold text-surface-900 dark:text-white">{value}</p>
    </div>
  );
}
