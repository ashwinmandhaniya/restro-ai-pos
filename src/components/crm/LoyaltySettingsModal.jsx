import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Award, CheckCircle2, X } from 'lucide-react';
import useCustomerStore from '@/store/customerStore';
import useUIStore from '@/store/uiStore';
import { cn } from '@/lib/utils';

export default function LoyaltySettingsModal({ isOpen, onClose }) {
  const { updateLoyaltySettings } = useCustomerStore();
  const { addNotification } = useUIStore();
  
  const [enabled, setEnabled] = useState(true);
  const [pointsPerCurrency, setPointsPerCurrency] = useState(100);
  const [currencyPerPoint, setCurrencyPerPoint] = useState(1);
  const [minPointsToRedeem, setMinPointsToRedeem] = useState(50);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateLoyaltySettings({
      enabled,
      pointsPerCurrency: Number(pointsPerCurrency),
      currencyPerPoint: Number(currencyPerPoint),
      minPointsToRedeem: Number(minPointsToRedeem)
    });
    setSaving(false);

    if (res.success) {
      addNotification({ type: 'success', title: 'Loyalty Saved', message: 'Program settings updated successfully.' });
      onClose();
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
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/20 text-violet-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Loyalty Rules</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Configure how customers earn points</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 md:p-6 space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Enable Loyalty Program</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Customers earn points automatically on orders.</p>
            </div>
            <button 
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={cn("w-11 h-6 rounded-full transition-colors relative", enabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700")}
            >
              <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", enabled ? "left-6" : "left-1")} />
            </button>
          </div>

          <div className={cn("space-y-4 transition-opacity", !enabled && "opacity-50 pointer-events-none")}>
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5"/> Spend Check</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                    <input type="number" required min="1" value={pointsPerCurrency} onChange={e => setPointsPerCurrency(e.target.value)} className="w-full pl-8 pr-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-500" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Spend per 1 Point</p>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/> Point Value</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                    <input type="number" required min="0.1" step="0.1" value={currencyPerPoint} onChange={e => setCurrencyPerPoint(e.target.value)} className="w-full pl-8 pr-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-500" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Discount per Point</p>
               </div>
             </div>

             <div>
               <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Redemption Threshold</label>
               <input type="number" required min="0" value={minPointsToRedeem} onChange={e => setMinPointsToRedeem(e.target.value)} className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-500" />
               <p className="text-[10px] text-slate-500 mt-1">Minimum points customer must have before they can redeem.</p>
             </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 text-slate-700 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 px-4 text-white font-bold bg-violet-600 rounded-xl hover:bg-violet-700 transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
