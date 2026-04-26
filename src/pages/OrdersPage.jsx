import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, ChefHat, CheckCircle, Timer, AlertTriangle, ExternalLink, Filter, RotateCcw, Printer, Share2, FileText, X, QrCode, Smartphone } from 'lucide-react'
import useOrderStore from '@/store/orderStore'
import useCartStore from '@/store/cartStore'
import { cn, formatCurrency } from '@/lib/utils'

const statusConfig = {
  new: { label: 'New', color: 'badge-info', bg: 'bg-blue-500', ring: 'ring-blue-400' },
  preparing: { label: 'Preparing', color: 'badge-warning', bg: 'bg-amber-500', ring: 'ring-amber-400' },
  ready: { label: 'Ready', color: 'badge-success', bg: 'bg-green-500', ring: 'ring-green-400' },
  served: { label: 'Served', color: 'badge-primary', bg: 'bg-primary-500', ring: 'ring-primary-400' },
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [view, setView] = useState('kds') // 'kds' or 'list'
  const [statusFilter, setStatusFilter] = useState('all')
  const [showBillModal, setShowBillModal] = useState(false)
  const [selectedBill, setSelectedBill] = useState(null)
  const [selectedOrders, setSelectedOrders] = useState([])
  const [viewingOrder, setViewingOrder] = useState(null)
  
  const { orders, fetchOrders, updateOrderStatus, updateOrder, isLoading } = useOrderStore()

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const getOrderKDSStatus = (order) => {
    if (order.status === 'completed') return 'served';
    if (order.status === 'cancelled') return 'cancelled';
    const statuses = order.items.map(i => i.status);
    if (statuses.every(s => s === 'served')) return 'served';
    if (statuses.some(s => s === 'preparing')) return 'preparing';
    if (statuses.some(s => s === 'ready')) return 'ready';
    return 'new';
  }

  // Get active queue
  const kotQueue = orders.filter(o => o.status === 'active')
  const recentOrders = orders 

  const handleUpdateKOT = async (order, currentStatus) => {
    const flow = { new: 'preparing', preparing: 'ready', ready: 'served' }
    const nextStatus = flow[currentStatus] || currentStatus
    if (nextStatus === currentStatus) return;

    for (const item of order.items) {
       await updateOrderStatus(order._id, item._id, nextStatus)
    }

    // If we just marked as served, we should complete the order
    if (nextStatus === 'served') {
       await updateOrder(order._id, { status: 'completed' })
    }
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(recentOrders.map(o => o._id))
    } else {
      setSelectedOrders([])
    }
  }

  const handleSelectOrder = (id) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(orderId => orderId !== id) : [...prev, id]
    )
  }

  const handleBulkComplete = async () => {
    // We only complete active orders
    const toComplete = recentOrders.filter(o => 
      selectedOrders.includes(o._id) && o.status === 'active'
    )
    
    if (toComplete.length === 0) return;

    try {
      await Promise.all(toComplete.map(o => updateOrder(o._id, { status: 'completed' })))
      setSelectedOrders([])
      fetchOrders()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Orders & Kitchen</h1>
          <p className="text-sm text-surface-500 mt-0.5">Manage orders and kitchen display</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-surface-100 dark:bg-surface-800 rounded-lg p-1">
            <button
              onClick={() => setView('kds')}
              className={cn('px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                view === 'kds' ? 'bg-white dark:bg-surface-700 shadow-sm' : 'text-surface-500')}
            >
              <ChefHat className="w-4 h-4 inline mr-1" /> Kitchen
            </button>
            <button
              onClick={() => setView('list')}
              className={cn('px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                view === 'list' ? 'bg-white dark:bg-surface-700 shadow-sm' : 'text-surface-500')}
            >
              Orders List
            </button>
          </div>
        </div>
      </div>

      {/* Live Counters & Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex-1 grid grid-cols-4 gap-3">
          {Object.entries(statusConfig).map(([key, config]) => {
            const count = orders.filter(o => {
                const oStatus = o.items[0]?.status || o.status || 'new'
                return oStatus === key
            }).length

            return (
              <button
                key={key}
                onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
                className={cn(
                  'card p-4 text-center transition-all',
                  statusFilter === key && `ring-2 ${config.ring}`
                )}
              >
                <div className={`w-3 h-3 rounded-full ${config.bg} mx-auto mb-2 ${key === 'new' ? 'animate-pulse' : ''}`} />
                <p className="text-2xl font-bold font-mono text-surface-900 dark:text-white">{count}</p>
                <p className="text-xs text-surface-500 capitalize">{config.label}</p>
              </button>
            )
          })}
        </div>

        {selectedOrders.length > 0 && (
          <div className="bg-primary-50 dark:bg-primary-900/10 p-2 rounded-xl border border-primary-200 dark:border-primary-800 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
            <span className="text-sm font-bold text-primary-700 dark:text-primary-300 ml-2">
              {selectedOrders.length} selected
            </span>
            <div className="flex gap-1.5">
              <button 
                onClick={handleBulkComplete}
                className="btn-sm bg-primary-500 text-white hover:bg-primary-600"
              >
                Complete Selected
              </button>
              <button 
                onClick={() => setSelectedOrders([])}
                className="btn-sm bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-surface-500">Loading Orders...</div>
      ) : view === 'kds' ? (
        /* Kitchen Display System */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {kotQueue
              .filter(o => {
                  const oStatus = o.items[0]?.status || o.status || 'new'
                  return statusFilter === 'all' || oStatus === statusFilter
              })
              .map((kot, index) => {
                const currentStatus = getOrderKDSStatus(kot)
                const config = statusConfig[currentStatus] || statusConfig.new
                
                return (
                  <motion.div
                    key={kot._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      'card overflow-hidden',
                      // High priority if waiting too long, simple logic simulation:
                      kot.type === 'Takeaway' && 'ring-2 ring-red-400 dark:ring-red-500'
                    )}
                  >
                    {/* KOT Header */}
                    <div className={cn('px-4 py-3 flex items-center justify-between', config.bg, 'text-white')}>
                      <div>
                        <p className="font-bold text-sm">#{kot.orderId || kot._id.slice(-6).toUpperCase()}</p>
                        <p className="text-xs opacity-80 capitalize">{kot.tableId ? `Table ${kot.tableId.name || kot.tableId}` : kot.type}</p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="text-[10px] opacity-80">{new Date(kot.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        {kot.source === 'qr' && (
                          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold mt-1 flex items-center gap-0.5">
                            <QrCode className="w-2.5 h-2.5" /> QR Order
                          </span>
                        )}
                        {kot.type === 'Takeaway' && !kot.source?.startsWith('qr') && (
                          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold mt-1">
                            ⚡ RUSH
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
                      {kot.items.map((item, i) => (
                        <div key={item._id || i} className="flex items-start gap-2">
                          <span className="w-6 h-6 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {item.quantity}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-surface-900 dark:text-white">
                               {item.name || (typeof item.menuItem === 'object' ? item.menuItem.name : 'Unknown Item')}
                            </p>
                            {item.note && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 italic">📝 {item.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="px-4 pb-4">
                      {currentStatus !== 'served' && (
                        <button
                          onClick={() => handleUpdateKOT(kot, currentStatus)}
                          className={cn(
                            'w-full btn font-bold text-sm transition-all',
                            currentStatus === 'new' && 'bg-amber-500 text-white hover:bg-amber-600',
                            currentStatus === 'preparing' && 'bg-green-500 text-white hover:bg-green-600',
                            currentStatus === 'ready' && 'bg-primary-500 text-white hover:bg-primary-600',
                          )}
                        >
                          {currentStatus === 'new' && '🔥 Start Preparing'}
                          {currentStatus === 'preparing' && '✅ Mark Ready'}
                          {currentStatus === 'ready' && '🍽️ Mark Served'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
          </AnimatePresence>
        </div>
      ) : (
        /* Orders List View */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 dark:border-surface-700">
                  <th className="px-4 py-3 text-left w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                      checked={selectedOrders.length === recentOrders.length && recentOrders.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  {['Order ID', 'Table', 'Type', 'Items', 'Amount', 'Status', 'Time', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const oStatus = getOrderKDSStatus(order)
                  return (
                    <tr key={order._id} className={cn(
                      "border-b border-surface-50 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors",
                      selectedOrders.includes(order._id) && "bg-primary-50/50 dark:bg-primary-900/10"
                    )}>
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox"
                          className="rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                          checked={selectedOrders.includes(order._id)}
                          onChange={() => handleSelectOrder(order._id)}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-mono font-semibold text-primary-600 dark:text-primary-400">
                         #{order.orderId || order._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-sm">{order.tableId ? (order.tableId.name || order.tableId) : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('badge text-[10px] capitalize',
                          order.type === 'Dine-in' ? 'badge-info' :
                          order.type === 'Takeaway' ? 'badge-warning' : 'badge-primary'
                        )}>
                          {order.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{order.items.reduce((acc, i) => acc + i.quantity, 0)}</td>
                      <td className="px-4 py-3 text-sm font-mono font-semibold">{formatCurrency(order.total)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('badge text-[10px] capitalize', statusConfig[oStatus]?.color)}>
                          {statusConfig[oStatus]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-500">
                        {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => setViewingOrder(order)}
                            className="p-2 rounded-lg text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                            title="View Details"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => { 
                              useCartStore.getState().loadOrderFromDB(order);
                              navigate('/pos');
                            }}
                            className="p-2 rounded-lg text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                            title="Move to POS Billing"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Modals */}
      <AnimatePresence>
        {viewingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-lg p-6 border border-surface-200 dark:border-surface-800">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                    Order Details <span className="text-sm font-mono text-primary-500">#{viewingOrder.orderId || viewingOrder._id.slice(-6).toUpperCase()}</span>
                  </h3>
                  <p className="text-sm text-surface-500">Placed on {new Date(viewingOrder.createdAt).toLocaleString()}</p>
                </div>
                <button onClick={() => setViewingOrder(null)} className="text-surface-400 hover:text-surface-600 transition-colors"><X size={20}/></button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-700">
                  <div className="flex gap-4">
                     <div>
                        <p className="text-[10px] uppercase tracking-wider text-surface-500 font-bold mb-0.5">Table/Type</p>
                        <p className="text-sm font-semibold dark:text-white">{viewingOrder.tableId?.name || viewingOrder.type}</p>
                     </div>
                     <div>
                        <p className="text-[10px] uppercase tracking-wider text-surface-500 font-bold mb-0.5">Served By</p>
                        <p className="text-sm font-semibold dark:text-white">Staff Member</p>
                     </div>
                  </div>
                  <span className={cn('badge text-[10px]', statusConfig[getOrderKDSStatus(viewingOrder)]?.color)}>
                    {statusConfig[getOrderKDSStatus(viewingOrder)]?.label}
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                  {viewingOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-800 last:border-0">
                      <div className="flex items-center gap-3">
                         <span className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-xs font-bold">{item.quantity}</span>
                         <div>
                            <p className="text-sm font-semibold dark:text-white">{item.name || item.menuItem?.name || 'Unknown Item'}</p>
                            {item.note && <p className="text-xs text-surface-500 italic">"{item.note}"</p>}
                         </div>
                      </div>
                      <p className="text-sm font-mono font-bold dark:text-white">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-surface-100 dark:border-surface-800 space-y-2">
                   <div className="flex justify-between text-sm text-surface-500">
                      <span>Subtotal</span>
                      <span className="font-mono">{formatCurrency(viewingOrder.total - (viewingOrder.tax || 0))}</span>
                   </div>
                   <div className="flex justify-between text-sm text-surface-500">
                      <span>Taxes & Charges</span>
                      <span className="font-mono">{formatCurrency(viewingOrder.tax || 0)}</span>
                   </div>
                   <div className="flex justify-between text-lg font-bold dark:text-white">
                      <span>Total Amount</span>
                      <span className="font-mono text-primary-500">{formatCurrency(viewingOrder.total)}</span>
                   </div>
                </div>

                <div className="flex gap-2 pt-2">
                   <button onClick={() => { useCartStore.getState().loadOrderFromDB(viewingOrder); navigate('/pos'); }} className="flex-1 btn-primary">
                      Open in POS
                   </button>
                   <button className="btn-secondary px-4">
                      <Printer className="w-4 h-4" />
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
