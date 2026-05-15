import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Clock, IndianRupee, AlertCircle, Plus, RotateCcw, QrCode, Merge, X, Trash2, Tag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useTableStore from '@/store/tableStore'
import useCartStore from '@/store/cartStore'
import useOrderStore from '@/store/orderStore'
import { formatCurrency, cn } from '@/lib/utils'
import useUIStore from '@/store/uiStore'
import useTableCategoryStore from '@/store/tableCategoryStore'

const statusConfig = {
  available: { label: 'Available', color: 'table-available', dot: 'bg-green-500' },
  occupied: { label: 'Occupied', color: 'table-occupied', dot: 'bg-primary-500' },
  reserved: { label: 'Reserved', color: 'table-reserved', dot: 'bg-amber-500' },
  billing: { label: 'Billing', color: 'table-billing', dot: 'bg-blue-500' },
}

const floors = [
  { id: 'ground', label: 'Ground Floor' },
  { id: 'first', label: '1st Floor' },
  { id: 'outdoor', label: 'Outdoor' }
]

const categoryPresets = [
  { name: 'AC Hall', icon: '❄️', color: '#3b82f6' },
  { name: 'Non AC', icon: '🌀', color: '#10b981' },
  { name: 'Bar', icon: '🍺', color: '#f59e0b' },
  { name: 'Rooftop', icon: '🌆', color: '#8b5cf6' },
  { name: 'VIP', icon: '👑', color: '#ec4899' },
]

export default function TablesPage() {
  const [selectedFloor, setSelectedFloor] = useState('ground')
  const [selectedTable, setSelectedTable] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showFloorModal, setShowFloorModal] = useState(false)
  const [editingTableId, setEditingTableId] = useState(null)
  const [selectedTables, setSelectedTables] = useState([])
  const [tableForm, setTableForm] = useState({ name: '', capacity: 4, floor: 'ground' })
  const [floorForm, setFloorForm] = useState({ name: '' })
  const [customFloors, setCustomFloors] = useState(() => JSON.parse(localStorage.getItem('tenantCustomFloors') || '[]'))
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', color: '#6366f1', icon: '🪑', description: '' })

  const { tables, fetchTables, createTable, updateTable, deleteTable, isLoading } = useTableStore()
  const { categories, fetchCategories, createCategory, updateCategory, deleteCategory: deleteCat } = useTableCategoryStore()
  const { orders, fetchOrders } = useOrderStore()
  const { confirmAction, addNotification, setShowPaymentModal } = useUIStore()
  const navigate = useNavigate()

  // Compute combined floors
  const activeFloorSet = new Set(tables.map(t => t.floor))
  const dynamicTableFloors = Array.from(activeFloorSet).filter(f => !floors.find(df => df.id === f) && !customFloors.find(cf => cf.id === f)).map(f => ({ id: f, label: f.charAt(0).toUpperCase() + f.slice(1) }))
  
  const allFloors = [...floors, ...customFloors, ...dynamicTableFloors]

  useEffect(() => {
    fetchTables()
    fetchOrders('active')
    fetchCategories()
  }, [fetchTables, fetchOrders, fetchCategories])

  const handleLoadOrder = (tableId, action) => {
    const order = orders.find(o => 
      (o.tableId?._id === tableId || o.tableId === tableId) && 
      o.status !== 'completed' && 
      o.status !== 'cancelled'
    );
    
    if (order) {
      useCartStore.getState().loadOrderFromDB(order);
      if (action === 'bill') {
        setShowPaymentModal(true);
      }
      navigate('/pos');
    } else {
      addNotification({ type: 'error', title: 'Order not found', message: 'No active order found for this table.' });
    }
  }

  const floorTables = tables.filter(t => t.floor === selectedFloor)
  const catFiltered = selectedCategory === 'all' ? floorTables : floorTables.filter(t => { const cid = t.category?._id || t.category; return cid === selectedCategory })
  const filteredTables = filterStatus === 'all' ? catFiltered : catFiltered.filter(t => t.status === filterStatus)

  const stats = {
    total: floorTables.length,
    available: floorTables.filter(t => t.status === 'available').length,
    occupied: floorTables.filter(t => t.status === 'occupied').length,
    reserved: floorTables.filter(t => t.status === 'reserved').length,
  }

  const handleSaveTable = async (e) => {
    e.preventDefault()
    try {
      if (editingTableId) {
        await updateTable(editingTableId, { ...tableForm, capacity: Number(tableForm.capacity) })
        addNotification({ type: 'success', title: 'Table Updated', message: `Table ${tableForm.name} updated.` })
      } else {
        await createTable({ ...tableForm, capacity: Number(tableForm.capacity) })
        addNotification({ type: 'success', title: 'Table Created', message: `Table ${tableForm.name} added.` })
      }
      setShowAddModal(false)
      setEditingTableId(null)
      setTableForm({ name: '', capacity: 4, floor: 'ground', category: null })
    } catch (err) {
      addNotification({ type: 'error', title: 'Operation Failed', message: err.message })
    }
  }

  const handleDeleteTable = async (id, name) => {
    const isConfirmed = await confirmAction({
      title: 'Delete Table',
      message: `Are you sure you want to delete table ${name}?`,
      confirmText: 'Delete'
    })
    if (isConfirmed) {
      try {
        await deleteTable(id)
        addNotification({ type: 'success', title: 'Deleted', message: 'Table removed.' })
        if (selectedTable?._id === id) setSelectedTable(null)
      } catch (err) {
        addNotification({ type: 'error', title: 'Delete Failed', message: err.message })
      }
    }
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTables(filteredTables.map(t => t._id))
    } else {
      setSelectedTables([])
    }
  }

  const handleSelectTable = (id) => {
    setSelectedTables(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const handleBulkDelete = async () => {
    const isConfirmed = await confirmAction({
      title: 'Bulk Delete Tables',
      message: `Delete ${selectedTables.length} tables? This cannot be undone.`,
      confirmText: 'Delete All'
    })
    if (isConfirmed) {
      try {
        await Promise.all(selectedTables.map(id => deleteTable(id)))
        addNotification({ type: 'success', title: 'Bulk Deleted', message: 'Selected tables removed.' })
        setSelectedTables([])
        setSelectedTable(null)
      } catch (err) {
        addNotification({ type: 'error', title: 'Partial Failure', message: 'Some tables could not be deleted.' })
      }
    }
  }

  const handleDeleteFloor = (id, label) => {
    const updatedCustomFloors = customFloors.filter(cf => cf.id !== id)
    setCustomFloors(updatedCustomFloors)
    localStorage.setItem('tenantCustomFloors', JSON.stringify(updatedCustomFloors))
    if (selectedFloor === id) setSelectedFloor('ground')
    addNotification({ type: 'info', title: 'Floor Removed', message: `${label} removed from layout.` })
  }

  const handleAddFloor = (e) => {
    e.preventDefault()
    if (!floorForm.name) return
    const newFloorId = floorForm.name.toLowerCase().replace(/\s+/g, '-')
    const newFloor = { id: newFloorId, label: floorForm.name }
    
    const updatedCustomFloors = [...customFloors, newFloor]
    setCustomFloors(updatedCustomFloors)
    localStorage.setItem('tenantCustomFloors', JSON.stringify(updatedCustomFloors))
    
    setSelectedFloor(newFloorId)
    setShowFloorModal(false)
    setFloorForm({ name: '' })
  }

  const handleSaveCategory = async (e) => {
    e.preventDefault()
    try {
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, categoryForm)
        addNotification({ type: 'success', title: 'Updated', message: 'Category updated.' })
      } else {
        await createCategory(categoryForm)
        addNotification({ type: 'success', title: 'Created', message: `Category "${categoryForm.name}" added.` })
      }
      setEditingCategoryId(null)
      setCategoryForm({ name: '', color: '#6366f1', icon: '🪑', description: '' })
    } catch(err) {
      addNotification({ type: 'error', title: 'Failed', message: err.response?.data?.message || err.message })
    }
  }

  const handleDeleteCategory = async (cat) => {
    const ok = await confirmAction({ title: 'Delete Category', message: `Delete "${cat.name}"? Tables will become uncategorized.`, confirmText: 'Delete' })
    if (ok) {
      try {
        await deleteCat(cat._id)
        addNotification({ type: 'success', title: 'Deleted', message: 'Category removed.' })
      } catch(err) {
        addNotification({ type: 'error', title: 'Failed', message: err.message })
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Table Management</h1>
          <p className="text-sm text-surface-500 mt-0.5">Live floor plan & table tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary btn-sm">
            <QrCode className="w-4 h-4 mr-1.5" /> QR Orders
          </button>
          <button onClick={() => setShowFloorModal(true)} className="btn-secondary btn-sm border-surface-200">
            <Merge className="w-4 h-4 mr-1.5" /> Floors
          </button>
          <button onClick={() => { setEditingCategoryId(null); setCategoryForm({ name: '', color: '#6366f1', icon: '🪑', description: '' }); setShowCategoryModal(true) }} className="btn-secondary btn-sm border-surface-200">
            <Tag className="w-4 h-4 mr-1.5" /> Categories
          </button>
          <button onClick={() => {
            setEditingTableId(null)
            setTableForm({ name: '', capacity: 4, floor: selectedFloor, category: selectedCategory === 'all' ? null : selectedCategory })
            setShowAddModal(true)
          }} className="btn-primary btn-sm">
            <Plus className="w-4 h-4 mr-1.5" /> Add Table
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-surface-600' },
          { label: 'Available', value: stats.available, color: 'text-green-600 dark:text-green-400' },
          { label: 'Occupied', value: stats.occupied, color: 'text-primary-600 dark:text-primary-400' },
          { label: 'Reserved', value: stats.reserved, color: 'text-amber-600 dark:text-amber-400' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-xs text-surface-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Floor Tabs + Status Filter */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {allFloors.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFloor(f.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                selectedFloor === f.id
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {selectedTables.length > 0 ? (
            <button onClick={handleBulkDelete} className="btn-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold px-4 py-2 rounded-full flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Delete {selectedTables.length}
            </button>
          ) : (
            <label className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-100 dark:bg-surface-800 text-xs font-semibold text-surface-500 cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-surface-300 text-primary-500 shadow-sm focus:ring-primary-500"
                checked={selectedTables.length === filteredTables.length && filteredTables.length > 0}
                onChange={handleSelectAll}
              />
              Select All
            </label>
          )}
          {['all', 'available', 'occupied', 'reserved', 'billing'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all',
                filterStatus === s
                  ? 'bg-surface-900 dark:bg-white text-white dark:text-surface-900'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-500'
              )}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-surface-400 uppercase tracking-wide">Category:</span>
          <button onClick={() => setSelectedCategory('all')} className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${selectedCategory === 'all' ? 'bg-surface-900 dark:bg-white text-white dark:text-surface-900' : 'bg-surface-100 dark:bg-surface-800 text-surface-500'}`}>All</button>
          {categories.map(cat => {
            const countOnFloor = floorTables.filter(t => (t.category?._id || t.category) === cat._id).length;
            return (
              <button key={cat._id} onClick={() => setSelectedCategory(cat._id)} className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${selectedCategory === cat._id ? 'text-white shadow-lg' : 'bg-surface-100 dark:bg-surface-800 text-surface-600'}`} style={selectedCategory === cat._id ? { backgroundColor: cat.color } : {}}>
                <span>{cat.icon}</span>{cat.name}
                {countOnFloor > 0 && <span className="opacity-70">({countOnFloor})</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Table Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {isLoading ? (
            <div className="col-span-full text-center py-10 text-surface-500">Loading tables...</div>
        ) : filteredTables.length === 0 ? (
            <div className="col-span-full text-center py-10 text-surface-500 flex flex-col items-center">
               <span className="text-4xl mb-2 opacity-50">🪑</span>
               <p>No tables configured on this floor.</p>
            </div>
        ) : filteredTables.map((table, index) => {
          const config = statusConfig[table.status] || statusConfig.available
          const tableCat = categories.find(c => c._id === (table.category?._id || table.category))
          return (
            <motion.div
              key={table._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedTable(table)}
              className={cn(
                'relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] group',
                config.color,
                selectedTable?._id === table._id && 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-surface-950',
                selectedTables.includes(table._id) && 'ring-2 ring-primary-500 opacity-90'
              )}
            >
              {/* Selection Checkbox */}
              <div className={cn("absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity", selectedTables.includes(table._id) && 'opacity-100')}>
                <input 
                  type="checkbox" 
                  checked={selectedTables.includes(table._id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleSelectTable(table._id);
                  }}
                  className="w-4 h-4 rounded border-surface-300 text-primary-500 shadow-sm"
                />
              </div>
              {/* Status dot */}
              <span className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${config.dot} ${
                table.status === 'occupied' ? 'animate-pulse' : ''
              }`} />

              {/* Category badge */}
              {tableCat && (
                <span className="absolute bottom-2 left-2 text-[10px] px-1.5 py-0.5 rounded-full text-white font-semibold" style={{ backgroundColor: tableCat.color }}>{tableCat.icon} {tableCat.name}</span>
              )}
              {/* Table number */}
              <div className="text-center mb-3">
                <p className="text-2xl font-bold">{table.name}</p>
                <p className="text-xs opacity-70">{table.capacity} seats</p>
              </div>

              {table.status === 'occupied' && (
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{table.guests || table.capacity} guests</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold font-mono">
                    <IndianRupee className="w-3 h-3" />
                    <span>{formatCurrency(orders.find(o => (o.tableId?._id === table._id || o.tableId === table._id) && o.status !== 'completed' && o.status !== 'cancelled')?.total || table.amount || 0)}</span>
                  </div>
                </div>
              )}

              {table.status === 'reserved' && (
                <div className="space-y-1 text-xs">
                  <p className="font-semibold">{table.reservedFor || 'Reserved'}</p>
                </div>
              )}

              {table.status === 'billing' && (
                <div className="space-y-1 text-xs">
                  <p className="font-semibold font-mono">{formatCurrency(orders.find(o => (o.tableId?._id === table._id || o.tableId === table._id) && o.status !== 'completed' && o.status !== 'cancelled')?.total || table.amount || 0)}</p>
                </div>
              )}

              {table.status === 'available' && (
                <p className="text-xs text-center opacity-60 mt-2">Tap to assign</p>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Selected Table Details */}
      {selectedTable && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                Table {selectedTable.name}
              </h3>
              <p className="text-sm text-surface-500 capitalize">
                {statusConfig[selectedTable.status]?.label} • {selectedTable.capacity} seats
              </p>
            </div>
            <div className="flex gap-2">
              {selectedTable.status === 'available' && (
                <button 
                  onClick={() => {
                    useCartStore.getState().setTable(selectedTable);
                    useCartStore.getState().setOrderType('dine-in');
                    navigate('/pos');
                  }}
                  className="btn-primary btn-sm"
                >
                  Assign Order
                </button>
              )}
              {selectedTable.status === 'occupied' && (
                <>
                  <button onClick={() => handleLoadOrder(selectedTable._id, 'view')} className="btn-secondary btn-sm">View Order</button>
                  <button onClick={() => handleLoadOrder(selectedTable._id, 'bill')} className="btn-primary btn-sm">Generate Bill</button>
                </>
              )}
              {selectedTable.status === 'billing' && (
                <button onClick={() => handleLoadOrder(selectedTable._id, 'bill')} className="btn-success btn-sm">Complete Payment</button>
              )}
              <button onClick={() => {
                setEditingTableId(selectedTable._id);
                setTableForm({ name: selectedTable.name, capacity: selectedTable.capacity, floor: selectedTable.floor, category: selectedTable.category?._id || selectedTable.category || null });
                setShowAddModal(true);
              }} className="btn-secondary btn-sm">Edit Table</button>
              <button onClick={() => setSelectedTable(null)} className="btn-ghost btn-sm">Close</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Add Table Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-sm p-6 border border-surface-200 dark:border-surface-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold dark:text-white">{editingTableId ? 'Edit Table' : 'Add Table'}</h3>
                <button onClick={() => {
                   setShowAddModal(false);
                   setEditingTableId(null);
                }} className="text-surface-400 hover:text-surface-600"><X size={20}/></button>
              </div>
              <form onSubmit={handleSaveTable} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block dark:text-surface-300">Table Name / Number</label>
                  <input required placeholder="e.g. T1" className="input" value={tableForm.name} onChange={e => setTableForm({...tableForm, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="text-sm font-medium mb-1 block dark:text-surface-300">Capacity</label>
                    <input type="number" required placeholder="4" className="input" value={tableForm.capacity} onChange={e => setTableForm({...tableForm, capacity: e.target.value})} />
                    </div>
                    <div>
                    <label className="text-sm font-medium mb-1 block dark:text-surface-300">Floor</label>
                    <select required className="input" value={tableForm.floor} onChange={e => setTableForm({...tableForm, floor: e.target.value})}>
                        {allFloors.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                    </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block dark:text-surface-300">Category (optional)</label>
                  <select className="input" value={tableForm.category || ''} onChange={e => setTableForm({...tableForm, category: e.target.value || null})}>
                    <option value="">-- No Category --</option>
                    {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.icon} {cat.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full btn-primary mt-2">{editingTableId ? 'Update Table' : 'Create Table'}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Floors Modal */}
      <AnimatePresence>
        {showFloorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-md p-6 border border-surface-200 dark:border-surface-800 flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <h3 className="text-xl font-bold dark:text-white">Manage Floors</h3>
                  <button onClick={() => setShowFloorModal(false)} className="text-surface-400 hover:text-surface-600"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleAddFloor} className="space-y-4 mb-6 shrink-0 bg-surface-50 dark:bg-surface-800 p-4 rounded-xl border border-surface-100 dark:border-surface-700">
                  <label className="text-sm font-bold block mb-1 dark:text-surface-200">New Floor</label>
                  <div className="flex gap-2">
                    <input required placeholder="e.g. Roof Top" className="input" value={floorForm.name} onChange={e => setFloorForm({...floorForm, name: e.target.value})} />
                    <button type="submit" className="btn-primary whitespace-nowrap px-6">Add</button>
                  </div>
                </form>

                <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-2">
                  <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Existing Layouts</h4>
                  {allFloors.map(f => (
                    <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900">
                       <span className="font-semibold text-sm dark:text-surface-200">{f.label}</span>
                       {!floors.find(df => df.id === f.id) && (
                         <button onClick={() => handleDeleteFloor(f.id, f.label)} className="p-1.5 text-surface-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                         </button>
                       )}
                       {floors.find(df => df.id === f.id) && (
                         <span className="text-[10px] bg-surface-100 dark:bg-surface-800 text-surface-500 px-2 py-0.5 rounded italic">Default</span>
                       )}
                    </div>
                  ))}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Categories Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-md p-6 border border-surface-200 dark:border-surface-800 flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2"><Tag className="w-5 h-5 text-primary-500" />Manage Categories</h3>
                <button onClick={() => { setShowCategoryModal(false); setEditingCategoryId(null) }} className="text-surface-400 hover:text-surface-600"><X size={20}/></button>
              </div>

              {!editingCategoryId && (
                <div className="mb-4 shrink-0">
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2 block">Quick Presets</label>
                  <div className="flex flex-wrap gap-2">
                    {categoryPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCategoryForm({ ...categoryForm, name: preset.name, icon: preset.icon, color: preset.color })}
                        className="px-2.5 py-1 text-xs font-medium rounded-full border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 transition-colors flex items-center gap-1.5"
                      >
                        <span>{preset.icon}</span> {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveCategory} className="space-y-3 mb-5 shrink-0 bg-surface-50 dark:bg-surface-800 p-4 rounded-xl border border-surface-100 dark:border-surface-700">
                <label className="text-sm font-bold block dark:text-surface-200">{editingCategoryId ? 'Edit Category' : 'New Category'}</label>
                <div className="flex gap-2">
                  <input style={{ width: 48, padding: 4 }} type="text" maxLength={2} className="input text-center text-xl" value={categoryForm.icon} onChange={e => setCategoryForm({...categoryForm, icon: e.target.value})} />
                  <input required placeholder="Category name (e.g. AC Hall)" className="input flex-1" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="text-xs text-surface-500 shrink-0">Color:</label>
                  {['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'].map(col => (
                    <button type="button" key={col} onClick={() => setCategoryForm({...categoryForm, color: col})} className={`w-6 h-6 rounded-full border-2 transition-all ${categoryForm.color === col ? 'border-surface-900 scale-125' : 'border-transparent'}`} style={{ backgroundColor: col }} />
                  ))}
                  <input type="color" className="w-7 h-7 rounded cursor-pointer border border-surface-200" value={categoryForm.color} onChange={e => setCategoryForm({...categoryForm, color: e.target.value})} />
                </div>
                <input placeholder="Description (optional)" className="input" value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} />
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary flex-1">{editingCategoryId ? 'Update' : 'Add Category'}</button>
                  {editingCategoryId && <button type="button" onClick={() => { setEditingCategoryId(null); setCategoryForm({ name: '', color: '#6366f1', icon: '🪑', description: '' }) }} className="btn-secondary">Cancel</button>}
                </div>
              </form>

              <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-2">
                <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Existing Categories</h4>
                {categories.length === 0 && <p className="text-sm text-surface-400 text-center py-4">No categories yet. Add your first one above.</p>}
                {categories.map(cat => (
                  <div key={cat._id} className="flex items-center gap-3 p-3 rounded-xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: cat.color + '22' }}>{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <p className="font-semibold text-sm dark:text-white truncate">{cat.name}</p>
                      </div>
                      <p className="text-xs text-surface-400">{cat.tableCount || 0} tables{cat.description ? ' • ' + cat.description : ''}</p>
                    </div>
                    <button onClick={() => { setEditingCategoryId(cat._id); setCategoryForm({ name: cat.name, color: cat.color, icon: cat.icon, description: cat.description || '' }) }} className="p-1.5 text-surface-400 hover:text-primary-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => handleDeleteCategory(cat)} className="p-1.5 text-surface-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
