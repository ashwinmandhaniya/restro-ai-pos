import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, Phone, Star, Crown, Award, Medal, Gift, MessageSquare, Plus, TrendingUp, Trash2, CheckSquare, X, Settings } from 'lucide-react'
import { customers as mockCustomers } from '@/data/analyticsData'
import { formatCurrency, cn, getInitials } from '@/lib/utils'
import useUIStore from '@/store/uiStore'
import useCustomerStore from '@/store/customerStore'
import LoyaltySettingsModal from '@/components/crm/LoyaltySettingsModal'
import AdjustPointsModal from '@/components/crm/AdjustPointsModal'

const loyaltyColors = {
  Platinum: { bg: 'bg-gradient-to-r from-slate-400 to-slate-600', text: 'text-slate-100' },
  Gold: { bg: 'bg-gradient-to-r from-amber-400 to-amber-600', text: 'text-amber-100' },
  Silver: { bg: 'bg-gradient-to-r from-gray-300 to-gray-500', text: 'text-gray-100' },
  Bronze: { bg: 'bg-gradient-to-r from-orange-400 to-orange-700', text: 'text-orange-100' },
}

const loyaltyIcons = {
  Platinum: Crown,
  Gold: Star,
  Silver: Award,
  Bronze: Medal,
}

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [showLoyaltySettings, setShowLoyaltySettings] = useState(false)
  const [adjustCustomerPoints, setAdjustCustomerPoints] = useState(null)
  
  const [category, setCategory] = useState('all')
  const { addNotification, confirmAction } = useUIStore()
  
  const { customers: remoteCustomers, fetchCustomers } = useCustomerStore()

  useEffect(() => {
    fetchCustomers()
  }, [])

  // Fallback to mock customers if DB is empty for demo purposes
  const [cList, setCList] = useState(mockCustomers)

  useEffect(() => {
    if (remoteCustomers.length > 0) {
      setCList(remoteCustomers)
    }
  }, [remoteCustomers])

  const [addForm, setAddForm] = useState({ name: '', phone: '', email: '' })
  const [offerForm, setOfferForm] = useState({ title: '', discount: '', message: '' })

  const filtered = cList.filter(c => {
    const searchMatch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
    let catMatch = true
    if (category === 'top') catMatch = c.totalSpent >= 30000
    if (category === 'frequent') catMatch = c.visits >= 20
    if (category === 'at_risk') catMatch = c.visits > 5 && c.visits < 15
    if (category === 'new') catMatch = c.visits <= 5
    return searchMatch && catMatch
  })

  // ... rest of event handlers
  const handleSelectAll = () => {
    if (selectedItems.length === filtered.length && filtered.length > 0) {
      setSelectedItems([])
    } else {
      setSelectedItems(filtered.map(c => c.id || c._id))
    }
  }

  const handleSelect = (e, id) => {
    e.stopPropagation()
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    )
  }

  const handleBulkAction = async (actionType) => {
    if (actionType === 'delete') {
      const isConfirmed = await confirmAction({ 
        title: 'Delete Customers', 
        message: `Are you sure you want to remove ${selectedItems.length} customers?`,
        confirmText: 'Remove'
      })
      if (isConfirmed) {
        addNotification({ type: 'success', title: 'Customers Removed', message: `Successfully removed ${selectedItems.length} customers.` })
        setSelectedItems([])
      }
    } else {
      addNotification({ type: 'success', title: 'Action Successful', message: `Bulk action sent for ${selectedItems.length} customers.` })
      setSelectedItems([])
    }
  }

  const handleAddCustomer = (e) => {
    e.preventDefault();
    const newCustomer = {
      id: Date.now().toString(),
      name: addForm.name,
      phone: addForm.phone,
      email: addForm.email,
      loyalty: 'Bronze',
      visits: 0,
      totalSpent: 0,
      loyaltyPoints: 0,
      favorite: 'None',
      lastVisit: 'Never' // Brand new!
    }
    setCList([newCustomer, ...cList])
    setShowAddModal(false)
    setAddForm({ name: '', phone: '', email: '' })
    addNotification({ type: 'success', title: 'Customer Added', message: `${newCustomer.name} has been enrolled in the system.` })
  }

  const handleSendOffer = (e) => {
    e.preventDefault();
    setShowOfferModal(false);
    setOfferForm({ title: '', discount: '', message: '' })
    
    // Check if sending broadly or specific ones selected
    const targetCount = selectedItems.length > 0 ? selectedItems.length : cList.length
    addNotification({ type: 'success', title: 'Offer Sent', message: `Dispatched offer to ${targetCount} customers successfully!` })
    if (selectedItems.length > 0) setSelectedItems([])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Customers & CRM</h1>
          <p className="text-sm text-surface-500 mt-0.5">Manage customer relationships & loyalty</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowLoyaltySettings(true)} className="btn-secondary btn-sm bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20 hover:bg-violet-100 dark:hover:bg-violet-500/20"><Settings className="w-4 h-4 mr-1" /> Loyalty Rules</button>
          <button onClick={() => setShowOfferModal(true)} className="btn-secondary btn-sm"><Gift className="w-4 h-4" /> Send Offer</button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm"><Plus className="w-4 h-4" /> Add Customer</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Customers', value: cList.length, icon: Users, color: 'from-blue-500 to-blue-600' },
          { label: 'Platinum Members', value: cList.filter(c => c.loyalty === 'Platinum').length, icon: Crown, color: 'from-slate-500 to-slate-600' },
          { label: 'Total Revenue', value: formatCurrency(cList.reduce((s, c) => s + c.totalSpent, 0)), icon: TrendingUp, color: 'from-green-500 to-green-600' },
          { label: 'Avg Visit Value', value: formatCurrency(Math.round(cList.reduce((s, c) => s + c.totalSpent / Math.max(1, c.visits), 0) / Math.max(1, cList.length))), icon: Star, color: 'from-amber-500 to-amber-600' },
        ].map((stat, i) => (
          <div key={i} className="card p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color} text-white`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-surface-500">{stat.label}</p>
              <p className="text-lg font-bold text-surface-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone..." className="input pl-10" />
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSelectAll}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
          >
            <CheckSquare className="w-4 h-4" />
            {selectedItems.length === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select All'}
          </button>
          
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 mr-2 border-l pl-4 border-surface-200 dark:border-surface-700">
                {selectedItems.length} selected
              </span>
              <button onClick={() => handleBulkAction('offer')} className="btn-secondary btn-sm bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800">
                <Gift className="w-4 h-4 mr-1" /> Bulk Offer
              </button>
              <button onClick={() => handleBulkAction('delete')} className="btn-secondary btn-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category Segment Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {[
          { id: 'all', label: 'All Customers' },
          { id: 'top', label: '⭐ Top Buyers (₹30k+)' },
          { id: 'frequent', label: '🔄 Frequent (20+ visits)' },
          { id: 'new', label: '🌱 New / Occasional' },
          { id: 'at_risk', label: '⚠️ At Risk (Slipping)' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn('whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all',
              category === cat.id 
                ? 'bg-primary-500 text-white shadow-md' 
                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((customer, i) => {
          const LoyaltyIcon = loyaltyIcons[customer.loyalty]
          const loyaltyStyle = loyaltyColors[customer.loyalty]
          return (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedCustomer(customer)}
              className={cn('card p-5 cursor-pointer hover:scale-[1.02] transition-all relative overflow-hidden group',
                selectedItems.includes(customer.id) ? 'ring-2 ring-primary-500 bg-primary-50/10 dark:bg-primary-900/10' : '',
                selectedCustomer?.id === customer.id && !selectedItems.includes(customer.id) && 'ring-2 ring-surface-300')}
            >
              <div 
                className={cn('absolute top-3 right-3 z-10 transition-opacity', 
                  selectedItems.includes(customer.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                )}
                onClick={(e) => handleSelect(e, customer.id)}
              >
                <input 
                  type="checkbox" 
                  checked={selectedItems.includes(customer.id)}
                  readOnly
                  className="w-5 h-5 rounded border-surface-300 text-primary-500 focus:ring-primary-500 cursor-pointer shadow-sm"
                />
              </div>

              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold">
                  {getInitials(customer.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-surface-900 dark:text-white truncate">{customer.name}</h3>
                  <p className="text-xs text-surface-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />{customer.phone}
                  </p>
                </div>
                <div className={cn('px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1', loyaltyStyle.bg, loyaltyStyle.text)}>
                  <LoyaltyIcon className="w-3 h-3" />
                  {customer.loyalty}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-surface-50 dark:bg-surface-800">
                  <p className="text-xs text-surface-500">Visits</p>
                  <p className="text-sm font-bold font-mono">{customer.visits}</p>
                </div>
                <div className="p-2 rounded-lg bg-surface-50 dark:bg-surface-800">
                  <p className="text-xs text-surface-500">Spent</p>
                  <p className="text-sm font-bold font-mono">{formatCurrency(customer.totalSpent)}</p>
                </div>
                <div className="p-2 rounded-lg bg-surface-50 dark:bg-surface-800">
                  <p className="text-xs text-surface-500">Points</p>
                  <p className="text-sm font-bold font-mono text-amber-500">{customer.loyaltyPoints || customer.points || 0}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-surface-500">
                <span>Fav: {customer.favorite || 'None'}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setAdjustCustomerPoints(customer); }}
                  className="px-2 py-1 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold rounded-lg hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors border border-violet-100 dark:border-violet-500/20"
                >
                  Adjust Points
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Add Customer Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-md p-6 border border-surface-200 dark:border-surface-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold dark:text-white">Register Customer</h3>
                <button onClick={() => setShowAddModal(false)} className="text-surface-400 hover:text-surface-600"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block dark:text-surface-300">Full Name</label>
                  <input required placeholder="E.g. Vikram Sharma" className="input" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block dark:text-surface-300">Phone Number</label>
                  <input required type="tel" placeholder="+91" className="input" value={addForm.phone} onChange={e => setAddForm({...addForm, phone: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block dark:text-surface-300">Email Address (Optional)</label>
                  <input type="email" placeholder="vikram@example.com" className="input" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} />
                </div>
                <button type="submit" className="w-full btn-primary mt-2">Add Customer</button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Send Offer Modal */}
        {showOfferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-md p-6 border border-surface-200 dark:border-surface-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold dark:text-white">Blast Promotion</h3>
                <button onClick={() => setShowOfferModal(false)} className="text-surface-400 hover:text-surface-600"><X className="w-5 h-5"/></button>
              </div>
              {selectedItems.length > 0 && (
                <div className="mb-4 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 p-3 rounded-lg text-sm font-semibold border border-primary-100 dark:border-primary-800">
                  Targeting {selectedItems.length} selected customer(s).
                </div>
              )}
              <form onSubmit={handleSendOffer} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm font-medium mb-1 block dark:text-surface-300">Offer Title</label>
                    <input required placeholder="E.g. Diwali Special" className="input" value={offerForm.title} onChange={e => setOfferForm({...offerForm, title: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block dark:text-surface-300">Discount</label>
                    <input required placeholder="15% OFF" className="input" value={offerForm.discount} onChange={e => setOfferForm({...offerForm, discount: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block dark:text-surface-300">Message (SMS/Email)</label>
                  <textarea rows="3" required className="input" placeholder="Hi {{name}}, enjoy 15% off your next visit!" value={offerForm.message} onChange={e => setOfferForm({...offerForm, message: e.target.value})}></textarea>
                </div>
                <button type="submit" className="w-full btn-primary mt-2">Send to Customers</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LoyaltySettingsModal 
        isOpen={showLoyaltySettings} 
        onClose={() => setShowLoyaltySettings(false)} 
      />
      
      <AdjustPointsModal 
        isOpen={!!adjustCustomerPoints} 
        onClose={() => setAdjustCustomerPoints(null)} 
        customer={adjustCustomerPoints} 
      />

    </div>
  )
}
