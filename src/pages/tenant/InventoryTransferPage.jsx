import React, { useEffect, useState } from 'react';
import useOutletStore from '@/store/outletStore';
import { Package, ArrowRight, ArrowRightCircle, CheckCircle, XCircle } from 'lucide-react';

export default function InventoryTransferPage() {
  const { currentOutlet, outlets, transfers, fetchTransfers, requestTransfer, approveTransfer, receiveTransfer, cancelTransfer, isLoading, isMultiOutletEnabled } = useOutletStore();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  // Local state for transfer request form
  const [targetOutletId, setTargetOutletId] = useState('');
  const [items, setItems] = useState([{ name: '', quantity: 1 }]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (currentOutlet) fetchTransfers();
  }, [currentOutlet, fetchTransfers]);

  const handleAddItem = () => {
    setItems([...items, { name: '', quantity: 1 }]);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetOutletId) return alert("Select a target outlet first");
    
    // In actual implementation, we might map item names to itemIds 
    // Here we just pass mock structure expected by DB
    const transferItems = items.map(i => ({
         inventoryItemId: "mock-id-for-now", // Would normally lookup real ID
         name: i.name,
         quantity: Number(i.quantity)
    }));

    const success = await requestTransfer({
      toOutletId: targetOutletId,
      items: transferItems,
      notes: note
    });

    if (success) {
      setIsRequestModalOpen(false);
      setTargetOutletId('');
      setItems([{ name: '', quantity: 1 }]);
      setNote('');
    }
  };

  if (!isMultiOutletEnabled) {
    return <div className="p-6">Multi-outlet is not enabled.</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Inventory Transfers</h1>
          <p className="text-surface-500">Manage stock movement between <strong>{currentOutlet?.name}</strong> and other branches</p>
        </div>
        <button 
          onClick={() => setIsRequestModalOpen(true)}
          className="btn-primary"
        >
          <Package size={18} /> Request Transfer
        </button>
      </div>

      {isLoading && transfers.length === 0 ? (
        <div>Loading transfers...</div>
      ) : (
        <div className="card overflow-hidden">
           <table className="w-full text-left">
             <thead className="bg-surface-50 dark:bg-surface-900/50 border-b border-surface-200 dark:border-surface-700">
                <tr>
                   <th className="px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">ID</th>
                   <th className="px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Direction</th>
                   <th className="px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Items</th>
                   <th className="px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                   <th className="px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
               {transfers.length === 0 && (
                 <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-surface-500">
                      No transfers found for this outlet.
                    </td>
                 </tr>
               )}
               {transfers.map(t => {
                 const isIncoming = t.toOutletId === currentOutlet?._id;
                 const partnerId = isIncoming ? t.fromOutletId : t.toOutletId;
                 const partner = outlets.find(o => o._id === partnerId);
                 
                 return (
                   <tr key={t._id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50">
                     <td className="px-6 py-4 font-mono text-xs font-medium text-surface-600 dark:text-surface-400">
                       {t.referenceNumber || t._id.slice(-6)}
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${isIncoming ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                             {isIncoming ? 'IN' : 'OUT'}
                           </span>
                           <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                             {partner?.name || 'Unknown'}
                           </span>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-400">
                        {t.items.length} item(s)
                     </td>
                     <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                           ${t.status === 'completed' ? 'bg-green-100 text-green-700' : 
                             t.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                             'bg-amber-100 text-amber-700'}`}>
                           {t.status.toUpperCase()}
                        </span>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {t.status === 'pending' && isIncoming === false && (
                           <div className="flex gap-2">
                              <button onClick={() => cancelTransfer(t._id)} className="text-red-500 hover:text-red-700 font-medium">Cancel</button>
                           </div>
                        )}
                        {t.status === 'pending' && isIncoming === true && (
                           <div className="flex gap-2">
                              <button onClick={() => approveTransfer(t._id)} className="text-violet-600 hover:text-violet-800 font-medium font-bold">Approve</button>
                              <button onClick={() => cancelTransfer(t._id)} className="text-red-500 hover:text-red-700 font-medium">Reject</button>
                           </div>
                        )}
                        {t.status === 'in_transit' && isIncoming === true && (
                           <button onClick={() => receiveTransfer(t._id)} className="text-green-600 hover:text-green-800 font-medium font-bold flex items-center gap-1">
                              <CheckCircle size={14}/> Receive
                           </button>
                        )}
                     </td>
                   </tr>
                 );
               })}
             </tbody>
           </table>
        </div>
      )}

      {/* Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50 backdrop-blur-sm">
           <div className="card w-full max-w-lg overflow-hidden">
              <div className="p-6 border-b border-surface-100 dark:border-surface-700">
                 <h3 className="text-xl font-bold text-surface-900 dark:text-white">Request Transfer</h3>
                 <p className="text-sm text-surface-500 mt-1">Request items from another branch</p>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                 <div>
                   <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">From Branch</label>
                   <select required value={targetOutletId} onChange={(e) => setTargetOutletId(e.target.value)} className="input">
                     <option value="">Select branch to request from...</option>
                     {outlets.filter(o => o._id !== currentOutlet?._id).map(o => (
                       <option key={o._id} value={o._id}>{o.name}</option>
                     ))}
                   </select>
                 </div>

                 <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">Items</label>
                     <button type="button" onClick={handleAddItem} className="text-xs text-violet-600 font-bold hover:text-violet-700">
                       + Add Item
                     </button>
                   </div>
                   
                   {items.map((item, idx) => (
                     <div key={idx} className="flex gap-3 items-start">
                       <input required type="text" placeholder="Item name" value={item.name} onChange={(e) => handleItemChange(idx, 'name', e.target.value)} className="input flex-1"/>
                       <input required type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} className="input w-24"/>
                       <button type="button" onClick={() => handleRemoveItem(idx)} className="mt-2 text-red-400 hover:text-red-600">
                         <XCircle size={20} />
                       </button>
                     </div>
                   ))}
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Notes</label>
                   <textarea value={note} onChange={e => setNote(e.target.value)} className="input" rows="2" placeholder="Optional notes..."></textarea>
                 </div>

                 <div className="pt-2 flex items-center justify-end gap-3">
                    <button type="button" onClick={() => setIsRequestModalOpen(false)} className="btn-ghost">Cancel</button>
                    <button type="submit" className="btn-primary" disabled={isLoading}>
                      {isLoading ? 'Submitting...' : 'Submit Request'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
