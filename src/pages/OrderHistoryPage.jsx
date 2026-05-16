import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Calendar, Filter, FileText, Download, X, Printer, RotateCcw, ChevronRight, Eye } from 'lucide-react'
import useOrderStore from '@/store/orderStore'
import useUIStore from '@/store/uiStore'
import useTenantSettingsStore from '@/store/tenantSettingsStore'
import { cn, formatCurrency } from '@/lib/utils'
import api from '@/lib/api'

const statusConfig = {
  all: { label: 'All Orders', color: 'badge-secondary' },
  completed: { label: 'Completed', color: 'badge-success' },
  cancelled: { label: 'Cancelled', color: 'badge-danger' },
}

export default function OrderHistoryPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState('today') // today, week, month, all
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showReceipt, setShowReceipt] = useState(false)

  const { orders, fetchOrders, updateOrder, isLoading } = useOrderStore()
  const { addNotification, confirmAction } = useUIStore()
  const { restaurantSettings } = useTenantSettingsStore()

  useEffect(() => {
    fetchOrders('all')
  }, [fetchOrders])

  // Fetch default printer config
  const [defaultPrinter, setDefaultPrinter] = useState(null)
  useEffect(() => {
    api.get('/printers').then(({ data }) => {
      const def = data.find(p => p.isDefault) || data[0]
      if (def) setDefaultPrinter(def)
    }).catch(() => {})
  }, [])

  // Process and filter historical orders (Completed & Cancelled mostly, though we can show all)
  const filteredOrders = orders.filter(order => {
    const isHistorical = order.status === 'completed' || order.status === 'cancelled'
    const matchesSearch = order._id.toLowerCase().includes(search.toLowerCase()) || 
                          (order.orderId && order.orderId.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilter === 'all' ? isHistorical : order.status === statusFilter
    
    // Basic date filtering mock
    let matchesDate = true
    const orderDate = new Date(order.createdAt)
    const today = new Date()
    
    if (dateRange === 'today') {
      matchesDate = orderDate.toDateString() === today.toDateString()
    } else if (dateRange === 'week') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      matchesDate = orderDate >= weekAgo
    } else if (dateRange === 'month') {
      const monthAgo = new Date(today.setMonth(today.getMonth() - 1))
      matchesDate = orderDate >= monthAgo
    }

    return matchesSearch && matchesStatus && matchesDate && isHistorical
  })

  // Quick Stats
  const totalOrders = filteredOrders.length
  const totalRevenue = filteredOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0)
  const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled').length

  const handlePrint = () => {
    // Set dynamic receipt width from default printer's paper size
    const paperWidthMap = {
      '58mm': '58mm', '80mm': '80mm', 'A4': '210mm', 'A5': '148mm',
      'A6': '105mm', 'Label (40×30)': '40mm', 'Label (60×40)': '60mm', 'Custom': '80mm'
    }
    const width = paperWidthMap[defaultPrinter?.paperSize] || '80mm'
    document.documentElement.style.setProperty('--receipt-width', width)
    window.print()
    addNotification({ type: 'success', title: 'Printing...', message: `Receipt dispatched to printer${defaultPrinter ? ` (${defaultPrinter.paperSize})` : ''}.` })
  }

  const handleRefund = async (order) => {
    const isConfirmed = await confirmAction({ 
      title: 'Issue Refund', 
      message: `Are you sure you want to refund order #${order.orderId || order._id.slice(-6).toUpperCase()} and cancel it?`,
      confirmText: 'Refund Order'
    })

    if (isConfirmed) {
      try {
        await updateOrder(order._id, { status: 'cancelled' })
        addNotification({ type: 'success', title: 'Refund Processed', message: 'The order has been cancelled and refunded.' })
        setShowReceipt(false)
        fetchOrders('all')
      } catch (err) {
        addNotification({ type: 'error', title: 'Refund Failed', message: 'Unable to process refund.' })
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Order History</h1>
          <p className="text-sm text-surface-500 mt-0.5">Review, re-print, and manage past transactions</p>
        </div>
        <button 
          onClick={() => addNotification({ type: 'info', title: 'Export Generated', message: 'CSV download starting...' })}
          className="btn-secondary btn-sm bg-surface-100 dark:bg-surface-800"
        >
          <Download className="w-4 h-4 mr-2" /> Export Log
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-surface-500">Historical Orders</p>
            <p className="text-xl font-bold text-surface-900 dark:text-white">{totalOrders}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
            <span className="font-serif font-bold text-xl">₹</span>
          </div>
          <div>
            <p className="text-xs text-surface-500">Net Revenue</p>
            <p className="text-xl font-bold text-surface-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-surface-500">Refunded / Cancelled</p>
            <p className="text-xl font-bold text-surface-900 dark:text-white">{cancelledOrders}</p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search Order ID..." 
            className="input pl-10" 
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center bg-surface-100 dark:bg-surface-800 rounded-lg p-1 mr-2">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: '7 Days' },
              { id: 'month', label: '30 Days' },
              { id: 'all', label: 'All Time' },
            ].map(range => (
              <button
                key={range.id}
                onClick={() => setDateRange(range.id)}
                className={cn('px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                  dateRange === range.id ? 'bg-white dark:bg-surface-700 shadow-sm text-surface-900 dark:text-white' : 'text-surface-500')}
              >
                {range.label}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-surface-100 dark:bg-surface-800 rounded-lg p-1">
            {Object.entries(statusConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={cn('px-3 py-1.5 rounded-md text-xs font-semibold transition-all capitalize',
                  statusFilter === key ? 'bg-white dark:bg-surface-700 shadow-sm text-surface-900 dark:text-white' : 'text-surface-500')}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Data Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100 dark:border-surface-700">
                {['Order ID', 'Date & Time', 'Type', 'Table/Customer', 'Amount', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && filteredOrders.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-12 text-surface-500">Fetching history...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-12 text-surface-500">No historical orders found.</td></tr>
              ) : filteredOrders.map((order, i) => (
                <motion.tr 
                  key={order._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-surface-50 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 cursor-pointer"
                  onClick={() => {
                    setSelectedOrder(order)
                    setShowReceipt(true)
                  }}
                >
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-primary-600 dark:text-primary-400">
                    #{order.orderId || order._id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium dark:text-white tracking-tight">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-surface-500">
                      {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 font-bold capitalize">
                      {order.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm dark:text-white font-medium">
                      {order.tableId ? `Table ${order.tableId.name || order.tableId}` : order.type}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono font-semibold dark:text-white">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('badge text-[10px] capitalize', statusConfig[order.status]?.color || 'badge-secondary')}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="flex items-center text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors">
                      View Detalis <ChevronRight className="w-3 h-3 ml-1" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal Slide Out */}
      <AnimatePresence>
        {showReceipt && selectedOrder && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowReceipt(false)}
              className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm"
            />
            
            {/* Slide over */}
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-white dark:bg-surface-900 shadow-2xl border-l border-surface-200 dark:border-surface-800 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-surface-100 dark:border-surface-800">
                <h2 className="text-lg font-bold dark:text-white">Order Details</h2>
                <button onClick={() => setShowReceipt(false)} className="p-2 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 printable-receipt">
                <div className="text-center mb-6 border-b border-dashed border-surface-300 dark:border-surface-700 pb-6">
                  {restaurantSettings?.settings?.billSettings?.showLogo && (restaurantSettings?.settings?.billSettings?.logoUrl || restaurantSettings?.branding?.logo) && (
                    <img 
                      src={restaurantSettings?.settings?.billSettings?.logoUrl || restaurantSettings?.branding?.logo} 
                      alt="Logo" 
                      className="w-12 h-12 object-contain mx-auto mb-2 grayscale" 
                    />
                  )}
                  <h3 className="text-xl font-bold dark:text-white">
                    {restaurantSettings?.settings?.billSettings?.brandName || restaurantSettings?.name || 'RECEIPT'}
                  </h3>
                  <p className="text-xs text-surface-500 mt-1 opacity-80">
                    {restaurantSettings?.settings?.billSettings?.headerText}
                  </p>
                  <p className="text-sm text-surface-500 mt-2 font-mono">
                    Order #{selectedOrder.orderId || selectedOrder._id.slice(-6).toUpperCase()}
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                  <div className="mt-4 inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300">
                    {selectedOrder.type} {selectedOrder.tableId ? `- Table ${selectedOrder.tableId.name || selectedOrder.tableId}` : ''}
                  </div>
                </div>

                <div className="space-y-4 mb-6 border-b border-dashed border-surface-300 dark:border-surface-700 pb-6">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-sm">
                      <div className="flex gap-2">
                        <span className="font-mono text-surface-500">{item.quantity}x</span>
                        <div>
                          <p className="font-semibold dark:text-surface-200">{item.name || (typeof item.menuItem === 'object' ? item.menuItem.name : 'Unknown Item')}</p>
                          {item.note && <p className="text-xs text-surface-500 mt-0.5">Note: {item.note}</p>}
                        </div>
                      </div>
                      <span className="font-mono font-medium dark:text-surface-200">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-surface-500">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.tax > 0 && (
                    <div className="flex justify-between text-surface-500">
                      <span>GST (Tax)</span>
                      <span className="font-mono">{formatCurrency(selectedOrder.tax)}</span>
                    </div>
                  )}
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Discount</span>
                      <span className="font-mono">-{formatCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-4 mt-2 border-t border-surface-100 dark:border-surface-800">
                    <span className="text-lg font-bold dark:text-white">Total Amount</span>
                    <span className="text-xl font-bold font-mono dark:text-white">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-4 border-t border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50 flex flex-col gap-2">
                <button onClick={handlePrint} className="w-full btn-primary py-3">
                  <Printer className="w-4 h-4 mr-2" /> Print Full Receipt
                </button>
                {selectedOrder.status !== 'cancelled' && (
                  <button 
                    onClick={() => handleRefund(selectedOrder)} 
                    className="w-full btn-secondary py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" /> Issue Refund & Cancel
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}
