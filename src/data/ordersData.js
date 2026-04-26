export const recentOrders = [
  { id: 'ORD-A1B2C', table: 'T2', type: 'Dine-in', items: 4, amount: 780, status: 'preparing', time: '12:30 PM', waiter: 'Raju' },
  { id: 'ORD-D3E4F', table: 'T3', type: 'Dine-in', items: 6, amount: 1580, status: 'preparing', time: '12:45 PM', waiter: 'Suresh' },
  { id: 'ORD-G5H6I', table: 'T6', type: 'Dine-in', items: 8, amount: 2340, status: 'ready', time: '12:15 PM', waiter: 'Raju' },
  { id: 'ORD-J7K8L', table: 'T7', type: 'Dine-in', items: 5, amount: 1920, status: 'served', time: '11:50 AM', waiter: 'Amit' },
  { id: 'ORD-M9N0O', table: 'T10', type: 'Dine-in', items: 3, amount: 960, status: 'new', time: '1:00 PM', waiter: 'Suresh' },
  { id: 'ORD-P1Q2R', table: 'T14', type: 'Dine-in', items: 10, amount: 3200, status: 'preparing', time: '12:00 PM', waiter: 'Deepak' },
  { id: 'ORD-S3T4U', table: null, type: 'Takeaway', items: 3, amount: 680, status: 'ready', time: '12:50 PM', waiter: null },
  { id: 'ORD-V5W6X', table: null, type: 'Delivery', items: 5, amount: 1200, status: 'preparing', time: '12:35 PM', waiter: null, platform: 'Swiggy' },
  { id: 'ORD-Y7Z8A', table: null, type: 'Delivery', items: 4, amount: 990, status: 'new', time: '1:05 PM', waiter: null, platform: 'Zomato' },
]

export const kotQueue = [
  {
    id: 'KOT-001',
    orderId: 'ORD-M9N0O',
    table: 'T10',
    time: '1:00 PM',
    status: 'new',
    priority: 'normal',
    items: [
      { name: 'Paneer Butter Masala', qty: 1, note: 'Less spicy' },
      { name: 'Butter Naan', qty: 3, note: '' },
      { name: 'Dal Makhani', qty: 1, note: '' },
    ]
  },
  {
    id: 'KOT-002',
    orderId: 'ORD-A1B2C',
    table: 'T2',
    time: '12:30 PM',
    status: 'preparing',
    priority: 'normal',
    items: [
      { name: 'Butter Chicken', qty: 1, note: '' },
      { name: 'Garlic Naan', qty: 2, note: '' },
      { name: 'Mango Lassi', qty: 2, note: 'Chilled' },
    ]
  },
  {
    id: 'KOT-003',
    orderId: 'ORD-D3E4F',
    table: 'T3',
    time: '12:45 PM',
    status: 'preparing',
    priority: 'high',
    items: [
      { name: 'Chicken Biryani', qty: 2, note: 'Extra raita' },
      { name: 'Paneer Tikka', qty: 1, note: '' },
      { name: 'Chicken Seekh Kebab', qty: 1, note: '' },
      { name: 'Fresh Lime Soda', qty: 3, note: '' },
    ]
  },
  {
    id: 'KOT-004',
    orderId: 'ORD-G5H6I',
    table: 'T6',
    time: '12:15 PM',
    status: 'ready',
    priority: 'normal',
    items: [
      { name: 'Mutton Rogan Josh', qty: 2, note: '' },
      { name: 'Veg Biryani', qty: 1, note: '' },
      { name: 'Laccha Paratha', qty: 4, note: '' },
      { name: 'Gulab Jamun', qty: 2, note: 'Warm' },
    ]
  },
  {
    id: 'KOT-005',
    orderId: 'ORD-V5W6X',
    table: null,
    time: '12:35 PM',
    status: 'preparing',
    priority: 'high',
    type: 'Delivery',
    platform: 'Swiggy',
    items: [
      { name: 'Chilli Chicken', qty: 1, note: '' },
      { name: 'Hakka Noodles', qty: 1, note: '' },
      { name: 'Veg Manchurian', qty: 1, note: 'Dry' },
      { name: 'Chicken Fried Rice', qty: 1, note: '' },
      { name: 'Sweet Corn Soup', qty: 1, note: '' },
    ]
  },
]

export const orderHistory = [
  { id: 'ORD-H001', date: '2026-04-10', time: '11:20 AM', table: 'T5', type: 'Dine-in', items: 6, amount: 2180, payment: 'UPI', status: 'completed' },
  { id: 'ORD-H002', date: '2026-04-10', time: '11:45 AM', table: null, type: 'Takeaway', items: 3, amount: 640, payment: 'Cash', status: 'completed' },
  { id: 'ORD-H003', date: '2026-04-10', time: '10:30 AM', table: 'T1', type: 'Dine-in', items: 2, amount: 380, payment: 'Card', status: 'completed' },
  { id: 'ORD-H004', date: '2026-04-09', time: '8:15 PM', table: 'T8', type: 'Dine-in', items: 12, amount: 4560, payment: 'Card', status: 'completed' },
  { id: 'ORD-H005', date: '2026-04-09', time: '7:30 PM', table: null, type: 'Delivery', items: 4, amount: 1100, payment: 'Online', status: 'completed', platform: 'Zomato' },
  { id: 'ORD-H006', date: '2026-04-09', time: '1:00 PM', table: 'T3', type: 'Dine-in', items: 5, amount: 1780, payment: 'UPI', status: 'completed' },
  { id: 'ORD-H007', date: '2026-04-09', time: '12:20 PM', table: null, type: 'Delivery', items: 6, amount: 2200, payment: 'Online', status: 'completed', platform: 'Swiggy' },
  { id: 'ORD-H008', date: '2026-04-08', time: '9:00 PM', table: 'T11', type: 'Dine-in', items: 15, amount: 6800, payment: 'Card', status: 'completed' },
]
