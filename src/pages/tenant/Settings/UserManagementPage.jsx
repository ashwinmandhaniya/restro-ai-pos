import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Pencil, Trash2, Shield, Search, Info, AlertCircle, X } from 'lucide-react';
import useTenantSettingsStore from '@/store/tenantSettingsStore';
import useAuthStore from '@/store/authStore';
import useUIStore from '@/store/uiStore';
import { cn } from '@/lib/utils';

export default function UserManagementPage() {
  const { users, roles, isLoading, error, fetchUsers, fetchRoles, createUser, updateUser, deleteUser } = useTenantSettingsStore();
  const { user: currentUser } = useAuthStore();
  const { confirmAction, addNotification } = useUIStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier',
    customRoleId: '',
    isActive: true
  });

  const tenantPlan = currentUser?.restaurantId?.currentPlanId; // Plan object if populated

  useEffect(() => {
    fetchUsers({ search: searchTerm });
    fetchRoles();
  }, [searchTerm]);

  const maxUsers = tenantPlan?.limits?.maxUsers || 3;
  const userCount = users.length;
  const isLimitReached = maxUsers !== -1 && userCount >= maxUsers;

  const openNew = () => {
    if (isLimitReached) return;
    setEditingId(null);
    setForm({ name: '', email: '', password: '', role: 'cashier', customRoleId: '', isActive: true });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingId(user._id);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      customRoleId: user.customRoleId?._id || '',
      isActive: user.isActive
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await updateUser(editingId, payload);
        addNotification({ type: 'success', title: 'User Updated', message: 'Staff member updated successfully.' });
      } else {
        await createUser(form);
        addNotification({ type: 'success', title: 'User Created', message: 'New staff member provisioned successfully.' });
      }
      setShowModal(false);
    } catch (e) {
      addNotification({ type: 'error', title: 'Save Failed', message: e.message || 'Could not save user data.' });
    }
  };

  const handleDeleteUser = async (id) => {
    const isConfirmed = await confirmAction({
      title: 'Remove Staff Member',
      message: 'Are you sure you want to remove this staff member? This action cannot be undone.',
      confirmText: 'Remove User'
    });

    if (isConfirmed) {
      try {
        await deleteUser(id);
        addNotification({ type: 'success', title: 'User Removed', message: 'The staff member has been deleted.' });
      } catch (e) {
        addNotification({ type: 'error', title: 'Deletion Failed', message: e.message || 'Could not remove user.' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-500" />
            User Management
          </h1>
          <p className="text-sm text-surface-500 mt-1">Manage your team and access levels</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-2 text-xs font-semibold text-surface-500 dark:text-surface-400 mb-1 uppercase tracking-wider">
              <Info className="w-3 h-3" /> User Credits
            </div>
            <div className="flex items-end gap-1.5">
              <span className="text-xl font-bold text-surface-900 dark:text-white">{userCount}</span>
              <span className="text-xs text-surface-400 mb-1">/ {maxUsers === -1 ? '∞' : maxUsers} used</span>
            </div>
          </div>
          
          <button 
            onClick={openNew}
            disabled={isLimitReached && !editingId}
            className={cn(
              "btn-primary flex items-center gap-2",
              isLimitReached && !editingId && "opacity-50 cursor-not-allowed grayscale"
            )}
          >
            <Plus className="w-4 h-4" /> New User
          </button>
        </div>
      </div>

      {isLimitReached && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">You've reached your plan's user limit. Please upgrade your plan or delete existing users to add more.</p>
        </div>
      )}

      {/* Table & List */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-surface-100 dark:border-surface-800">
          <div className="relative">
            <Search className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 h-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 dark:bg-surface-800/50">
                <th className="text-left py-3 px-6 text-xs text-surface-500 font-semibold uppercase tracking-wider">Name & Email</th>
                <th className="text-left py-3 px-6 text-xs text-surface-500 font-semibold uppercase tracking-wider">Role</th>
                <th className="text-left py-3 px-6 text-xs text-surface-500 font-semibold uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-6 text-xs text-surface-500 font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-12 text-surface-500">Loading your team...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-surface-500">No staff members found.</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u._id} className="hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-surface-900 dark:text-white">{u.name}</div>
                      <div className="text-xs text-surface-500">{u.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        u.role === 'admin' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                        u.role === 'manager' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                        u.role === 'chef' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                        u.role === 'custom' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                        "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400"
                      )}>
                        {u.role === 'custom' ? u.customRoleId?.name : u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn(
                        "w-2 h-2 rounded-full inline-block mr-2",
                        u.isActive ? "bg-emerald-500" : "bg-surface-300 dark:bg-surface-600"
                      )} />
                      <span className="text-surface-700 dark:text-surface-300">{u.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteUser(u._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-surface-400 hover:text-red-500">
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
      </div>

      {/* User Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-white dark:bg-surface-900 rounded-2xl shadow-2xl overflow-hidden border border-surface-200 dark:border-surface-800"
            >
              <div className="p-6 border-b border-surface-100 dark:border-surface-800 flex justify-between items-center">
                <h3 className="text-xl font-bold dark:text-white">{editingId ? 'Edit Staff Member' : 'Provision New Staff'}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                    {error}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium dark:text-white">Full Name</label>
                    <input required className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="John Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium dark:text-white">Email Address</label>
                    <input required type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="john@example.com" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium dark:text-white">
                    {editingId ? 'New Password (Optional)' : 'Password'}
                  </label>
                  <input required={!editingId} minLength={6} type="password" className="input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium dark:text-white">Role Type</label>
                    <select className="input" value={form.role} onChange={e => setForm({...form, role: e.target.value, customRoleId: e.target.value === 'custom' ? form.customRoleId : ''})}>
                      <option value="manager">Manager</option>
                      <option value="cashier">Cashier</option>
                      <option value="waiter">Waiter</option>
                      <option value="chef">Chef</option>
                      <option value="custom">Custom Role</option>
                    </select>
                  </div>
                  
                  {form.role === 'custom' && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium dark:text-white">Select Custom Role</label>
                      <select required className="input" value={form.customRoleId} onChange={e => setForm({...form, customRoleId: e.target.value})}>
                        <option value="">Choose Role...</option>
                        {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-surface-200 dark:border-surface-800 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="rounded text-primary-500" />
                  <div className="text-sm font-medium dark:text-white">Account Status is Active</div>
                </label>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={isLoading} className="btn-primary flex-1">
                    {isLoading ? 'Saving...' : editingId ? 'Update Profile' : 'Create Staff User'}
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
