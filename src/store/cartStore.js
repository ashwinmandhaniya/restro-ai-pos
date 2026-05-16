import { create } from 'zustand'
import { generateOrderId } from '@/lib/utils'

const useCartStore = create((set, get) => ({
  items: [],
  table: null,
  customer: null,
  orderType: 'dine-in', // dine-in, takeaway, delivery
  discount: { type: 'none', value: 0 }, // type: none, percentage, flat
  notes: '',
  gstRate: 5, // default 5%, updated from restaurant settings
  heldOrders: [],
  activeOrderId: null, // Link to DB _id for existing orders being billed

  // Load a DB order into the cart for billing
  loadOrderFromDB: (order) => {
    // Map DB items back to cart items (ensure icons/ids match)
    const cartItems = order.items.map(item => ({
      _id: item.menuItem?._id || item.menuItem,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      note: item.note,
      image: item.image || '🍽️' // Default if missing
    }));

    set({
      items: cartItems,
      table: order.tableId,
      customer: order.customer,
      orderType: order.type ? order.type.toLowerCase() : 'dine-in',
      discount: { type: order.discount > 0 ? 'flat' : 'none', value: order.discount || 0 },
      notes: order.notes || '',
      activeOrderId: order._id
    });
  },

  // Add item to cart
  addItem: (item) => {
    const { items } = get()
    const itemIdToMatch = item._id || item.id
    const existingIndex = items.findIndex(i => (i._id || i.id) === itemIdToMatch)
    
    if (existingIndex >= 0) {
      const updated = [...items]
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + 1,
      }
      set({ items: updated })
    } else {
      set({ items: [...items, { ...item, quantity: 1, note: '' }] })
    }
  },

  // Remove item from cart
  removeItem: (itemId) => {
    set({ items: get().items.filter(i => (i._id || i.id) !== itemId) })
  },

  // Update item quantity
  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId)
      return
    }
    set({
      items: get().items.map(i =>
        (i._id || i.id) === itemId ? { ...i, quantity } : i
      ),
    })
  },

  // Update item note
  updateNote: (itemId, note) => {
    set({
      items: get().items.map(i =>
        (i._id || i.id) === itemId ? { ...i, note } : i
      ),
    })
  },

  // Set table
  setTable: (table) => set({ table }),

  // Set customer
  setCustomer: (customer) => set({ customer }),

  // Set order type
  setOrderType: (orderType) => set({ orderType }),

  // Set discount
  setDiscount: (discount) => set({ discount }),

  // Set notes
  setNotes: (notes) => set({ notes }),

  // Calculate subtotal
  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },

  // Calculate discount amount
  getDiscountAmount: () => {
    const { discount } = get()
    const subtotal = get().getSubtotal()
    if (discount.type === 'percentage') return (subtotal * discount.value) / 100
    if (discount.type === 'flat') return discount.value
    return 0
  },

  // Set GST rate from restaurant settings
  setGstRate: (rate) => set({ gstRate: Number(rate) || 5 }),

  // Calculate tax (uses dynamic gstRate from settings)
  getTax: () => {
    const subtotal = get().getSubtotal() - get().getDiscountAmount()
    const rate = get().gstRate
    const halfRate = rate / 2 / 100 // e.g. 5% -> 0.025 each for CGST/SGST
    return {
      cgst: subtotal * halfRate,
      sgst: subtotal * halfRate,
      total: subtotal * (rate / 100),
      rate: rate,
    }
  },

  // Calculate grand total
  getTotal: () => {
    const subtotal = get().getSubtotal()
    const discountAmount = get().getDiscountAmount()
    const tax = get().getTax()
    return subtotal - discountAmount + tax.total
  },

  // Get item count
  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0)
  },

  // Hold current order
  holdOrder: () => {
    const { items, table, customer, orderType, discount, notes } = get()
    if (items.length === 0) return
    
    const heldOrder = {
      id: generateOrderId(),
      items: [...items],
      table,
      customer,
      orderType,
      discount,
      notes,
      heldAt: new Date().toISOString(),
    }
    
    set({
      heldOrders: [...get().heldOrders, heldOrder],
      items: [],
      table: null,
      customer: null,
      discount: { type: 'none', value: 0 },
      notes: '',
    })
  },

  // Recall held order
  recallOrder: (orderId) => {
    const order = get().heldOrders.find(o => o.id === orderId)
    if (!order) return
    
    set({
      items: order.items,
      table: order.table,
      customer: order.customer,
      orderType: order.orderType,
      discount: order.discount,
      notes: order.notes,
      heldOrders: get().heldOrders.filter(o => o.id !== orderId),
    })
  },

  // Clear cart
  clearCart: () => {
    set({
      items: [],
      table: null,
      customer: null,
      discount: { type: 'none', value: 0 },
      notes: '',
      activeOrderId: null,
    })
  },
}))

export default useCartStore
