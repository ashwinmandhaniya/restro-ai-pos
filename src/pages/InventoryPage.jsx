import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, AlertTriangle, TrendingDown, Plus, Search, ShoppingCart, ArrowDown, ArrowUp, Filter, Trash2, X } from 'lucide-react'
import { inventoryItems } from '@/data/analyticsData'
import { formatCurrency, cn } from '@/lib/utils'
import useUIStore from '@/store/uiStore'

export default function InventoryPage() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedItems, setSelectedItems] = useState([])
  const { addNotification, confirmAction } = useUIStore()

  const [items, setItems] = useState(inventoryItems)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPOModal, setShowPOModal] = useState(false)

  // Forms
  const [addForm, setAddForm] = useState({ name: '', stock: '', maxStock: '', minStock: '', unit: 'kg', price: '', supplier: '' })
  const [poForm, setPoForm] = useState({ supplier: '', notes: '' })

  const filtered = items.filter(item => {
    const matchesFilter = filter === 'all' || item.status === filter
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const lowStockCount = items.filter(i => i.status === 'low').length
  const totalValue = items.reduce((sum, i) => sum + i.stock * i.price, 0)

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(filtered.map(i => i.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelect = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    )
  }

  const handleBulkDelete = async () => {
    const isConfirmed = await confirmAction({
      title: 'Remove Inventory Items',
      message: `Are you sure you want to remove ${selectedItems.length} items from inventory?`,
      confirmText: 'Remove Items'
    })

    if (isConfirmed) {
      setItems(prev => prev.filter(item => !selectedItems.includes(item.id)))
      addNotification({ type: 'success', title: 'Items Removed', message: `Successfully removed ${selectedItems.length} items from inventory.` })
      setSelectedItems([])
    }
  }

  const handleAddItem = (e) => {
    e.preventDefault()
    const newItem = {
      id: Date.now().toString(),
      name: addForm.name,
      stock: Number(addForm.stock),
      maxStock: Number(addForm.maxStock) || Number(addForm.stock) * 1.5,
      minStock: Number(addForm.minStock),
      unit: addForm.unit,
      price: Number(addForm.price),
      supplier: addForm.supplier,
      lastOrdered: 'Just now',
      status: Number(addForm.stock) > Number(addForm.minStock) ? 'ok' : 'low'
    }
    setItems([newItem, ...items])
    setShowAddModal(false)
    setAddForm({ name: '', stock: '', maxStock: '', minStock: '', unit: 'kg', price: '', supplier: '' })
    addNotification({ type: 'success', title: 'Item Added', message: `${newItem.name} has been added to inventory.` })
  }

  const handleCreatePO = (e) => {
    e.preventDefault()
    setShowPOModal(false)
    setPoForm({ supplier: '', notes: '' })
    addNotification({ type: 'success', title: 'PO Generated', message: 'Purchase order has been generated and sent to supplier.' })
  }

  const handleReorder = (itemName) => {
    addNotification({ type: 'info', title: 'Reorder Initiated', message: `Reorder draft created for ${itemName}.` })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Inventory</h1>
          <p className="text-sm text-surface-500 mt-0.5">Track stock levels and manage suppliers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPOModal(true)} className="btn-secondary btn-sm">
            <ShoppingCart className="w-4 h-4" /> Purchase Order
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-surface-500">Total Items</p>
            <p className="text-xl font-bold text-surface-900 dark:text-white">{items.length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-surface-500">Low Stock Alerts</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">{lowStockCount}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-surface-500">Stock Value</p>
            <p className="text-xl font-bold font-mono text-surface-900 dark:text-white">{formatCurrency(totalValue)}</p>
          </div>
        </div>
      </div>

      {/* Filter + Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inventory..." className="input pl-10" />
        </div>
        <div className="flex gap-2">
          {['all', 'ok', 'low', 'warning'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={cn(
              'px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all',
              filter === f ? 'bg-primary-500 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
            )}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {selectedItems.length > 0 && (
          <div className="bg-primary-50 dark:bg-primary-900/20 px-4 py-3 border-b border-primary-100 dark:border-primary-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
              {selectedItems.length} item(s) selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="btn-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Delete Selected
            </button>
          </div>
        )}
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-100 dark:border-surface-700">
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  className="rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                  checked={selectedItems.length === filtered.length && filtered.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              {['Item', 'Stock', 'Unit', 'Min', 'Price/Unit', 'Supplier', 'Last Ordered', 'Status', 'Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => {
              const stockPercent = (item.stock / item.maxStock) * 100
              return (
                <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-surface-50 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelect(item.id)}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-surface-900 dark:text-white">{item.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all',
                          stockPercent > 50 ? 'bg-green-500' : stockPercent > 25 ? 'bg-amber-500' : 'bg-red-500'
                        )} style={{ width: `${stockPercent}%` }} />
                      </div>
                      <span className="text-sm font-mono font-semibold">{item.stock}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-500">{item.unit}</td>
                  <td className="px-4 py-3 text-sm text-surface-500">{item.minStock}</td>
                  <td className="px-4 py-3 text-sm font-mono">{formatCurrency(item.price)}</td>
                  <td className="px-4 py-3 text-sm text-surface-600 dark:text-surface-400">{item.supplier}</td>
                  <td className="px-4 py-3 text-sm text-surface-500">{item.lastOrdered}</td>
                  <td className="px-4 py-3">
                    <span className={cn('badge text-[10px]',
                      item.status === 'ok' ? 'badge-success' : item.status === 'low' ? 'badge-danger' : 'badge-warning'
                    )}>
                      {item.status === 'ok' ? 'In Stock' : item.status === 'low' ? 'Low Stock' : 'Warning'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleReorder(item.name)} className="btn-primary btn-sm text-xs">Reorder</button>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Add Item Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-md p-6 border border-surface-200 dark:border-surface-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold dark:text-white">Add Inventory Item</h3>
                <button onClick={() => setShowAddModal(false)} className="text-surface-400 hover:text-surface-600"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block dark:text-surface-300">Item Name</label>
                  <input required placeholder="e.g. Tomatoes" className="input" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block dark:text-surface-300">Current Stock</label>
                    <input required type="number" className="input" value={addForm.stock} onChange={e => setAddForm({ ...addForm, stock: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block dark:text-surface-300">Min Stock Alert</label>
                    <input required type="number" className="input" value={addForm.minStock} onChange={e => setAddForm({ ...addForm, minStock: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block dark:text-surface-300">Unit</label>
                    <select className="input" value={addForm.unit} onChange={e => setAddForm({ ...addForm, unit: e.target.value })}>
                      <option value="kg">kg</option>
                      <option value="pcs">pcs</option>
                      <option value="ltr">ltr</option>
                      <option value="box">box</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block dark:text-surface-300">Price / Unit</label>
                    <input required type="number" className="input" value={addForm.price} onChange={e => setAddForm({ ...addForm, price: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium mb-1 block dark:text-surface-300">Supplier Name</label>
                    <input required className="input" value={addForm.supplier} onChange={e => setAddForm({ ...addForm, supplier: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="w-full btn-primary mt-2">Add to Inventory</button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Purchase Order Modal */}
        {showPOModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-md p-6 border border-surface-200 dark:border-surface-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold dark:text-white">Create Purchase Order</h3>
                <button onClick={() => setShowPOModal(false)} className="text-surface-400 hover:text-surface-600"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreatePO} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block dark:text-surface-300">Select Supplier</label>
                  <select required className="input" value={poForm.supplier} onChange={e => setPoForm({ ...poForm, supplier: e.target.value })}>
                    <option value="">Select a supplier...</option>
                    {[...new Set(items.map(i => i.supplier))].map(sup => (
                      <option key={sup} value={sup}>{sup}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block dark:text-surface-300">Items to Order</label>
                  <div className="border border-surface-200 dark:border-surface-700 rounded-lg max-h-40 overflow-y-auto p-2 bg-surface-50 dark:bg-surface-800">
                    {items.filter(i => !poForm.supplier || i.supplier === poForm.supplier).map(item => (
                      <label key={item.id} className="flex items-center gap-2 p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded cursor-pointer">
                        <input type="checkbox" className="rounded text-primary-500 border-surface-300" defaultChecked={item.status === 'low'} />
                        <span className="text-sm dark:text-surface-200">{item.name}</span>
                        <span className="text-xs text-surface-500 ml-auto">Stock: {item.stock}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block dark:text-surface-300">Additional Notes</label>
                  <textarea rows="2" className="input" placeholder="Delivery instructions..." value={poForm.notes} onChange={e => setPoForm({ ...poForm, notes: e.target.value })}></textarea>
                </div>
                <button type="submit" className="w-full btn-primary mt-4">Generate & Send PO</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
