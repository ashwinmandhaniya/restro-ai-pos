import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, AlertTriangle, TrendingDown, Plus, Search, ShoppingCart, ArrowDown, ArrowUp, Filter, Trash2, X, Brain, Zap, CheckCircle2, ShieldAlert } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import useUIStore from '@/store/uiStore'
import api from '@/lib/api'

export default function InventoryPage() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('list')
  const [selectedItems, setSelectedItems] = useState([])
  const { addNotification, confirmAction } = useUIStore()

  const [items, setItems] = useState([])
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPOModal, setShowPOModal] = useState(false)

  // Forms
  const [addForm, setAddForm] = useState({ name: '', stock: '', maxStock: '', minStock: '', unit: 'kg', price: '', supplier: '' })
  const [poForm, setPoForm] = useState({ supplier: '', notes: '', selectedItems: {} })

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const res = await api.get('/tenant/inventory')
      if (res.data?.success) setItems(res.data.data)
    } catch (e) {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to fetch inventory' })
    } finally {
      setLoading(false)
    }
  }

  const fetchInsights = async () => {
    try {
      const res = await api.get('/tenant/inventory/insights')
      if (res.data?.success) setInsights(res.data.data)
    } catch (e) {
      console.error('Failed to fetch AI insights:', e)
    }
  }

  const filtered = items.filter(item => {
    const matchesFilter = filter === 'all' || item.status === filter
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const lowStockCount = items.filter(i => i.status === 'low').length
  const totalValue = items.reduce((sum, i) => sum + i.stock * i.price, 0)

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(filtered.map(i => i._id || i.id))
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
      try {
        await api.post('/tenant/inventory/bulk-delete', { ids: selectedItems })
        setItems(prev => prev.filter(item => !selectedItems.includes(item._id || item.id)))
        addNotification({ type: 'success', title: 'Items Removed', message: `Successfully removed ${selectedItems.length} items from inventory.` })
        setSelectedItems([])
      } catch (error) {
        addNotification({ type: 'error', title: 'Error', message: 'Failed to delete items' })
      }
    }
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        name: addForm.name,
        stock: Number(addForm.stock),
        maxStock: Number(addForm.maxStock) || Number(addForm.stock) * 1.5,
        minStock: Number(addForm.minStock),
        unit: addForm.unit,
        price: Number(addForm.price),
        supplier: addForm.supplier
      }
      
      const res = await api.post('/tenant/inventory', payload)
      if (res.data?.success || res.data?._offline) {
        if (res.data?._offline) {
          addNotification({ type: 'warning', title: 'Offline Mode', message: res.data.message })
          const offlineItem = { ...payload, _id: `offline-${Date.now()}`, lastOrdered: 'Just now', status: payload.stock <= payload.minStock ? 'low' : 'ok' }
          setItems([offlineItem, ...items])
        } else {
          setItems([res.data.data, ...items])
          addNotification({ type: 'success', title: 'Item Added', message: `${res.data.data.name} has been added to inventory.` })
        }
        setShowAddModal(false)
        setAddForm({ name: '', stock: '', maxStock: '', minStock: '', unit: 'kg', price: '', supplier: '' })
      }
    } catch (error) {
      addNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to add item' })
    }
  }

  const handleCreatePO = (e) => {
    e.preventDefault()
    
    const selectedItemIds = Object.keys(poForm.selectedItems)
    if (selectedItemIds.length === 0) {
      addNotification({ type: 'warning', title: 'Empty Order', message: 'Please select at least one item to order.' })
      return
    }

    setShowPOModal(false)
    setPoForm({ supplier: '', notes: '', selectedItems: {} })
    addNotification({ type: 'success', title: 'PO Generated', message: `Purchase order for ${selectedItemIds.length} items has been generated and sent to ${poForm.supplier}.` })
  }

  const handleReorder = (itemName) => {
    addNotification({ type: 'info', title: 'Reorder Initiated', message: `Reorder draft created for ${itemName}.` })
  }

  const handleAIPredictItem = () => {
    if (!addForm.name) {
      addNotification({ type: 'warning', title: 'Need Name', message: 'Enter an item name first for AI to predict details.' })
      return
    }
    const name = addForm.name.toLowerCase()
    let unit = 'kg', price = 0, supplier = 'Local Market', minStock = 10, maxStock = 50
    
    if (name.includes('milk') || name.includes('oil') || name.includes('water')) {
      unit = 'ltr'; price = 60; supplier = 'Dairy/Liquid Supplier'; minStock = 5; maxStock = 20;
    } else if (name.includes('egg') || name.includes('bread') || name.includes('bun') || name.includes('box')) {
      unit = 'pcs'; price = 5; supplier = 'Bakery Supplier'; minStock = 30; maxStock = 150;
    } else if (name.includes('chicken') || name.includes('meat') || name.includes('fish')) {
      unit = 'kg'; price = 250; supplier = 'Meat Vendor'; minStock = 10; maxStock = 30;
    } else {
      unit = 'kg'; price = 40; supplier = 'Fresh Produce Market'; minStock = 15; maxStock = 60;
    }

    setAddForm({ ...addForm, unit, price, supplier, minStock, maxStock })
    addNotification({ type: 'success', title: 'AI Prediction Applied', message: `Autofilled standard defaults for ${addForm.name}.` })
  }

  const handleAIAutoOrder = () => {
    if (items.length === 0) return addNotification({ type: 'error', title: 'No Data', message: 'No items in inventory to analyze.' })
    
    // Find supplier with most low stock items
    const supplierIssues = {}
    items.forEach(item => {
      if (item.stock <= item.minStock) {
        supplierIssues[item.supplier] = (supplierIssues[item.supplier] || 0) + 1
      }
    })
    
    let targetSupplier = ''
    let maxIssues = 0
    for (const [sup, count] of Object.entries(supplierIssues)) {
      if (count > maxIssues) {
        maxIssues = count
        targetSupplier = sup
      }
    }

    if (!targetSupplier) {
       addNotification({ type: 'success', title: 'All Good', message: 'No critical low stock items found! You are good to go.' })
       return
    }

    // Select the supplier and all their low items
    const preSelected = {}
    items.forEach(item => {
      if (item.supplier === targetSupplier && item.stock <= item.minStock) {
        preSelected[item._id || item.id] = Math.max(0, item.maxStock - item.stock) || 10
      }
    })

    setPoForm({ supplier: targetSupplier, notes: 'URGENT: Automated AI Order for low stock items.', selectedItems: preSelected })
    addNotification({ type: 'info', title: 'AI PO Generated', message: `Auto-selected supplier ${targetSupplier} with ${Object.keys(preSelected).length} critical items.` })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Inventory</h1>
          <p className="text-sm text-surface-500 mt-0.5">Track stock levels and manage suppliers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => {
            // Pre-fill selected items if any are selected from the table
            const preSelected = {}
            let suggestedSupplier = ''
            
            if (selectedItems.length > 0) {
              const selectedFullItems = items.filter(i => selectedItems.includes(i._id || i.id))
              // If all selected items belong to the same supplier, auto-select it
              const suppliers = [...new Set(selectedFullItems.map(i => i.supplier))]
              if (suppliers.length === 1) suggestedSupplier = suppliers[0]
              
              selectedFullItems.forEach(item => {
                preSelected[item._id || item.id] = Math.max(0, item.maxStock - item.stock) || 10
              })
            }
            setPoForm({ supplier: suggestedSupplier, notes: '', selectedItems: preSelected })
            setShowPOModal(true)
          }} className="btn-secondary btn-sm">
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

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit">
        {[['list', 'Inventory List'], ['ai', '🧠 AI Brain']].map(([tab, label]) => (
          <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'ai' && !insights) fetchInsights() }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              activeTab === tab
                ? 'bg-white dark:bg-surface-900 text-surface-900 dark:text-white shadow-sm'
                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
            )}>
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
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
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-surface-500 text-sm">Loading inventory...</p>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-12 text-surface-500">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No inventory items found.</p>
                </td>
              </tr>
            ) : filtered.map((item, i) => {
              const stockPercent = (item.stock / item.maxStock) * 100
              const itemId = item._id || item.id
              return (
                <motion.tr key={itemId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-surface-50 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                      checked={selectedItems.includes(itemId)}
                      onChange={() => handleSelect(itemId)}
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
          </motion.div>
        ) : activeTab === 'ai' ? (
          <motion.div key="ai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            {insights ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Risk Score */}
                  <div className="card p-6 flex flex-col items-center justify-center text-center">
                    <h3 className="text-sm font-semibold text-surface-500 mb-4 uppercase tracking-wider">Inventory Risk Score</h3>
                    <div className="relative w-32 h-32 flex items-center justify-center mb-2">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" className="stroke-surface-100 dark:stroke-surface-800" strokeWidth="8" fill="none" />
                        <motion.circle
                          initial={{ strokeDasharray: '0 251' }}
                          animate={{ strokeDasharray: `${(insights.riskScore / 100) * 251} 251` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          cx="50" cy="50" r="40"
                          className={cn(
                            "stroke-current",
                            insights.riskScore > 70 ? 'text-red-500' :
                            insights.riskScore > 40 ? 'text-amber-500' : 'text-emerald-500'
                          )}
                          strokeWidth="8" fill="none" strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold dark:text-white">{insights.riskScore}</span>
                        <span className="text-xs text-surface-400">/100</span>
                      </div>
                    </div>
                    <p className={cn("text-sm font-semibold mt-2",
                      insights.riskScore > 70 ? 'text-red-600 dark:text-red-400' :
                      insights.riskScore > 40 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    )}>
                      {insights.riskScore > 70 ? 'High Risk' :
                       insights.riskScore > 40 ? 'Moderate Risk' : 'Healthy'}
                    </p>
                  </div>

                  {/* AI Recommendations */}
                  <div className="md:col-span-2 card p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Brain className="w-5 h-5 text-indigo-500" />
                      <h3 className="text-lg font-bold dark:text-white">AI Recommendations</h3>
                    </div>
                    <div className="space-y-4">
                      {insights.recommendations.map(rec => (
                        <motion.div key={rec.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                          className={cn("p-4 rounded-xl border flex gap-3",
                            rec.type === 'danger' ? 'bg-red-50 border-red-100 dark:bg-red-500/10 dark:border-red-500/20' :
                            rec.type === 'warning' ? 'bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20' :
                            rec.type === 'success' ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20' :
                            'bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20'
                          )}>
                          {rec.type === 'danger' ? <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" /> :
                           rec.type === 'warning' ? <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-500" /> :
                           rec.type === 'success' ? <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-500" /> :
                           <Zap className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-500" />}
                          <div>
                            <p className="text-sm font-bold text-surface-900 dark:text-white">{rec.title}</p>
                            <p className="text-xs text-surface-600 dark:text-surface-400 mt-1 leading-relaxed">{rec.message}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-surface-400">
                <Brain className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No insights available yet. Please add inventory items.</p>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

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
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-1 block dark:text-surface-300">Item Name</label>
                    <input required placeholder="e.g. Tomatoes" className="input" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} />
                  </div>
                  <button type="button" onClick={handleAIPredictItem} className="btn-secondary h-[42px] px-3 border-indigo-200 text-indigo-600 dark:border-indigo-500/30 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 whitespace-nowrap">
                    <Brain className="w-4 h-4 mr-1" /> AI Predict
                  </button>
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold dark:text-white">Create Purchase Order</h3>
                <button onClick={() => setShowPOModal(false)} className="text-surface-400 hover:text-surface-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="mb-4">
                <button type="button" onClick={handleAIAutoOrder} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg font-semibold border transition-all border-indigo-200 text-indigo-600 dark:border-indigo-500/30 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20">
                  <Brain className="w-4 h-4" /> AI Auto-Draft Critical Order
                </button>
              </div>
              <form onSubmit={handleCreatePO} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block dark:text-surface-300">Select Supplier</label>
                  <select required className="input" value={poForm.supplier} onChange={e => setPoForm({ ...poForm, supplier: e.target.value, selectedItems: {} })}>
                    <option value="">Select a supplier...</option>
                    {[...new Set(items.map(i => i.supplier).filter(Boolean))].map(sup => (
                      <option key={sup} value={sup}>{sup}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 flex justify-between items-center dark:text-surface-300">
                    <span>Items to Order</span>
                    {poForm.supplier && (
                      <span className="text-xs text-primary-500 font-semibold">{Object.keys(poForm.selectedItems).length} selected</span>
                    )}
                  </label>
                  
                  {!poForm.supplier ? (
                     <div className="border border-surface-200 dark:border-surface-700 rounded-lg p-6 bg-surface-50 dark:bg-surface-800 text-center text-sm text-surface-500 flex flex-col items-center justify-center">
                       <ShoppingCart className="w-8 h-8 opacity-20 mb-2" />
                       <p>Please select a supplier first to view available items.</p>
                     </div>
                  ) : (
                    <div className="border border-surface-200 dark:border-surface-700 rounded-lg max-h-56 overflow-y-auto p-2 bg-surface-50 dark:bg-surface-800 space-y-1">
                      {items.filter(i => i.supplier === poForm.supplier).length > 0 ? (
                        items.filter(i => i.supplier === poForm.supplier).map(item => {
                          const itemId = item._id || item.id;
                          const isSelected = poForm.selectedItems[itemId] !== undefined;
                          return (
                            <div key={itemId} className={cn("flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border transition-all", isSelected ? "bg-white dark:bg-surface-900 border-primary-500 shadow-sm" : "hover:bg-surface-100 dark:hover:bg-surface-700 border-transparent")}>
                              <div className="flex items-center gap-3 flex-1">
                                <input 
                                  type="checkbox" 
                                  className="rounded text-primary-500 border-surface-300 w-4 h-4 cursor-pointer" 
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const newSelected = { ...poForm.selectedItems };
                                    if (e.target.checked) {
                                      newSelected[itemId] = Math.max(0, item.maxStock - item.stock) || 10;
                                    } else {
                                      delete newSelected[itemId];
                                    }
                                    setPoForm({ ...poForm, selectedItems: newSelected });
                                  }} 
                                />
                                <div className="flex flex-col cursor-pointer flex-1" onClick={() => {
                                  const newSelected = { ...poForm.selectedItems };
                                  if (!isSelected) newSelected[itemId] = Math.max(0, item.maxStock - item.stock) || 10;
                                  else delete newSelected[itemId];
                                  setPoForm({ ...poForm, selectedItems: newSelected });
                                }}>
                                  <span className="text-sm font-semibold dark:text-surface-200">{item.name}</span>
                                  <div className="text-xs text-surface-500 flex gap-3 mt-0.5">
                                    <span className={item.stock <= item.minStock ? "text-red-500 font-medium" : ""}>Stock: {item.stock}</span>
                                    <span>Max: {item.maxStock}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {isSelected && (
                                <div className="flex items-center gap-2 pl-7 sm:pl-0">
                                  <div className="text-xs text-surface-500 hidden sm:block">Order Qty:</div>
                                  <input 
                                    type="number" 
                                    min="1"
                                    className="input w-24 text-sm py-1.5 px-2" 
                                    value={poForm.selectedItems[itemId] || ''}
                                    onChange={(e) => setPoForm({ 
                                      ...poForm, 
                                      selectedItems: { ...poForm.selectedItems, [itemId]: parseInt(e.target.value) || 0 } 
                                    })}
                                  />
                                  <span className="text-xs font-medium text-surface-500 w-8">{item.unit}</span>
                                </div>
                              )}
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-sm text-surface-500 text-center py-6">No items found for this supplier.</p>
                      )}
                    </div>
                  )}
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
