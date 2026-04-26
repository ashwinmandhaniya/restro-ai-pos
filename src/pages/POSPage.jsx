import { useState, useEffect } from 'react'
import { Search, Grid3X3, List } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useMenuStore from '@/store/menuStore'
import useCartStore from '@/store/cartStore'
import useUIStore from '@/store/uiStore'
import { formatCurrency, cn } from '@/lib/utils'
import CartPanel from '@/components/pos/CartPanel'
import PaymentModal from '@/components/pos/PaymentModal'

export default function POSPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [vegOnly, setVegOnly] = useState(false)
  
  const { categories, menuItems, isLoading, fetchMenuData } = useMenuStore()
  const { addItem } = useCartStore()
  const { addNotification, showPaymentModal } = useUIStore()

  useEffect(() => {
    fetchMenuData()
  }, [fetchMenuData])

  const filteredItems = menuItems.filter(item => {
    const itemCatId = typeof item.category === 'object' ? item.category?._id : item.category
    const matchesCategory = activeCategory === 'all' || itemCatId === activeCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesVeg = !vegOnly || item.veg
    return matchesCategory && matchesSearch && matchesVeg && item.available
  })

  const handleAddItem = (item) => {
    addItem(item)
    addNotification({ type: 'success', title: `${item.name} added`, message: `₹${item.price}` })
  }

  return (
    <div className="flex gap-0 h-[calc(100vh-7rem)] -m-6">
      {/* Left: Menu Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-surface-50 dark:bg-surface-950">
        {/* Top Bar */}
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search menu items..."
              className="input pl-10 py-2.5 text-sm"
            />
          </div>
          
          {/* Veg Toggle */}
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
              vegOnly 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-500 border border-transparent'
            )}
          >
            <span className={`w-3 h-3 rounded-sm border-2 ${vegOnly ? 'border-green-600 bg-green-600' : 'border-green-600'}`} />
            Veg
          </button>

          {/* View Toggle */}
          <div className="flex items-center bg-surface-100 dark:bg-surface-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded-md transition-all',
                viewMode === 'grid' ? 'bg-white dark:bg-surface-700 shadow-sm' : 'text-surface-400'
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded-md transition-all',
                viewMode === 'list' ? 'bg-white dark:bg-surface-700 shadow-sm' : 'text-surface-400'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 p-4 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150',
              activeCategory === 'all'
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                : 'bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 border border-surface-200 dark:border-surface-700'
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setActiveCategory(cat._id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150',
                activeCategory === cat._id
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 border border-surface-200 dark:border-surface-700'
              )}
            >
              <span className="text-base">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-4 pt-2 scrollbar-thin">
          {isLoading ? (
            <div className="flex justify-center py-20 text-surface-400">Loading menu...</div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15, delay: index * 0.02 }}
                    onClick={() => handleAddItem(item)}
                    className="menu-item-card group"
                  >
                    <div className="absolute top-2 right-2">
                      <span className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center ${
                        item.veg ? 'border-green-600' : 'border-red-600'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          item.veg ? 'bg-green-600' : 'bg-red-600'
                        }`} />
                      </span>
                    </div>

                    {/* Item image / emoji */}
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">
                      {item.image}
                    </div>

                    {/* Item details */}
                    <h3 className="text-sm font-semibold text-surface-900 dark:text-white leading-tight line-clamp-2">
                      {item.name}
                    </h3>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-base font-bold font-mono text-primary-600 dark:text-primary-400">
                        {formatCurrency(item.price)}
                      </span>
                      {item.popular && (
                        <span className="badge bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px]">
                          🔥 HOT
                        </span>
                      )}
                    </div>

                    {/* Quick add overlay */}
                    <div className="absolute inset-0 rounded-xl bg-primary-500/10 dark:bg-primary-500/5 
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-150 
                                  flex items-center justify-center">
                      <span className="bg-primary-500 text-white text-xs font-bold px-3 py-1.5 rounded-full 
                                     shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                        + ADD
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            /* List View */
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleAddItem(item)}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 
                             cursor-pointer hover:border-primary-200 dark:hover:border-primary-500/30 transition-all active:scale-[0.99]"
                >
                  <span className="text-2xl">{item.image}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-surface-900 dark:text-white">{item.name}</h3>
                    <p className="text-xs text-surface-500 truncate">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-sm border-2 flex items-center justify-center ${
                      item.veg ? 'border-green-600' : 'border-red-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.veg ? 'bg-green-600' : 'bg-red-600'}`} />
                    </span>
                    <span className="text-sm font-bold font-mono text-primary-600 dark:text-primary-400">
                      {formatCurrency(item.price)}
                    </span>
                    <button className="btn-primary btn-sm">+ Add</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-surface-400">
              <span className="text-4xl mb-3">🍽️</span>
              <p className="text-sm font-medium">No items found</p>
              <p className="text-xs mt-1">Try a different search or category</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart Panel */}
      <CartPanel />

      {/* Payment Modal */}
      {showPaymentModal && <PaymentModal />}
    </div>
  )
}
