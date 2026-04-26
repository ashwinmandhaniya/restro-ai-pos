import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Plus, Filter, X, Pencil, Shield, Building2, Trash2 } from 'lucide-react';
import useAdminUserStore from '@/store/adminUserStore';
import useAdminTenantStore from '@/store/adminTenantStore';
import { cn } from '@/lib/utils';

const roleColors = {
  superadmin: 'bg-violet-500/20 text-violet-400',
  admin: 'bg-amber-500/20 text-amber-400',
  manager: 'bg-blue-500/20 text-blue-400',
  cashier: 'bg-emerald-500/20 text-emerald-400',
  waiter: 'bg-slate-500/20 text-slate-400'
};

export default function AdminUsersPage() {
  const { users, fetchUsers, createUser, updateUser, deleteUser, isLoading } = useAdminUserStore();
  const { tenants, fetchTenants } = useAdminTenantStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier',
    restaurantId: '',
    isActive: true
  });

  useEffect(() => {
    fetchUsers({ search: searchTerm, role: roleFilter });
  }, [searchTerm, roleFilter]);

  useEffect(() => {
    if (tenants.length === 0) fetchTenants();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm({ name: '', email: '', password: '', role: 'cashier', restaurantId: '', isActive: true });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingId(user._id);
    setForm({
      name: user.name,
      email: user.email,
      password: '', // Kept empty unless changing
      role: user.role,
      restaurantId: user.restaurantId?._id || '',
      isActive: user.isActive
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.password) delete payload.password; // Don't send empty password on edit
    
    if (editingId) {
      await updateUser(editingId, payload);
    } else {
      if (!payload.password) return alert("Password is required for new users");
      await createUser(payload);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-violet-500" />
            User Management
          </h1>
          <p className="text-slate-400 mt-1">Manage global platform users and tenant boundaries</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-all shadow-lg shadow-violet-500/20">
          <Plus className="w-5 h-5" /> New User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-violet-500 focus:outline-none transition-colors"
          />
        </div>
        <select 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-violet-500 focus:outline-none capitalize"
        >
          <option value="">All Roles</option>
          <option value="superadmin">Super Admin</option>
          <option value="admin">Tenant Admin</option>
          <option value="manager">Manager</option>
          <option value="cashier">Cashier</option>
          <option value="waiter">Waiter</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50">
              <th className="text-left py-4 px-6 text-xs text-slate-500 font-semibold uppercase tracking-wider">User</th>
              <th className="text-left py-4 px-6 text-xs text-slate-500 font-semibold uppercase tracking-wider">Role</th>
              <th className="text-left py-4 px-6 text-xs text-slate-500 font-semibold uppercase tracking-wider">Tenant</th>
              <th className="text-left py-4 px-6 text-xs text-slate-500 font-semibold uppercase tracking-wider">Status</th>
              <th className="text-right py-4 px-6 text-xs text-slate-500 font-semibold uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-12 text-slate-500 font-medium">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-slate-500 font-medium">No users found matching filters.</td></tr>
            ) : (
              users.map(user => (
                <tr key={user._id} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <UserIcon className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium capitalize flex items-center inline-flex gap-1.5', roleColors[user.role] || 'bg-slate-800 text-slate-300')}>
                      {user.role === 'superadmin' && <Shield className="w-3 h-3" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-300 flex items-center gap-2">
                    {user.restaurantId ? (
                      <>
                        <Building2 className="w-4 h-4 text-violet-400" />
                        <span className="truncate max-w-[150px]">{user.restaurantId.name}</span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500 italic">— Global Profile —</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className={cn('w-2 h-2 rounded-full inline-block mr-2', user.isActive ? 'bg-emerald-500' : 'bg-red-500')} />
                    <span className="text-slate-300 capitalize">{user.isActive ? 'Active' : 'Locked'}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(user)} className="p-2 rounded-lg bg-slate-800 hover:bg-violet-600 hover:text-white text-slate-400 transition-colors tooltip" title="Edit User">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if(confirm("Permanently delete user?")) deleteUser(user._id); }} className="p-2 rounded-lg bg-slate-800 hover:bg-red-500 hover:text-white text-slate-400 transition-colors tooltip" title="Delete User">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
              
              <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-violet-500" />
                  {editingId ? 'Edit Platform User' : 'Register New User'}
                </h3>
                <button type="button" onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-800 p-1.5 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Full Name *</label>
                    <input required className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none transition-colors"
                      value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Email *</label>
                    <input required type="email" className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none transition-colors"
                      value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="john@example.com" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
                    Password {editingId && <span className="text-slate-500 font-normal">(Leave blank to keep unchanged)</span>} {!editingId && '*'}
                  </label>
                  <input type="password" required={!editingId} minLength={6} className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none transition-colors"
                    value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> Platform Role *
                    </label>
                    <select required className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none capitalize transition-colors"
                      value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                      <option value="superadmin">Super Admin</option>
                      <option value="admin">Tenant Admin</option>
                      <option value="manager">Manager</option>
                      <option value="cashier">Cashier</option>
                      <option value="waiter">Waiter</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> Tenant Binding
                    </label>
                    <select className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none transition-colors disabled:opacity-50"
                      value={form.restaurantId} onChange={e => setForm({...form, restaurantId: e.target.value})} disabled={form.role === 'superadmin'}>
                      <option value="">— Unbound (Global) —</option>
                      {tenants.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                    {form.role === 'superadmin' && <p className="text-[10px] text-violet-400 mt-1">Superadmins are globally scoped.</p>}
                  </div>
                </div>

                <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer group">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} 
                    className="w-4 h-4 rounded text-violet-600 bg-slate-900 border-slate-700 focus:ring-violet-600 focus:ring-offset-slate-800" />
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors">Account is Active</p>
                    <p className="text-xs text-slate-500">Uncheck to lock account and prevent login immediately.</p>
                  </div>
                </label>

                <div className="pt-2">
                  <button type="submit" disabled={isLoading} className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all shadow-lg shadow-violet-600/30 active:scale-[0.98]">
                    {isLoading ? 'Saving...' : editingId ? 'Update User Matrix' : 'Provision User'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
