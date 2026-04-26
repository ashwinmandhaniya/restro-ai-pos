import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Plus, X, Crown, Zap, Rocket, Building2, Pencil, Trash2, Ban } from 'lucide-react';
import useAdminPlanStore from '@/store/adminPlanStore';
import { cn } from '@/lib/utils';

const AVAILABLE_FEATURES = [
  { id: 'pos', label: 'POS Billing' },
  { id: 'tables', label: 'Table Management' },
  { id: 'reservations', label: 'Table Reservations' },
  { id: 'kds', label: 'Orders & KDS' },
  { id: 'history', label: 'Order History' },
  { id: 'qr_ordering', label: 'QR Ordering' },
  { id: 'qr_analytics', label: 'QR Analytics' },
  { id: 'whatsapp', label: 'WhatsApp Integrations' },
  { id: 'menu', label: 'Menu Management' },
  { id: 'inventory', label: 'Inventory Control' },
  { id: 'multi_outlet', label: 'Multi-Outlet Admin' },
  { id: 'inventory_transfers', label: 'Inventory Transfers' },
  { id: 'network_analytics', label: 'Network Analytics' },
  { id: 'menu_sync', label: 'Menu Synchronization' },
  { id: 'customers', label: 'Customer CRM' },
  { id: 'ai_insights', label: 'AI Insights & Copilot' },
  { id: 'reports', label: 'Advanced Reports' },
  { id: 'users_roles', label: 'Advanced User Roles' },
  { id: 'loyalty', label: 'Loyalty Program' },
];

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
          <button onClick={() => setShowAssign(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all">
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
                      <span key={f} className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">{f.replace(/_/g, ' ')}</span>
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

      {/* Assign Modal */}
      <AnimatePresence>
        {showAssign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6">
              <div className="flex justify-between mb-5">
                <h3 className="text-xl font-bold text-white">Assign Plan</h3>
                <button onClick={() => setShowAssign(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAssign} className="space-y-4">
                <div><label className="text-xs text-slate-400 mb-1 block">Restaurant ID *</label>
                  <input required placeholder="Paste MongoDB ID" className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none" value={assignForm.restaurantId} onChange={e => setAssignForm({...assignForm, restaurantId: e.target.value})} /></div>
                <div><label className="text-xs text-slate-400 mb-1 block">Plan *</label>
                  <select required className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none" value={assignForm.planId} onChange={e => setAssignForm({...assignForm, planId: e.target.value})}>
                    <option value="">Select Plan</option>
                    {plans.map(p => <option key={p._id} value={p._id}>{p.name} — ₹{p.price.monthly}/mo</option>)}
                  </select></div>
                <div><label className="text-xs text-slate-400 mb-1 block">Billing Cycle</label>
                  <select className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none" value={assignForm.billingCycle} onChange={e => setAssignForm({...assignForm, billingCycle: e.target.value})}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select></div>
                <button type="submit" className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-all">Assign Subscription</button>
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
                  <label className="text-sm font-semibold text-white mb-3 block">Available Features</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {AVAILABLE_FEATURES.map(feature => (
                      <label key={feature.id} className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer hover:text-white transition-colors">
                        <input 
                          type="checkbox" 
                          checked={(planForm.features || []).includes(feature.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPlanForm(prev => ({ ...prev, features: [...(prev.features || []), feature.id] }));
                            } else {
                              setPlanForm(prev => ({ ...prev, features: (prev.features || []).filter(f => f !== feature.id) }));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900 cursor-pointer"
                        />
                        {feature.label}
                      </label>
                    ))}
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
