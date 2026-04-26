import { useEffect, useState } from 'react';
import { ToggleLeft, ToggleRight, Plus, X, Search, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAdminFeatureFlagStore from '@/store/adminFeatureFlagStore';
import { cn } from '@/lib/utils';

const categoryColors = {
  ai: 'bg-violet-500/20 text-violet-400',
  billing: 'bg-emerald-500/20 text-emerald-400',
  marketing: 'bg-blue-500/20 text-blue-400',
  operations: 'bg-amber-500/20 text-amber-400',
  analytics: 'bg-cyan-500/20 text-cyan-400',
  integrations: 'bg-fuchsia-500/20 text-fuchsia-400',
};

export default function AdminFeatureFlagsPage() {
  const { flags, fetchFlags, toggleFlag, createFlag, updateFlag, deleteFlag, isLoading } = useAdminFeatureFlagStore();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ key: '', label: '', description: '', category: 'operations', isPremium: false });

  useEffect(() => { fetchFlags(); }, []);

  const filtered = flags.filter(f => {
    if (search && !f.label.toLowerCase().includes(search.toLowerCase()) && !f.key.includes(search.toLowerCase())) return false;
    if (catFilter && f.category !== catFilter) return false;
    return true;
  });

  const categories = [...new Set(flags.map(f => f.category))];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await updateFlag(editingId, form);
    } else {
      await createFlag({ ...form, isGloballyEnabled: true });
    }
    setShowModal(false);
    setForm({ key: '', label: '', description: '', category: 'operations', isPremium: false });
  };
  
  const openEdit = (f) => {
    setEditingId(f._id);
    setForm({ key: f.key, label: f.label, description: f.description || '', category: f.category, isPremium: f.isPremium });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Feature Flags</h1>
          <p className="text-slate-400 mt-1">Toggle features globally or per plan/tenant</p>
        </div>
        <button onClick={() => { setEditingId(null); setForm({ key: '', label: '', description: '', category: 'operations', isPremium: false }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all">
          <Plus className="w-4 h-4" /> New Flag
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search flags..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500" />
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setCatFilter('')} className={cn('px-3 py-2 rounded-lg text-xs font-semibold transition-all', !catFilter ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400')}>All</button>
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)} className={cn('px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all', catFilter === c ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400')}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Flags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((flag) => (
          <div key={flag._id} className={cn('rounded-xl bg-slate-900 border p-4 transition-all', flag.isGloballyEnabled ? 'border-slate-700' : 'border-slate-800 opacity-50')}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-white truncate">{flag.label}</h4>
                  {flag.isPremium && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">PRO</span>}
                  {flag.isCore && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">CORE</span>}
                </div>
                <code className="text-[10px] text-slate-500 font-mono">{flag.key}</code>
              </div>
              <button onClick={() => toggleFlag(flag._id)} className="flex-shrink-0 ml-3">
                {flag.isGloballyEnabled
                  ? <ToggleRight className="w-8 h-8 text-violet-500" />
                  : <ToggleLeft className="w-8 h-8 text-slate-600" />
                }
              </button>
            </div>
            {flag.description && <p className="text-xs text-slate-500 mb-3">{flag.description}</p>}
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-800/50">
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium capitalize', categoryColors[flag.category] || categoryColors['operations'])}>
                {flag.category}
              </span>
              {!flag.isCore && (
                <div className="flex gap-1.5">
                  <button onClick={() => openEdit(flag)} className="p-1 rounded text-slate-500 hover:text-white transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { if(confirm("Delete this flag?")) deleteFlag(flag._id); }} className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6">
              <div className="flex justify-between mb-5">
                <h3 className="text-xl font-bold text-white">{editingId ? 'Edit Feature Flag' : 'New Feature Flag'}</h3>
                <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="text-xs text-slate-400 mb-1 block">Key *</label>
                  <input required disabled={!!editingId} placeholder="e.g. live_chat" className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white font-mono focus:border-violet-500 focus:outline-none disabled:opacity-50" value={form.key} onChange={e => setForm({...form, key: e.target.value})} /></div>
                <div><label className="text-xs text-slate-400 mb-1 block">Label *</label>
                  <input required placeholder="Live Chat" className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none" value={form.label} onChange={e => setForm({...form, label: e.target.value})} /></div>
                <div><label className="text-xs text-slate-400 mb-1 block">Description</label>
                  <textarea placeholder="What does this feature do?" className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none resize-none" rows="2" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                <div><label className="text-xs text-slate-400 mb-1 block">Category</label>
                  <select className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {['ai', 'billing', 'marketing', 'operations', 'analytics', 'integrations'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
                <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                  <input type="checkbox" checked={form.isPremium} onChange={e => setForm({...form, isPremium: e.target.checked})} className="rounded bg-slate-800 border-slate-700" /> Premium Feature
                </label>
                <button type="submit" disabled={isLoading} className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-all mt-4">
                  {editingId ? 'Save Changes' : 'Create Flag'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
