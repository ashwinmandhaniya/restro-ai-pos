import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QrCode, Plus, Trash2, Download, Copy, Eye, EyeOff, Zap, X, Search, Filter, TrendingUp, BarChart3, ExternalLink } from 'lucide-react'
import useQRStore from '@/store/qrStore'
import useTableStore from '@/store/tableStore'
import useUIStore from '@/store/uiStore'
import { cn } from '@/lib/utils'

export default function QRManagementPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedQRs, setSelectedQRs] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [createForm, setCreateForm] = useState({ type: 'table', tableId: '', label: '', expiresAt: '' })

  const { qrCodes, analytics, isLoading, fetchQRCodes, fetchAnalytics, generateQR, bulkGenerate, updateQR, deleteQR } = useQRStore()
  const { tables, fetchTables } = useTableStore()
  const { addNotification, confirmAction } = useUIStore()

  useEffect(() => {
    fetchQRCodes()
    fetchAnalytics()
    fetchTables()
  }, [fetchQRCodes, fetchAnalytics, fetchTables])

  const filtered = qrCodes.filter(qr => {
    const matchesSearch = qr.label?.toLowerCase().includes(searchQuery.toLowerCase()) || qr.slug.includes(searchQuery)
    const matchesType = filterType === 'all' || qr.type === filterType
    return matchesSearch && matchesType
  })

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await generateQR({
        type: createForm.type,
        tableId: createForm.type === 'table' ? createForm.tableId : undefined,
        label: createForm.label || undefined,
        expiresAt: createForm.expiresAt || undefined
      })
      addNotification({ type: 'success', title: 'QR Created', message: 'New QR code generated successfully.' })
      setShowCreateModal(false)
      setCreateForm({ type: 'table', tableId: '', label: '', expiresAt: '' })
      fetchAnalytics()
    } catch (err) {
      addNotification({ type: 'error', title: 'Creation Failed', message: err.response?.data?.message || err.message })
    }
  }

  const handleBulkGenerate = async () => {
    try {
      const result = await bulkGenerate()
      addNotification({ type: 'success', title: 'Bulk Generation', message: result.message })
      fetchAnalytics()
    } catch (err) {
      addNotification({ type: 'error', title: 'Bulk Failed', message: err.response?.data?.message || err.message })
    }
  }

  const handleToggleActive = async (qr) => {
    try {
      await updateQR(qr._id, { isActive: !qr.isActive })
      addNotification({ type: 'info', title: 'Status Updated', message: `QR is now ${!qr.isActive ? 'active' : 'disabled'}.` })
    } catch (err) {
      addNotification({ type: 'error', title: 'Update Failed', message: err.message })
    }
  }

  const handleDelete = async (id) => {
    const confirmed = await confirmAction({
      title: 'Delete QR Code',
      message: 'This QR code will be permanently removed and will stop working.',
      confirmText: 'Delete'
    })
    if (confirmed) {
      try {
        await deleteQR(id)
        addNotification({ type: 'success', title: 'Deleted', message: 'QR code removed.' })
        fetchAnalytics()
      } catch (err) {
        addNotification({ type: 'error', title: 'Delete Failed', message: err.message })
      }
    }
  }

  const handleBulkDelete = async () => {
    const confirmed = await confirmAction({
      title: 'Bulk Delete QR Codes',
      message: `Delete ${selectedQRs.length} selected QR codes? They will stop working immediately.`,
      confirmText: 'Delete All'
    })
    if (confirmed) {
      try {
        await Promise.all(selectedQRs.map(id => deleteQR(id)))
        addNotification({ type: 'success', title: 'Bulk Deleted', message: 'Selected QR codes removed.' })
        setSelectedQRs([])
        fetchAnalytics()
      } catch (err) {
        addNotification({ type: 'error', title: 'Partial Failure', message: 'Some QR codes could not be deleted.' })
      }
    }
  }

  const handleSelectAll = (e) => {
    setSelectedQRs(e.target.checked ? filtered.map(q => q._id) : [])
  }

  const handleSelect = (id) => {
    setSelectedQRs(prev => prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id])
  }

  const copyLink = (url) => {
    navigator.clipboard.writeText(url)
    addNotification({ type: 'success', title: 'Copied', message: 'QR link copied to clipboard.' })
  }

  const downloadQR = (qrImage, label) => {
    const link = document.createElement('a')
    link.href = qrImage
    link.download = `${(label || 'qr').replace(/\s+/g, '_')}.png`
    link.click()
  }

  const typeBadge = (type) => {
    const map = {
      table: { label: '🪑 Table', cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
      takeaway: { label: '🛍️ Takeaway', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
      campaign: { label: '🎯 Campaign', cls: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
      room: { label: '🏨 Room', cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
    }
    const cfg = map[type] || map.table
    return <span className={cn('badge text-[10px] font-bold', cfg.cls)}>{cfg.label}</span>
  }

  // Get tables without QR codes for the create dropdown
  const tablesWithoutQR = tables.filter(t => !t.qrCodeId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">QR Code Manager</h1>
          <p className="text-sm text-surface-500 mt-0.5">{qrCodes.length} QR codes • Contactless ordering system</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleBulkGenerate} className="btn-secondary btn-sm">
            <Zap className="w-4 h-4 mr-1.5" /> Auto-Generate All
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary btn-sm">
            <Plus className="w-4 h-4 mr-1.5" /> Create QR
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total QR Codes', value: analytics.totalQRCodes, icon: QrCode, color: 'text-surface-600' },
            { label: 'Active', value: analytics.activeQRCodes, icon: Eye, color: 'text-green-600 dark:text-green-400' },
            { label: 'Total Scans', value: analytics.totalScans, icon: BarChart3, color: 'text-blue-600 dark:text-blue-400' },
            { label: "Today's Scans", value: analytics.todayScans, icon: TrendingUp, color: 'text-purple-600 dark:text-purple-400' },
            { label: "Today's Orders", value: analytics.todayOrders, icon: Zap, color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Conversion', value: `${analytics.conversionRate}%`, icon: TrendingUp, color: 'text-primary-600 dark:text-primary-400' },
          ].map(stat => (
            <div key={stat.label} className="card p-4 text-center">
              <stat.icon className={cn('w-5 h-5 mx-auto mb-2 opacity-60', stat.color)} />
              <p className={cn('text-xl font-bold font-mono', stat.color)}>{stat.value}</p>
              <p className="text-[10px] text-surface-500 mt-1 uppercase tracking-wider font-semibold">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + Filters + Bulk Actions */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search QR codes..." className="input pl-10" />
        </div>
        <div className="flex gap-1.5">
          {['all', 'table', 'takeaway', 'campaign'].map(type => (
            <button key={type} onClick={() => setFilterType(type)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all',
                filterType === type
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-500'
              )}>
              {type}
            </button>
          ))}
        </div>
        {selectedQRs.length > 0 ? (
          <button onClick={handleBulkDelete} className="btn-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold px-4 py-2 rounded-full flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Delete {selectedQRs.length}
          </button>
        ) : (
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-100 dark:bg-surface-800 text-xs font-semibold text-surface-500 cursor-pointer">
            <input type="checkbox" className="rounded border-surface-300 text-primary-500"
              checked={selectedQRs.length === filtered.length && filtered.length > 0}
              onChange={handleSelectAll} />
            Select All
          </label>
        )}
      </div>

      {/* QR Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-20 text-surface-500">Loading QR codes...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-20 text-surface-500 flex flex-col items-center">
            <QrCode className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">No QR codes found</p>
            <p className="text-xs mt-1">Create one or auto-generate for all tables</p>
          </div>
        ) : filtered.map((qr, index) => (
          <motion.div key={qr._id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={cn('card overflow-hidden group transition-all',
              !qr.isActive && 'opacity-60',
              selectedQRs.includes(qr._id) && 'ring-2 ring-primary-500'
            )}>
            {/* QR Image */}
            <div className="relative bg-white p-6 flex items-center justify-center border-b border-surface-100 dark:border-surface-800">
              <img src={qr.qrImage} alt={qr.label} className="w-36 h-36 rounded-lg" />
              {!qr.isActive && (
                <div className="absolute inset-0 bg-surface-900/40 flex items-center justify-center backdrop-blur-sm">
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">DISABLED</span>
                </div>
              )}
              <div className="absolute top-3 left-3">
                <input type="checkbox" className="w-4 h-4 rounded border-surface-300 text-primary-500"
                  checked={selectedQRs.includes(qr._id)}
                  onChange={() => handleSelect(qr._id)} />
              </div>
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-surface-900 dark:text-white">{qr.label || 'Unnamed QR'}</h3>
                  <p className="text-[10px] text-surface-400 font-mono mt-0.5">{qr.slug}</p>
                </div>
                {typeBadge(qr.type)}
              </div>

              {qr.tableId && (
                <div className="text-xs text-surface-500">
                  Table: <span className="font-semibold text-surface-700 dark:text-surface-300">{qr.tableId.name}</span>
                  {' • '}{qr.tableId.floor}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-surface-500">
                <span>📊 {qr.scanCount} scans</span>
                {qr.lastScannedAt && (
                  <span>Last: {new Date(qr.lastScannedAt).toLocaleDateString()}</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-surface-100 dark:border-surface-800">
                <button onClick={() => handleToggleActive(qr)}
                  className={cn('p-2 rounded-lg text-xs transition-all',
                    qr.isActive
                      ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                      : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                  )} title={qr.isActive ? 'Deactivate' : 'Activate'}>
                  {qr.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => copyLink(qr.qrUrl)}
                  className="p-2 rounded-lg text-surface-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all" title="Copy Link">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => downloadQR(qr.qrImage, qr.label)}
                  className="p-2 rounded-lg text-surface-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all" title="Download">
                  <Download className="w-4 h-4" />
                </button>
                <a href={qr.qrUrl} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-lg text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all" title="Preview">
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button onClick={() => handleDelete(qr._id)}
                  className="p-2 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all ml-auto" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create QR Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-md p-6 border border-surface-200 dark:border-surface-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold dark:text-white">Create QR Code</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-surface-400 hover:text-surface-600"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block dark:text-surface-300">QR Type</label>
                  <select className="input" value={createForm.type}
                    onChange={e => setCreateForm({ ...createForm, type: e.target.value, tableId: '' })}>
                    <option value="table">🪑 Table QR</option>
                    <option value="takeaway">🛍️ Takeaway QR</option>
                    <option value="campaign">🎯 Campaign QR</option>
                    <option value="room">🏨 Room QR</option>
                  </select>
                </div>

                {createForm.type === 'table' && (
                  <div>
                    <label className="text-sm font-medium mb-1 block dark:text-surface-300">Select Table</label>
                    <select required className="input" value={createForm.tableId}
                      onChange={e => setCreateForm({ ...createForm, tableId: e.target.value })}>
                      <option value="">-- Choose a table --</option>
                      {tablesWithoutQR.map(t => (
                        <option key={t._id} value={t._id}>{t.name} ({t.floor})</option>
                      ))}
                    </select>
                    {tablesWithoutQR.length === 0 && (
                      <p className="text-xs text-amber-500 mt-1">All tables already have QR codes.</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-1 block dark:text-surface-300">Label (Optional)</label>
                  <input className="input" placeholder="e.g. Table 5 - Rooftop Section"
                    value={createForm.label} onChange={e => setCreateForm({ ...createForm, label: e.target.value })} />
                </div>

                {createForm.type === 'campaign' && (
                  <div>
                    <label className="text-sm font-medium mb-1 block dark:text-surface-300">Expires At (Optional)</label>
                    <input type="datetime-local" className="input"
                      value={createForm.expiresAt} onChange={e => setCreateForm({ ...createForm, expiresAt: e.target.value })} />
                  </div>
                )}

                <button type="submit" className="w-full btn-primary mt-2">
                  <QrCode className="w-4 h-4 mr-2" /> Generate QR Code
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
