import React, { useState, useEffect } from 'react';
import { RefreshCw, Save, Search, Store } from 'lucide-react';
import useMenuStore from '@/store/menuStore';
import useOutletStore from '@/store/outletStore';
import useUIStore from '@/store/uiStore';
import { cn, formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function MenuSyncPage() {
  const { menuItems, fetchMenuData } = useMenuStore();
  const { outlets, menuOverrides, fetchMenuOverrides, updateMenuOverrides, isMultiOutletEnabled } = useOutletStore();
  const { addNotification } = useUIStore();

  const [selectedOutletId, setSelectedOutletId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Local state map for overrides while editing: { [itemId]: { price, available } }
  const [localOverrides, setLocalOverrides] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchMenuData(); // ensure we have master menu
  }, [fetchMenuData]);

  // When outlet selector changes, fetch their specific overrides
  useEffect(() => {
    if (selectedOutletId) {
      fetchMenuOverrides(selectedOutletId);
    } else {
      setLocalOverrides({});
    }
  }, [selectedOutletId, fetchMenuOverrides]);

  // When store's menuOverrides changes (after fetch), hydrate our local edit state
  useEffect(() => {
    const map = {};
    menuOverrides.forEach(ov => {
      map[ov.menuItem] = {
        price: ov.price,
        available: ov.available
      };
    });
    setLocalOverrides(map);
  }, [menuOverrides]);

  const handlePriceChange = (itemId, newPrice) => {
    setLocalOverrides(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        price: newPrice === '' ? undefined : Number(newPrice),
        available: prev[itemId]?.available ?? true // default available if only setting price
      }
    }));
  };

  const handleAvailabilityToggle = (itemId) => {
    setLocalOverrides(prev => {
      const currentAvail = prev[itemId]?.available;
      const willBeAvailable = currentAvail === undefined ? false : !currentAvail; // toggling from master true -> false usually
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          available: willBeAvailable
        }
      };
    });
  };

  const handleSave = async () => {
    if (!selectedOutletId) return;
    setIsSaving(true);
    
    // Convert local map to array expected by API
    const overridesArray = Object.keys(localOverrides).map(itemId => ({
      menuItem: itemId,
      price: localOverrides[itemId].price,
      available: localOverrides[itemId].available
    })).filter(ov => ov.price !== undefined || ov.available !== undefined); // only send actual overrides

    const success = await updateMenuOverrides(selectedOutletId, overridesArray);
    if (success) {
      addNotification({ type: 'success', title: 'Sync Successful', message: 'Menu overrides saved to branch.' });
    }
    setIsSaving(false);
  };

  const filteredItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (typeof item.category === 'object' ? item.category.name : item.category).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isMultiOutletEnabled || outlets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Store className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Multi-Outlet Disabled</h2>
        <p className="text-slate-500 mt-2">Centralized menu sync is only available for multi-outlet tenants.</p>
      </div>
    );
  }

  // Identify master HQ to hide from the dropdown if needed, though they could override HQ menu via API, 
  // usually HQ is the master. We'll show all branches.
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-violet-500" />
            Menu Sync Policy
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">Customize item pricing and availability for specific outlets</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleSave} 
            disabled={isSaving || !selectedOutletId}
            className="btn-primary flex items-center gap-2 px-6"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Policy
          </button>
        </div>
      </div>

      <div className="card p-5 bg-gradient-to-r from-violet-500/10 to-transparent dark:from-violet-900/20 border-violet-100 dark:border-violet-900/50">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full relative">
            <label className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400 mb-2 block">
              1. Select Target Branch
            </label>
            <select 
              value={selectedOutletId} 
              onChange={e => setSelectedOutletId(e.target.value)}
              className="input bg-white dark:bg-slate-900 border-violet-200 dark:border-violet-800"
            >
              <option value="">-- Choose an outlet to configure --</option>
              {outlets.filter(o => !o.isHQ).map(o => (
                <option key={o._id} value={o._id}>{o.name} {o.code ? `(${o.code})` : ''}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 w-full relative">
             <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
               2. Filter Master Catalog
             </label>
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Search by name or category..." 
                 className="input pl-10"
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
               />
             </div>
          </div>
        </div>
      </div>

      {!selectedOutletId ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <Store className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <p className="text-slate-500 font-medium">Select a branch above to view and edit its menu overrides.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase">HQ Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase bg-violet-50 dark:bg-violet-900/10 rounded-tl-lg">Branch Override Price</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase bg-violet-50 dark:bg-violet-900/10 rounded-tr-lg">Branch Availability</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => {
                  const override = localOverrides[item._id] || {};
                  const isAvailable = override.available !== undefined ? override.available : item.available;
                  const hasPriceOverride = override.price !== undefined;
                  
                  return (
                    <motion.tr 
                      key={item._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn(
                        "border-b border-surface-50 dark:border-surface-800 transition-colors",
                        (hasPriceOverride || override.available !== undefined) ? "bg-violet-50/50 dark:bg-violet-900/10" : "hover:bg-surface-50 dark:hover:bg-surface-800/50"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg w-8 h-8 flex items-center justify-center bg-surface-100 dark:bg-surface-800 rounded">{item.image?.includes('http') ? <img src={item.image} className="w-full h-full object-cover rounded" alt=""/> : item.image}</span>
                          <span className="font-semibold text-sm dark:text-white">{item.name} {item.veg ? '🟩' : '🟥'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-500 capitalize">
                        {typeof item.category === 'object' ? item.category.name : item.category}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-500">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-4 py-3 bg-violet-50/30 dark:bg-violet-900/5">
                        <div className="relative w-32">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                          <input 
                            type="number"
                            placeholder={item.price}
                            value={override.price === undefined ? '' : override.price}
                            onChange={(e) => handlePriceChange(item._id, e.target.value)}
                            className={cn(
                              "input pl-7 text-sm font-mono h-9",
                              hasPriceOverride ? "border-violet-400 text-violet-700 dark:text-violet-400 bg-white dark:bg-slate-900" : "bg-transparent border-transparent hover:border-slate-200"
                            )}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 bg-violet-50/30 dark:bg-violet-900/5 text-center">
                        <button
                          onClick={() => handleAvailabilityToggle(item._id)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-bold transition-all mx-auto min-w-[100px]",
                            isAvailable 
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 shadow-inner" 
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          )}
                        >
                          {isAvailable ? 'IN STOCK' : 'OUT_OF_STOCK'}
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
