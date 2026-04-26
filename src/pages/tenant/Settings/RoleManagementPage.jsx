import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Pencil, Trash2, X, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import useTenantSettingsStore from '@/store/tenantSettingsStore';
import useAuthStore from '@/store/authStore';
import useUIStore from '@/store/uiStore';
import { cn } from '@/lib/utils';

const PERMISSIONS = [
  { id: 'dashboard.view', label: 'View Dashboard', category: 'Analytics' },
  { id: 'pos.billing', label: 'POS Billing', category: 'Sales' },
  { id: 'orders.view', label: 'View Orders', category: 'Sales' },
  { id: 'orders.void', label: 'Void Orders', category: 'Sales' },
  { id: 'menu.manage', label: 'Manage Menu', category: 'Catalog' },
  { id: 'inventory.manage', label: 'Manage Inventory', category: 'Catalog' },
  { id: 'kitchen.display', label: 'Kitchen Display', category: 'Operations' },
  { id: 'tokens.manage', label: 'Token Management', category: 'Operations' },
  { id: 'tables.manage', label: 'Manage Tables', category: 'Operations' },
  { id: 'reports.view', label: 'View Reports', category: 'Analytics' },
  { id: 'customers.manage', label: 'Manage Customers', category: 'Analytics' },
  { id: 'whatsapp.marketing', label: 'WhatsApp Loop', category: 'Marketing' },
  { id: 'settings.manage', label: 'System Settings', category: 'Admin' },
];

export default function RoleManagementPage() {
  const { roles, isLoading, error, fetchRoles, createRole, updateRole, deleteRole } = useTenantSettingsStore();
  const { user: currentUser } = useAuthStore();
  const { confirmAction, addNotification } = useUIStore();
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    permissions: []
  });

  const tenantPlan = currentUser?.restaurantId?.currentPlanId;

  useEffect(() => {
    fetchRoles();
  }, []);

  const maxRoles = tenantPlan?.limits?.maxRoles || 3;
  const roleCount = roles.length;
  const isLimitReached = maxRoles !== -1 && roleCount >= maxRoles;

  const openNew = () => {
    if (isLimitReached) return;
    setEditingId(null);
    setForm({ name: '', description: '', permissions: [] });
    setShowModal(true);
  };

  const openEdit = (role) => {
    setEditingId(role._id);
    setForm({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || []
    });
    setShowModal(true);
  };

  const handleTogglePermission = (id) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(id) 
        ? prev.permissions.filter(p => p !== id) 
        : [...prev.permissions, id]
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateRole(editingId, form);
        addNotification({ type: 'success', title: 'Role Updated', message: 'The role has been updated.' });
      } else {
        await createRole(form);
        addNotification({ type: 'success', title: 'Role Created', message: 'New role has been provisioned.' });
      }
      setShowModal(false);
    } catch (e) {
      addNotification({ type: 'error', title: 'Save Failed', message: e.message || 'Could not save the role.' });
    }
  };

  const handleDeleteRole = async (id) => {
    const isConfirmed = await confirmAction({
      title: 'Archive Role',
      message: 'Are you sure you want to archive this role? Staff assigned to it might lose access.',
      confirmText: 'Archive Role'
    });
    if (isConfirmed) {
      try {
        await deleteRole(id);
        addNotification({ type: 'success', title: 'Role Archived', message: 'The role was successfully archived.' });
      } catch (e) {
        addNotification({ type: 'error', title: 'Action Failed', message: e.message || 'Could not archive role.' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-500" />
            Role Management
          </h1>
          <p className="text-sm text-surface-500 mt-1">Design granular access levels for your staff</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-2 text-xs font-semibold text-surface-500 dark:text-surface-400 mb-1 uppercase tracking-wider">
              <Info className="w-3 h-3" /> Role Credits
            </div>
            <div className="flex items-end gap-1.5">
              <span className="text-xl font-bold text-surface-900 dark:text-white">{roleCount}</span>
              <span className="text-xs text-surface-400 mb-1">/ {maxRoles === -1 ? '∞' : maxRoles} used</span>
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
            <Plus className="w-4 h-4" /> New Role
          </button>
        </div>
      </div>

      {isLimitReached && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">You've reached your plan's custom role limit. Standard roles don't count towards this limit.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center text-surface-500">Loading roles...</div>
        ) : roles.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-surface-200 dark:border-surface-800 rounded-3xl">
             <Shield className="w-12 h-12 text-surface-300 mx-auto mb-4" />
             <p className="text-surface-500 mb-6 underline">No custom roles defined yet.</p>
             <button onClick={openNew} disabled={isLimitReached} className="btn-secondary">Provision My First Role</button>
          </div>
        ) : (
          roles.map(role => (
            <motion.div 
              key={role._id} 
              layoutId={role._id}
              className="card p-6 flex flex-col justify-between group hover:border-primary-500/50 transition-all duration-300"
            >
              <div>
                <div className="flex justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary-500" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(role)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteRole(role._id)} className="p-2 rounded-lg hover:bg-red-500/10 text-surface-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white">{role.name}</h3>
                <p className="text-sm text-surface-500 mt-1 mb-6 line-clamp-2">{role.description || 'No description provided.'}</p>
                
                <div className="space-y-2">
                  <p className="text-xs font-bold text-surface-400 uppercase tracking-widest">Active Permissions ({role.permissions?.length || 0})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions?.slice(0, 4).map(p => (
                      <span key={p} className="px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-[10px] text-surface-600 dark:text-surface-400 font-medium">
                        {PERMISSIONS.find(perm => perm.id === p)?.label || p}
                      </span>
                    ))}
                    {(role.permissions?.length || 0) > 4 && (
                      <span className="text-[10px] text-surface-400 font-medium self-center">+{role.permissions.length - 4} more</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between">
                <span className="text-xs text-surface-500 italic">Used by {role.usersCount || 0} users</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Role Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-white dark:bg-surface-900 rounded-3xl shadow-2xl overflow-hidden border border-surface-200 dark:border-surface-800"
            >
              <div className="p-6 border-b border-surface-100 dark:border-surface-800 flex justify-between items-center bg-surface-50/50 dark:bg-surface-950/50">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary-500" />
                  {editingId ? 'Refine Custom Role' : 'Architect New Role'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-6">
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                    {error}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold dark:text-white">Role Hierarchy Name</label>
                    <input required className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Senior Captain" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold dark:text-white">Internal Description</label>
                    <input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Full cross-service operations access" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-surface-400 uppercase tracking-widest">Global Policy Matrix</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {PERMISSIONS.map(perm => (
                      <button
                        key={perm.id}
                        type="button"
                        onClick={() => handleTogglePermission(perm.id)}
                        className={cn(
                          "flex flex-col items-start p-3 rounded-2xl border-2 transition-all text-left group",
                          form.permissions.includes(perm.id)
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30"
                            : "border-surface-100 dark:border-surface-800 hover:border-surface-200 dark:hover:border-surface-700"
                        )}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-[9px] font-bold text-surface-400 uppercase group-hover:text-primary-400 transition-colors">{perm.category}</span>
                          {form.permissions.includes(perm.id) && <CheckCircle2 className="w-3.5 h-3.5 text-primary-500" />}
                        </div>
                        <span className={cn(
                          "text-sm font-bold",
                          form.permissions.includes(perm.id) ? "text-primary-700 dark:text-primary-400" : "text-surface-600 dark:text-surface-400"
                        )}>{perm.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary h-12 flex-1">Cancel</button>
                  <button type="submit" disabled={isLoading} className="btn-primary h-12 flex-1 shadow-lg shadow-primary-500/20 active:scale-[0.98]">
                    {isLoading ? 'Processing...' : editingId ? 'Update Role Matrix' : 'Commit New Role'}
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
