import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, GripVertical, Star, Filter, X, Sparkles } from 'lucide-react'
import useMenuStore from '@/store/menuStore'
import useUIStore from '@/store/uiStore'
import { formatCurrency, cn } from '@/lib/utils'
import MenuScannerModal from '@/components/ai/MenuScannerModal'

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showItemModal, setShowItemModal] = useState(false)
  const [showCatModal, setShowCatModal] = useState(false)
  const [showScannerModal, setShowScannerModal] = useState(false)
  const [editingItemId, setEditingItemId] = useState(null)
  const [editingCatId, setEditingCatId] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  
  // Form States
  const [catForm, setCatForm] = useState({ name: '', icon: '🍽️' })
  const [itemForm, setItemForm] = useState({ 
    name: '', description: '', price: '', category: '', image: '🍔', veg: true, popular: false
  })

  const { 
    categories, menuItems, fetchMenuData, 
    addCategory, updateCategory, deleteCategory,
    addMenuItem, updateMenuItem, deleteMenuItem, isLoading 
  } = useMenuStore()
  const { confirmAction, addNotification } = useUIStore()

  useEffect(() => {
    fetchMenuData()
  }, [fetchMenuData])

  const filteredItems = menuItems.filter(item => {
    const itemCatId = typeof item.category === 'object' ? item.category?._id : item.category
    const matchesCategory = activeCategory === 'all' || itemCatId === activeCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(filteredItems.map(i => i._id))
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
      title: 'Delete Selected Items', 
      message: `Are you sure you want to delete ${selectedItems.length} items? This action cannot be undone.`,
      confirmText: 'Delete Items'
    })

    if (isConfirmed) {
      try {
        await Promise.all(selectedItems.map(id => deleteMenuItem(id)));
        addNotification({ type: 'success', title: 'Items Deleted', message: `Successfully deleted ${selectedItems.length} items.` });
        setSelectedItems([]);
        fetchMenuData();
      } catch (err) {
        addNotification({ type: 'error', title: 'Deletion Failed', message: 'Could not delete some or all selected items.' });
      }
    }
  }

  const toggleAvailability = async (id, currentStatus) => {
    try {
      await updateMenuItem(id, { available: !currentStatus })
      addNotification({ type: 'success', title: 'Status Updated', message: `Item is now ${!currentStatus ? 'available' : 'hidden'}.` })
    } catch (err) {
      addNotification({ type: 'error', title: 'Update Failed', message: err.message || 'Could not update status.' })
    }
  }

  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction({ 
      title: 'Delete Menu Item', 
      message: 'Are you sure you want to delete this specific food item? This action cannot be undone.',
      confirmText: 'Delete Item'
    })
    
    if (isConfirmed) {
      try {
        await deleteMenuItem(id)
        addNotification({ type: 'success', title: 'Item Deleted', message: 'The menu item has been removed successfully.' })
        fetchMenuData() // Refresh list smoothly
      } catch (err) {
        addNotification({ type: 'error', title: 'Deletion Failed', message: err.message || 'Could not delete item.' })
      }
    }
  }

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCatId) {
        await updateCategory(editingCatId, catForm);
        addNotification({ type: 'success', title: 'Category Updated', message: `${catForm.name} category has been updated.` })
      } else {
        await addCategory(catForm);
        addNotification({ type: 'success', title: 'Category Created', message: `${catForm.name} category has been added.` })
      }
      setEditingCatId(null);
      setCatForm({ name: '', icon: '🍽️' });
    } catch (err) {
      addNotification({ type: 'error', title: 'Save Failed', message: err.message || 'Could not save category.' })
    }
  }

  const handleDeleteCategory = async (id, name) => {
    const isConfirmed = await confirmAction({
      title: 'Delete Category',
      message: `Are you sure you want to delete the completely empty category "${name}"?`,
      confirmText: 'Delete Category'
    });
    if (isConfirmed) {
      try {
        await deleteCategory(id);
        addNotification({ type: 'success', title: 'Category Deleted', message: `Category ${name} was removed.` });
      } catch (err) {
        addNotification({ type: 'error', title: 'Deletion Failed', message: err.response?.data?.message || err.message || 'Could not delete category.' });
      }
    }
  }

  const handleSelectAllCategories = (e) => {
    if (e.target.checked) {
      setSelectedCategories(categories.map(c => c._id))
    } else {
      setSelectedCategories([])
    }
  }

  const handleSelectCategory = (id) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const handleBulkDeleteCategories = async () => {
    const isConfirmed = await confirmAction({
      title: 'Bulk Delete Categories',
      message: `Are you sure you want to delete ${selectedCategories.length} categories? Any categories containing items will be skipped and protected.`,
      confirmText: 'Delete Selected'
    });
    if (isConfirmed) {
      try {
        await Promise.all(selectedCategories.map(id => deleteCategory(id)));
        addNotification({ type: 'success', title: 'Categories Deleted', message: `Successfully removed categories.` });
        setSelectedCategories([]);
      } catch (err) {
        addNotification({ type: 'error', title: 'Bulk Deletion Blocked', message: err.response?.data?.message || err.message || 'Could not delete some categories.' });
      }
    }
  }

  const handleSaveItem = async (e) => {
    e.preventDefault();
    const itemData = {
      ...itemForm,
      price: Number(itemForm.price)
    };
    
    try {
      if (editingItemId) {
        await updateMenuItem(editingItemId, itemData);
        addNotification({ type: 'success', title: 'Item Updated', message: `${itemData.name} has been updated.` })
      } else {
        await addMenuItem(itemData);
        addNotification({ type: 'success', title: 'Item Created', message: `${itemData.name} has been added to the menu.` })
      }
      
      setShowItemModal(false);
      setEditingItemId(null);
      setItemForm({ name: '', description: '', price: '', category: categories[0]?._id || '', image: '🍔', veg: true, popular: false });
    } catch (err) {
      addNotification({ type: 'error', title: 'Save Failed', message: err.message || 'Could not save menu item.' })
    }
  }

  const handleEditClick = (item) => {
    setEditingItemId(item._id);
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: item.price !== undefined ? String(item.price) : '',
      category: typeof item.category === 'object' ? item.category._id : item.category,
      image: item.image || '🍔',
      veg: item.veg ?? true,
      popular: item.popular ?? false
    });
    setShowItemModal(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Menu Management</h1>
          <p className="text-sm text-surface-500 mt-0.5">{menuItems.length} items across {categories.length} categories</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowScannerModal(true)} className="btn-secondary btn-sm bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-950/30 dark:to-purple-950/30 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400 hover:border-primary-300">
            <Sparkles className="w-4 h-4" /> Scan Menu (AI)
          </button>
          <button onClick={() => {
            setCatForm({ name: '', icon: '🍽️' });
            setEditingCatId(null);
            setShowCatModal(true);
          }} className="btn-secondary btn-sm border-surface-200">
            <Filter className="w-4 h-4 mr-1" /> Categories
          </button>
          <button onClick={() => {
            setEditingItemId(null)
            if (categories.length > 0) setItemForm(prev => ({...prev, category: categories[0]._id}))
            setShowItemModal(true)
          }} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Search + Categories */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu items..."
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              'px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
              activeCategory === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
            )}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat._id}
              onClick={() => setActiveCategory(cat._id)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
                activeCategory === cat._id
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
              )}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Items Table */}
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100 dark:border-surface-700">
                <th className="px-4 py-3 text-left w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                    checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                {['', 'Item', 'Category', 'Price', 'Type', 'Popular', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                 <tr><td colSpan="8" className="text-center py-10 text-surface-500">Loading menu...</td></tr>
              ) : filteredItems.map((item, index) => (
                <motion.tr
                  key={item._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b border-surface-50 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input 
                      type="checkbox"
                      className="rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                      checked={selectedItems.includes(item._id)}
                      onChange={() => handleSelect(item._id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <GripVertical className="w-4 h-4 text-surface-300 cursor-grab" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl overflow-hidden rounded-md flex items-center justify-center bg-surface-100 dark:bg-surface-800 w-10 h-10">
                        {item.image.includes('http') ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : item.image}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-surface-900 dark:text-white">{item.name}</p>
                        <p className="text-xs text-surface-500 truncate max-w-[200px]">{item.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 capitalize text-[10px]">
                      {typeof item.category === 'object' ? item.category.name : item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-surface-900 dark:text-white">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center ${
                      item.veg ? 'border-green-600' : 'border-red-600'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${item.veg ? 'bg-green-600' : 'bg-red-600'}`} />
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {item.popular && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleAvailability(item._id, item.available)}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all',
                        item.available
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      )}
                    >
                      {item.available ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {item.available ? 'Available' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEditClick(item)} className="p-1.5 rounded-md text-surface-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(item._id)} className="p-1.5 rounded-md text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Category Modal (Manage Categories) */}
        {showCatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-lg p-6 border border-surface-200 dark:border-surface-800 flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-xl font-bold dark:text-white">Manage Categories</h3>
                <button onClick={() => setShowCatModal(false)} className="text-surface-400 hover:text-surface-600"><X size={20}/></button>
              </div>
              
              <form onSubmit={handleSaveCategory} className="space-y-4 mb-6 shrink-0 bg-surface-50 dark:bg-surface-800 p-4 rounded-xl border border-surface-100 dark:border-surface-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold dark:text-surface-200">{editingCatId ? 'Edit Category' : 'Create New Category'}</h4>
                  {editingCatId && (
                    <button type="button" onClick={() => { setEditingCatId(null); setCatForm({ name: '', icon: '🍽️' }); }} className="text-xs text-primary-500 hover:underline">
                      Cancel Edit
                    </button>
                  )}
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input required placeholder="Category Name" className="input text-sm" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} />
                  </div>
                  <div className="w-24">
                    <input required placeholder="Icon" className="input text-sm text-center" value={catForm.icon} onChange={e => setCatForm({...catForm, icon: e.target.value})} />
                  </div>
                  <button type="submit" className="btn-primary whitespace-nowrap">
                    {editingCatId ? 'Save' : 'Add'}
                  </button>
                </div>
              </form>

              <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider">Existing Categories</h4>
                  {selectedCategories.length > 0 ? (
                    <button onClick={handleBulkDeleteCategories} className="btn-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50">
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete {selectedCategories.length}
                    </button>
                  ) : (
                    <label className="flex items-center gap-2 text-xs font-semibold text-surface-500 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="rounded border-surface-300 text-primary-500 shadow-sm focus:ring-primary-500" 
                        checked={selectedCategories.length === categories.length && categories.length > 0}
                        onChange={handleSelectAllCategories}
                      />
                      Select All
                    </label>
                  )}
                </div>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div key={cat._id} className={cn("flex items-center justify-between p-3 rounded-xl border transition-colors",
                      editingCatId === cat._id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900'
                    )}>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          className="rounded border-surface-300 text-primary-500 cursor-pointer"
                          checked={selectedCategories.includes(cat._id)}
                          onChange={() => handleSelectCategory(cat._id)}
                        />
                        <span className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-lg">{cat.icon}</span>
                        <span className="font-semibold text-sm dark:text-surface-200">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => {
                            setEditingCatId(cat._id);
                            setCatForm({ name: cat.name, icon: cat.icon });
                          }} 
                          className="p-2 text-surface-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(cat._id, cat.name)} 
                          className="p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <p className="text-sm text-surface-500 italic text-center py-4">No categories created yet.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Item Modal */}
        {showItemModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-md p-6 border border-surface-200 dark:border-surface-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold dark:text-white">{editingItemId ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
                <button onClick={() => setShowItemModal(false)} className="text-surface-400 hover:text-surface-600"><X size={20}/></button>
              </div>
              <form onSubmit={handleSaveItem} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm font-medium mb-1 block dark:text-surface-300">Item Name</label>
                    <input required className="input" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium mb-1 block dark:text-surface-300">Description</label>
                    <textarea className="input text-sm" rows="2" value={itemForm.description} onChange={e => setItemForm({...itemForm, description: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block dark:text-surface-300">Price (₹)</label>
                    <input type="number" required className="input" value={itemForm.price} onChange={e => setItemForm({...itemForm, price: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block dark:text-surface-300">Category</label>
                    <select required className="input" value={itemForm.category} onChange={e => setItemForm({...itemForm, category: e.target.value})}>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium mb-1 block dark:text-surface-300">Image (URL or Emoji)</label>
                    <input required className="input" value={itemForm.image} onChange={e => setItemForm({...itemForm, image: e.target.value})} />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 text-sm dark:text-surface-300 cursor-pointer">
                    <input type="checkbox" checked={itemForm.veg} onChange={e => setItemForm({...itemForm, veg: e.target.checked})} className="rounded text-green-500 bg-surface-800 border-surface-700" />
                    Vegetarian
                  </label>
                  <label className="flex items-center gap-2 text-sm dark:text-surface-300 cursor-pointer">
                    <input type="checkbox" checked={itemForm.popular} onChange={e => setItemForm({...itemForm, popular: e.target.checked})} className="rounded text-amber-500 bg-surface-800 border-surface-700" />
                    Popular/Hot
                  </label>
                </div>

                <button type="submit" className="w-full btn-primary mt-4">
                  {editingItemId ? 'Save Changes' : 'Add Item'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
        {/* Scanner Modal */}
        <MenuScannerModal 
          isOpen={showScannerModal} 
          onClose={() => setShowScannerModal(false)} 
          onImportSuccess={() => {
            setShowScannerModal(false);
            fetchMenuData(); // Refresh the menu lists
          }}
        />

      </AnimatePresence>

    </div>
  )
}
