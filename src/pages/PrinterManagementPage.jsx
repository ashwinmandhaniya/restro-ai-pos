import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Printer, Plus, Search, Wifi, Usb, Bluetooth, Network, Settings, Trash2,
  Edit3, X, CheckCircle, XCircle, Zap, FileText, Receipt, Tag,
  Monitor, ToggleLeft, ToggleRight, TestTube, ChevronRight, AlertCircle,
  Copy, RefreshCw, Signal, HardDrive, Info, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import useUIStore from '@/store/uiStore'
import api from '@/lib/api'

/* ─────────────────────────────────────────────────────────
   PRINTER TYPE CONFIGS
───────────────────────────────────────────────────────── */
const CONNECTION_TYPES = {
  usb:       { label: 'USB',       icon: Usb,       color: 'from-blue-500 to-blue-600',    badge: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' },
  wifi:      { label: 'WiFi',      icon: Wifi,      color: 'from-green-500 to-green-600',   badge: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' },
  bluetooth: { label: 'Bluetooth', icon: Bluetooth,  color: 'from-indigo-500 to-indigo-600', badge: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' },
  lan:       { label: 'LAN/IP',    icon: Network,   color: 'from-violet-500 to-violet-600', badge: 'bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400' },
}

const PRINTER_TYPES = {
  thermal:    { label: 'Thermal Receipt', icon: '🧾', desc: '58mm / 80mm rolls' },
  dotmatrix:  { label: 'Dot Matrix',      icon: '🖨️', desc: 'Impact printing' },
  laser:      { label: 'Laser',           icon: '⚡', desc: 'A4/A5 Laser' },
  inkjet:     { label: 'Inkjet',          icon: '🎨', desc: 'Color printing' },
  label:      { label: 'Label Printer',   icon: '🏷️', desc: 'Barcode & labels' },
}

const PAPER_SIZES = ['58mm', '80mm', 'A4', 'A5', 'A6', 'Label (40×30)', 'Label (60×40)', 'Custom']

const PRINT_PURPOSES = [
  { id: 'bill',    label: 'Bill / Invoice',  icon: Receipt,  desc: 'Customer receipts' },
  { id: 'kot',     label: 'KOT',             icon: FileText, desc: 'Kitchen order tickets' },
  { id: 'label',   label: 'Label / Barcode', icon: Tag,      desc: 'Item tags & barcodes' },
  { id: 'report',  label: 'Reports',         icon: Monitor,  desc: 'Daily/monthly reports' },
]

/* ─────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────── */
export default function PrinterManagementPage() {
  const [printers, setPrinters] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterConn, setFilterConn] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editPrinter, setEditPrinter] = useState(null)
  const [selectedPrinter, setSelectedPrinter] = useState(null)

  const [form, setForm] = useState({
    name: '', model: '', connection: 'usb', type: 'thermal', paperSize: '80mm',
    purposes: ['bill'], ip: '', port: '9100', copies: 1, autoPrint: true, autoKOT: false,
    cutPaper: true, printLogo: true, fontSize: 'medium'
  })

  const { addNotification, confirmAction } = useUIStore()

  // ── Fetch printers from backend ─────────────────────────
  const fetchPrinters = useCallback(async () => {
    try {
      const { data } = await api.get('/printers')
      setPrinters(data)
    } catch (err) {
      console.error('[Printers] Fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchPrinters() }, [fetchPrinters])

  const online = printers.filter(p => p.status === 'online').length
  const filtered = printers.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.model.toLowerCase().includes(search.toLowerCase())
    const matchConn = filterConn === 'all' || p.connection === filterConn
    return matchSearch && matchConn
  })

  const resetForm = () => setForm({
    name: '', model: '', connection: 'usb', type: 'thermal', paperSize: '80mm',
    purposes: ['bill'], ip: '', port: '9100', copies: 1, autoPrint: true, autoKOT: false,
    cutPaper: true, printLogo: true, fontSize: 'medium'
  })

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (editPrinter) {
        const { data } = await api.put(`/printers/${editPrinter._id}`, form)
        setPrinters(prev => prev.map(p => p._id === data._id ? data : p))
        addNotification({ type: 'success', title: 'Printer Updated', message: form.name })
      } else {
        const { data } = await api.post('/printers', form)
        setPrinters(prev => [...prev, data])
        addNotification({ type: 'success', title: 'Printer Added', message: `${form.name} registered` })
      }
      setShowAddModal(false)
      setEditPrinter(null)
      resetForm()
    } catch (err) {
      addNotification({ type: 'error', title: 'Save Failed', message: err.response?.data?.message || err.message })
    }
  }

  const handleEdit = (printer) => {
    setForm({
      name: printer.name, model: printer.model, connection: printer.connection,
      type: printer.type, paperSize: printer.paperSize, purposes: [...printer.purposes],
      ip: printer.ip, port: printer.port, copies: printer.copies,
      autoPrint: printer.autoPrint, autoKOT: printer.autoKOT,
      cutPaper: printer.cutPaper, printLogo: printer.printLogo, fontSize: printer.fontSize
    })
    setEditPrinter(printer)
    setShowAddModal(true)
  }

  const handleDelete = async (printer) => {
    const ok = await confirmAction({ title: 'Remove Printer', message: `Remove "${printer.name}"?`, confirmText: 'Remove' })
    if (ok) {
      try {
        await api.delete(`/printers/${printer._id}`)
        setPrinters(prev => prev.filter(p => p._id !== printer._id))
        if (selectedPrinter?._id === printer._id) setSelectedPrinter(null)
        addNotification({ type: 'success', title: 'Printer Removed', message: printer.name })
        // Refresh to pick up any auto-promoted default
        fetchPrinters()
      } catch (err) {
        addNotification({ type: 'error', title: 'Delete Failed', message: err.response?.data?.message || err.message })
      }
    }
  }

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/printers/${id}/default`)
      setPrinters(prev => prev.map(p => ({ ...p, isDefault: p._id === id })))
      addNotification({ type: 'success', title: 'Default Printer Set' })
    } catch (err) {
      addNotification({ type: 'error', title: 'Failed', message: err.response?.data?.message || err.message })
    }
  }

  const toggleStatus = async (id) => {
    const printer = printers.find(p => p._id === id)
    if (!printer) return
    const newStatus = printer.status === 'online' ? 'offline' : 'online'
    try {
      const { data } = await api.put(`/printers/${id}`, { status: newStatus })
      setPrinters(prev => prev.map(p => p._id === id ? data : p))
    } catch (err) {
      addNotification({ type: 'error', title: 'Status Update Failed', message: err.message })
    }
  }

  const handleTestPrint = (printer) => {
    addNotification({ type: 'info', title: '🖨️ Preparing Test Print...', message: `Opening print dialog for ${printer.name}` })
    
    // Build paper-size specific CSS
    const paperWidthMap = {
      '58mm': '58mm', '80mm': '80mm', 'A4': '210mm', 'A5': '148mm', 'A6': '105mm',
      'Label (40×30)': '40mm', 'Label (60×40)': '60mm', 'Custom': '80mm'
    }
    const paperWidth = paperWidthMap[printer.paperSize] || '80mm'
    const fontSizeMap = { small: '10px', medium: '12px', large: '14px' }
    const fontSize = fontSizeMap[printer.fontSize] || '12px'

    const testHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Print — ${printer.name}</title>
        <style>
          @page { size: ${paperWidth} auto; margin: 4mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: ${fontSize}; width: ${paperWidth}; color: #000; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; padding: 2px 0; }
          h2 { font-size: ${parseInt(fontSize) + 4}px; margin-bottom: 4px; }
          .info-grid { margin: 8px 0; }
          .info-grid div { padding: 2px 0; }
          .success { padding: 8px; border: 2px solid #000; margin: 8px 0; text-align: center; font-weight: bold; font-size: ${parseInt(fontSize) + 2}px; }
        </style>
      </head>
      <body>
        <div class="center">
          <h2>🖨️ TEST PRINT</h2>
          <p>${new Date().toLocaleString()}</p>
        </div>
        <div class="divider"></div>
        <div class="info-grid">
          <div class="row"><span>Printer:</span><span class="bold">${printer.name}</span></div>
          <div class="row"><span>Model:</span><span>${printer.model}</span></div>
          <div class="row"><span>Connection:</span><span>${(CONNECTION_TYPES[printer.connection] || {}).label || printer.connection}</span></div>
          <div class="row"><span>Type:</span><span>${(PRINTER_TYPES[printer.type] || {}).label || printer.type}</span></div>
          <div class="row"><span>Paper Size:</span><span>${printer.paperSize}</span></div>
          <div class="row"><span>Font Size:</span><span>${printer.fontSize}</span></div>
          <div class="row"><span>Copies:</span><span>${printer.copies}</span></div>
          ${printer.ip ? `<div class="row"><span>IP:</span><span>${printer.ip}:${printer.port}</span></div>` : ''}
        </div>
        <div class="divider"></div>
        <div class="center" style="margin: 6px 0;">
          <div class="row"><span>Sample Item A x 2</span><span>₹299.00</span></div>
          <div class="row"><span>Sample Item B x 1</span><span>₹149.00</span></div>
          <div class="row"><span>Sample Item C x 3</span><span>₹597.00</span></div>
        </div>
        <div class="divider"></div>
        <div class="row bold"><span>TOTAL</span><span>₹1,045.00</span></div>
        <div class="divider"></div>
        <div class="success">✅ PRINT TEST SUCCESSFUL</div>
        <div class="center">
          <p>Auto-Print: ${printer.autoPrint ? 'ON' : 'OFF'}</p>
          <p>Auto-Cut: ${printer.cutPaper ? 'ON' : 'OFF'}</p>
          <p>Logo: ${printer.printLogo ? 'ON' : 'OFF'}</p>
        </div>
        <div class="divider"></div>
        <div class="center" style="margin-top: 6px;">
          <p style="font-size: ${parseInt(fontSize) - 2}px;">POS Billing Software v2.0</p>
          <p style="font-size: ${parseInt(fontSize) - 2}px;">Printer Management Test Page</p>
        </div>
      </body>
      </html>
    `

    // Create hidden iframe for print
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:0;height:0;border:none;'
    document.body.appendChild(iframe)

    iframe.contentDocument.open()
    iframe.contentDocument.write(testHTML)
    iframe.contentDocument.close()

    // Wait for content to render, then print
    setTimeout(() => {
      try {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
        addNotification({ type: 'success', title: '✅ Test Print Sent', message: `Print dialog opened for ${printer.name}` })
      } catch (err) {
        addNotification({ type: 'error', title: 'Print Failed', message: err.message })
      }
      // Cleanup iframe after a delay
      setTimeout(() => document.body.removeChild(iframe), 3000)
    }, 500)
  }

  const togglePurpose = (purposeId) => {
    setForm(f => ({
      ...f,
      purposes: f.purposes.includes(purposeId) ? f.purposes.filter(p => p !== purposeId) : [...f.purposes, purposeId]
    }))
  }

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <Printer className="w-7 h-7 text-violet-500" />
            Printer Management
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">Configure multi-device printing — USB, WiFi, Bluetooth, LAN & more</p>
        </div>
        <button onClick={() => { resetForm(); setEditPrinter(null); setShowAddModal(true) }} className="btn-primary btn-sm">
          <Plus className="w-4 h-4 mr-1" /> Add Printer
        </button>
      </div>

      {/* ═══ STATS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Printers', value: printers.length, icon: Printer, color: 'from-violet-500 to-violet-600' },
          { label: 'Online', value: online, icon: CheckCircle, color: 'from-green-500 to-green-600' },
          { label: 'Offline', value: printers.length - online, icon: XCircle, color: 'from-red-500 to-red-600' },
          { label: 'Connection Types', value: [...new Set(printers.map(p => p.connection))].length, icon: Network, color: 'from-blue-500 to-blue-600' },
          { label: 'Print Stations', value: [...new Set(printers.map(p => p.purposes).flat())].length, icon: HardDrive, color: 'from-amber-500 to-amber-600' },
        ].map((stat, i) => (
          <div key={i} className="card p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-surface-500 uppercase tracking-wider font-semibold">{stat.label}</p>
              <p className="text-lg font-extrabold text-surface-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ SUPPORTED DEVICES BANNER ═══ */}
      <div className="card p-5 bg-gradient-to-r from-violet-500/5 via-blue-500/5 to-emerald-500/5 dark:from-violet-500/10 dark:via-blue-500/10 dark:to-emerald-500/10 border-violet-200/50 dark:border-violet-500/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 text-white flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold dark:text-white mb-2">Supported Devices & Connections</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'USB', emoji: '🔌' }, { label: 'WiFi', emoji: '📡' }, { label: 'Bluetooth', emoji: '📶' },
                { label: 'LAN/Ethernet', emoji: '🌐' }, { label: 'Thermal', emoji: '🧾' }, { label: 'Dot Matrix', emoji: '🖨️' },
                { label: 'Laser', emoji: '⚡' }, { label: 'Inkjet', emoji: '🎨' }, { label: 'Label', emoji: '🏷️' },
                { label: '58mm', emoji: '📏' }, { label: '80mm', emoji: '📐' }, { label: 'A4', emoji: '📄' },
                { label: 'A5', emoji: '📃' }, { label: 'Custom Size', emoji: '✂️' },
              ].map(d => (
                <span key={d.label} className="px-2.5 py-1 rounded-lg bg-white dark:bg-surface-800 text-xs font-semibold text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-700 shadow-sm">
                  {d.emoji} {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FILTERS ═══ */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search printers..." className="input pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFilterConn('all')}
            className={cn('px-3 py-2 rounded-lg text-xs font-bold transition-all',
              filterConn === 'all' ? 'bg-primary-500 text-white shadow-md' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400')}>
            All
          </button>
          {Object.entries(CONNECTION_TYPES).map(([key, cfg]) => (
            <button key={key} onClick={() => setFilterConn(key)}
              className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all',
                filterConn === key ? 'bg-primary-500 text-white shadow-md' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400')}>
              <cfg.icon className="w-3.5 h-3.5" />{cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ PRINTER CARDS ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((printer, i) => {
          const conn = CONNECTION_TYPES[printer.connection] || CONNECTION_TYPES.usb
          const type = PRINTER_TYPES[printer.type] || PRINTER_TYPES.thermal
          const ConnIcon = conn.icon
          return (
            <motion.div
              key={printer._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelectedPrinter(printer)}
              className={cn(
                'card p-5 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden',
                printer.isDefault && 'ring-2 ring-primary-500/50'
              )}
            >
              {/* Status indicator */}
              <div className={cn('absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold',
                printer.status === 'online'
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              )}>
                <span className={cn('w-2 h-2 rounded-full', printer.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500')} />
                {printer.status === 'online' ? 'Online' : 'Offline'}
              </div>

              {printer.isDefault && (
                <div className="absolute top-4 left-4 px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-[9px] font-bold">
                  ★ DEFAULT
                </div>
              )}

              <div className="flex items-start gap-3 mb-4 mt-2">
                <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl shadow-md', conn.color)}>
                  {type.icon}
                </div>
                <div className="flex-1 min-w-0 mt-1">
                  <h3 className="text-sm font-bold text-surface-900 dark:text-white truncate">{printer.name}</h3>
                  <p className="text-xs text-surface-500">{printer.model}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="p-2 rounded-lg bg-surface-50 dark:bg-surface-800 text-center">
                  <p className="text-[9px] text-surface-500 uppercase">Connection</p>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <ConnIcon className="w-3 h-3 text-surface-600 dark:text-surface-400" />
                    <span className="text-xs font-bold">{conn.label}</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-surface-50 dark:bg-surface-800 text-center">
                  <p className="text-[9px] text-surface-500 uppercase">Type</p>
                  <p className="text-xs font-bold mt-0.5">{type.label}</p>
                </div>
                <div className="p-2 rounded-lg bg-surface-50 dark:bg-surface-800 text-center">
                  <p className="text-[9px] text-surface-500 uppercase">Paper</p>
                  <p className="text-xs font-bold mt-0.5">{printer.paperSize}</p>
                </div>
              </div>

              {/* Purposes */}
              <div className="flex flex-wrap gap-1.5">
                {printer.purposes.map(p => {
                  const purpose = PRINT_PURPOSES.find(pp => pp.id === p)
                  return purpose ? (
                    <span key={p} className="px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/10 text-violet-700 dark:text-violet-400 text-[10px] font-bold border border-violet-100 dark:border-violet-500/20">
                      {purpose.label}
                    </span>
                  ) : null
                })}
                {printer.autoPrint && (
                  <span className="px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 text-[10px] font-bold border border-green-100 dark:border-green-500/20">
                    Auto-Print
                  </span>
                )}
              </div>

              {/* Quick Actions */}
              <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-800 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={(e) => { e.stopPropagation(); handleTestPrint(printer) }}
                  className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors">
                  <TestTube className="w-3 h-3 inline mr-1" />Test
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleEdit(printer) }}
                  className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition-colors">
                  <Edit3 className="w-3 h-3 inline mr-1" />Edit
                </button>
                <button onClick={(e) => { e.stopPropagation(); toggleStatus(printer._id) }}
                  className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100 transition-colors">
                  <Signal className="w-3 h-3 inline mr-1" />{printer.status === 'online' ? 'Off' : 'On'}
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {filtered.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-surface-400">
          <Printer className="w-14 h-14 mb-3 opacity-20" />
          <p className="text-base font-semibold">{printers.length === 0 ? 'No printers configured' : 'No printers match filters'}</p>
          <p className="text-sm mt-1">{printers.length === 0 ? 'Add your first printer to get started' : 'Try adjusting your search or filter'}</p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      )}

      {/* ═══ PRINTER DETAIL DRAWER ═══ */}
      <AnimatePresence>
        {selectedPrinter && (
          <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedPrinter(null)}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-white dark:bg-surface-900 shadow-2xl overflow-y-auto"
            >
              {/* Header */}
              <div className={cn('p-6 text-white relative bg-gradient-to-br', (CONNECTION_TYPES[selectedPrinter.connection] || CONNECTION_TYPES.usb).color)}>
                <button onClick={() => setSelectedPrinter(null)} className="absolute top-4 right-4 p-2 rounded-xl bg-white/20 hover:bg-white/30">
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl backdrop-blur-sm">
                    {(PRINTER_TYPES[selectedPrinter.type] || PRINTER_TYPES.thermal).icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold">{selectedPrinter.name}</h3>
                    <p className="text-sm opacity-80">{selectedPrinter.model}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn('px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm',
                        selectedPrinter.status === 'online' ? 'bg-green-500/30' : 'bg-red-500/30'
                      )}>
                        {selectedPrinter.status === 'online' ? '● Online' : '● Offline'}
                      </span>
                      {selectedPrinter.isDefault && (
                        <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-sm">★ Default</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Connection & Print Info */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Connection', value: (CONNECTION_TYPES[selectedPrinter.connection] || CONNECTION_TYPES.usb).label },
                    { label: 'Printer Type', value: (PRINTER_TYPES[selectedPrinter.type] || PRINTER_TYPES.thermal).label },
                    { label: 'Paper Size', value: selectedPrinter.paperSize },
                    { label: 'Copies', value: `${selectedPrinter.copies}x` },
                    { label: 'Font Size', value: selectedPrinter.fontSize },
                    { label: 'Auto Cut', value: selectedPrinter.cutPaper ? 'Yes' : 'No' },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                      <p className="text-[10px] text-surface-500 uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-bold dark:text-white mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* IP / Network */}
                {(selectedPrinter.connection === 'lan' || selectedPrinter.connection === 'wifi') && selectedPrinter.ip && (
                  <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                    <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Network Configuration</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-surface-500">IP Address</span>
                        <span className="font-mono font-bold dark:text-white">{selectedPrinter.ip}</span>
                      </div>
                      {selectedPrinter.port && (
                        <div className="flex justify-between text-sm">
                          <span className="text-surface-500">Port</span>
                          <span className="font-mono font-bold dark:text-white">{selectedPrinter.port}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Purposes */}
                <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                  <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Print Stations</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPrinter.purposes.map(p => {
                      const purpose = PRINT_PURPOSES.find(pp => pp.id === p)
                      return purpose ? (
                        <span key={p} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/10 text-violet-700 dark:text-violet-400 font-bold text-xs border border-violet-100 dark:border-violet-500/20">
                          <purpose.icon className="w-3.5 h-3.5" />{purpose.label}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>

                {/* Feature Toggles */}
                <div className="space-y-3">
                  {[
                    { label: 'Auto-Print Bills', value: selectedPrinter.autoPrint },
                    { label: 'Auto-Print KOT', value: selectedPrinter.autoKOT },
                    { label: 'Print Logo', value: selectedPrinter.printLogo },
                    { label: 'Paper Auto-Cut', value: selectedPrinter.cutPaper },
                  ].map((toggle, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                      <span className="text-sm font-semibold dark:text-surface-300">{toggle.label}</span>
                      {toggle.value ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-bold">
                          <CheckCircle className="w-4 h-4" /> Enabled
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-surface-400 text-xs font-bold">
                          <XCircle className="w-4 h-4" /> Disabled
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button onClick={() => handleTestPrint(selectedPrinter)}
                    className="py-3 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-blue-500/25">
                    <TestTube className="w-4 h-4 inline mr-1.5" />Test Print
                  </button>
                  <button onClick={() => { handleSetDefault(selectedPrinter._id); setSelectedPrinter(null) }}
                    className="py-3 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 active:scale-95 transition-all shadow-lg shadow-amber-500/25">
                    <CheckCircle className="w-4 h-4 inline mr-1.5" />Set Default
                  </button>
                  <button onClick={() => { handleEdit(selectedPrinter); setSelectedPrinter(null) }}
                    className="py-3 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 font-bold text-sm hover:bg-surface-200 dark:hover:bg-surface-700 active:scale-95 transition-all">
                    <Edit3 className="w-4 h-4 inline mr-1.5" />Edit
                  </button>
                  <button onClick={() => { handleDelete(selectedPrinter); setSelectedPrinter(null) }}
                    className="py-3 rounded-xl border-2 border-red-200 dark:border-red-800 text-red-500 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 transition-all">
                    <Trash2 className="w-4 h-4 inline mr-1.5" />Remove
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ ADD / EDIT PRINTER MODAL ═══ */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => { setShowAddModal(false); setEditPrinter(null); resetForm() }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-surface-200 dark:border-surface-800">
              <div className="sticky top-0 bg-white dark:bg-surface-900 z-10 flex justify-between items-center p-6 pb-4 border-b border-surface-100 dark:border-surface-800">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                  <Printer className="w-5 h-5 text-violet-500" />
                  {editPrinter ? 'Edit Printer' : 'Add New Printer'}
                </h3>
                <button onClick={() => { setShowAddModal(false); setEditPrinter(null); resetForm() }}
                  className="p-2 rounded-lg text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5">
                {/* Name & Model */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block dark:text-surface-300">Printer Name *</label>
                    <input required placeholder="e.g. POS Counter" className="input"
                      value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block dark:text-surface-300">Model</label>
                    <input placeholder="e.g. Epson TM-T82X" className="input"
                      value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
                  </div>
                </div>

                {/* Connection Type */}
                <div>
                  <label className="text-sm font-semibold mb-2 block dark:text-surface-300">Connection Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(CONNECTION_TYPES).map(([key, cfg]) => (
                      <button key={key} type="button" onClick={() => setForm({ ...form, connection: key })}
                        className={cn('p-3 rounded-xl text-center transition-all border-2',
                          form.connection === key
                            ? `border-primary-500 bg-primary-50 dark:bg-primary-900/10 shadow-md`
                            : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 hover:border-surface-300'
                        )}>
                        <cfg.icon className={cn('w-5 h-5 mx-auto mb-1', form.connection === key ? 'text-primary-600' : 'text-surface-500')} />
                        <span className="text-[10px] font-bold">{cfg.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* IP/Port for network printers */}
                {(form.connection === 'lan' || form.connection === 'wifi') && (
                  <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                    <div className="col-span-2">
                      <label className="text-xs font-semibold mb-1 block dark:text-surface-300">IP Address</label>
                      <input placeholder="192.168.1.xxx" className="input text-sm"
                        value={form.ip} onChange={e => setForm({ ...form, ip: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block dark:text-surface-300">Port</label>
                      <input placeholder="9100" className="input text-sm"
                        value={form.port} onChange={e => setForm({ ...form, port: e.target.value })} />
                    </div>
                  </div>
                )}

                {/* Printer Type */}
                <div>
                  <label className="text-sm font-semibold mb-2 block dark:text-surface-300">Printer Type</label>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(PRINTER_TYPES).map(([key, cfg]) => (
                      <button key={key} type="button" onClick={() => setForm({ ...form, type: key })}
                        className={cn('p-3 rounded-xl text-center transition-all border-2',
                          form.type === key
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 shadow-md'
                            : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 hover:border-surface-300'
                        )}>
                        <span className="text-xl block mb-1">{cfg.icon}</span>
                        <span className="text-[9px] font-bold leading-tight block">{cfg.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paper Size */}
                <div>
                  <label className="text-sm font-semibold mb-2 block dark:text-surface-300">Paper Size</label>
                  <div className="flex flex-wrap gap-2">
                    {PAPER_SIZES.map(size => (
                      <button key={size} type="button" onClick={() => setForm({ ...form, paperSize: size })}
                        className={cn('px-3 py-2 rounded-lg text-xs font-bold transition-all border',
                          form.paperSize === size
                            ? 'bg-primary-500 text-white border-primary-500 shadow-md'
                            : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400'
                        )}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Print Purpose */}
                <div>
                  <label className="text-sm font-semibold mb-2 block dark:text-surface-300">Print Purpose</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRINT_PURPOSES.map(purpose => (
                      <button key={purpose.id} type="button" onClick={() => togglePurpose(purpose.id)}
                        className={cn('flex items-center gap-2 p-3 rounded-xl text-left transition-all border-2',
                          form.purposes.includes(purpose.id)
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                            : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800'
                        )}>
                        <purpose.icon className={cn('w-4 h-4 flex-shrink-0', form.purposes.includes(purpose.id) ? 'text-primary-600' : 'text-surface-400')} />
                        <div>
                          <p className="text-xs font-bold">{purpose.label}</p>
                          <p className="text-[9px] text-surface-400">{purpose.desc}</p>
                        </div>
                        {form.purposes.includes(purpose.id) && <CheckCircle className="w-4 h-4 text-primary-500 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block dark:text-surface-300">Copies</label>
                    <input type="number" min="1" max="5" className="input"
                      value={form.copies} onChange={e => setForm({ ...form, copies: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block dark:text-surface-300">Font Size</label>
                    <select className="input" value={form.fontSize} onChange={e => setForm({ ...form, fontSize: e.target.value })}>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'autoPrint', label: 'Auto-Print Bills' },
                    { key: 'autoKOT', label: 'Auto-Print KOT' },
                    { key: 'cutPaper', label: 'Paper Auto-Cut' },
                    { key: 'printLogo', label: 'Print Logo' },
                  ].map(toggle => (
                    <button key={toggle.key} type="button" onClick={() => setForm({ ...form, [toggle.key]: !form[toggle.key] })}
                      className={cn('flex items-center justify-between p-3 rounded-xl border transition-all',
                        form[toggle.key]
                          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-500/20'
                          : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700'
                      )}>
                      <span className="text-xs font-semibold">{toggle.label}</span>
                      {form[toggle.key] ? (
                        <ToggleRight className="w-6 h-6 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-surface-400" />
                      )}
                    </button>
                  ))}
                </div>

                <button type="submit" className="w-full btn-primary py-3 font-bold">
                  {editPrinter ? 'Update Printer' : 'Add Printer'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
