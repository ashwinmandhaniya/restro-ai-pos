export const dashboardStats = {
  todayRevenue: 48750,
  yesterdayRevenue: 42300,
  todayOrders: 67,
  yesterdayOrders: 58,
  avgOrderValue: 728,
  activeOrders: 9,
  todayCustomers: 124,
  tablesOccupied: 6,
  totalTables: 16,
}

export const weeklyRevenue = [
  { day: 'Mon', revenue: 38200, orders: 52 },
  { day: 'Tue', revenue: 42100, orders: 58 },
  { day: 'Wed', revenue: 35800, orders: 48 },
  { day: 'Thu', revenue: 46500, orders: 63 },
  { day: 'Fri', revenue: 52300, orders: 71 },
  { day: 'Sat', revenue: 61200, orders: 85 },
  { day: 'Sun', revenue: 48750, orders: 67 },
]

export const monthlyRevenue = [
  { month: 'Jan', revenue: 1080000 },
  { month: 'Feb', revenue: 985000 },
  { month: 'Mar', revenue: 1150000 },
  { month: 'Apr', revenue: 1245000 },
  { month: 'May', revenue: 1180000 },
  { month: 'Jun', revenue: 998000 },
  { month: 'Jul', revenue: 1320000 },
  { month: 'Aug', revenue: 1180000 },
  { month: 'Sep', revenue: 1050000 },
  { month: 'Oct', revenue: 1400000 },
  { month: 'Nov', revenue: 1280000 },
  { month: 'Dec', revenue: 1520000 },
]

export const topSellingItems = [
  { name: 'Butter Chicken', orders: 145, revenue: 55100, trend: 'up' },
  { name: 'Chicken Biryani', orders: 132, revenue: 46200, trend: 'up' },
  { name: 'Paneer Butter Masala', orders: 128, revenue: 40960, trend: 'stable' },
  { name: 'Butter Naan', orders: 320, revenue: 19200, trend: 'up' },
  { name: 'Dal Makhani', orders: 98, revenue: 27440, trend: 'down' },
  { name: 'Garlic Naan', orders: 285, revenue: 22800, trend: 'up' },
  { name: 'Mango Lassi', orders: 89, revenue: 10680, trend: 'up' },
  { name: 'Paneer Tikka', orders: 76, revenue: 21280, trend: 'stable' },
]

export const peakHoursData = [
  { hour: '10 AM', mon: 12, tue: 15, wed: 10, thu: 14, fri: 18, sat: 22, sun: 20 },
  { hour: '11 AM', mon: 25, tue: 28, wed: 22, thu: 30, fri: 35, sat: 42, sun: 38 },
  { hour: '12 PM', mon: 45, tue: 48, wed: 40, thu: 52, fri: 58, sat: 68, sun: 62 },
  { hour: '1 PM', mon: 65, tue: 70, wed: 55, thu: 72, fri: 78, sat: 90, sun: 85 },
  { hour: '2 PM', mon: 40, tue: 42, wed: 35, thu: 45, fri: 50, sat: 60, sun: 55 },
  { hour: '3 PM', mon: 15, tue: 18, wed: 12, thu: 16, fri: 22, sat: 30, sun: 25 },
  { hour: '4 PM', mon: 8, tue: 10, wed: 6, thu: 9, fri: 14, sat: 18, sun: 15 },
  { hour: '5 PM', mon: 10, tue: 12, wed: 8, thu: 11, fri: 16, sat: 20, sun: 18 },
  { hour: '6 PM', mon: 22, tue: 25, wed: 18, thu: 24, fri: 32, sat: 40, sun: 35 },
  { hour: '7 PM', mon: 50, tue: 55, wed: 42, thu: 58, fri: 65, sat: 80, sun: 72 },
  { hour: '8 PM', mon: 68, tue: 72, wed: 60, thu: 75, fri: 85, sat: 95, sun: 88 },
  { hour: '9 PM', mon: 55, tue: 58, wed: 48, thu: 60, fri: 70, sat: 82, sun: 75 },
  { hour: '10 PM', mon: 30, tue: 32, wed: 25, thu: 35, fri: 42, sat: 55, sun: 48 },
]

export const paymentBreakdown = [
  { method: 'UPI', amount: 18500, percentage: 38, color: '#8b5cf6' },
  { method: 'Cash', amount: 14200, percentage: 29, color: '#22c55e' },
  { method: 'Card', amount: 10800, percentage: 22, color: '#0ea5e9' },
  { method: 'Online', amount: 5250, percentage: 11, color: '#f97316' },
]

export const staffPerformance = [
  { name: 'Raju', role: 'Waiter', orders: 18, revenue: 14200, rating: 4.8, avatar: '👨' },
  { name: 'Suresh', role: 'Waiter', orders: 15, revenue: 11800, rating: 4.5, avatar: '👨' },
  { name: 'Amit', role: 'Waiter', orders: 12, revenue: 9600, rating: 4.7, avatar: '👨' },
  { name: 'Deepak', role: 'Waiter', orders: 10, revenue: 8200, rating: 4.3, avatar: '👨' },
  { name: 'Priya', role: 'Cashier', orders: 45, revenue: 32800, rating: 4.9, avatar: '👩' },
]

export const aiInsights = [
  {
    id: 1,
    type: 'prediction',
    title: 'Weekend Rush Expected',
    description: 'Based on historical data, Saturday dinner is predicted to be 23% busier. Consider adding 2 extra staff.',
    impact: 'high',
    icon: '📈',
    action: 'Schedule Staff',
  },
  {
    id: 2,
    type: 'inventory',
    title: 'Low Stock: Paneer',
    description: 'Paneer stock will run out by tomorrow afternoon at current consumption rate. Auto-purchase order drafted.',
    impact: 'critical',
    icon: '📦',
    action: 'View Order',
  },
  {
    id: 3,
    type: 'menu',
    title: 'Dead Item: Missi Roti',
    description: 'Missi Roti has been ordered only 3 times in the last 30 days. Consider removing or repositioning.',
    impact: 'low',
    icon: '🍽️',
    action: 'View Item',
  },
  {
    id: 4,
    type: 'customer',
    title: 'VIP Alert: Regular Customer',
    description: 'Mr. Patel (visits: 24) hasn\'t visited in 12 days. Send a personalized offer to re-engage.',
    impact: 'medium',
    icon: '⭐',
    action: 'Send Offer',
  },
  {
    id: 5,
    type: 'fraud',
    title: 'Unusual Pattern Detected',
    description: 'Multiple void transactions noticed at counter during 6-7 PM shift. Review recommended.',
    impact: 'critical',
    icon: '🚨',
    action: 'Review Logs',
  },
  {
    id: 6,
    type: 'upsell',
    title: 'Upsell Opportunity',
    description: 'Customers ordering Butter Chicken also frequently add Garlic Naan (78% correlation). Enable smart suggestion.',
    impact: 'medium',
    icon: '💡',
    action: 'Enable',
  },
]

export const inventoryItems = [
  { id: 1, name: 'Paneer', unit: 'kg', stock: 4.5, minStock: 5, maxStock: 20, price: 320, supplier: 'Fresh Dairy Co.', lastOrdered: '2026-04-08', status: 'low' },
  { id: 2, name: 'Chicken', unit: 'kg', stock: 12, minStock: 8, maxStock: 30, price: 240, supplier: 'Farm Fresh Meats', lastOrdered: '2026-04-09', status: 'ok' },
  { id: 3, name: 'Mutton', unit: 'kg', stock: 6, minStock: 5, maxStock: 15, price: 680, supplier: 'Farm Fresh Meats', lastOrdered: '2026-04-09', status: 'ok' },
  { id: 4, name: 'Basmati Rice', unit: 'kg', stock: 25, minStock: 10, maxStock: 50, price: 120, supplier: 'Grain Traders', lastOrdered: '2026-04-05', status: 'ok' },
  { id: 5, name: 'Cooking Oil', unit: 'ltr', stock: 8, minStock: 10, maxStock: 30, price: 180, supplier: 'Grain Traders', lastOrdered: '2026-04-07', status: 'low' },
  { id: 6, name: 'Onion', unit: 'kg', stock: 18, minStock: 15, maxStock: 40, price: 40, supplier: 'Veggie Hub', lastOrdered: '2026-04-09', status: 'ok' },
  { id: 7, name: 'Tomato', unit: 'kg', stock: 10, minStock: 10, maxStock: 30, price: 60, supplier: 'Veggie Hub', lastOrdered: '2026-04-09', status: 'warning' },
  { id: 8, name: 'Cream', unit: 'ltr', stock: 3, minStock: 5, maxStock: 15, price: 280, supplier: 'Fresh Dairy Co.', lastOrdered: '2026-04-08', status: 'low' },
  { id: 9, name: 'Butter', unit: 'kg', stock: 5, minStock: 4, maxStock: 12, price: 450, supplier: 'Fresh Dairy Co.', lastOrdered: '2026-04-08', status: 'ok' },
  { id: 10, name: 'Flour (Maida)', unit: 'kg', stock: 15, minStock: 8, maxStock: 25, price: 45, supplier: 'Grain Traders', lastOrdered: '2026-04-06', status: 'ok' },
  { id: 11, name: 'Whole Wheat Flour', unit: 'kg', stock: 12, minStock: 8, maxStock: 25, price: 50, supplier: 'Grain Traders', lastOrdered: '2026-04-06', status: 'ok' },
  { id: 12, name: 'Fresh Fish', unit: 'kg', stock: 2, minStock: 3, maxStock: 8, price: 420, supplier: 'Sea Fresh', lastOrdered: '2026-04-10', status: 'low' },
]

export const customers = [
  { id: 1, name: 'Rajesh Sharma', phone: '+91 98765 43210', visits: 32, totalSpent: 48600, lastVisit: '2026-04-10', favorite: 'Butter Chicken', loyalty: 'Gold', points: 2430 },
  { id: 2, name: 'Priya Patel', phone: '+91 87654 32109', visits: 24, totalSpent: 36200, lastVisit: '2026-03-30', favorite: 'Paneer Tikka', loyalty: 'Gold', points: 1810 },
  { id: 3, name: 'Amit Kumar', phone: '+91 76543 21098', visits: 18, totalSpent: 22400, lastVisit: '2026-04-08', favorite: 'Chicken Biryani', loyalty: 'Silver', points: 1120 },
  { id: 4, name: 'Sneha Gupta', phone: '+91 65432 10987', visits: 45, totalSpent: 68900, lastVisit: '2026-04-10', favorite: 'Dal Makhani', loyalty: 'Platinum', points: 3445 },
  { id: 5, name: 'Vikram Singh', phone: '+91 54321 09876', visits: 12, totalSpent: 15800, lastVisit: '2026-04-05', favorite: 'Mutton Biryani', loyalty: 'Silver', points: 790 },
  { id: 6, name: 'Anita Desai', phone: '+91 43210 98765', visits: 8, totalSpent: 9200, lastVisit: '2026-04-02', favorite: 'Paneer Butter Masala', loyalty: 'Bronze', points: 460 },
  { id: 7, name: 'Karan Malhotra', phone: '+91 32109 87654', visits: 56, totalSpent: 82400, lastVisit: '2026-04-10', favorite: 'Butter Chicken', loyalty: 'Platinum', points: 4120 },
  { id: 8, name: 'Meera Joshi', phone: '+91 21098 76543', visits: 15, totalSpent: 19500, lastVisit: '2026-04-07', favorite: 'Chole Bhature', loyalty: 'Silver', points: 975 },
]
