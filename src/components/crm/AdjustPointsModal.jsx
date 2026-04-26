import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import useCustomerStore from '@/store/customerStore';
import useUIStore from '@/store/uiStore';

export default function AdjustPointsModal({ isOpen, onClose, customer }) {
  const { adjustLoyaltyPoints } = useCustomerStore();
  const { addNotification } = useUIStore();
  
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !customer) return null;

  const handleAdjust = async (e, type) => {
    e.preventDefault();
    if (!points || Number(points) <= 0) return;
    
    const value = type === 'add' ? Number(points) : -Number(points);
    
    setLoading(true);
    const res = await adjustLoyaltyPoints(customer._id || customer.id, value, reason);
    setLoading(false);

    if (res.success) {
      addNotification({ type: 'success', title: 'Points Updated', message: `Customer points adjusted by ${value}.` });
      onClose();
      setPoints('');
      setReason('');
    } else {
      addNotification({ type: 'error', title: 'Error', message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Adjust Points</h2>
            <p className="text-sm text-slate-500">for {customer.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 md:p-6 space-y-4">
          <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <p className="text-sm text-slate-500 mb-1">Current Balance</p>
            <p className="text-3xl font-black text-violet-600 dark:text-violet-400">{customer.loyaltyPoints || customer.points || 0}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Points to Adjust</label>
            <input type="number" min="1" value={points} onChange={e => setPoints(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-500" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Reason (Optional)</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Apology for delay" className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-violet-500" />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button onClick={(e) => handleAdjust(e, 'deduct')} disabled={loading || !points} className="flex-1 py-2.5 px-4 text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition disabled:opacity-50 border border-red-100 dark:border-red-500/20">
              - Deduct
            </button>
            <button onClick={(e) => handleAdjust(e, 'add')} disabled={loading || !points} className="flex-1 py-2.5 px-4 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition disabled:opacity-50 border border-emerald-100 dark:border-emerald-500/20">
              + Add
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
