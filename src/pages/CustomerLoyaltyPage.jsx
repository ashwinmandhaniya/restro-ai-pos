import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Crown, Star, Award, Medal, TrendingUp, Users, Search,
  Settings, Coins, Phone, X, 
  Sparkles, Trophy, Heart, BarChart3, Filter, ShieldCheck
} from 'lucide-react'
import { formatCurrency, cn, getInitials } from '@/lib/utils'
import useUIStore from '@/store/uiStore'
import useCustomerStore from '@/store/customerStore'
import LoyaltySettingsModal from '@/components/crm/LoyaltySettingsModal'
import AdjustPointsModal from '@/components/crm/AdjustPointsModal'

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const TIER_CONFIG = {
  Platinum: { icon: Crown,  color: 'from-slate-400 to-slate-600',   badge: 'bg-gradient-to-r from-slate-400 to-slate-600 text-white',   ring: 'ring-slate-400',   min: 30000, multiplier: '3x' },
  Gold:     { icon: Star,   color: 'from-amber-400 to-amber-600',   badge: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white',   ring: 'ring-amber-400',   min: 10000, multiplier: '2x' },
  Silver:   { icon: Award,  color: 'from-gray-300 to-gray-500',     badge: 'bg-gradient-to-r from-gray-300 to-gray-500 text-white',     ring: 'ring-gray-400',    min: 5000,  multiplier: '1.5x' },
  Bronze:   { icon: Medal,  color: 'from-orange-400 to-orange-700', badge: 'bg-gradient-to-r from-orange-400 to-orange-700 text-white', ring: 'ring-orange-400',  min: 0,     multiplier: '1x' },
}



/* ─────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────── */
export default function CustomerLoyaltyPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [showLoyaltySettings, setShowLoyaltySettings] = useState(false)
  const [adjustCustomerPoints, setAdjustCustomerPoints] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const { addNotification } = useUIStore()
  const { customers: remoteCustomers, fetchCustomers } = useCustomerStore()

  useEffect(() => { fetchCustomers() }, [])

  const cList = remoteCustomers

  // Compute stats
  const totalPoints = cList.reduce((s, c) => s + (c.loyaltyPoints || c.points || 0), 0)
  const totalMembers = cList.length
  const tierCounts = {
    Platinum: cList.filter(c => (c.loyaltyTier || c.loyalty) === 'Platinum').length,
    Gold: cList.filter(c => (c.loyaltyTier || c.loyalty) === 'Gold').length,
    Silver: cList.filter(c => (c.loyaltyTier || c.loyalty) === 'Silver').length,
    Bronze: cList.filter(c => (c.loyaltyTier || c.loyalty) === 'Bronze').length,
  }
  const avgPointsPerCustomer = totalMembers > 0 ? Math.round(totalPoints / totalMembers) : 0

  const filtered = cList.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
    const matchTier = tierFilter === 'all' || (c.loyaltyTier || c.loyalty) === tierFilter
    return matchSearch && matchTier
  }).sort((a, b) => (b.loyaltyPoints || b.points || 0) - (a.loyaltyPoints || a.points || 0))

  const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'members', label: 'Members', icon: Users },
  ]

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-500" />
            Customer Loyalty
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">Manage rewards, tiers, and customer engagement</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLoyaltySettings(true)}
            className="btn-secondary btn-sm bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20 hover:bg-violet-100"
          >
            <Settings className="w-4 h-4 mr-1" /> Program Rules
          </button>
        </div>
      </div>

      {/* ═══ TAB NAVIGATION ═══ */}
      <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
              activeTab === tab.id
                ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm'
                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Members', value: totalMembers, icon: Users, color: 'from-blue-500 to-blue-600', sub: `${tierCounts.Platinum} Platinum` },
                { label: 'Points in Circulation', value: totalPoints.toLocaleString(), icon: Coins, color: 'from-amber-500 to-amber-600', sub: `Avg ${avgPointsPerCustomer}/member` },
                { label: 'Rewards Redeemed', value: '0', icon: Crown, color: 'from-green-500 to-green-600', sub: 'This month' },
                { label: 'Retention Rate', value: 'N/A', icon: Heart, color: 'from-rose-500 to-rose-600', sub: '+0% vs last month' },
              ].map((stat, i) => (
                <div key={i} className="card p-5 relative overflow-hidden group hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">{stat.label}</p>
                      <p className="text-2xl font-extrabold mt-1 text-surface-900 dark:text-white">{stat.value}</p>
                      <p className="text-xs text-surface-400 mt-0.5">{stat.sub}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity" 
                       style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }} />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              {/* Tier Distribution */}
              <div className="card p-6">
                <h3 className="text-base font-bold dark:text-white mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-violet-500" />
                  Tier Distribution
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(TIER_CONFIG).map(([tier, config]) => {
                    const count = tierCounts[tier] || 0
                    const pct = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0
                    const TierIcon = config.icon
                    return (
                      <div key={tier} className="flex items-center gap-3 p-4 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-md`}>
                          <TierIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold dark:text-white">{tier}</span>
                            <span className="text-xs font-mono text-surface-500">{count} ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className={`h-full rounded-full bg-gradient-to-r ${config.color}`}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
                  <p className="text-xs text-surface-400">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    Multiplier shows points earned per currency unit
                  </p>
                </div>
              </div>
            </div>

            {/* Top Earners */}
            <div className="card p-6">
              <h3 className="text-base font-bold dark:text-white mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                Top Loyalty Members
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {cList.length > 0 ? [...cList].sort((a, b) => (b.loyaltyPoints || b.points || 0) - (a.loyaltyPoints || a.points || 0)).slice(0, 4).map((c, i) => {
                  const tier = TIER_CONFIG[c.loyaltyTier || c.loyalty] || TIER_CONFIG.Bronze
                  const TierIcon = tier.icon
                  const pts = c.loyaltyPoints || c.points || 0
                  return (
                    <div key={c.id || c._id} className="flex items-center gap-3 p-4 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold">
                          {getInitials(c.name)}
                        </div>
                        {i === 0 && <span className="absolute -top-1 -right-1 text-lg">👑</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold dark:text-white truncate">{c.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold', tier.badge)}>
                            {c.loyaltyTier || c.loyalty || 'Bronze'}
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                            {pts.toLocaleString()} pts
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                }) : (
                  <p className="text-sm text-surface-500 col-span-4">No loyalty members found.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'members' && (
          <motion.div key="members" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search members by name or phone..."
                  className="input pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                {['all', 'Platinum', 'Gold', 'Silver', 'Bronze'].map(tier => {
                  const config = tier !== 'all' ? TIER_CONFIG[tier] : null
                  const TierIcon = config?.icon || Filter
                  return (
                    <button
                      key={tier}
                      onClick={() => setTierFilter(tier)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all',
                        tierFilter === tier
                          ? (tier === 'all'
                            ? 'bg-primary-500 text-white shadow-md'
                            : cn('text-white shadow-md', config?.badge))
                          : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                      )}
                    >
                      <TierIcon className="w-3.5 h-3.5" />
                      {tier === 'all' ? 'All' : tier}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((customer, i) => {
                const loyaltyVal = customer.loyaltyTier || customer.loyalty || 'Bronze'
                const tier = TIER_CONFIG[loyaltyVal] || TIER_CONFIG.Bronze
                const TierIcon = tier.icon
                const pts = customer.loyaltyPoints || customer.points || 0
                return (
                  <motion.div
                    key={customer.id || customer._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="card p-5 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    {/* Tier stripe */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${tier.color}`} />

                    <div className="flex items-start gap-3 mb-4">
                      <div className={cn('w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold ring-2', tier.ring)}>
                        {getInitials(customer.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-surface-900 dark:text-white truncate">{customer.name}</h3>
                        <p className="text-xs text-surface-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />{customer.phone}
                        </p>
                      </div>
                      <div className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1', tier.badge)}>
                        <TierIcon className="w-3 h-3" />
                        {loyaltyVal}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-surface-50 dark:bg-surface-800">
                        <p className="text-[10px] text-surface-500 uppercase tracking-wider">Points</p>
                        <p className="text-base font-extrabold font-mono text-amber-600 dark:text-amber-400">{pts.toLocaleString()}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-surface-50 dark:bg-surface-800">
                        <p className="text-[10px] text-surface-500 uppercase tracking-wider">Visits</p>
                        <p className="text-base font-extrabold font-mono">{customer.visits}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-surface-50 dark:bg-surface-800">
                        <p className="text-[10px] text-surface-500 uppercase tracking-wider">Spent</p>
                        <p className="text-base font-extrabold font-mono text-green-600 dark:text-green-400">{formatCurrency(customer.totalSpent)}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] text-surface-400">
                        Last: {customer.lastVisit || 'N/A'}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setAdjustCustomerPoints(customer) }}
                        className="px-3 py-1.5 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold text-xs rounded-lg hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors border border-violet-100 dark:border-violet-500/20"
                      >
                        <Coins className="w-3 h-3 inline mr-1" />
                        Adjust Points
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-surface-400">
                <Users className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-base font-semibold">No members found</p>
                <p className="text-sm mt-1">Try adjusting your filter or search</p>
              </div>
            )}
          </motion.div>
        )}


      </AnimatePresence>

      {/* ═══ CUSTOMER DETAIL DRAWER ═══ */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedCustomer(null)}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-white dark:bg-surface-900 shadow-2xl overflow-y-auto"
            >
              {/* Header */}
              <div className={`p-6 bg-gradient-to-br ${(TIER_CONFIG[selectedCustomer.loyalty] || TIER_CONFIG.Bronze).color} text-white`}>
                <button onClick={() => setSelectedCustomer(null)} className="absolute top-4 right-4 p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-all">
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
                    {getInitials(selectedCustomer.name)}
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold">{selectedCustomer.name}</h3>
                    <p className="text-sm opacity-80 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3.5 h-3.5" />{selectedCustomer.phone}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-3 py-1 rounded-full bg-white/20 text-sm font-bold flex items-center gap-1 backdrop-blur-sm">
                        {(() => { const T = TIER_CONFIG[selectedCustomer.loyaltyTier || selectedCustomer.loyalty] || TIER_CONFIG.Bronze; return <T.icon className="w-4 h-4" /> })()}
                        {selectedCustomer.loyaltyTier || selectedCustomer.loyalty || 'Bronze'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Points balance */}
                <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200/50 dark:border-amber-500/20">
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Loyalty Points Balance</p>
                  <p className="text-4xl font-black text-amber-600 dark:text-amber-400 font-mono">
                    {(selectedCustomer.loyaltyPoints || selectedCustomer.points || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-surface-500 mt-1">
                    ≈ {formatCurrency((selectedCustomer.loyaltyPoints || selectedCustomer.points || 0) * 1)} redemption value
                  </p>
                  <button
                    onClick={() => setAdjustCustomerPoints(selectedCustomer)}
                    className="mt-4 px-6 py-2.5 bg-violet-600 text-white font-bold text-sm rounded-xl hover:bg-violet-700 active:scale-95 transition-all shadow-lg shadow-violet-500/25"
                  >
                    <Coins className="w-4 h-4 inline mr-1.5" />
                    Adjust Points
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800 text-center">
                    <p className="text-xs text-surface-500">Total Visits</p>
                    <p className="text-2xl font-extrabold font-mono mt-1">{selectedCustomer.visits}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800 text-center">
                    <p className="text-xs text-surface-500">Total Spent</p>
                    <p className="text-2xl font-extrabold font-mono mt-1 text-green-600 dark:text-green-400">{formatCurrency(selectedCustomer.totalSpent)}</p>
                  </div>
                </div>

                {/* Tier Progress */}
                <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                  <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3">Tier Progress</p>
                  <div className="space-y-2">
                    {Object.entries(TIER_CONFIG).reverse().map(([tier, config]) => {
                      const TierIcon = config.icon
                      const isCurrent = (selectedCustomer.loyaltyTier || selectedCustomer.loyalty || 'Bronze') === tier
                      const isAchieved = selectedCustomer.totalSpent >= config.min
                      return (
                        <div key={tier} className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
                          isCurrent && 'bg-white dark:bg-surface-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-500/30',
                          !isAchieved && 'opacity-40'
                        )}>
                          <TierIcon className="w-4 h-4" />
                          <span className="text-sm font-semibold flex-1">{tier}</span>
                          <span className="text-xs font-mono text-surface-500">₹{config.min.toLocaleString()}+</span>
                          {isAchieved && <span className="text-green-500 text-xs">✓</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Favorite */}
                {selectedCustomer.favorite && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-500/20">
                    <Heart className="w-5 h-5 text-rose-500" />
                    <div>
                      <p className="text-xs text-rose-500 font-semibold">Favorite Dish</p>
                      <p className="text-sm font-bold dark:text-white">{selectedCustomer.favorite}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <LoyaltySettingsModal isOpen={showLoyaltySettings} onClose={() => setShowLoyaltySettings(false)} />
      <AdjustPointsModal isOpen={!!adjustCustomerPoints} onClose={() => setAdjustCustomerPoints(null)} customer={adjustCustomerPoints} />
    </div>
  )
}
