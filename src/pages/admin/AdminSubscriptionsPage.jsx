import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Plus, X, Crown, Zap, Rocket, Building2, Pencil, Trash2, Ban, Search, CheckCircle2, RefreshCw, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react';
import useAdminPlanStore from '@/store/adminPlanStore';
import useAdminTenantStore from '@/store/adminTenantStore';
import { cn } from '@/lib/utils';

const FEATURE_MODULES = [
  {
    category: 'Core POS',
    color: 'text-emerald-400',
    features: [
      { id: 'pos_billing', label: 'POS Billing' },
      { id: 'touch_screen_pos', label: 'Touch Screen POS' },
      { id: 'multi_counter', label: 'Multi Counter POS' },
      { id: 'basic_menu', label: 'Basic Menu Management' },
      { id: 'basic_reports', label: 'Basic Reports' },
    ]
  },
  {
    category: 'Table & Reservations',
    color: 'text-blue-400',
    features: [
      { id: 'table_management', label: 'Table Management' },
      { id: 'reservations', label: 'Table Reservations' },
    ]
  },
  {
    category: 'Kitchen & Orders',
    color: 'text-orange-400',
    features: [
      { id: 'kds', label: 'Kitchen Display (KDS)' },
      { id: 'chef_management', label: 'Chef Management' },
      { id: 'order_history', label: 'Order History' },
      { id: 'order_alerts', label: 'Order Alerts' },
      { id: 'token_management', label: 'Token Management' },
    ]
  },
  {
    category: 'Staff Management',
    color: 'text-pink-400',
    features: [
      { id: 'waiter_management', label: 'Waiter Management' },
      { id: 'waiter_display', label: 'Waiter Display' },
      { id: 'staff_management', label: 'Staff Management' },
      { id: 'user_management', label: 'User Management' },
      { id: 'role_management', label: 'Role Management' },
    ]
  },
  {
    category: 'Menu & Inventory',
    color: 'text-amber-400',
    features: [
      { id: 'advanced_menu', label: 'Advanced Menu' },
      { id: 'recipe_management', label: 'Recipe Management' },
      { id: 'inventory', label: 'Inventory Control' },
      { id: 'waste_management', label: 'Waste Management' },
    ]
  },
  {
    category: 'QR & Digital Ordering',
    color: 'text-cyan-400',
    features: [
      { id: 'qr_ordering', label: 'QR Code Ordering' },
      { id: 'qr_analytics', label: 'QR Analytics' },
    ]
  },
  {
    category: 'CRM & Marketing',
    color: 'text-violet-400',
    features: [
      { id: 'customers', label: 'Customer CRM' },
      { id: 'loyalty', label: 'Loyalty Program' },
      { id: 'whatsapp', label: 'WhatsApp Marketing' },
    ]
  },
  {
    category: 'Multi-Outlet',
    color: 'text-teal-400',
    features: [
      { id: 'multi_outlet', label: 'Multi-Outlet Admin' },
      { id: 'inventory_transfers', label: 'Inventory Transfers' },
      { id: 'network_analytics', label: 'Network Analytics' },
      { id: 'menu_sync', label: 'Menu Synchronization' },
    ]
  },
  {
    category: 'AI & Analytics',
    color: 'text-fuchsia-400',
    features: [
      { id: 'ai_insights', label: 'AI Insights & Copilot' },
      { id: 'advanced_reports', label: 'Advanced Reports' },
      { id: 'crash_prevention', label: 'Crash Prevention' },
    ]
  },
  {
    category: 'Integrations',
    color: 'text-sky-400',
    features: [
      { id: 'integrations', label: 'Third-Party Integrations' },
    ]
  }
];

// Flat lookup for feature labels
const FEATURE_LABEL_MAP = {};
FEATURE_MODULES.forEach(g => g.features.forEach(f => { FEATURE_LABEL_MAP[f.id] = f.label; }));
const ALL_FEATURE_IDS = Object.keys(FEATURE_LABEL_MAP);

const planIcons = { 'free-trial': Zap, 'starter': CreditCard, 'growth': Rocket, 'enterprise': Crown };
const planColors = { 'free-trial': 'from-slate-500 to-slate-600', 'starter': 'from-blue-500 to-cyan-600', 'growth': 'from-violet-500 to-fuchsia-600', 'enterprise': 'from-amber-500 to-orange-600' };

export default function AdminSubscriptionsPage() {
  const { plans, subscriptions, pagination, fetchPlans, fetchSubscriptions, assignSubscription, updateSubscription, createPlan, updatePlan, deletePlan, isLoading } = useAdminPlanStore();
  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({ restaurantId: '', planId: '', billingCycle: 'monthly' });
  const [tab, setTab] = useState('plans');

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '', slug: '', description: '', trialDays: 0, isPopular: false,
    price: { monthly: 0, yearly: 0 },
    limits: { maxOrders: -1, maxOutlets: -1, maxUsers: -1, maxMenuItems: -1, maxRoles: -1 },
    features: [] 
  });

  const { tenants, isLoading: tenantsLoading, fetchTenants } = useAdminTenantStore();
  const [restaurantSearch, setRestaurantSearch] = useState('');

  const filteredTenants = useMemo(() => {
    if (!restaurantSearch.trim()) return tenants;
    const q = restaurantSearch.toLowerCase();
    return tenants.filter(t =>
      t.name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q)
    );
  }, [tenants, restaurantSearch]);

  useEffect(() => { fetchPlans(); fetchSubscriptions(); }, []);

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...planForm
    };
    if (editingPlanId) await updatePlan(editingPlanId, payload);
    else await createPlan(payload);
    setShowPlanModal(false);
  };

  const openEditPlan = (plan) => {
    setEditingPlanId(plan._id);
    setPlanForm({ ...plan, features: plan.features || [] });
    setShowPlanModal(true);
  };

  const handleDeletePlan = async (id) => {
    if (confirm("Are you sure you want to delete this plan?")) {
      await deletePlan(id);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    await assignSubscription(assignForm);
    setShowAssign(false);
    setAssignForm({ restaurantId: '', planId: '', billingCycle: 'monthly' });
    setRestaurantSearch('');
  };

  const statusBadge = {
    active: 'bg-emerald-500/20 text-emerald-400',
    trialing: 'bg-blue-500/20 text-blue-400',
    past_due: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-slate-500/20 text-slate-400',
    expired: 'bg-slate-500/20 text-slate-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Subscriptions</h1>
          <p className="text-slate-400 mt-1">Manage plans and tenant subscriptions</p>
        </div>
        <div className="flex gap-3">
          {tab === 'plans' && (
            <button onClick={() => { setEditingPlanId(null); setPlanForm({ name: '', slug: '', description: '', trialDays: 0, isPopular: false, price: { monthly: 0, yearly: 0 }, limits: { maxOrders: -1, maxOutlets: -1, maxUsers: -1, maxMenuItems: -1, maxRoles: -1 }, features: [] }); setShowPlanModal(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition-all border border-slate-700">
              <Plus className="w-4 h-4" /> New Plan
            </button>
          )}
          <button onClick={() => { setShowAssign(true); fetchTenants({ limit: 200 }); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" /> Assign Plan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {['plans', 'subscriptions'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all', tab === t ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700')}>{t}</button>
        ))}
      </div>

      {tab === 'plans' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {plans.map((plan, i) => {
            const Icon = planIcons[plan.slug] || CreditCard;
            const gradient = planColors[plan.slug] || 'from-violet-500 to-fuchsia-600';
            return (
              <motion.div key={plan._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className={cn('relative overflow-hidden rounded-2xl bg-slate-900 border p-6', plan.isPopular ? 'border-violet-500 ring-1 ring-violet-500/30' : 'border-slate-800')}>
                <div className="absolute top-3 right-3 flex gap-1.5 origin-top-right items-center">
                  {plan.isPopular && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500 text-white font-bold uppercase mr-1">Popular</span>}
                  <button onClick={() => openEditPlan(plan)} className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeletePlan(plan._id)} className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4', gradient)}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-sm text-slate-400 mt-1 line-clamp-2">{plan.description}</p>
                <div className="mt-4 mb-4">
                  <span className="text-3xl font-bold text-white font-mono">₹{plan.price.monthly.toLocaleString()}</span>
                  <span className="text-sm text-slate-500 ml-1">/month</span>
                  {plan.price.yearly > 0 && <p className="text-xs text-slate-500 mt-1">₹{plan.price.yearly.toLocaleString()}/year</p>}
                </div>
                <div className="space-y-1.5 text-xs text-slate-400">
                  <p>📦 {plan.limits.maxOrders === -1 ? 'Unlimited' : plan.limits.maxOrders} orders</p>
                  <p>🏢 {plan.limits.maxOutlets === -1 ? 'Unlimited' : plan.limits.maxOutlets} outlets</p>
                  <p>👤 {plan.limits.maxUsers === -1 ? 'Unlimited' : plan.limits.maxUsers} users</p>
                  <p>🛡️ {plan.limits.maxRoles === -1 ? 'Unlimited' : plan.limits.maxRoles} roles</p>
                  <p>🍽️ {plan.limits.maxMenuItems === -1 ? 'Unlimited' : plan.limits.maxMenuItems} menu items</p>
                </div>
                {plan.features.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1">
                    {plan.features.slice(0, 5).map(f => (
                      <span key={f} className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">{FEATURE_LABEL_MAP[f] || f.replace(/_/g, ' ')}</span>
                    ))}
                    {plan.features.length > 5 && <span className="text-[10px] text-slate-500">+{plan.features.length - 5} more</span>}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-800">
              {['Restaurant', 'Plan', 'Status', 'Billing', 'Amount', 'Period End', 'Payment', 'Actions'].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs text-slate-500 font-semibold uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-500">No subscriptions yet</td></tr>
              ) : subscriptions.map((sub) => (
                <tr key={sub._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-white font-medium">{sub.restaurantId?.name || '—'}</td>
                  <td className="py-3 px-4"><span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">{sub.planId?.name}</span></td>
                  <td className="py-3 px-4"><span className={cn('text-xs px-2.5 py-1 rounded-full font-medium capitalize', statusBadge[sub.status])}>{sub.status}</span></td>
                  <td className="py-3 px-4 text-slate-400 capitalize">{sub.billingCycle}</td>
                  <td className="py-3 px-4 font-mono text-emerald-400">₹{sub.amount?.total?.toLocaleString() || 0}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs">{sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '—'}</td>
                  <td className="py-3 px-4 text-slate-400 capitalize">{sub.paymentMethod}</td>
                  <td className="py-3 px-4">
                    {sub.status !== 'cancelled' && (
                      <button onClick={() => { if(confirm("Cancel this subscription?")) updateSubscription(sub._id, { status: "cancelled" }); }} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors" title="Cancel Subscription"><Ban className="w-3.5 h-3.5" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Plan Modal */}
      <AnimatePresence>
        {showAssign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 m-auto">
              <div className="flex justify-between mb-5">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-violet-400" /> Assign Plan to Restaurant</h3>
                  <p className="text-xs text-slate-500 mt-1">Select a restaurant and choose a plan to assign.</p>
                </div>
                <button onClick={() => setShowAssign(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAssign} className="space-y-5">
                {/* Step 1: Select Restaurant */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wider">① Select Restaurant</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search restaurants by name or email…"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
                      value={restaurantSearch}
                      onChange={e => setRestaurantSearch(e.target.value)}
                      onFocus={() => { if (tenants.length === 0) fetchTenants({ limit: 200 }); }}
                    />
                  </div>
                  {/* Restaurant list */}
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/50 divide-y divide-slate-800/60">
                    {tenantsLoading ? (
                      <div className="px-4 py-6 text-center text-slate-500 text-xs">Loading restaurants…</div>
                    ) : filteredTenants.length === 0 ? (
                      <div className="px-4 py-6 text-center text-slate-500 text-xs">{restaurantSearch ? 'No restaurants match your search.' : 'No restaurants found.'}</div>
                    ) : (
                      filteredTenants.map(t => (
                        <button
                          key={t._id}
                          type="button"
                          onClick={() => setAssignForm({ ...assignForm, restaurantId: t._id })}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800/50 transition-colors',
                            assignForm.restaurantId === t._id && 'bg-violet-600/15 border-l-2 border-violet-500'
                          )}
                        >
                          <div className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                            assignForm.restaurantId === t._id ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400"
                          )}>
                            {t.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-semibold truncate", assignForm.restaurantId === t._id ? "text-violet-300" : "text-white")}>{t.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{t.email}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold capitalize',
                              t.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                              t.status === 'pending_approval' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-slate-500/20 text-slate-400'
                            )}>{t.status?.replace(/_/g, ' ')}</span>
                            {assignForm.restaurantId === t._id && <CheckCircle2 className="w-4 h-4 text-violet-400" />}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  {assignForm.restaurantId && (
                    <p className="text-[11px] text-slate-600 mt-1.5 font-mono">ID: {assignForm.restaurantId}</p>
                  )}
                </div>

                {/* Step 2: Select Plan */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wider">② Select Plan</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {plans.map(p => {
                      const isSelected = assignForm.planId === p._id;
                      const Icon = planIcons[p.slug] || CreditCard;
                      const gradient = planColors[p.slug] || 'from-violet-500 to-fuchsia-600';
                      const price = assignForm.billingCycle === 'yearly' ? p.price.yearly : p.price.monthly;
                      return (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => setAssignForm({ ...assignForm, planId: p._id })}
                          className={cn(
                            'relative rounded-xl border p-4 text-left transition-all',
                            isSelected ? 'border-violet-500 bg-violet-600/10 ring-1 ring-violet-500/30' : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                          )}
                        >
                          {isSelected && <div className="absolute top-2 right-2"><CheckCircle2 className="w-4 h-4 text-violet-400" /></div>}
                          <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2', gradient)}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-sm font-bold text-white">{p.name}</p>
                          <p className="text-lg font-black text-white font-mono mt-1">₹{price?.toLocaleString() || 0}
                            <span className="text-xs text-slate-500 font-normal ml-1">/{assignForm.billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                          </p>
                          {p.isPopular && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500 text-white font-bold uppercase mt-2 inline-block">Popular</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 3: Billing Cycle */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wider">③ Billing Cycle</label>
                  <div className="flex gap-3">
                    {['monthly', 'yearly'].map(cycle => (
                      <button
                        key={cycle}
                        type="button"
                        onClick={() => setAssignForm({ ...assignForm, billingCycle: cycle })}
                        className={cn(
                          'flex-1 px-4 py-3 rounded-xl border text-sm font-semibold capitalize transition-all',
                          assignForm.billingCycle === cycle
                            ? 'border-violet-500 bg-violet-600/15 text-violet-300'
                            : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                        )}
                      >
                        {cycle}
                        {cycle === 'yearly' && <span className="block text-[10px] text-emerald-400 mt-0.5">Save more</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                {assignForm.restaurantId && assignForm.planId && (() => {
                  const selTenant = tenants.find(t => t._id === assignForm.restaurantId);
                  const selPlan = plans.find(p => p._id === assignForm.planId);
                  const price = assignForm.billingCycle === 'yearly' ? selPlan?.price?.yearly : selPlan?.price?.monthly;
                  return (
                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Summary</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">{selTenant?.name || 'Restaurant'}</span>
                        <span className="text-white font-bold">{selPlan?.name} — ₹{price?.toLocaleString()}/{assignForm.billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                      </div>
                    </div>
                  );
                })()}

                <button
                  type="submit"
                  disabled={!assignForm.restaurantId || !assignForm.planId || isLoading}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {isLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Assigning…</> : <><CreditCard className="w-4 h-4" /> Assign Subscription</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Plan Modal */}
      <AnimatePresence>
        {showPlanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 m-auto">
              <div className="flex justify-between mb-5">
                <h3 className="text-xl font-bold text-white">{editingPlanId ? 'Edit Plan' : 'New Plan'}</h3>
                <button type="button" onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handlePlanSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs text-slate-400 mb-1 block">Plan Name</label>
                    <input required className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white" value={planForm.name} onChange={e => setPlanForm({...planForm, name: e.target.value})} placeholder="Growth" /></div>
                  <div><label className="text-xs text-slate-400 mb-1 block">Slug (e.g. basic, pro)</label>
                    <input required className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white" value={planForm.slug} onChange={e => setPlanForm({...planForm, slug: e.target.value})} placeholder="growth" /></div>
                </div>
                <div><label className="text-xs text-slate-400 mb-1 block">Description</label>
                  <input className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white" value={planForm.description} onChange={e => setPlanForm({...planForm, description: e.target.value})} /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="text-xs text-slate-400 mb-1 block">Monthly Price (₹)</label>
                    <input required type="number" className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white" value={planForm.price?.monthly || 0} onChange={e => setPlanForm({...planForm, price: {...planForm.price, monthly: Number(e.target.value)}})} /></div>
                  <div><label className="text-xs text-slate-400 mb-1 block">Yearly Price (₹)</label>
                    <input required type="number" className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white" value={planForm.price?.yearly || 0} onChange={e => setPlanForm({...planForm, price: {...planForm.price, yearly: Number(e.target.value)}})} /></div>
                  <div><label className="text-xs text-slate-400 mb-1 block">Trial Days</label>
                    <input required type="number" className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white" value={planForm.trialDays || 0} onChange={e => setPlanForm({...planForm, trialDays: Number(e.target.value)})} /></div>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  <div><label className="text-xs text-slate-400 mb-1 block">Max Orders</label>
                    <input required type="number" className="w-full px-2 py-2 rounded-xl bg-slate-800 border border-slate-700 text-[11px] text-white" value={planForm.limits?.maxOrders || -1} onChange={e => setPlanForm({...planForm, limits: {...planForm.limits, maxOrders: Number(e.target.value)}})} /></div>
                  <div><label className="text-xs text-slate-400 mb-1 block">Outlets</label>
                    <input required type="number" className="w-full px-2 py-2 rounded-xl bg-slate-800 border border-slate-700 text-[11px] text-white" value={planForm.limits?.maxOutlets || -1} onChange={e => setPlanForm({...planForm, limits: {...planForm.limits, maxOutlets: Number(e.target.value)}})} /></div>
                  <div><label className="text-xs text-slate-400 mb-1 block">Users</label>
                    <input required type="number" className="w-full px-2 py-2 rounded-xl bg-slate-800 border border-slate-700 text-[11px] text-white" value={planForm.limits?.maxUsers || -1} onChange={e => setPlanForm({...planForm, limits: {...planForm.limits, maxUsers: Number(e.target.value)}})} /></div>
                  <div><label className="text-xs text-slate-400 mb-1 block">Roles</label>
                    <input required type="number" className="w-full px-2 py-2 rounded-xl bg-slate-800 border border-slate-700 text-[11px] text-white" value={planForm.limits?.maxRoles || -1} onChange={e => setPlanForm({...planForm, limits: {...planForm.limits, maxRoles: Number(e.target.value)}})} /></div>
                  <div><label className="text-xs text-slate-400 mb-1 block">Items</label>
                    <input required type="number" className="w-full px-2 py-2 rounded-xl bg-slate-800 border border-slate-700 text-[11px] text-white" value={planForm.limits?.maxMenuItems || -1} onChange={e => setPlanForm({...planForm, limits: {...planForm.limits, maxMenuItems: Number(e.target.value)}})} /></div>
                </div>
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 border-dashed">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-white">Feature / Module Control</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setPlanForm(prev => ({ ...prev, features: [...ALL_FEATURE_IDS] }))}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold hover:bg-emerald-500/25 transition-colors">Select All</button>
                      <button type="button" onClick={() => setPlanForm(prev => ({ ...prev, features: [] }))}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 font-bold hover:bg-red-500/25 transition-colors">Clear All</button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-4">Control which modules/features are available for tenants on this plan. <span className="text-white font-semibold">{(planForm.features || []).length}</span> of {ALL_FEATURE_IDS.length} features enabled.</p>
                  <div className="space-y-3">
                    {FEATURE_MODULES.map(group => {
                      const groupFeatureIds = group.features.map(f => f.id);
                      const enabledInGroup = groupFeatureIds.filter(id => (planForm.features || []).includes(id)).length;
                      const allSelected = enabledInGroup === groupFeatureIds.length;
                      return (
                        <div key={group.category} className="rounded-xl border border-slate-700/50 bg-slate-900/60 overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/30">
                            <span className={cn('text-xs font-bold uppercase tracking-wider', group.color)}>{group.category}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500 font-mono">{enabledInGroup}/{groupFeatureIds.length}</span>
                              <button type="button" onClick={() => {
                                if (allSelected) {
                                  setPlanForm(prev => ({ ...prev, features: (prev.features || []).filter(f => !groupFeatureIds.includes(f)) }));
                                } else {
                                  setPlanForm(prev => ({ ...prev, features: [...new Set([...(prev.features || []), ...groupFeatureIds])] }));
                                }
                              }} className={cn('p-0.5 rounded transition-colors', allSelected ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400')} title={allSelected ? 'Deselect All' : 'Select All'}>
                                {allSelected ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                              </button>
                            </div>
                          </div>
                          <div className="px-4 py-2.5 flex flex-wrap gap-2">
                            {group.features.map(feature => {
                              const isOn = (planForm.features || []).includes(feature.id);
                              return (
                                <button key={feature.id} type="button" onClick={() => {
                                  if (isOn) {
                                    setPlanForm(prev => ({ ...prev, features: (prev.features || []).filter(f => f !== feature.id) }));
                                  } else {
                                    setPlanForm(prev => ({ ...prev, features: [...(prev.features || []), feature.id] }));
                                  }
                                }} className={cn(
                                  'text-[11px] px-2.5 py-1.5 rounded-lg font-semibold transition-all border',
                                  isOn ? 'bg-violet-600/20 border-violet-500/40 text-violet-300' : 'bg-slate-800/60 border-slate-700/40 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                                )}>
                                  {isOn ? '✓ ' : ''}{feature.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                  <input type="checkbox" checked={planForm.isPopular} onChange={e => setPlanForm({...planForm, isPopular: e.target.checked})} className="rounded bg-slate-800 border-slate-700" /> Mark as Popular Plan
                </label>
                <div className="pt-2 border-t border-slate-800">
                  <button type="submit" disabled={isLoading} className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-all">Save Plan</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
