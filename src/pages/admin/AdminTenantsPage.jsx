import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Building2, X, Check, Ban, RotateCcw, Eye, ChevronDown, Pencil, Trash2, CreditCard, Crown, Zap, Rocket, CheckCircle2, RefreshCw } from 'lucide-react';
import useAdminTenantStore from '@/store/adminTenantStore';
import useAdminPlanStore from '@/store/adminPlanStore';
import { cn } from '@/lib/utils';

const planIcons = { 'free-trial': Zap, 'starter': CreditCard, 'growth': Rocket, 'enterprise': Crown };
const planColors = { 'free-trial': 'from-slate-500 to-slate-600', 'starter': 'from-blue-500 to-cyan-600', 'growth': 'from-violet-500 to-fuchsia-600', 'enterprise': 'from-amber-500 to-orange-600' };

const statusBadge = {
  active: 'bg-emerald-500/20 text-emerald-400',
  pending_approval: 'bg-amber-500/20 text-amber-400',
  suspended: 'bg-red-500/20 text-red-400',
  churned: 'bg-slate-500/20 text-slate-400',
};

export default function AdminTenantsPage() {
  const { tenants, pagination, fetchTenants, createTenant, updateTenant, deleteTenant, updateTenantStatus, isLoading } = useAdminTenantStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', adminEmail: '', adminPassword: '', region: { city: '', state: '' } });

  // Assign Plan state
  const { plans, fetchPlans, assignSubscription, isLoading: plansLoading } = useAdminPlanStore();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null); // the restaurant object
  const [assignForm, setAssignForm] = useState({ planId: '', billingCycle: 'monthly' });

  useEffect(() => { fetchTenants({ search, status: statusFilter || undefined }); }, [search, statusFilter]);

  const openAssignPlan = (tenant) => {
    setAssignTarget(tenant);
    setAssignForm({ planId: '', billingCycle: 'monthly' });
    if (plans.length === 0) fetchPlans();
    setShowAssignModal(true);
  };

  const handleAssignPlan = async (e) => {
    e.preventDefault();
    if (!assignTarget || !assignForm.planId) return;
    await assignSubscription({ restaurantId: assignTarget._id, ...assignForm });
    setShowAssignModal(false);
    setAssignTarget(null);
    fetchTenants({ search, status: statusFilter || undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await updateTenant(editingId, form);
    } else {
      await createTenant(form);
    }
    setShowModal(false);
    setForm({ name: '', email: '', phone: '', adminEmail: '', adminPassword: '', region: { city: '', state: '' } });
  };

  const openEdit = (t) => {
    setEditingId(t._id);
    setForm({ name: t.name, email: t.email || '', phone: t.phone || '', region: t.region || { city: '', state: '' }, adminEmail: '', adminPassword: '' });
    setShowModal(true);
  };
  
  const handleDelete = async (id) => {
    if (confirm("Archive this restaurant? It will be marked as churned.")) {
      await deleteTenant(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Restaurants</h1>
          <p className="text-slate-400 mt-1">Manage all tenants on the platform</p>
        </div>
        <button onClick={() => { setEditingId(null); setForm({ name: '', email: '', phone: '', adminEmail: '', adminPassword: '', region: { city: '', state: '' } }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all">
          <Plus className="w-4 h-4" /> Add Restaurant
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search restaurants..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
        </div>
        <div className="flex gap-1.5">
          {['', 'active', 'pending_approval', 'suspended', 'churned'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn('px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all', statusFilter === s ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700')}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-800">
            {['Restaurant', 'Status', 'City', 'Plan', 'Health', 'Created', 'Actions'].map(h => (
              <th key={h} className="text-left py-3 px-4 text-xs text-slate-500 font-semibold uppercase">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-16 text-slate-500">Loading...</td></tr>
            ) : tenants.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-16 text-slate-500">No restaurants found</td></tr>
            ) : tenants.map((t) => (
              <tr key={t._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.email || '—'}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium capitalize', statusBadge[t.status])}>{t.status?.replace('_', ' ')}</span>
                </td>
                <td className="py-3 px-4 text-slate-400">{t.region?.city || '—'}</td>
                <td className="py-3 px-4 text-slate-400">{t.currentPlanId?.name || <span className="text-slate-600">No plan</span>}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 rounded-full bg-slate-700"><div className={cn('h-full rounded-full', t.healthScore > 70 ? 'bg-emerald-500' : t.healthScore > 40 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${t.healthScore}%` }} /></div>
                    <span className="text-xs text-slate-500 font-mono">{t.healthScore}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-500 text-xs">{new Date(t.createdAt).toLocaleDateString()}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openAssignPlan(t)} className="p-1.5 rounded-lg hover:bg-violet-500/20 text-violet-400" title="Assign Plan"><CreditCard className="w-4 h-4" /></button>
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400" title="Edit"><Pencil className="w-4 h-4" /></button>
                    {t.status === 'pending_approval' && (
                      <button onClick={() => updateTenantStatus(t._id, 'active')} className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400" title="Approve"><Check className="w-4 h-4" /></button>
                    )}
                    {t.status === 'active' && (
                      <button onClick={() => updateTenantStatus(t._id, 'suspended')} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400" title="Suspend"><Ban className="w-4 h-4" /></button>
                    )}
                    {t.status === 'suspended' && (
                      <button onClick={() => updateTenantStatus(t._id, 'active')} className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400" title="Reactivate"><RotateCcw className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => handleDelete(t._id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 ml-1" title="Archive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6">
              <div className="flex justify-between mb-5">
                <h3 className="text-xl font-bold text-white">{editingId ? 'Edit Restaurant' : 'Add Restaurant'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs text-slate-400 mb-1 block">Restaurant Name *</label>
                    <input required className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                  <div><label className="text-xs text-slate-400 mb-1 block">Email</label>
                    <input type="email" className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                  <div><label className="text-xs text-slate-400 mb-1 block">Phone</label>
                    <input className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                  <div><label className="text-xs text-slate-400 mb-1 block">City</label>
                    <input className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none" value={form.region.city} onChange={e => setForm({...form, region: {...form.region, city: e.target.value}})} /></div>
                </div>
                {!editingId && (
                  <>
                    <hr className="border-slate-800" />
                    <p className="text-xs text-slate-500 font-medium">Admin Account (optional)</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs text-slate-400 mb-1 block">Admin Email</label>
                        <input type="email" className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none" value={form.adminEmail} onChange={e => setForm({...form, adminEmail: e.target.value})} /></div>
                      <div><label className="text-xs text-slate-400 mb-1 block">Admin Password</label>
                        <input type="password" className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none" value={form.adminPassword} onChange={e => setForm({...form, adminPassword: e.target.value})} /></div>
                    </div>
                  </>
                )}
                <button type="submit" className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-all">
                  {editingId ? 'Save Changes' : 'Create Restaurant'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Plan Modal */}
      <AnimatePresence>
        {showAssignModal && assignTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 m-auto">
              <div className="flex justify-between mb-5">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-violet-400" /> Assign Plan</h3>
                  <p className="text-xs text-slate-500 mt-1">Assign a subscription plan to this restaurant.</p>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              {/* Selected Restaurant */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 mb-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {assignTarget.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{assignTarget.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{assignTarget.email}</p>
                </div>
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold capitalize', statusBadge[assignTarget.status])}>{assignTarget.status?.replace(/_/g, ' ')}</span>
                {assignTarget.currentPlanId?.name && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-bold">Current: {assignTarget.currentPlanId.name}</span>
                )}
              </div>

              <form onSubmit={handleAssignPlan} className="space-y-5">
                {/* Plan Cards */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wider">Select Plan</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {plans.map(p => {
                      const isSelected = assignForm.planId === p._id;
                      const Icon = planIcons[p.slug] || CreditCard;
                      const gradient = planColors[p.slug] || 'from-violet-500 to-fuchsia-600';
                      const price = assignForm.billingCycle === 'yearly' ? p.price.yearly : p.price.monthly;
                      return (
                        <button key={p._id} type="button" onClick={() => setAssignForm({ ...assignForm, planId: p._id })}
                          className={cn('relative rounded-xl border p-4 text-left transition-all',
                            isSelected ? 'border-violet-500 bg-violet-600/10 ring-1 ring-violet-500/30' : 'border-slate-800 bg-slate-900 hover:border-slate-700')}>
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

                {/* Billing Cycle */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wider">Billing Cycle</label>
                  <div className="flex gap-3">
                    {['monthly', 'yearly'].map(cycle => (
                      <button key={cycle} type="button" onClick={() => setAssignForm({ ...assignForm, billingCycle: cycle })}
                        className={cn('flex-1 px-4 py-3 rounded-xl border text-sm font-semibold capitalize transition-all',
                          assignForm.billingCycle === cycle ? 'border-violet-500 bg-violet-600/15 text-violet-300' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600')}>
                        {cycle}
                        {cycle === 'yearly' && <span className="block text-[10px] text-emerald-400 mt-0.5">Save more</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                {assignForm.planId && (() => {
                  const selPlan = plans.find(p => p._id === assignForm.planId);
                  const price = assignForm.billingCycle === 'yearly' ? selPlan?.price?.yearly : selPlan?.price?.monthly;
                  return (
                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Summary</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">{assignTarget.name}</span>
                        <span className="text-white font-bold">{selPlan?.name} — ₹{price?.toLocaleString()}/{assignForm.billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                      </div>
                    </div>
                  );
                })()}

                <button type="submit" disabled={!assignForm.planId || plansLoading}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2">
                  {plansLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Assigning…</> : <><CreditCard className="w-4 h-4" /> Assign Subscription</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
