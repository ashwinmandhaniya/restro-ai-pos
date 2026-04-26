import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit2, Trash2, Save, X, ChefHat } from 'lucide-react';
import api from '@/lib/api';
import useKdsStore from '@/store/kdsStore';
import useMenuStore from '@/store/menuStore';

export default function KitchenStationSettings() {
  const { stations, fetchStations } = useKdsStore();
  const { categories, fetchMenuData } = useMenuStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    color: '#8B5CF6',
    isActive: true,
    priority: 0,
    categories: []
  });

  useEffect(() => {
    fetchStations();
    fetchMenuData();
  }, [fetchStations, fetchMenuData]);

  const resetForm = () => {
    setFormData({ name: '', code: '', color: '#8B5CF6', isActive: true, priority: 0, categories: [] });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEdit = (station) => {
    setFormData({
      name: station.name,
      code: station.code || '',
      color: station.color || '#8B5CF6',
      isActive: station.isActive,
      priority: station.priority || 0,
      categories: station.categories.map(c => typeof c === 'object' ? c._id : c)
    });
    setEditingId(station._id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this station?")) return;
    try {
      await api.delete(`/kds/stations/${id}`);
      fetchStations();
    } catch (error) {
      console.error(error);
      alert('Failed to delete station');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingId) {
        await api.put(`/kds/stations/${editingId}`, formData);
      } else {
        await api.post('/kds/stations', formData);
      }
      fetchStations();
      resetForm();
    } catch (error) {
      console.error(error);
      alert('Failed to save station');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (catId) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(catId)
        ? prev.categories.filter(id => id !== catId)
        : [...prev.categories, catId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-surface-900 dark:text-white">Kitchen Stations</h3>
          <p className="text-sm text-surface-500">Configure stations and route items by category for the KDS.</p>
        </div>
        {!isFormOpen && (
          <button onClick={() => setIsFormOpen(true)} className="btn-primary btn-sm">
            <Plus size={16} /> Add Station
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="card p-5 border border-primary-200 dark:border-primary-900 shadow-lg animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-200 dark:border-surface-700">
            <h4 className="font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <ChefHat size={18} className="text-primary-500" /> 
              {editingId ? 'Edit Station' : 'New Station'}
            </h4>
            <button onClick={resetForm} className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Station Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input" placeholder="e.g. Grill Station" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Code</label>
                  <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="input" placeholder="e.g. GRL" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Color</label>
                  <input type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="h-10 w-20 p-1 block bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg cursor-pointer" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Routed Categories</label>
              <div className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map(cat => (
                    <label key={cat._id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 cursor-pointer transition-colors border border-transparent hover:border-surface-300 dark:hover:border-surface-600">
                      <input 
                        type="checkbox" 
                        checked={formData.categories.includes(cat._id)}
                        onChange={() => toggleCategory(cat._id)}
                        className="rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium select-none truncate">
                        {cat.icon} {cat.name}
                      </span>
                    </label>
                  ))}
                  {categories.length === 0 && <span className="text-sm text-surface-500 col-span-3">No categories found. Create categories in the Menu section first.</span>}
                </div>
              </div>
              <p className="text-xs text-surface-500 mt-2 flex items-center gap-1">
                 <ChefHat size={12}/> Items from these categories will automatically route to this station in the KDS.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
              <button type="button" onClick={resetForm} className="btn-ghost">Cancel</button>
              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Station'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stations.map(station => (
          <div key={station._id} className="card p-5 hover:border-primary-200 dark:hover:border-primary-800 transition-colors group">
             <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: station.color + '20', color: station.color }}>
                     <ChefHat size={20} />
                   </div>
                   <div>
                     <h4 className="font-bold text-surface-900 dark:text-white leading-tight">{station.name}</h4>
                     <p className="text-xs font-mono text-surface-500 opacity-80">{station.code || 'NO-CODE'}</p>
                   </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => handleEdit(station)} className="p-1.5 text-surface-400 hover:text-primary-500 rounded bg-surface-50 dark:bg-surface-800 hover:bg-primary-50 dark:hover:bg-primary-900/20"><Edit2 size={14}/></button>
                   <button onClick={() => handleDelete(station._id)} className="p-1.5 text-surface-400 hover:text-red-500 rounded bg-surface-50 dark:bg-surface-800 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={14}/></button>
                </div>
             </div>
             
             <div className="space-y-2">
                <p className="text-xs text-surface-500 font-semibold uppercase tracking-wider">Routed Categories ({station.categories?.length || 0})</p>
                <div className="flex flex-wrap gap-1.5">
                   {station.categories?.slice(0,4).map(c => (
                     <span key={typeof c === 'object' ? c._id : c} className="badge bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 border border-surface-200 dark:border-surface-700">
                       {typeof c === 'object' ? c.name : 'Unknown'}
                     </span>
                   ))}
                   {station.categories?.length > 4 && (
                     <span className="badge bg-surface-50 dark:bg-surface-800/50 text-surface-500">+{station.categories.length - 4} more</span>
                   )}
                   {!station.categories?.length && (
                     <span className="text-xs italic text-surface-400">None assigned</span>
                   )}
                </div>
             </div>
          </div>
        ))}
        {stations.length === 0 && !isFormOpen && (
           <div className="col-span-full py-12 text-center text-surface-500 card border-dashed">
              <ChefHat size={48} className="mx-auto mb-3 opacity-20" />
              <h4 className="text-lg font-semibold text-surface-700 dark:text-surface-300">No Kitchen Stations</h4>
              <p className="text-sm mt-1 mb-4">Set up stations to start routing orders in the KDS.</p>
              <button onClick={() => setIsFormOpen(true)} className="btn-secondary btn-sm mx-auto">
                <Plus size={16} /> Create First Station
              </button>
           </div>
        )}
      </div>
    </div>
  );
}
