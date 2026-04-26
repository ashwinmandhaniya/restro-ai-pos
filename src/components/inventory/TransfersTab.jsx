import React, { useEffect, useState } from 'react';
import { RefreshCw, Plus, ArrowRight, ArrowLeft, CheckCircle, XCircle, Clock, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useOutletStore from '@/store/outletStore';
import useUIStore from '@/store/uiStore';
import { cn } from '@/lib/utils';
// We'll borrow the mock items from same place as InventoryPage for the dropdown
import { inventoryItems } from '@/data/analyticsData';

export default function TransfersTab() {
  const { currentOutlet, outlets, transfers, fetchTransfers, requestTransfer, approveTransfer, receiveTransfer, cancelTransfer, isLoading } = useOutletStore();
  const { addNotification, confirmAction } = useUIStore();
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, inbound, outbound
  
  // Request Modal State
  const [targetOutletId, setTargetOutletId] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [transferItems, setTransferItems] = useState([]); // [{itemId, name, qty}]

  useEffect(() => {
    if (currentOutlet) {
      fetchTransfers();
    }
  }, [currentOutlet, fetchTransfers]);

  const handleAddItemToTransfer = () => {
    if (!selectedItem || !quantity || quantity <= 0) return;
    const itemObj = inventoryItems.find(i => i.id === selectedItem);
    if (!itemObj) return;
    
    setTransferItems([...transferItems, {
      itemId: itemObj.id,
      name: itemObj.name,
      quantity: Number(quantity),
      unit: itemObj.unit
    }]);
    
    setSelectedItem('');
    setQuantity('');
  };

  const removeItemFromTransfer = (idx) => {
    setTransferItems(transferItems.filter((_, i) => i !== idx));
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!targetOutletId) return addNotification({ type: 'error', message: 'Please select a source outlet.' });
    if (transferItems.length === 0) return addNotification({ type: 'error', message: 'Please add at least one item.' });

    const success = await requestTransfer({
      fromOutletId: targetOutletId,
      items: transferItems,
      notes
    });

    if (success) {
      addNotification({ type: 'success', title: 'Request Sent', message: 'Transfer request submitted successfully.' });
      setShowRequestModal(false);
      setTransferItems([]);
      setTargetOutletId('');
      setNotes('');
    }
  };

  const handleAction = async (action, transferId) => {
    const isConfirmed = await confirmAction({
      title: `Confirm ${action}`,
      message: `Are you sure you want to ${action} this transfer?`,
      confirmText: `Yes, ${action}`
    });

    if (!isConfirmed) return;

    let success = false;
    if (action === 'approve') success = await approveTransfer(transferId);
    if (action === 'receive') success = await receiveTransfer(transferId);
    if (action === 'cancel') success = await cancelTransfer(transferId);

    if (success) {
      addNotification({ type: 'success', message: `Transfer ${action}d successfully.` });
    }
  };

  const displayedTransfers = transfers.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'inbound') return t.toOutletId?._id === currentOutlet?._id;
    if (filter === 'outbound') return t.fromOutletId?._id === currentOutlet?._id;
    return true;
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'requested': return <span className="badge badge-warning text-yellow-700 bg-yellow-100 flex items-center gap-1"><Clock size={12}/> Requested</span>;
      case 'approved': return <span className="badge bg-blue-100 text-blue-700 flex items-center gap-1"><RefreshCw size={12}/> Dispatched</span>;
      case 'in_transit': return <span className="badge bg-purple-100 text-purple-700 flex items-center gap-1"><RefreshCw size={12}/> In Transit</span>;
      case 'received': return <span className="badge badge-success flex items-center gap-1"><CheckCircle size={12}/> Received</span>;
      case 'cancelled': return <span className="badge badge-error flex items-center gap-1"><XCircle size={12}/> Cancelled</span>;
      default: return <span className="badge bg-slate-100">{status}</span>;
    }
  };

  if (!currentOutlet) {
    return <div className="p-8 text-center text-slate-500">Please select an outlet from the top bar to view transfers.</div>;
  }

  // Use the layout wrapper provided by the parent so we just return the inner content
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div className="flex gap-2">
          {['all', 'inbound', 'outbound'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={cn(
              'px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all',
              filter === f ? 'bg-violet-600 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'
            )}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={() => setShowRequestModal(true)} className="btn-primary btn-sm flex items-center gap-2">
          <Plus size={16} /> Request Transfer
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500">Loading transfers...</div>
      ) : displayedTransfers.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
          <RefreshCw size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No transfers found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayedTransfers.map(t => {
            const isInbound = t.toOutletId?._id === currentOutlet?._id;
            const directionText = isInbound ? 'Inbound from' : 'Outbound to';
            const otherOutlet = isInbound ? t.fromOutletId?.name : t.toOutletId?.name;

            return (
              <div key={t._id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                 <div className="flex items-start justify-between mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
                   <div className="flex items-center gap-3">
                     <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", isInbound ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600")}>
                        {isInbound ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                     </div>
                     <div>
                       <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                         {directionText} <span className="font-semibold text-violet-600">{otherOutlet || 'Deleted Outlet'}</span>
                       </h4>
                       <p className="text-xs text-slate-500 font-mono mt-0.5">{new Date(t.createdAt).toLocaleString()}</p>
                     </div>
                   </div>
                   <div>
                     {getStatusBadge(t.status)}
                   </div>
                 </div>

                 <div className="mb-4">
                   <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Items</h5>
                   <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 space-y-2">
                      {t.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                          <span className="font-mono text-slate-500">{item.quantity} {item.unit || 'units'}</span>
                        </div>
                      ))}
                   </div>
                   {t.notes && (
                     <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                       <span className="font-medium">Notes:</span> {t.notes}
                     </p>
                   )}
                 </div>

                 <div className="flex gap-2 justify-end">
                    {/* Action buttons based on status and direction */}
                    {t.status === 'requested' && isInbound && (
                      <button onClick={() => handleAction('cancel', t._id)} className="btn-secondary btn-sm text-red-600 border-red-200 hover:bg-red-50">Cancel Request</button>
                    )}
                    {t.status === 'requested' && !isInbound && (
                      <>
                        <button onClick={() => handleAction('cancel', t._id)} className="btn-secondary btn-sm text-red-600 border-red-200 hover:bg-red-50">Reject</button>
                        <button onClick={() => handleAction('approve', t._id)} className="btn-primary btn-sm bg-blue-600 hover:bg-blue-700">Approve & Dispatch</button>
                      </>
                    )}
                    {(t.status === 'approved' || t.status === 'in_transit') && isInbound && (
                      <button onClick={() => handleAction('receive', t._id)} className="btn-primary btn-sm bg-green-600 hover:bg-green-700">Mark as Received</button>
                    )}
                 </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Request Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-lg p-6 border border-surface-200 dark:border-surface-800">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold dark:text-white">Request Inventory Transfer</h3>
                 <button onClick={() => setShowRequestModal(false)} className="text-surface-400 hover:text-surface-600"><X size={20}/></button>
               </div>
               
               <form onSubmit={handleRequestSubmit} className="space-y-4">
                 <div>
                   <label className="text-sm font-medium mb-1 block dark:text-surface-300">Request From Outlet</label>
                   <select required className="input" value={targetOutletId} onChange={e => setTargetOutletId(e.target.value)}>
                     <option value="">Select source outlet...</option>
                     {outlets.filter(o => o._id !== currentOutlet._id && o.status === 'active').map(o => (
                       <option key={o._id} value={o._id}>{o.name} {o.isHQ ? '(HQ)' : ''}</option>
                     ))}
                   </select>
                 </div>

                 <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50">
                    <h4 className="text-sm font-bold mb-3 dark:text-surface-300">Add Items</h4>
                    <div className="flex gap-2 mb-3">
                      <select className="input text-sm flex-1" value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
                         <option value="">Select Item...</option>
                         {inventoryItems.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                      </select>
                      <input type="number" min="0.1" step="any" placeholder="Qty" className="input text-sm w-24" value={quantity} onChange={e => setQuantity(e.target.value)} />
                      <button type="button" onClick={handleAddItemToTransfer} className="btn-secondary btn-sm px-3 border-slate-300 bg-white dark:bg-slate-700">Add</button>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto">
                       {transferItems.map((ti, idx) => (
                         <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm text-sm">
                           <span className="font-medium dark:text-surface-200">{ti.name}</span>
                           <div className="flex items-center gap-3">
                             <span className="font-mono text-slate-500">{ti.quantity} {ti.unit}</span>
                             <button type="button" onClick={() => removeItemFromTransfer(idx)} className="text-red-500 hover:text-red-700"><X size={14}/></button>
                           </div>
                         </div>
                       ))}
                       {transferItems.length === 0 && <p className="text-xs text-center text-slate-400 py-2">No items added yet.</p>}
                    </div>
                 </div>

                 <div>
                   <label className="text-sm font-medium mb-1 block dark:text-surface-300">Notes (Optional)</label>
                   <textarea className="input" rows="2" placeholder="Urgent request for weekend rush..." value={notes} onChange={e => setNotes(e.target.value)}></textarea>
                 </div>

                 <button type="submit" className="w-full btn-primary mt-2">Submit Transfer Request</button>
               </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
