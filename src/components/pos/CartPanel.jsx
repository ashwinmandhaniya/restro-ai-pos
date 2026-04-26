import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Trash2, Percent, User, Hash, Pause, Play, ShoppingBag, Truck, UtensilsCrossed, StickyNote, FileText } from 'lucide-react'
import useCartStore from '@/store/cartStore'
import useUIStore from '@/store/uiStore'
import useOrderStore from '@/store/orderStore'
import useTableStore from '@/store/tableStore'
import { formatCurrency, cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

export default function CartPanel() {
  const {
    items, table, customer, orderType, discount, heldOrders,
    addItem, removeItem, updateQuantity, updateNote, setOrderType, setDiscount,
    getSubtotal, getDiscountAmount, getTax, getTotal, getItemCount,
    holdOrder, recallOrder, clearCart, setTable
  } = useCartStore()
  const { tables, fetchTables } = useTableStore()
  const { setShowPaymentModal, setShowKOTPreview, addNotification } = useUIStore()
  const [showDiscount, setShowDiscount] = useState(false)
  const [showHeldOrders, setShowHeldOrders] = useState(false)
  const [showDueOrders, setShowDueOrders] = useState(false)
  const [discountInput, setDiscountInput] = useState('')
  const [discountType, setDiscountType] = useState('percentage')
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showTableModal, setShowTableModal] = useState(false)
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '' })

  const { orders, fetchOrders } = useOrderStore()

  useEffect(() => {
    fetchTables()
    fetchOrders('all') // Fetch all to get pending ones
  }, [fetchTables, fetchOrders])

  const dueOrders = orders.filter(o => o.paymentStatus === 'pending')

  const subtotal = getSubtotal()
  const discountAmount = getDiscountAmount()
  const tax = getTax()
  const total = getTotal()
  const itemCount = getItemCount()

  const handleApplyDiscount = () => {
    const value = parseFloat(discountInput)
    if (isNaN(value) || value <= 0) return
    setDiscount({ type: discountType, value })
    setShowDiscount(false)
    addNotification({ type: 'success', title: 'Discount Applied', message: discountType === 'percentage' ? `${value}% off` : `₹${value} off` })
  }

  const handleHoldOrder = () => {
    holdOrder()
    addNotification({ type: 'info', title: 'Order Held', message: 'You can recall it anytime' })
  }

  const orderTypes = [
    { value: 'dine-in', label: 'Dine In', icon: UtensilsCrossed },
    { value: 'takeaway', label: 'Takeaway', icon: ShoppingBag },
    { value: 'delivery', label: 'Delivery', icon: Truck },
  ]

  const handleSaveCustomer = (e) => {
    e.preventDefault()
    if (customerForm.name) {
      useCartStore.getState().setCustomer(customerForm)
      setShowCustomerModal(false)
    }
  }

  return (
    <div className="w-[380px] flex flex-col bg-white dark:bg-surface-900 border-l border-surface-100 dark:border-surface-800">
      {/* Order Type Tabs */}
      <div className="flex p-3 gap-1 bg-surface-50 dark:bg-surface-800/50 border-b border-surface-100 dark:border-surface-800">
        {orderTypes.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setOrderType(value)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150',
              orderType === value
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                : 'text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-700'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Table / Customer Info */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-100 dark:border-surface-800">
        <button 
          onClick={() => setShowTableModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-xs font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-all"
        >
          <Hash className="w-3 h-3" />
          {table ? `Table ${table.name || table}` : 'Select Table'}
        </button>
        <button 
          onClick={() => setShowCustomerModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-xs font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-all">
          <User className="w-3 h-3" />
          {customer ? customer.name : 'Add Customer'}
        </button>
        {dueOrders.length > 0 && (
          <button
            onClick={() => { setShowDueOrders(!showDueOrders); setShowHeldOrders(false) }}
            className="ml-auto flex items-center gap-1 px-2 py-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-semibold animate-pulse"
          >
            <FileText className="w-3 h-3" />
            {dueOrders.length} Due
          </button>
        )}
        {heldOrders.length > 0 && (
          <button
            onClick={() => { setShowHeldOrders(!showHeldOrders); setShowDueOrders(false) }}
            className={cn(
              "flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold",
              dueOrders.length === 0 && "ml-auto"
            )}
          >
            <Pause className="w-3 h-3" />
            {heldOrders.length}
          </button>
        )}
      </div>

      {/* Due Orders Dropdown */}
      <AnimatePresence>
        {showDueOrders && dueOrders.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-surface-100 dark:border-surface-800"
          >
            <div className="p-3 space-y-2 bg-primary-50 dark:bg-primary-900/10">
              <p className="text-xs font-semibold text-primary-700 dark:text-primary-400">Orders Ready for Billing</p>
              {dueOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-surface-800 shadow-sm border border-primary-100 dark:border-primary-900/30">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-bold text-surface-900 dark:text-white truncate">#{order.orderId || order._id.slice(-6).toUpperCase()}</p>
                    <p className="text-[10px] text-surface-500 uppercase tracking-tighter">
                      {order.type} • {order.tableId?.name ? `Table ${order.tableId.name}` : order.tableId || 'No Table'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-primary-600">{formatCurrency(order.total)}</span>
                    <button
                      onClick={() => { 
                        useCartStore.getState().loadOrderFromDB(order); 
                        setShowDueOrders(false);
                        addNotification({ type: 'info', title: 'Order Loaded', message: 'Ready for final billing' });
                      }}
                      className="p-1.5 rounded-md bg-primary-500 text-white hover:bg-primary-600 transition-all"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Held Orders Dropdown */}
      <AnimatePresence>
        {showHeldOrders && heldOrders.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-surface-100 dark:border-surface-800"
          >
            <div className="p-3 space-y-2 bg-amber-50 dark:bg-amber-900/10">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Held Orders</p>
              {heldOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-surface-800">
                  <div>
                    <p className="text-xs font-semibold text-surface-900 dark:text-white">{order.id}</p>
                    <p className="text-[10px] text-surface-500">{order.items.length} items • {order.table ? `Table ${order.table}` : order.orderType}</p>
                  </div>
                  <button
                    onClick={() => { recallOrder(order.id); setShowHeldOrders(false) }}
                    className="btn-primary btn-sm text-xs"
                  >
                    <Play className="w-3 h-3" /> Recall
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Local Customer Modal */}
      <AnimatePresence>
        {showCustomerModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-sm p-5 border border-surface-200 dark:border-surface-800">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Customer Details</h3>
              <form onSubmit={handleSaveCustomer} className="space-y-4">
                <div>
                  <label className="text-xs font-medium mb-1 block dark:text-surface-300">Name</label>
                  <input required placeholder="e.g. John Doe" className="input text-sm py-2" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block dark:text-surface-300">Phone</label>
                  <input placeholder="e.g. 9876543210" className="input text-sm py-2" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} />
                </div>
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={() => {
                    useCartStore.getState().setCustomer(null)
                    setCustomerForm({name: '', phone: ''})
                    setShowCustomerModal(false)
                  }} className="btn-secondary flex-1 text-red-500 hover:border-red-200 hover:bg-red-50">Clear</button>
                  <button type="submit" className="btn-primary flex-1">Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Local Table Modal */}
      <AnimatePresence>
        {showTableModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-lg p-5 border border-surface-200 dark:border-surface-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold dark:text-white">Select Table</h3>
                <button onClick={() => setShowTableModal(false)} className="text-surface-400 hover:text-surface-600">×</button>
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar grid grid-cols-3 gap-3">
                 <div
                    onClick={() => { setTable(null); setShowTableModal(false) }}
                    className={cn(
                      "p-3 rounded-xl border-2 cursor-pointer text-center transition-all bg-surface-50 dark:bg-surface-800",
                      !table ? "border-primary-500" : "border-transparent"
                    )}
                  >
                    <p className="text-sm font-bold mt-1 text-surface-600 dark:text-surface-300">None</p>
                    <p className="text-[10px] opacity-60">Clear Selection</p>
                 </div>
                 {tables.map(t => (
                  <div
                    key={t._id}
                    onClick={() => { setTable(t); setShowTableModal(false) }}
                    className={cn(
                      "p-3 rounded-xl border-2 cursor-pointer text-center transition-all",
                      t.status === 'available' ? 'bg-green-50 dark:bg-green-900/10 hover:border-green-300' : 'bg-surface-100 dark:bg-surface-800 opacity-70',
                      table?._id === t._id ? "border-primary-500 ring-2 ring-primary-500/30" : "border-transparent"
                    )}
                  >
                    <p className="text-sm font-bold mt-1 text-surface-900 dark:text-white">{t.name}</p>
                    <p className="text-[10px] opacity-60 capitalize">{t.status}</p>
                  </div>
                 ))}
                 {tables.length === 0 && <p className="col-span-3 text-center text-surface-500 text-sm py-4">No tables found. Add them in Table Management.</p>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-surface-400">
            <ShoppingBag className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No items in cart</p>
            <p className="text-xs mt-1">Tap menu items to add</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            <AnimatePresence>
              {items.map((item, index) => {
                const uniqueId = item._id || item.id;
                return (
                <motion.div
                  key={uniqueId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{item.image}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-semibold text-surface-900 dark:text-white leading-tight pr-2">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeItem(uniqueId)}
                          className="p-1 rounded-md text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 bg-white dark:bg-surface-700 rounded-lg border border-surface-200 dark:border-surface-600">
                          <button
                            onClick={() => updateQuantity(uniqueId, item.quantity - 1)}
                            className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-600 rounded-l-lg transition-all"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold font-mono">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(uniqueId, item.quantity + 1)}
                            className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-600 rounded-r-lg transition-all"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-sm font-bold font-mono text-surface-900 dark:text-white">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )})}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bill Summary */}
      {items.length > 0 && (
        <div className="border-t border-surface-100 dark:border-surface-800">
          {/* Discount Section */}
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-surface-500">Subtotal ({itemCount} items)</span>
              <span className="font-mono font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            
            {discount.type !== 'none' && (
              <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">
                <span className="flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  Discount ({discount.type === 'percentage' ? `${discount.value}%` : 'Flat'})
                </span>
                <span className="font-mono font-semibold">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs text-surface-400">
              <span>CGST (2.5%)</span>
              <span className="font-mono">{formatCurrency(tax.cgst)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-surface-400">
              <span>SGST (2.5%)</span>
              <span className="font-mono">{formatCurrency(tax.sgst)}</span>
            </div>
            
            <div className="flex items-center justify-between text-base pt-2 border-t border-dashed border-surface-200 dark:border-surface-700">
              <span className="font-bold text-surface-900 dark:text-white">Total</span>
              <span className="font-bold font-mono text-xl text-primary-600 dark:text-primary-400">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-3 pt-0 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => setShowDiscount(!showDiscount)}
                className="btn-secondary btn-sm flex-1 text-xs"
              >
                <Percent className="w-3 h-3" />
                Discount
              </button>
              <button onClick={handleHoldOrder} className="btn-secondary btn-sm flex-1 text-xs">
                <Pause className="w-3 h-3" />
                Hold
              </button>
              <button onClick={clearCart} className="btn-ghost btn-sm text-red-500 text-xs">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* Discount Input */}
            <AnimatePresence>
              {showDiscount && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-2 p-2 rounded-lg bg-surface-50 dark:bg-surface-800">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="input py-1.5 text-xs w-24"
                    >
                      <option value="percentage">%</option>
                      <option value="flat">₹ Flat</option>
                    </select>
                    <input
                      type="number"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value)}
                      placeholder="Value"
                      className="input py-1.5 text-xs flex-1"
                    />
                    <button onClick={handleApplyDiscount} className="btn-primary btn-sm text-xs">Apply</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* KOT & Pay */}
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    const oType = useCartStore.getState().orderType || 'dine-in';
                    const mappedType = oType === 'takeaway' ? 'Takeaway' : (oType === 'delivery' ? 'Delivery' : 'Dine-in');
                    
                    const orderPayload = {
                      tableId: table ? table._id : undefined,
                      type: mappedType,
                      items: items.map(i => ({ 
                         menuItem: i._id || i.id, 
                         name: i.name,
                         quantity: i.quantity, 
                         price: i.price, 
                         note: i.note,
                         status: 'new'
                      })),
                      subtotal,
                      discount: discountAmount,
                      gst: tax.total,
                      total: total,
                      paymentStatus: 'pending',
                      paymentMethod: 'none', 
                      status: 'active' 
                    }
                    await useOrderStore.getState().createOrder(orderPayload);
                    clearCart();
                    addNotification({ type: 'success', title: 'KOT Sent!', message: 'Kitchen order ticket generated' })
                  } catch(e) {
                     addNotification({ type: 'error', title: 'Error', message: 'Failed to send KOT' })
                  }
                }}
                className="btn bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500 flex-1 font-bold"
              >
                🎫 KOT
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="btn-primary flex-[2] font-bold btn-lg text-base"
              >
                💰 Pay {formatCurrency(total)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
