import React, { useState } from 'react';
import { Store, ChevronDown, Check } from 'lucide-react';
import useOutletStore from '@/store/outletStore';
import useAuthStore from '@/store/authStore';

export default function OutletSwitcher() {
  const { outlets, currentOutlet, switchOutlet, isMultiOutletEnabled } = useOutletStore();
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  if (!isMultiOutletEnabled || outlets.length <= 1) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-200 transition"
      >
        <Store size={16} className="text-violet-600" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
          {currentOutlet?.name || 'All Outlets'}
        </span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-2">
            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Select Outlet
            </div>
            
            {/* Show "All Outlets" context if user is tenant admin (null outletId) */}
            {user?.outletId === null && (
              <button
                onClick={() => {
                  switchOutlet(null);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${
                  currentOutlet === null ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <span>Global Overview</span>
                {currentOutlet === null && <Check size={16} className="text-violet-600" />}
              </button>
            )}

            {outlets.map(outlet => (
              <button
                key={outlet._id}
                onClick={() => {
                  switchOutlet(outlet._id);
                  setIsOpen(false);
                  // Quick page reload to ensure all data is scoped nicely 
                  // or rely on store subscriptions (better). We'll rely on store for now.
                }}
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${
                  currentOutlet?._id === outlet._id ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${outlet.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="truncate max-w-[140px]">{outlet.name}</span>
                </div>
                {currentOutlet?._id === outlet._id && <Check size={16} className="text-violet-600" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
