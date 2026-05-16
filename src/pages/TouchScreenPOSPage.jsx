import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, ShoppingCart, Plus, Minus, Trash2, X, ChevronUp, ChevronDown,
  UtensilsCrossed, ShoppingBag, Truck, CreditCard, Banknote, Smartphone,
  ArrowLeft, Maximize2, Minimize2, RotateCcw, ChefHat, Sparkles,
  Hash, User, FileText, Play, Mic, Percent, Pause
} from 'lucide-react'
import useMenuStore from '@/store/menuStore'
import useCartStore from '@/store/cartStore'
import useUIStore from '@/store/uiStore'
import useOrderStore from '@/store/orderStore'
import useTableStore from '@/store/tableStore'
import useTenantSettingsStore from '@/store/tenantSettingsStore'
import { formatCurrency, cn } from '@/lib/utils'
import useCounterId from '@/hooks/useCounterId'
import PaymentModal from '@/components/pos/PaymentModal'

/* ─────────────────────────────────────────────
   Category emoji fallback map
───────────────────────────────────────────── */
const CATEGORY_COLORS = [
  'from-rose-500 to-pink-600',
  'from-orange-500 to-amber-600',
  'from-emerald-500 to-green-600',
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-teal-600',
  'from-fuchsia-500 to-pink-600',
  'from-yellow-500 to-orange-500',
]

/* ─────────────────────────────────────────────
   TouchScreenPOSPage
───────────────────────────────────────────── */
export default function TouchScreenPOSPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [orderType, setOrderType] = useState('dine-in')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [addedItemId, setAddedItemId] = useState(null)
  const [showTableModal, setShowTableModal] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showDueOrders, setShowDueOrders] = useState(false)
  const [showDiscount, setShowDiscount] = useState(false)
  const [discountInput, setDiscountInput] = useState('')
  const [discountType, setDiscountType] = useState('percentage')
  const [showHeldOrders, setShowHeldOrders] = useState(false)
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '' })
  const searchRef = useRef(null)

  const { categories, menuItems, isLoading, fetchMenuData } = useMenuStore()
  const {
    items: cartItems, table, customer, discount, heldOrders,
    addItem, removeItem, updateQuantity,
    getSubtotal, getTotal, getTax, getItemCount, getDiscountAmount, clearCart,
    setOrderType: setCartOrderType, setTable, setCustomer, setDiscount,
    loadOrderFromDB, holdOrder, recallOrder
  } = useCartStore()
  const { addNotification, showPaymentModal, setShowPaymentModal, setShowVoiceBilling } = useUIStore()
  const { tables, fetchTables } = useTableStore()
  const { orders, fetchOrders } = useOrderStore()
  const counterId = useCounterId()

  useEffect(() => {
    fetchMenuData()
    fetchTables()
    fetchOrders('all')
  }, [fetchMenuData, fetchTables, fetchOrders])

  // Load GST rate from restaurant settings
  useEffect(() => {
    const loadGstRate = async () => {
      try {
        const settings = useTenantSettingsStore.getState().restaurantSettings
          || await useTenantSettingsStore.getState().fetchSettings()
        if (settings?.settings?.gstRate != null) {
          useCartStore.getState().setGstRate(settings.settings.gstRate)
        }
      } catch (e) { /* use default */ }
    }
    loadGstRate()
  }, [])

  // Sync order type
  useEffect(() => { setCartOrderType(orderType) }, [orderType, setCartOrderType])

  const dueOrders = orders.filter(o => o.paymentStatus === 'pending')

  const handleSaveCustomer = (e) => {
    e.preventDefault()
    if (customerForm.name) {
      setCustomer(customerForm)
      setShowCustomerModal(false)
      addNotification({ type: 'success', title: 'Customer Added', message: customerForm.name })
    }
  }

  // Auto-open cart when items are added
  const itemCount = getItemCount()
  useEffect(() => {
    if (itemCount > 0 && !cartOpen) setCartOpen(true)
  }, [itemCount])

  const filteredItems = menuItems.filter(item => {
    const itemCatId = typeof item.category === 'object' ? item.category?._id : item.category
    const matchesCategory = activeCategory === 'all' || itemCatId === activeCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch && item.available
  })

  const handleAddItem = (item) => {
    addItem(item)
    setAddedItemId(item._id)
    setTimeout(() => setAddedItemId(null), 600)
    // Haptic feedback if available
    if (navigator.vibrate) navigator.vibrate(30)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  const handleKOT = async () => {
    try {
      const oType = orderType === 'takeaway' ? 'Takeaway' : (orderType === 'delivery' ? 'Delivery' : 'Dine-in')
      const tableId = table ? table._id : undefined
      const subtotal = getSubtotal()
      const tax = getTax()
      const total = getTotal()
      await useOrderStore.getState().createOrder({
        tableId,
        type: oType,
        counterId: counterId || undefined,
        items: cartItems.map(i => ({
          menuItem: i._id || i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          note: i.note,
          status: 'new'
        })),
        subtotal,
        discount: 0,
        gst: tax.total,
        total,
        paymentStatus: 'pending',
        paymentMethod: 'none',
        status: 'active'
      })
      clearCart()
      setCartOpen(false)
      addNotification({ type: 'success', title: '🎫 KOT Sent!', message: 'Order sent to kitchen' })
    } catch {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to send KOT' })
    }
  }

  const subtotal = getSubtotal()
  const discountAmount = getDiscountAmount()
  const tax = getTax()
  const total = getTotal()

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface-50 dark:bg-surface-950 overflow-hidden select-none"
      style={{ touchAction: 'manipulation' }}>

      {/* ═══ TOP BAR ═══ */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800 shadow-sm"
        style={{ minHeight: 64 }}>
        {/* Back */}
        <button
          onClick={() => window.history.back()}
          className="p-3 rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-extrabold leading-tight">
              <span className="text-gradient">Touch</span>
              <span className="dark:text-white">POS</span>
            </h1>
            <p className="text-[10px] text-surface-400 font-medium -mt-0.5 tracking-wide">TOUCH SCREEN MODE</p>
          </div>
        </div>

        {/* Order Type Selector */}
        <div className="flex items-center gap-1 ml-4 bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
          {[
            { value: 'dine-in', label: 'Dine In', icon: UtensilsCrossed },
            { value: 'takeaway', label: 'Takeaway', icon: ShoppingBag },
            { value: 'delivery', label: 'Delivery', icon: Truck },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setOrderType(value)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95',
                orderType === value
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden md:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md ml-auto relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-100 dark:bg-surface-800 border-0 text-sm font-medium 
                       focus:ring-2 focus:ring-primary-500/30 focus:bg-white dark:focus:bg-surface-700 transition-all outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-surface-200 dark:bg-surface-600">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Voice Billing */}
        <button
          onClick={() => setShowVoiceBilling(true)}
          className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 active:scale-95 transition-all relative group"
          title="Voice Billing"
        >
          <Mic className="w-5 h-5" />
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white dark:border-surface-900 group-hover:animate-ping" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-3 rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 active:scale-95 transition-all"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>

        {/* Cart Badge */}
        <button
          onClick={() => setCartOpen(!cartOpen)}
          className={cn(
            'relative p-3 rounded-xl active:scale-95 transition-all',
            cartOpen
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
              : 'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700'
          )}
        >
          <ShoppingCart className="w-5 h-5" />
          {itemCount > 0 && (
            <motion.span
              key={itemCount}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg"
            >
              {itemCount}
            </motion.span>
          )}
        </button>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── LEFT: Category Sidebar ─── */}
        <aside className="w-28 md:w-36 flex flex-col bg-white dark:bg-surface-900 border-r border-surface-100 dark:border-surface-800 overflow-y-auto scrollbar-thin py-3 px-2 gap-2">
          {/* All category */}
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              'flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-all active:scale-95',
              activeCategory === 'all'
                ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                : 'bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
            )}
          >
            <div className="text-2xl">🍽️</div>
            <span className="text-[11px] font-bold leading-tight">All Items</span>
          </button>

          {categories.map((cat, i) => (
            <button
              key={cat._id}
              onClick={() => setActiveCategory(cat._id)}
              className={cn(
                'flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-all active:scale-95',
                activeCategory === cat._id
                  ? `bg-gradient-to-br ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} text-white shadow-lg`
                  : 'bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
              )}
            >
              <div className="text-2xl">{cat.icon || '🍴'}</div>
              <span className="text-[11px] font-bold leading-tight line-clamp-2">{cat.name}</span>
            </button>
          ))}
        </aside>

        {/* ─── CENTER: Menu Grid ─── */}
        <main className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {/* Category title */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold dark:text-white">
              {activeCategory === 'all' ? 'All Items' : categories.find(c => c._id === activeCategory)?.name || 'Menu'}
              <span className="text-sm font-normal text-surface-400 ml-2">({filteredItems.length})</span>
            </h2>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-surface-400">
              <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium">Loading menu...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-surface-400">
              <span className="text-5xl mb-4">🔍</span>
              <p className="text-lg font-semibold">No items found</p>
              <p className="text-sm mt-1">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, index) => {
                  const inCart = cartItems.find(ci => (ci._id || ci.id) === item._id)
                  const isJustAdded = addedItemId === item._id
                  return (
                    <motion.div
                      key={item._id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.15, delay: index * 0.01 }}
                      onClick={() => handleAddItem(item)}
                      className={cn(
                        'relative rounded-2xl p-4 cursor-pointer transition-all duration-150',
                        'bg-white dark:bg-surface-800 border-2 active:scale-[0.96]',
                        'hover:shadow-lg hover:-translate-y-0.5',
                        inCart
                          ? 'border-primary-400 dark:border-primary-500 shadow-md shadow-primary-500/10'
                          : 'border-surface-100 dark:border-surface-700',
                        isJustAdded && 'ring-4 ring-green-400/50'
                      )}
                      style={{ minHeight: 140 }}
                    >
                      {/* Veg/Non-Veg indicator */}
                      <div className="absolute top-3 right-3">
                        <span className={`w-5 h-5 rounded border-2 flex items-center justify-center ${item.veg ? 'border-green-600' : 'border-red-600'
                          }`}>
                          <span className={`w-2.5 h-2.5 rounded-full ${item.veg ? 'bg-green-600' : 'bg-red-600'}`} />
                        </span>
                      </div>

                      {/* Qty badge if in cart */}
                      {inCart && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 left-3 w-7 h-7 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg"
                        >
                          {inCart.quantity}
                        </motion.div>
                      )}

                      {/* Item image/emoji */}
                      <div className="text-4xl mb-3 text-center">
                        {item.image || '🍽️'}
                      </div>

                      {/* Item details */}
                      <h3 className="text-sm font-bold text-surface-900 dark:text-white leading-snug line-clamp-2 text-center">
                        {item.name}
                      </h3>

                      <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="text-lg font-extrabold font-mono text-primary-600 dark:text-primary-400">
                          {formatCurrency(item.price)}
                        </span>
                        {item.popular && (
                          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-semibold">
                            🔥
                          </span>
                        )}
                      </div>

                      {/* Touch add overlay */}
                      <motion.div
                        className={cn(
                          'absolute inset-0 rounded-2xl flex items-center justify-center transition-opacity',
                          isJustAdded ? 'opacity-100' : 'opacity-0'
                        )}
                        style={{ background: 'rgba(34, 197, 94, 0.15)' }}
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={isJustAdded ? { scale: [0, 1.3, 1] } : { scale: 0 }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          className="bg-green-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
                        >
                          <Plus className="w-7 h-7" strokeWidth={3} />
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </main>

        {/* ─── RIGHT: Cart Drawer ─── */}
        <AnimatePresence>
          {cartOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="flex flex-col bg-white dark:bg-surface-900 border-l border-surface-100 dark:border-surface-800 overflow-hidden"
            >
              {/* Cart Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 dark:border-surface-800">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary-500" />
                  <h3 className="text-lg font-extrabold dark:text-white">Order</h3>
                  {itemCount > 0 && (
                    <span className="ml-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold px-2 py-0.5 rounded-full">
                      {itemCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {cartItems.length > 0 && (
                    <button
                      onClick={() => { clearCart(); addNotification({ type: 'info', title: 'Cart Cleared' }) }}
                      className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setCartOpen(false)}
                    className="p-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 active:scale-95 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ── Table / Customer / Due ── */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-100 dark:border-surface-800 flex-wrap">
                <button
                  onClick={() => setShowTableModal(true)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95',
                    table
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700'
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                  )}
                >
                  <Hash className="w-4 h-4" />
                  {table ? `Table ${table.name || table}` : 'Select Table'}
                </button>

                <button
                  onClick={() => setShowCustomerModal(true)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95',
                    customer
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700'
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                  )}
                >
                  <User className="w-4 h-4" />
                  {customer ? customer.name : 'Add Customer'}
                </button>

                {dueOrders.length > 0 && (
                  <button
                    onClick={() => setShowDueOrders(!showDueOrders)}
                    className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm font-bold animate-pulse active:scale-95 transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    {dueOrders.length} Due
                  </button>
                )}
              </div>

              {/* ── Due Orders Dropdown ── */}
              <AnimatePresence>
                {showDueOrders && dueOrders.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b border-surface-100 dark:border-surface-800"
                  >
                    <div className="p-4 space-y-2 bg-primary-50 dark:bg-primary-900/10 max-h-52 overflow-y-auto scrollbar-thin">
                      <p className="text-xs font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-2">Orders Ready for Billing</p>
                      {dueOrders.map((order) => (
                        <div key={order._id} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-surface-800 shadow-sm border border-primary-100 dark:border-primary-900/30">
                          <div className="min-w-0 flex-1 pr-3">
                            <p className="text-sm font-bold text-surface-900 dark:text-white truncate">#{order.orderId || order._id.slice(-6).toUpperCase()}</p>
                            <p className="text-[11px] text-surface-500 uppercase tracking-tight">
                              {order.type} • {order.tableId?.name ? `Table ${order.tableId.name}` : order.tableId || 'No Table'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold font-mono text-primary-600 dark:text-primary-400">{formatCurrency(order.total)}</span>
                            <button
                              onClick={() => {
                                loadOrderFromDB(order)
                                setShowDueOrders(false)
                                addNotification({ type: 'info', title: 'Order Loaded', message: 'Ready for final billing' })
                              }}
                              className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 active:scale-90 transition-all shadow-md"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-surface-400 p-6">
                    <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-base font-semibold">Cart is empty</p>
                    <p className="text-sm mt-1 text-center">Tap items on the menu to add them to your order</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    <AnimatePresence>
                      {cartItems.map((item) => {
                        const uid = item._id || item.id
                        return (
                          <motion.div
                            key={uid}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center gap-3 p-3 rounded-2xl bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700"
                          >
                            <span className="text-2xl flex-shrink-0">{item.image || '🍽️'}</span>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold dark:text-white leading-tight truncate">{item.name}</h4>
                              <p className="text-xs font-mono text-primary-600 dark:text-primary-400 font-bold mt-0.5">
                                {formatCurrency(item.price * item.quantity)}
                              </p>
                            </div>
                            {/* Qty controls */}
                            <div className="flex items-center gap-0 bg-white dark:bg-surface-700 rounded-xl border border-surface-200 dark:border-surface-600 shadow-sm">
                              <button
                                onClick={(e) => { e.stopPropagation(); updateQuantity(uid, item.quantity - 1) }}
                                className="p-2.5 rounded-l-xl hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-90 transition-all"
                              >
                                {item.quantity === 1 ? <Trash2 className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4" />}
                              </button>
                              <span className="w-10 text-center text-base font-extrabold font-mono">{item.quantity}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); updateQuantity(uid, item.quantity + 1) }}
                                className="p-2.5 rounded-r-xl hover:bg-green-50 dark:hover:bg-green-900/20 active:scale-90 transition-all"
                              >
                                <Plus className="w-4 h-4 text-green-600" />
                              </button>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Bill Summary + Actions */}
              {cartItems.length > 0 && (
                <div className="border-t border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                  {/* Summary */}
                  <div className="px-5 py-4 space-y-2">
                    <div className="flex justify-between text-sm text-surface-500">
                      <span>Subtotal</span>
                      <span className="font-mono font-semibold">{formatCurrency(subtotal)}</span>
                    </div>

                    {discount.type !== 'none' && (
                      <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">
                        <span className="flex items-center gap-1">
                          <Percent className="w-3 h-3" />
                          Discount ({discount.type === 'percentage' ? `${discount.value}%` : 'Flat'})
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="font-mono font-semibold">-{formatCurrency(discountAmount)}</span>
                          <button
                            onClick={() => {
                              setDiscount({ type: 'none', value: 0 })
                              addNotification({ type: 'info', title: 'Discount Removed', message: 'Discount has been cleared.' })
                            }}
                            className="p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            title="Remove Discount"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-xs text-surface-400">
                      <span>GST ({tax.rate}%)</span>
                      <span className="font-mono">{formatCurrency(tax.total)}</span>
                    </div>
                    <div className="flex justify-between text-lg pt-2 border-t border-dashed border-surface-200 dark:border-surface-700">
                      <span className="font-extrabold dark:text-white">Total</span>
                      <span className="font-extrabold font-mono text-primary-600 dark:text-primary-400">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>

                  {/* ── Discount / Hold / Clear Row ── */}
                  <div className="px-4 pb-2 flex gap-2">
                    <button
                      onClick={() => setShowDiscount(!showDiscount)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold transition-all active:scale-95',
                        showDiscount
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                          : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                      )}
                    >
                      <Percent className="w-4 h-4" />
                      Discount
                    </button>
                    <button
                      onClick={() => {
                        holdOrder()
                        setCartOpen(false)
                        addNotification({ type: 'info', title: 'Order Held', message: 'You can recall it from the held orders.' })
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600 text-sm font-bold active:scale-95 transition-all"
                    >
                      <Pause className="w-4 h-4" />
                      Hold
                    </button>
                    <button
                      onClick={() => { clearCart(); setCartOpen(false) }}
                      className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 active:scale-95 transition-all"
                      title="Clear Cart"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Discount Input Panel */}
                  <AnimatePresence>
                    {showDiscount && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden px-4 pb-3"
                      >
                        <div className="p-3 rounded-xl bg-surface-100 dark:bg-surface-800 space-y-2">
                          <div className="flex gap-2">
                            <select
                              value={discountType}
                              onChange={(e) => setDiscountType(e.target.value)}
                              className="px-3 py-2.5 rounded-xl bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500/30 w-24"
                            >
                              <option value="percentage">%</option>
                              <option value="flat">₹ Flat</option>
                            </select>
                            <input
                              type="number"
                              value={discountInput}
                              onChange={(e) => setDiscountInput(e.target.value)}
                              placeholder="Value"
                              className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500/30"
                            />
                          </div>
                          <button
                            onClick={() => {
                              const value = parseFloat(discountInput)
                              if (isNaN(value) || value <= 0) return
                              setDiscount({ type: discountType, value })
                              setShowDiscount(false)
                              setDiscountInput('')
                              addNotification({ type: 'success', title: 'Discount Applied', message: discountType === 'percentage' ? `${value}% off` : `₹${value} off` })
                            }}
                            className="w-full py-3 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 active:scale-[0.97] transition-all shadow-lg shadow-green-500/25"
                          >
                            Apply Discount
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Held Orders Quick-Recall */}
                  {heldOrders.length > 0 && (
                    <div className="px-4 pb-2">
                      <button
                        onClick={() => setShowHeldOrders(!showHeldOrders)}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm font-bold hover:bg-amber-100 dark:hover:bg-amber-900/30 active:scale-[0.98] transition-all"
                      >
                        <span className="flex items-center gap-1.5">
                          <Pause className="w-4 h-4" />
                          {heldOrders.length} Held Order{heldOrders.length > 1 ? 's' : ''}
                        </span>
                        <ChevronDown className={cn('w-4 h-4 transition-transform', showHeldOrders && 'rotate-180')} />
                      </button>
                      <AnimatePresence>
                        {showHeldOrders && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-2 space-y-2"
                          >
                            {heldOrders.map((order) => (
                              <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-surface-800 border border-amber-200 dark:border-amber-800">
                                <div>
                                  <p className="text-xs font-bold dark:text-white">{order.id}</p>
                                  <p className="text-[10px] text-surface-500">{order.items.length} items • {order.table ? `Table ${order.table}` : order.orderType}</p>
                                </div>
                                <button
                                  onClick={() => { recallOrder(order.id); setShowHeldOrders(false) }}
                                  className="px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 active:scale-95 transition-all shadow-md shadow-amber-500/25"
                                >
                                  <Play className="w-3.5 h-3.5 inline mr-1" /> Recall
                                </button>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="px-4 pb-4 flex gap-3">
                    <button
                      onClick={handleKOT}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold',
                        'bg-amber-500 text-white shadow-lg shadow-amber-500/25',
                        'hover:bg-amber-600 active:scale-[0.97] transition-all'
                      )}
                    >
                      🎫 KOT
                    </button>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className={cn(
                        'flex-[2] flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold',
                        'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30',
                        'hover:from-primary-600 hover:to-primary-700 active:scale-[0.97] transition-all'
                      )}
                    >
                      <CreditCard className="w-5 h-5" />
                      Pay {formatCurrency(total)}
                    </button>
                  </div>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ BOTTOM FLOATING CART BAR (when cart is closed) ═══ */}
      <AnimatePresence>
        {!cartOpen && itemCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <button
              onClick={() => setCartOpen(true)}
              className={cn(
                'flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl',
                'bg-gradient-to-r from-primary-500 to-primary-600 text-white',
                'hover:from-primary-600 hover:to-primary-700 active:scale-[0.97] transition-all',
                'min-w-[320px]'
              )}
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-primary-600 text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              </div>
              <span className="flex-1 text-left">
                <span className="text-sm font-bold block">View Order</span>
                <span className="text-xs opacity-80">{itemCount} item{itemCount > 1 ? 's' : ''} added</span>
              </span>
              <span className="text-lg font-extrabold font-mono">
                {formatCurrency(total)}
              </span>
              <ChevronUp className="w-5 h-5 opacity-60" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      {showPaymentModal && <PaymentModal />}

      {/* ═══ TABLE SELECTION MODAL ═══ */}
      <AnimatePresence>
        {showTableModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowTableModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-surface-900 rounded-3xl shadow-2xl w-full max-w-lg p-6 border border-surface-200 dark:border-surface-800"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-extrabold dark:text-white flex items-center gap-2">
                  <Hash className="w-5 h-5 text-primary-500" />
                  Select Table
                </h3>
                <button onClick={() => setShowTableModal(false)}
                  className="p-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 active:scale-95 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[50vh] overflow-y-auto scrollbar-thin grid grid-cols-3 gap-3">
                {/* None / Clear */}
                <button
                  onClick={() => { setTable(null); setShowTableModal(false) }}
                  className={cn(
                    'p-4 rounded-2xl border-2 cursor-pointer text-center transition-all active:scale-95',
                    'bg-surface-50 dark:bg-surface-800',
                    !table ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-surface-200 dark:border-surface-700'
                  )}
                >
                  <p className="text-sm font-bold text-surface-600 dark:text-surface-300">None</p>
                  <p className="text-[10px] text-surface-400 mt-0.5">Clear</p>
                </button>

                {tables.map(t => (
                  <button
                    key={t._id}
                    onClick={() => { setTable(t); setShowTableModal(false); addNotification({ type: 'success', title: `Table ${t.name}`, message: 'Selected' }) }}
                    className={cn(
                      'p-4 rounded-2xl border-2 cursor-pointer text-center transition-all active:scale-95',
                      t.status === 'available'
                        ? 'bg-green-50 dark:bg-green-900/10 hover:border-green-400'
                        : 'bg-surface-100 dark:bg-surface-800 opacity-60',
                      table?._id === t._id
                        ? 'border-primary-500 ring-2 ring-primary-500/20'
                        : 'border-surface-200 dark:border-surface-700'
                    )}
                  >
                    <p className="text-base font-extrabold text-surface-900 dark:text-white">{t.name}</p>
                    <p className={cn(
                      'text-[10px] mt-0.5 capitalize font-semibold',
                      t.status === 'available' ? 'text-green-600' : 'text-surface-400'
                    )}>{t.status}</p>
                  </button>
                ))}

                {tables.length === 0 && (
                  <p className="col-span-3 text-center text-surface-400 text-sm py-6">No tables found. Add them in Table Management.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ CUSTOMER MODAL ═══ */}
      <AnimatePresence>
        {showCustomerModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowCustomerModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-surface-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-surface-200 dark:border-surface-800"
            >
              <h3 className="text-xl font-extrabold mb-5 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-primary-500" />
                Customer Details
              </h3>
              <form onSubmit={handleSaveCustomer} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block dark:text-surface-300">Name *</label>
                  <input
                    required
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-3.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-base font-medium outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
                    value={customerForm.name}
                    onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block dark:text-surface-300">Phone</label>
                  <input
                    placeholder="e.g. 9876543210"
                    className="w-full px-4 py-3.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-base font-medium outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
                    value={customerForm.phone}
                    onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block dark:text-surface-300">
                    Email ID <span className="text-surface-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. john@example.com"
                    className="w-full px-4 py-3.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-base font-medium outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
                    value={customerForm.email || ''}
                    onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomer(null)
                      setCustomerForm({ name: '', phone: '', email: '' })
                      setShowCustomerModal(false)
                    }}
                    className="flex-1 py-3.5 rounded-xl border-2 border-red-200 dark:border-red-800 text-red-500 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 transition-all"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 rounded-xl bg-primary-500 text-white font-bold text-sm hover:bg-primary-600 active:scale-95 transition-all shadow-lg shadow-primary-500/25"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}