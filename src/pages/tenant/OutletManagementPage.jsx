import React, { useEffect, useState } from 'react';
import useOutletStore from '@/store/outletStore';
import { Plus, MapPin, Settings, CheckCircle, XCircle, Star, BarChart3 } from 'lucide-react';

export default function OutletManagementPage() {
  const { outlets, analytics, isLoading, error, isMultiOutletEnabled, init, createOutlet, updateOutletStatus, setHqOutlet, fetchAnalytics } = useOutletStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', type: 'branch', city: '', state: '', address: '' });

  useEffect(() => {
    init().then(() => {
      fetchAnalytics();
    });
  }, [init, fetchAnalytics]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      code: formData.code,
      type: formData.type,
      region: { city: formData.city, state: formData.state },
      address: formData.address,
    };
    const success = await createOutlet(payload);
    if (success) {
      setIsCreateModalOpen(false);
      setFormData({ name: '', code: '', type: 'branch', city: '', state: '', address: '' });
    }
  };

  const toggleStatus = async (outlet) => {
    const newStatus = outlet.status === 'active' ? 'inactive' : 'active';
    await updateOutletStatus(outlet._id, newStatus);
  };

  if (isLoading && outlets.length === 0) return <div className="p-6 text-surface-500">Loading outlets...</div>;

  if (!isMultiOutletEnabled) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-12 text-center card">
        <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 text-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MapPin size={32} />
        </div>
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Multi-Outlet Management</h2>
        <p className="text-surface-500 mb-6">
          Manage multiple branches, sync menus, and track inventory across locations. Available on the Ultra Pro plan.
        </p>
        <button className="btn-primary">
          Upgrade to Ultra Pro
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Outlet Management</h1>
          <p className="text-surface-500">Manage your branches, analytics, and settings</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary"
        >
          <Plus size={18} /> Add New Outlet
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-medium dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Analytics Summary Row */}
      {analytics && analytics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary-50 dark:bg-secondary-900/20 text-secondary-500 rounded-xl"><MapPin size={24}/></div>
              <div>
                <p className="text-sm font-medium text-surface-500">Total Outlets</p>
                <h3 className="text-2xl font-bold text-surface-900 dark:text-white">{analytics.length}</h3>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-xl"><BarChart3 size={24}/></div>
              <div>
                <p className="text-sm font-medium text-surface-500">Network Revenue</p>
                <h3 className="text-2xl font-bold text-surface-900 dark:text-white">
                  ₹{analytics.reduce((sum, o) => sum + (o.analytics?.totalRevenue || 0), 0).toLocaleString()}
                </h3>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent-50 dark:bg-accent-900/20 text-accent-500 rounded-xl"><CheckCircle size={24}/></div>
              <div>
                <p className="text-sm font-medium text-surface-500">Active Branches</p>
                <h3 className="text-2xl font-bold text-surface-900 dark:text-white">
                  {analytics.filter(o => o.status === 'active').length}
                </h3>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {outlets.map(outlet => {
          // get analytics for this outlet if available
          const outletStats = analytics?.find(a => a._id === outlet._id)?.analytics || { totalRevenue: 0, totalOrders: 0 };
          return (
          <div key={outlet._id} className="card p-6 flex flex-col relative overflow-hidden group">
            {outlet.isHQ && (
              <div className="absolute top-0 right-0 bg-primary-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-wider flex items-center gap-1 shadow-sm">
                <Star size={10} fill="currentColor" /> HEADQUARTERS
              </div>
            )}
            
            <div className="flex items-start justify-between mb-4 mt-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-surface-100 dark:bg-surface-800 rounded-xl flex items-center justify-center text-surface-600 dark:text-surface-300">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-surface-900 dark:text-white leading-tight">{outlet.name}</h3>
                  <p className="text-sm text-surface-500 font-mono mt-0.5">{outlet.code}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-5 p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
               <div>
                 <p className="text-xs text-surface-500 uppercase tracking-wider font-semibold">Revenue</p>
                 <p className="font-bold text-surface-900 dark:text-surface-50">₹{outletStats.totalRevenue.toLocaleString()}</p>
               </div>
               <div>
                 <p className="text-xs text-surface-500 uppercase tracking-wider font-semibold">Orders</p>
                 <p className="font-bold text-surface-900 dark:text-surface-50">{outletStats.totalOrders}</p>
               </div>
            </div>

            <div className="space-y-3 flex-grow mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-500 font-medium">Status</span>
                <span className={outlet.status === 'active' ? 'badge-success' : 'badge'}>
                  {outlet.status === 'active' ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                  {outlet.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-500 font-medium">Location</span>
                <span className="text-surface-900 dark:text-surface-300 font-semibold">{outlet.region?.city || 'Not set'}</span>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-surface-100 dark:border-surface-800 flex flex-wrap gap-2">
              <button 
                onClick={() => toggleStatus(outlet)}
                className="btn-secondary flex-1"
              >
                {outlet.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              {!outlet.isHQ && (
                <button 
                  onClick={() => setHqOutlet(outlet._id)}
                  className="btn-ghost flex-1 border border-surface-200 dark:border-surface-700"
                >
                  Make HQ
                </button>
              )}
            </div>
          </div>
        )})}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50 backdrop-blur-sm">
           <div className="card w-full max-w-md overflow-hidden animate-fade-in animate-slide-up">
             <div className="p-6 border-b border-surface-200 dark:border-surface-700">
               <h3 className="text-xl font-bold text-surface-900 dark:text-white">Create New Outlet</h3>
               <p className="text-sm text-surface-500 mt-1">Set up a new branch or location.</p>
             </div>
             <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Outlet Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input" placeholder="e.g. Downtown Branch" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Branch Code</label>
                    <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="input" placeholder="e.g. DTN-01" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Type</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="input">
                      <option value="hq">Headquarters</option>
                      <option value="branch">Branch</option>
                      <option value="franchise">Franchise</option>
                      <option value="cloud_kitchen">Cloud Kitchen</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">City</label>
                    <input required type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">State</label>
                    <input required type="text" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="input" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Address Line</label>
                  <input required type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="input" />
                </div>
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-surface-200 dark:border-surface-700 mt-6">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" className="btn-primary" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Outlet'}
                  </button>
                </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}
