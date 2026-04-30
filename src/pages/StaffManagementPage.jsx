import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, Search, Brain, Star, TrendingUp, Clock, Shield, ChefHat, UserCheck, Coffee, X, Edit3, Trash2, CheckCircle, AlertTriangle, Zap, Award, Phone, Mail, Calendar, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn, formatCurrency, getInitials } from '@/lib/utils'
import useUIStore from '@/store/uiStore'
import api from '@/lib/api'

const ROLE_CONFIG = {
  admin:    { label: 'Admin',    color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400', icon: Shield },
  manager:  { label: 'Manager', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', icon: Users },
  waiter:   { label: 'Waiter',  color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', icon: UserCheck },
  chef:     { label: 'Chef',    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400', icon: ChefHat },
  cashier:  { label: 'Cashier', color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400', icon: Coffee },
  custom:   { label: 'Custom',  color: 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400', icon: Users },
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState([])
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', role: 'waiter', shift: 'Morning', password: '' })
  const { addNotification, confirmAction } = useUIStore()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [staffRes, insRes] = await Promise.allSettled([
        api.get('/tenant/staff'),
        api.get('/tenant/staff/insights')
      ])
      if (staffRes.status === 'fulfilled') setStaff(staffRes.value.data.data || [])
      if (insRes.status === 'fulfilled') setInsights(insRes.value.data.data)
    } catch (e) { /* noop */ }
    finally { setLoading(false) }
  }

  const filtered = staff.filter(s => {
    const q = search.toLowerCase()
    const matchQ = s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.phone?.includes(q)
    const matchR = roleFilter === 'all' || s.role === roleFilter
    return matchQ && matchR
  })

  const stats = {
    total: staff.length,
    active: staff.filter(s => s.isActive).length,
    waiters: staff.filter(s => s.role === 'waiter').length,
    chefs: staff.filter(s => s.role === 'chef').length,
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/tenant/waiters', addForm)
      setStaff(p => [res.data.data, ...p])
      setShowAdd(false)
      setAddForm({ name: '', email: '', phone: '', role: 'waiter', shift: 'Morning', password: '' })
      addNotification({ type: 'success', title: 'Staff Added', message: `${addForm.name} registered successfully` })
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to add staff' })
    }
  }

  const handleToggleActive = async (member) => {
    try {
      await api.patch(`/tenant/staff/${member._id}`, { isActive: !member.isActive })
      setStaff(p => p.map(s => s._id === member._id ? { ...s, isActive: !s.isActive } : s))
      if (selected?._id === member._id) setSelected(s => ({ ...s, isActive: !s.isActive }))
      addNotification({ type: 'success', title: 'Updated', message: `${member.name} marked ${!member.isActive ? 'active' : 'inactive'}` })
    } catch {
      addNotification({ type: 'error', title: 'Error', message: 'Could not update status' })
    }
  }

  const handleDelete = async (member) => {
    const ok = await confirmAction({ title: 'Remove Staff', message: `Remove ${member.name} permanently?`, confirmText: 'Remove' })
    if (!ok) return
    try {
      await api.delete(`/tenant/users/${member._id}`)
      setStaff(p => p.filter(s => s._id !== member._id))
      setSelected(null)
      addNotification({ type: 'success', title: 'Removed', message: member.name })
    } catch {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to remove staff member' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-violet-500" /> Staff Management
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">Manage your entire team with AI-powered insights</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowAI(true); if (!insights) fetchAll() }}
            className="btn-secondary btn-sm flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-500" /> AI Insights
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Staff', value: stats.total, icon: Users, color: 'from-violet-500 to-violet-600' },
          { label: 'Active Now', value: stats.active, icon: CheckCircle, color: 'from-green-500 to-green-600' },
          { label: 'Waiters', value: stats.waiters, icon: UserCheck, color: 'from-blue-500 to-blue-600' },
          { label: 'Chefs', value: stats.chefs, icon: ChefHat, color: 'from-orange-500 to-orange-600' },
        ].map((s, i) => (
          <div key={i} className="card p-4 flex items-center gap-3">
            <div className={cn('p-2.5 rounded-xl bg-gradient-to-br text-white shadow-lg', s.color)}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-surface-500 uppercase tracking-wider font-semibold">{s.label}</p>
              <p className="text-xl font-extrabold text-surface-900 dark:text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone..." className="input pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'waiter', 'chef', 'cashier', 'manager', 'admin'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={cn('px-3 py-2 rounded-lg text-xs font-bold transition-all',
                roleFilter === r ? 'bg-primary-500 text-white shadow' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400')}>
              {r === 'all' ? 'All Roles' : ROLE_CONFIG[r]?.label || r}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filtered.map((member, i) => {
              const rc = ROLE_CONFIG[member.role] || ROLE_CONFIG.custom
              const RIcon = rc.icon
              return (
                <motion.div key={member._id} layout
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelected(member)}
                  className={cn('card p-5 cursor-pointer hover:shadow-lg transition-all group relative', !member.isActive && 'opacity-50')}>
                  {/* Active dot */}
                  <div className={cn('absolute top-4 right-4 w-2.5 h-2.5 rounded-full', member.isActive ? 'bg-green-500 animate-pulse' : 'bg-surface-300')} />

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                      {getInitials(member.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-surface-900 dark:text-white truncate">{member.name}</p>
                      <p className="text-xs text-surface-500 truncate">{member.email}</p>
                      <span className={cn('inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold', rc.color)}>
                        <RIcon className="w-2.5 h-2.5" /> {rc.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    {(member.role === 'waiter' ? [
                      { l: 'Orders', v: member.ordersCompleted || 0 },
                      { l: 'Rating', v: member.rating ? `${member.rating}★` : 'N/A' },
                      { l: 'Points', v: member.rewardPoints || 0 },
                    ] : member.role === 'chef' ? [
                      { l: 'Load', v: member.currentLoad || 0 },
                      { l: 'Max', v: member.maxConcurrentItems || 8 },
                      { l: 'Status', v: member.isAvailable ? 'On' : 'Off' },
                    ] : [
                      { l: 'Shift', v: member.shift || '-' },
                      { l: 'Attend.', v: `${member.attendance || 100}%` },
                      { l: 'Status', v: member.isActive ? 'Active' : 'Inactive' },
                    ]).map((m, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-surface-50 dark:bg-surface-800">
                        <p className="text-[9px] text-surface-500 uppercase tracking-wider">{m.l}</p>
                        <p className="text-sm font-extrabold font-mono text-surface-900 dark:text-white">{m.v}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-surface-400">
              <Users className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-semibold">No staff members found</p>
            </div>
          )}
        </div>
      )}

      {/* Detail Drawer */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelected(null)}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-sm bg-white dark:bg-surface-900 shadow-2xl overflow-y-auto">
              <div className="p-6 bg-gradient-to-br from-violet-500 to-violet-700 text-white">
                <button onClick={() => setSelected(null)} className="absolute top-4 right-4 p-2 rounded-xl bg-white/20 hover:bg-white/30">
                  <X className="w-5 h-5" />
                </button>
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-black mb-3">
                  {getInitials(selected.name)}
                </div>
                <h3 className="text-xl font-extrabold">{selected.name}</h3>
                <p className="text-sm opacity-80">{ROLE_CONFIG[selected.role]?.label || selected.role}</p>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-surface-400" /><span className="dark:text-surface-300">{selected.phone || '—'}</span></div>
                  <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-surface-400" /><span className="dark:text-surface-300">{selected.email}</span></div>
                  <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-surface-400" /><span className="dark:text-surface-300">Joined: {new Date(selected.createdAt).toLocaleDateString()}</span></div>
                </div>

                {selected.role === 'waiter' && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { l: 'Shift', v: selected.shift || 'Morning' },
                      { l: 'Attendance', v: `${selected.attendance || 100}%` },
                      { l: 'Orders Done', v: selected.ordersCompleted || 0 },
                      { l: 'Rating', v: selected.rating ? `${selected.rating}/5` : 'N/A' },
                      { l: 'Tips Earned', v: formatCurrency(selected.tips || 0) },
                      { l: 'Reward Points', v: (selected.rewardPoints || 0).toLocaleString() },
                    ].map((s, i) => (
                      <div key={i} className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                        <p className="text-[10px] text-surface-500 uppercase tracking-wider">{s.l}</p>
                        <p className="text-base font-extrabold font-mono dark:text-white">{s.v}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Badge */}
                <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-4 h-4 text-violet-600" />
                    <p className="text-xs font-bold text-violet-700 dark:text-violet-400">AI Performance Score</p>
                  </div>
                  <p className="text-2xl font-black text-violet-700 dark:text-violet-400 font-mono">
                    {Math.round((selected.rating || 3) * 20 + (selected.attendance || 100) * 0.3 + (selected.ordersCompleted || 0) * 0.1)}
                    <span className="text-xs font-semibold ml-1 opacity-70">/100</span>
                  </p>
                  <p className="text-xs text-surface-500 mt-1">Based on rating, attendance & order volume</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleDelete(selected)}
                    className="flex-1 py-2.5 rounded-xl border-2 border-red-200 dark:border-red-800 text-red-500 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                    <Trash2 className="w-4 h-4 inline mr-1" />Remove
                  </button>
                  <button onClick={() => handleToggleActive(selected)}
                    className={cn('flex-1 py-2.5 rounded-xl font-bold text-sm transition-all',
                      selected.isActive ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-green-500 text-white hover:bg-green-600')}>
                    {selected.isActive ? <><ToggleLeft className="w-4 h-4 inline mr-1" />Deactivate</> : <><ToggleRight className="w-4 h-4 inline mr-1" />Activate</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Insights Modal */}
      <AnimatePresence>
        {showAI && insights && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAI(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-surface-200 dark:border-surface-800">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-violet-500" /> AI Staff Insights
                </h3>
                <button onClick={() => setShowAI(false)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { l: 'Total Staff', v: insights.totalStaff, color: 'text-violet-600' },
                  { l: 'Active Staff', v: insights.activeStaff, color: 'text-green-600' },
                  { l: 'Avg Orders/Day', v: insights.avgOrdersPerDay, color: 'text-blue-600' },
                  { l: 'Weekly Orders', v: insights.weeklyOrders, color: 'text-orange-600' },
                ].map((s, i) => (
                  <div key={i} className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800 text-center">
                    <p className="text-[10px] text-surface-500 uppercase tracking-wider">{s.l}</p>
                    <p className={cn('text-2xl font-black font-mono', s.color)}>{s.v}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">Recommendations</p>
                {(insights.recommendations || []).map((r, i) => (
                  <div key={i} className={cn('p-3 rounded-xl border flex items-start gap-3',
                    r.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-500/20' :
                    r.type === 'success' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-500/20' :
                    'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-500/20')}>
                    {r.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> :
                     r.type === 'success' ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> :
                     <Zap className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
                    <div>
                      <p className="text-sm font-bold dark:text-white">{r.title}</p>
                      <p className="text-xs text-surface-500 mt-0.5">{r.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-md p-6 border border-surface-200 dark:border-surface-800">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-500" /> Add Staff Member
                </h3>
                <button onClick={() => setShowAdd(false)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block dark:text-surface-300">Full Name *</label>
                  <input required placeholder="e.g. Raju Verma" className="input"
                    value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block dark:text-surface-300">Phone *</label>
                    <input required type="tel" placeholder="+91..." className="input"
                      value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block dark:text-surface-300">Email *</label>
                    <input required type="email" placeholder="email@..." className="input"
                      value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block dark:text-surface-300">Role</label>
                    <select className="input" value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })}>
                      <option value="waiter">Waiter</option>
                      <option value="chef">Chef</option>
                      <option value="cashier">Cashier</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block dark:text-surface-300">Shift</label>
                    <select className="input" value={addForm.shift} onChange={e => setAddForm({ ...addForm, shift: e.target.value })}>
                      <option>Morning</option><option>Evening</option><option>Split</option><option>Night</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block dark:text-surface-300">Password *</label>
                  <input required type="password" placeholder="Min 6 characters" className="input"
                    value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} />
                </div>
                <button type="submit" className="w-full btn-primary mt-2">Register Staff Member</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
