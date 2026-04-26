import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, ArrowLeft, Save, Check, AlertCircle,
  Smartphone, Key, Globe, Bell, Loader2, Wifi, WifiOff, ChevronRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import useUIStore from '@/store/uiStore'
import { cn } from '@/lib/utils'

const providers = [
  { id: 'none',       name: 'Not Configured', desc: 'WhatsApp deep links only (no API)', icon: '🔗' },
  { id: 'meta_cloud', name: 'Meta Cloud API',  desc: 'Official WhatsApp Business API',    icon: '📱' },
  { id: 'twilio',     name: 'Twilio',          desc: 'Twilio WhatsApp Business',           icon: '☁️' },
  { id: 'gupshup',    name: 'Gupshup',         desc: 'Gupshup WhatsApp API',              icon: '💬' },
]

const templateEvents = [
  { key: 'orderConfirmation', label: 'Order Confirmation', dot: 'bg-blue-500',    icon: '✅', color: 'blue' },
  { key: 'orderReady',         label: 'Order Ready',        dot: 'bg-amber-500',   icon: '🔔', color: 'amber' },
  { key: 'orderCompleted',     label: 'Order Completed',    dot: 'bg-emerald-500', icon: '🎉', color: 'emerald' },
]

const autoNotifyEvents = [
  { key: 'onOrderPlaced', label: 'Order Placed', desc: 'Send confirmation when customer places an order', emoji: '✅' },
  { key: 'onOrderReady',  label: 'Order Ready',  desc: 'Notify when food is ready for pickup/serve',     emoji: '🔔' },
  { key: 'onOrderServed', label: 'Order Served', desc: 'Send thank-you message after serving',           emoji: '🎉' },
]

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      aria-checked={value}
      role="switch"
      className={cn(
        'relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none',
        value ? 'bg-[#25D366]' : 'bg-surface-200 dark:bg-surface-700'
      )}
    >
      <span className={cn(
        'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200',
        value ? 'translate-x-5' : 'translate-x-0.5'
      )} />
    </button>
  )
}

function Card({ children, className = '' }) {
  return (
    <div className={cn(
      'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl overflow-hidden',
      className
    )}>
      {children}
    </div>
  )
}

function CardHeader({ icon, title, description, right }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-surface-100 dark:border-surface-800">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-surface-900 dark:text-white truncate">{title}</h3>
          {description && <p className="text-xs text-surface-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  )
}

function TextInput({ label, type = 'text', placeholder, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1.5">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:border-primary-500 dark:focus:border-primary-400 text-surface-900 dark:text-white placeholder-surface-400 rounded-xl px-4 py-2.5 outline-none transition-colors text-sm"
      />
    </div>
  )
}

export default function WhatsAppSettingsPage() {
  const navigate = useNavigate()
  const { addNotification } = useUIStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    enabled: false,
    provider: 'none',
    apiKey: '',
    phoneNumberId: '',
    businessPhone: '',
    templateNamespace: '',
    templates: {
      orderConfirmation: { name: 'order_confirmed', body: "✅ *Order Confirmed!*\n\nOrder ID: *{{orderId}}*\nItems: {{itemCount}}\nTotal: ₹{{total}}\n\nYour food is being prepared. We'll notify you when it's ready!" },
      orderReady:        { name: 'order_ready',     body: "🔔 *Your Order is Ready!*\n\nOrder ID: *{{orderId}}*\n\nPlease collect your order. Enjoy your meal! 😊" },
      orderCompleted:    { name: 'order_completed', body: "🎉 *Thank you for dining with us!*\n\nOrder ID: *{{orderId}}*\nTotal: ₹{{total}}\n\nWe hope you enjoyed your meal. See you again soon! ❤️" }
    },
    autoNotify: { onOrderPlaced: true, onOrderReady: true, onOrderServed: false }
  })

  useEffect(() => {
    api.get('/tenant/settings').then(res => {
      const wa = res.data.data?.settings?.whatsapp
      if (wa) {
        const normalized = { ...wa }
        if (normalized.templates && typeof normalized.templates.orderConfirmation === 'string') {
          normalized.templates = {
            orderConfirmation: { name: normalized.templates.orderConfirmation, body: settings.templates.orderConfirmation.body },
            orderReady:        { name: normalized.templates.orderReady,        body: settings.templates.orderReady.body },
            orderCompleted:    { name: normalized.templates.orderCompleted,     body: settings.templates.orderCompleted.body }
          }
        }
        setSettings(prev => ({ ...prev, ...normalized }))
      }
    }).catch(err => console.error(err)).finally(() => setIsLoading(false))
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await api.put('/tenant/settings', { 'settings.whatsapp': settings })
      addNotification({ type: 'success', title: 'Saved!', message: 'WhatsApp settings updated successfully.' })
    } catch (err) {
      addNotification({ type: 'error', title: 'Save Failed', message: err.response?.data?.message || err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (path, value) => {
    setSettings(prev => {
      const keys = path.split('.')
      const next = { ...prev }
      let obj = next
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] }
        obj = obj[keys[i]]
      }
      obj[keys[keys.length - 1]] = value
      return next
    })
  }

  const isConnected = settings.enabled && settings.provider !== 'none' && settings.apiKey

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="-m-6 flex flex-col" style={{ minHeight: 'calc(100vh - 4rem)' }}>

      {/* ── Sticky Header ── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-900/60 backdrop-blur-md">
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#25D366]/15 flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
            </div>
            <h1 className="text-lg font-bold text-surface-900 dark:text-white">WhatsApp Integration</h1>
          </div>
          <p className="text-xs text-surface-500 mt-0.5 ml-8">Configure automated order notifications via WhatsApp</p>
        </div>

        {/* Connection status pill */}
        <div className={cn(
          'hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
          isConnected
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30'
            : 'bg-surface-100 text-surface-500 border border-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:border-surface-700'
        )}>
          {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isConnected ? 'Connected' : 'Not Connected'}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-primary-600/20"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto bg-surface-50 dark:bg-surface-950">
        <div className="px-6 py-6 space-y-4">

          {/* 1. Enable Toggle */}
          <Card>
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-[#25D366]/10 dark:bg-[#25D366]/15 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-[#25D366]" />
                </div>
                <div>
                  <p className="font-semibold text-surface-900 dark:text-white text-sm">Enable WhatsApp Notifications</p>
                  <p className="text-xs text-surface-500 mt-0.5">Send automated order updates to customers</p>
                </div>
              </div>
              <Toggle value={settings.enabled} onChange={v => updateField('enabled', v)} />
            </div>
          </Card>

          {/* 2. Provider */}
          <Card>
            <CardHeader
              icon={<Globe className="w-4 h-4 text-blue-500" />}
              title="Provider"
              description="Select your WhatsApp messaging service"
            />
            <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {providers.map(p => {
                const isActive = settings.provider === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => updateField('provider', p.id)}
                    className={cn(
                      'relative p-3.5 rounded-xl border-2 text-left transition-all',
                      isActive
                        ? 'border-[#25D366] bg-[#25D366]/5 dark:bg-[#25D366]/10'
                        : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600 bg-white dark:bg-surface-800/40'
                    )}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{p.icon}</span>
                        <p className={cn('text-sm font-semibold leading-tight', isActive ? 'text-[#25D366]' : 'text-surface-900 dark:text-white')}>
                          {p.name}
                        </p>
                      </div>
                      {isActive && (
                        <div className="w-4 h-4 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-surface-500 leading-tight">{p.desc}</p>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* 3. API Credentials – shown only when provider is active */}
          <AnimatePresence>
            {settings.provider !== 'none' && (
              <motion.div
                key="api-creds"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader
                    icon={<Key className="w-4 h-4 text-amber-500" />}
                    title="API Credentials"
                    description="Your provider authentication details"
                  />
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <TextInput
                        label="API Key / Auth Token"
                        type="password"
                        placeholder="Enter your API key"
                        value={settings.apiKey}
                        onChange={e => updateField('apiKey', e.target.value)}
                      />
                      <TextInput
                        label={settings.provider === 'meta_cloud' ? 'Phone Number ID' : 'Account SID'}
                        placeholder={settings.provider === 'meta_cloud' ? 'Phone Number ID' : 'Account SID'}
                        value={settings.phoneNumberId}
                        onChange={e => updateField('phoneNumberId', e.target.value)}
                      />
                      <TextInput
                        label="Business Phone Number"
                        placeholder="91XXXXXXXXXX"
                        value={settings.businessPhone}
                        onChange={e => updateField('businessPhone', e.target.value)}
                      />
                      <TextInput
                        label="Template Namespace"
                        placeholder="Your namespace"
                        value={settings.templateNamespace}
                        onChange={e => updateField('templateNamespace', e.target.value)}
                      />
                    </div>
                    <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        API keys are stored encrypted. Make sure your WhatsApp Business Account has approved message templates configured.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 4. Message Templates – shown only when provider is active */}
          <AnimatePresence>
            {settings.provider !== 'none' && (
              <motion.div
                key="templates"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader
                    icon={<Smartphone className="w-4 h-4 text-purple-500" />}
                    title="Message Templates"
                    description="Configure message body for each notification type"
                    right={
                      <div className="bg-surface-100 dark:bg-surface-800 px-2.5 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700">
                        <p className="text-[10px] font-bold text-surface-500 mb-1">Variables</p>
                        <div className="flex gap-1 flex-wrap">
                          {['{{orderId}}', '{{total}}'].map(v => (
                            <code key={v} className="text-[10px] bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 px-1.5 py-0.5 rounded">{v}</code>
                          ))}
                        </div>
                      </div>
                    }
                  />
                  <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {templateEvents.map(({ key, label, dot, icon }) => (
                      <div key={key} className="bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-700/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-base leading-none">{icon}</span>
                          <div className={cn('w-1.5 h-1.5 rounded-full', dot)} />
                          <span className="text-sm font-semibold text-surface-900 dark:text-white">{label}</span>
                        </div>
                        <div className="space-y-2.5">
                          <div>
                            <label className="block text-[10px] font-bold text-surface-400 uppercase tracking-wide mb-1">Template Name (Meta Cloud)</label>
                            <input
                              className="w-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:border-primary-500 text-surface-900 dark:text-white rounded-lg px-3 py-2 outline-none transition-colors text-xs"
                              value={settings.templates[key].name}
                              onChange={e => updateField(`templates.${key}.name`, e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-surface-400 uppercase tracking-wide mb-1">Message Body (Twilio / Gupshup)</label>
                            <textarea
                              className="w-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:border-primary-500 text-surface-900 dark:text-white rounded-lg px-3 py-2 outline-none transition-colors text-xs resize-none font-mono"
                              rows={3}
                              value={settings.templates[key].body}
                              onChange={e => updateField(`templates.${key}.body`, e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 5. Auto-Notifications */}
          <Card>
            <CardHeader
              icon={<Bell className="w-4 h-4 text-emerald-500" />}
              title="Auto-Notifications"
              description="Choose which events trigger automatic WhatsApp messages"
            />
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              {autoNotifyEvents.map(item => (
                <div key={item.key} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="text-lg w-6 text-center">{item.emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-white">{item.label}</p>
                      <p className="text-xs text-surface-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <Toggle
                    value={settings.autoNotify[item.key]}
                    onChange={v => updateField(`autoNotify.${item.key}`, v)}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* 6. Connection Status */}
          <Card>
            <div className="flex items-center gap-4 p-5">
              <div className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0',
                isConnected
                  ? 'bg-emerald-100 dark:bg-emerald-500/15'
                  : 'bg-surface-100 dark:bg-surface-800'
              )}>
                {isConnected
                  ? <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  : <AlertCircle className="w-5 h-5 text-surface-400" />
                }
              </div>
              <div className="flex-1">
                <p className={cn('text-sm font-semibold', isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-surface-600 dark:text-surface-400')}>
                  {isConnected ? 'WhatsApp Connected' : 'Not Connected'}
                </p>
                <p className="text-xs text-surface-500 mt-0.5">
                  {isConnected
                    ? `Active via ${providers.find(p => p.id === settings.provider)?.name}`
                    : 'Customers can still use WhatsApp deep links for ordering'}
                </p>
              </div>
              {isConnected && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}
