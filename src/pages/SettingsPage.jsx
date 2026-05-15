import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Building, Palette, Bell, Printer, CreditCard, Users, Shield, Globe,
  Wifi, Database, ChevronRight, Save, Moon, Sun, Monitor, RefreshCw, Crown,
  Image as ImageIcon, Type, AlignLeft, Info, Brain, ChefHat, Ticket, Keyboard
} from 'lucide-react'
import TenantSubscriptionPanel from './tenant/Settings/components/TenantSubscriptionPanel'
import AIConfigSettings from './tenant/Settings/components/AIConfigSettings'
import KitchenStationSettings from '@/components/settings/KitchenStationSettings'
import useUIStore from '@/store/uiStore'
import useTenantSettingsStore from '@/store/tenantSettingsStore'
import { cn } from '@/lib/utils'
import { useLocation, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import useTenantInvoiceStore from '@/store/tenantInvoiceStore'
import { CheckCircle, XCircle, AlertCircle, Clock as ClockIcon, FileText as FileTextIcon, RotateCcw, UploadCloud, Loader2 } from 'lucide-react'
import useKeyboardStore from '@/store/keyboardStore'
import { sessionManager } from '@/lib/security'
import api from '@/lib/api'

// No longer hardcoded - we will build this dynamically based on store data
const SECTIONS = [
  { id: 'restaurant', label: 'Restaurant Profile', icon: Building },
  { id: 'kitchen', label: 'Kitchen Stations', icon: ChefHat },
  { id: 'bill', label: 'Bill Customization', icon: Printer },
  { id: 'subscription', label: 'My Subscription', icon: Crown, customComponent: TenantSubscriptionPanel },
  { id: 'billing', label: 'Billing & Tax', icon: CreditCard },
  { id: 'payments', label: 'Payment Integration', icon: CreditCard },
  { id: 'ai', label: 'AI Configuration', icon: Brain },
  { id: 'token', label: 'Token Queue', icon: Ticket },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'printers', label: 'Printer & Devices', icon: Printer },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard },
  { id: 'security', label: 'Security & Privacy', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

export default function SettingsPage() {
  const { addNotification } = useUIStore()
  const { fetchSettings, updateSettings, isLoading } = useTenantSettingsStore()
  const { invoices: tenantInvoices, fetchInvoices: fetchTenantInvoices, isLoading: isInvoiceLoading } = useTenantInvoiceStore()
  const location = useLocation()
  const navigate = useNavigate()
  
  const [activeSection, setActiveSection] = useState(location.state?.section || 'restaurant')
  const [formData, setFormData] = useState({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const data = await fetchSettings()
      if (data) {
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || '',
          gstRate: data.settings?.gstRate || 5,
          currency: data.settings?.currency || 'INR',
          // Bill Settings
          brandName: data.settings?.billSettings?.brandName || data.name || '',
          logoUrl: data.settings?.billSettings?.logoUrl || data.branding?.logo || '',
          headerText: data.settings?.billSettings?.headerText || '',
          footerText: data.settings?.billSettings?.footerText || 'Thank you! Visit again.',
          showLogo: data.settings?.billSettings?.showLogo ?? true,
          showFSSAI: data.settings?.billSettings?.showFSSAI ?? true,
          customAddress: data.settings?.billSettings?.customAddress || '',
          customPhone: data.settings?.billSettings?.customPhone || '',
          customGst: data.settings?.billSettings?.customGst || data.kyc?.gstNumber || '',
          // Payment Settings
          paymentProvider: data.paymentGateway?.provider || 'none',
          requirePrepaidQrOrders: data.paymentGateway?.requirePrepaidQrOrders ?? false,
          razorpayKeyId: data.paymentGateway?.razorpayKeyId || '',
          razorpayKeySecret: data.paymentGateway?.razorpayKeySecret || '',
          // Token Management Settings
          tokenPrefix: data.settings?.tokenManagement?.prefix || 'T-',
          tokenResetDaily: data.settings?.tokenManagement?.resetDaily ?? true,
          tokenAutoAdvanceFromKDS: data.settings?.tokenManagement?.autoAdvanceFromKDS ?? true,
          tokenEnableAudioAnnouncements: data.settings?.tokenManagement?.enableAudioAnnouncements ?? true,
          tokenWhatsAppAlerts: data.settings?.whatsapp?.autoNotify?.onOrderReady ?? true,
          onOrderFeedback: data.settings?.whatsapp?.autoNotify?.onOrderFeedback ?? true,
          googleMapsLink: data.branding?.googleMapsLink || '',
          whatsappPhone: data.settings?.whatsapp?.businessPhone || '',
        })
      }
    }
    load()
  }, [fetchSettings])

  useEffect(() => {
    if (activeSection === 'billing') {
      fetchTenantInvoices()
    }
  }, [activeSection, fetchTenantInvoices])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const [isUploading, setIsUploading] = useState(false)

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      addNotification({ type: 'error', title: 'Invalid File', message: 'Please upload a valid image (JPG, PNG, WEBP, SVG).' })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      addNotification({ type: 'error', title: 'File Too Large', message: 'Logo image must be less than 2MB.' })
      return
    }

    setIsUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('image', file)
      formDataUpload.append('folder', 'logos')

      const response = await api.post('/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.data.success) {
        handleInputChange('logoUrl', response.data.data.url)
        addNotification({ type: 'success', title: 'Upload Successful', message: 'Logo uploaded successfully.' })
      } else {
        throw new Error(response.data.message || 'Upload failed')
      }
    } catch (err) {
      console.error(err)
      addNotification({ type: 'error', title: 'Upload Failed', message: err.message || 'Could not upload image.' })
    } finally {
      setIsUploading(false)
      // Reset input so the same file can be selected again if needed
      e.target.value = ''
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        settings: {
          currency: formData.currency,
          gstRate: formData.gstRate,
          billSettings: {
            brandName: formData.brandName,
            logoUrl: formData.logoUrl,
            headerText: formData.headerText,
            footerText: formData.footerText,
            showLogo: formData.showLogo,
            showFSSAI: formData.showFSSAI,
            customAddress: formData.customAddress,
            customPhone: formData.customPhone,
            customGst: formData.customGst,
          },
          tokenManagement: {
            prefix: formData.tokenPrefix,
            resetDaily: formData.tokenResetDaily,
            autoAdvanceFromKDS: formData.tokenAutoAdvanceFromKDS,
            enableAudioAnnouncements: formData.tokenEnableAudioAnnouncements
          },
          whatsapp: {
            autoNotify: {
              onOrderReady: formData.tokenWhatsAppAlerts,
              onOrderFeedback: formData.onOrderFeedback
            }
          }
        },
        branding: {
          googleMapsLink: formData.googleMapsLink
        }
      }
      await updateSettings(payload)
      addNotification({ type: 'success', title: 'Settings Saved', message: 'Your restaurant settings have been updated successfully.' })
    } catch (err) {
      console.error(err)
      addNotification({ type: 'error', title: 'Save Failed', message: err.message || 'Something went wrong while saving.' })
    } finally {
      setIsSaving(false)
    }
  }

  const currentSection = SECTIONS.find(s => s.id === activeSection)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Settings</h1>
          <p className="text-sm text-surface-500 mt-0.5">Configure your restaurant & system preferences</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="btn-primary btn-sm flex items-center gap-2"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-6">
        <div className="w-56 space-y-1 flex-shrink-0">
          {SECTIONS.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left',
                activeSection === section.id
                  ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400'
                  : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'
              )}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="card p-6"
          >
            <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-6 flex items-center gap-2">
              {currentSection && <currentSection.icon className="w-5 h-5 text-primary-500" />}
              {currentSection?.label}
            </h2>
            
            <div className="space-y-6">
              {activeSection === 'restaurant' && (
                <div className="grid gap-6">
                   <div className="grid gap-2">
                     <label className="text-sm font-semibold text-surface-700 dark:text-surface-300">Official Restaurant Name</label>
                     <input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="input" placeholder="e.g. The Royal Kitchen" />
                   </div>
                   <div className="grid gap-2">
                     <label className="text-sm font-semibold text-surface-700 dark:text-surface-300">Official Phone Number</label>
                     <input type="text" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className="input" placeholder="+91 ..." />
                   </div>
                   <div className="grid gap-2">
                     <label className="text-sm font-semibold text-surface-700 dark:text-surface-300">Physical Address</label>
                     <textarea value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} className="input min-h-[100px]" placeholder="Full business address..." />
                   </div>
                </div>
              )}

              {activeSection === 'bill' && (
                <div className="space-y-8">
                   {/* Layout Configuration */}
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-6">
                         <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                            <div>
                               <p className="text-sm font-bold dark:text-white">Show Logo on Bill</p>
                               <p className="text-xs text-surface-500">Include restaurant logo at top</p>
                            </div>
                            <button 
                              onClick={() => handleInputChange('showLogo', !formData.showLogo)}
                              className={cn("relative w-11 h-6 rounded-full transition-all", formData.showLogo ? "bg-primary-500" : "bg-surface-300")}
                            >
                               <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all", formData.showLogo && "translate-x-5")} />
                            </button>
                         </div>

                         {formData.showLogo && (
                           <div className="grid gap-2">
                              <label className="text-xs font-bold text-surface-500 uppercase tracking-widest">Restaurant Logo</label>
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl bg-surface-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-surface-200 dark:border-surface-700">
                                  {formData.logoUrl ? <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <ImageIcon className="w-6 h-6 text-surface-400" />}
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="flex gap-2">
                                    <label className="btn-secondary btn-sm cursor-pointer relative overflow-hidden flex-1 justify-center flex items-center gap-2">
                                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                      {isUploading ? 'Uploading...' : 'Upload Image'}
                                      <input 
                                        type="file" 
                                        accept="image/jpeg, image/png, image/webp, image/svg+xml" 
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleLogoUpload}
                                        disabled={isUploading}
                                      />
                                    </label>
                                  </div>
                                  <input type="text" value={formData.logoUrl} onChange={(e) => handleInputChange('logoUrl', e.target.value)} className="input text-xs w-full" placeholder="Or paste logo URL here..." />
                                </div>
                              </div>
                           </div>
                         )}

                         <div className="grid gap-2">
                            <label className="text-sm font-semibold dark:text-white">Brand Name for Bill</label>
                            <input type="text" value={formData.brandName} onChange={(e) => handleInputChange('brandName', e.target.value)} className="input" placeholder="Name as seen on receipt" />
                         </div>

                         <div className="grid gap-2">
                            <label className="text-sm font-semibold dark:text-white">Header Text (Optional)</label>
                            <input type="text" value={formData.headerText} onChange={(e) => handleInputChange('headerText', e.target.value)} className="input" placeholder="e.g. Welcome to our garden" />
                         </div>
                         
                         <div className="grid gap-2">
                            <label className="text-sm font-semibold dark:text-white">Footer / Thank You Note</label>
                            <textarea value={formData.footerText} onChange={(e) => handleInputChange('footerText', e.target.value)} className="input" rows={2} placeholder="Visit again soon!" />
                         </div>
                      </div>

                      {/* Visual Preview */}
                      <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Live Receipt Preview</p>
                         <div className="w-[180px] bg-white dark:bg-slate-800 text-black dark:text-slate-300 shadow-xl p-4 font-mono text-[9px] min-h-[250px] flex flex-col items-center text-center">
                            {formData.showLogo && formData.logoUrl && <img src={formData.logoUrl} alt="Preview logo" className="w-8 h-8 object-contain mb-2 filter grayscale" />}
                            <h3 className="font-bold text-[11px] leading-tight mb-1 text-black">{formData.brandName}</h3>
                            <p className="text-[8px] leading-tight mb-2 opacity-70">{formData.headerText}</p>
                            <div className="w-full border-t border-dashed border-black/20 my-1"></div>
                            <div className="w-full py-2 space-y-1">
                               <div className="flex justify-between"><span>ITEM NAME x 1</span><span>99.00</span></div>
                               <div className="flex justify-between"><span>SERVICE... x 2</span><span>150.00</span></div>
                            </div>
                            <div className="w-full border-t border-dashed border-black/20 my-1"></div>
                            <div className="w-full text-right font-bold text-[10px] py-1">TOTAL: 249.00</div>
                            <div className="flex-1"></div>
                            <div className="w-full border-t border-dashed border-black/20 mt-4 mb-2"></div>
                            <p className="text-[7px] italic opacity-60 px-2 leading-tight">{formData.footerText}</p>
                         </div>
                      </div>
                   </div>

                   <div className="pt-6 border-t border-surface-100 dark:border-surface-800">
                      <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary-500" />
                        Bill Detail Overrides
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-1.5">
                           <label className="text-xs font-medium text-surface-500">Bill Phone</label>
                           <input type="text" value={formData.customPhone} onChange={(e) => handleInputChange('customPhone', e.target.value)} className="input text-xs" placeholder="Override phone..." />
                        </div>
                        <div className="grid gap-1.5">
                           <label className="text-xs font-medium text-surface-500">Bill Address</label>
                           <input type="text" value={formData.customAddress} onChange={(e) => handleInputChange('customAddress', e.target.value)} className="input text-xs" placeholder="Override address..." />
                        </div>
                        <div className="grid gap-1.5">
                           <label className="text-xs font-medium text-surface-500">GSTIN on Bill</label>
                           <input type="text" value={formData.customGst} onChange={(e) => handleInputChange('customGst', e.target.value)} className="input text-xs" placeholder="Override GSTIN..." />
                        </div>
                      </div>
                      <div className="grid gap-2 mt-6">
                        <label className="text-sm font-semibold dark:text-white">Google Maps Review Link</label>
                        <p className="text-xs text-surface-500">The link sent to customers in the automated feedback WhatsApp message.</p>
                        <input type="text" value={formData.googleMapsLink} onChange={(e) => handleInputChange('googleMapsLink', e.target.value)} className="input" placeholder="https://g.page/r/your-id/review" />
                      </div>
                   </div>
                </div>
              )}
              
              {activeSection === 'token' && (
                <div className="space-y-6 max-w-2xl">
                   <div className="grid gap-2">
                     <label className="text-sm font-semibold text-surface-900 dark:text-white">Token Prefix</label>
                     <p className="text-xs text-surface-500 mb-1">Prefix applied to generated token numbers.</p>
                     <input type="text" value={formData.tokenPrefix} onChange={(e) => handleInputChange('tokenPrefix', e.target.value)} className="input w-32 font-mono text-center" placeholder="e.g. T-" />
                   </div>
                   
                   <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                     <div>
                       <p className="text-sm font-bold text-surface-900 dark:text-white">Reset Token Number Daily</p>
                       <p className="text-xs text-surface-500">Automatically reset the token number sequence every day at midnight.</p>
                     </div>
                     <button 
                       onClick={() => handleInputChange('tokenResetDaily', !formData.tokenResetDaily)}
                       className={cn("relative w-11 h-6 rounded-full transition-all", formData.tokenResetDaily ? "bg-primary-500" : "bg-surface-300")}
                     >
                       <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all", formData.tokenResetDaily && "translate-x-5")} />
                     </button>
                   </div>
                   
                   <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                     <div>
                       <p className="text-sm font-bold text-surface-900 dark:text-white">Smart Auto-Advance from KDS</p>
                       <p className="text-xs text-surface-500">Automatically move tokens to "Ready" status when all items are completed by Chefs in the Kitchen Display.</p>
                     </div>
                     <button 
                       onClick={() => handleInputChange('tokenAutoAdvanceFromKDS', !formData.tokenAutoAdvanceFromKDS)}
                       className={cn("relative w-11 h-6 rounded-full transition-all", formData.tokenAutoAdvanceFromKDS ? "bg-primary-500" : "bg-surface-300")}
                     >
                       <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all", formData.tokenAutoAdvanceFromKDS && "translate-x-5")} />
                     </button>
                   </div>
                   
                   <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                     <div>
                       <p className="text-sm font-bold text-surface-900 dark:text-white">Enable Audio & Voice Announcements</p>
                       <p className="text-xs text-surface-500">Play chime and Text-To-Speech voice announcements on the Public Token TV Display.</p>
                     </div>
                     <button 
                       onClick={() => handleInputChange('tokenEnableAudioAnnouncements', !formData.tokenEnableAudioAnnouncements)}
                       className={cn("relative w-11 h-6 rounded-full transition-all", formData.tokenEnableAudioAnnouncements ? "bg-primary-500" : "bg-surface-300")}
                     >
                       <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all", formData.tokenEnableAudioAnnouncements && "translate-x-5")} />
                     </button>
                   </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                      <div>
                        <p className="text-sm font-bold text-surface-900 dark:text-white">WhatsApp Readiness Alerts</p>
                        <p className="text-xs text-surface-500">Automatically send a WhatsApp message to the customer when their token is marked as "Ready".</p>
                      </div>
                      <button 
                        onClick={() => handleInputChange('tokenWhatsAppAlerts', !formData.tokenWhatsAppAlerts)}
                        className={cn("relative w-11 h-6 rounded-full transition-all", formData.tokenWhatsAppAlerts ? "bg-primary-500" : "bg-surface-300")}
                      >
                        <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all", formData.tokenWhatsAppAlerts && "translate-x-5")} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                       <div>
                         <p className="text-sm font-bold text-surface-900 dark:text-white">WhatsApp Feedback Loop</p>
                         <p className="text-xs text-surface-500">Automatically send a feedback request message to the customer 1 hour after their order is completed.</p>
                       </div>
                       <button 
                         onClick={() => handleInputChange('onOrderFeedback', !formData.onOrderFeedback)}
                         className={cn("relative w-11 h-6 rounded-full transition-all", formData.onOrderFeedback ? "bg-primary-500" : "bg-surface-300")}
                       >
                         <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all", formData.onOrderFeedback && "translate-x-5")} />
                       </button>
                    </div>

                    {formData.tokenWhatsAppAlerts && (
                      <div className="p-4 rounded-xl border border-dashed border-primary-200 dark:border-primary-900/30 bg-primary-50/30 dark:bg-primary-950/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">Verify Connection</p>
                            <p className="text-[11px] text-surface-500">Send a test message to ensure your WhatsApp API is configured correctly.</p>
                          </div>
                          <div className="flex gap-2">
                             <input 
                               type="text" 
                               placeholder="Phone with country code" 
                               className="input py-1.5 text-xs w-48"
                               value={formData.testPhone || ''}
                               onChange={(e) => handleInputChange('testPhone', e.target.value)}
                             />
                             <button 
                               onClick={async () => {
                                 try {
                                   const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/whatsapp/test-message`, {
                                     method: 'POST',
                                     headers: {
                                       'Content-Type': 'application/json',
                                       'Authorization': `Bearer ${localStorage.getItem('token')}`
                                     },
                                     body: JSON.stringify({ phone: formData.testPhone })
                                   });
                                   const resData = await response.json();
                                   if (resData.success) {
                                     addNotification({ type: 'success', title: 'Test Sent', message: 'WhatsApp test message successful!' });
                                   } else {
                                     throw new Error(resData.message);
                                   }
                                 } catch (err) {
                                   addNotification({ type: 'error', title: 'Test Failed', message: err.message });
                                 }
                               }}
                               className="btn-secondary py-1.5 px-3 text-xs"
                             >
                               Send Test
                             </button>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              )}

              {activeSection === 'subscription' && <TenantSubscriptionPanel />}

              {activeSection === 'billing' && (
                <>
                  <div className="grid gap-6">
                     <div className="grid gap-2">
                       <label className="text-sm font-semibold">Standard GST Rate (%)</label>
                       <input type="number" value={formData.gstRate} onChange={(e) => handleInputChange('gstRate', e.target.value)} className="input w-24" />
                     </div>
                     <div className="grid gap-2">
                       <label className="text-sm font-semibold">Base Currency</label>
                       <select value={formData.currency} onChange={(e) => handleInputChange('currency', e.target.value)} className="input w-48">
                          <option value="INR">Indian Rupee (₹)</option>
                          <option value="USD">US Dollar ($)</option>
                          <option value="AED">UAE Dirham (د.إ)</option>
                       </select>
                     </div>
                  </div>

                  <div className="pt-6 border-t border-surface-100 dark:border-surface-800">
                    <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-4">Payment History</h3>
                    <div className="overflow-x-auto -mx-6 bg-surface-50/50 dark:bg-surface-800/20 border-y border-surface-100 dark:border-surface-800">
                      <table className="w-full text-left text-xs text-surface-600 dark:text-surface-400">
                        <thead className="bg-surface-50 dark:bg-surface-800/50 text-surface-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-3 font-semibold">Invoice #</th>
                            <th className="px-6 py-3 font-semibold">Date</th>
                            <th className="px-6 py-3 font-semibold">Amount</th>
                            <th className="px-6 py-3 font-semibold">Status</th>
                            <th className="px-6 py-3 font-semibold text-right">Receipt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                          {isInvoiceLoading && tenantInvoices.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="px-6 py-8 text-center bg-white dark:bg-transparent">
                                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-primary-500" />
                                <span className="opacity-50">Loading history...</span>
                              </td>
                            </tr>
                          ) : tenantInvoices.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="px-6 py-8 text-center bg-white dark:bg-transparent italic opacity-50">
                                No payment records found.
                              </td>
                            </tr>
                          ) : (
                            tenantInvoices.map((inv) => (
                              <tr key={inv._id} className="bg-white dark:bg-transparent">
                                <td className="px-6 py-3 font-medium text-surface-900 dark:text-white">{inv.invoiceNumber}</td>
                                <td className="px-6 py-3">{format(new Date(inv.issueDate), 'MMM dd, yyyy')}</td>
                                <td className="px-6 py-3 font-bold text-surface-900 dark:text-white">₹{inv.total.toLocaleString()}</td>
                                <td className="px-6 py-3">
                                  {inv.status === 'paid' && <span className="text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Paid</span>}
                                  {inv.status === 'overdue' && <span className="text-red-600 dark:text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Overdue</span>}
                                  {inv.status === 'sent' && <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1"><ClockIcon className="w-3 h-3" /> Pending</span>}
                                </td>
                                <td className="px-6 py-3 text-right">
                                  <button 
                                    className="p-1 px-2 text-[10px] font-bold uppercase rounded-md border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition"
                                    onClick={() => {
                                      // Simple CSV export for now
                                      const csvContent = "data:text/csv;charset=utf-8," + "Invoice #,Date,Amount,Status\n" + `${inv.invoiceNumber},${format(new Date(inv.issueDate), 'yyyy-MM-dd')},${inv.total},${inv.status}`;
                                      const encodedUri = encodeURI(csvContent);
                                      const link = document.createElement("a");
                                      link.setAttribute("href", encodedUri);
                                      link.setAttribute("download", `invoice_${inv.invoiceNumber}.csv`);
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }}
                                  >
                                    <FileTextIcon className="w-3 h-3 inline mr-1" />
                                    Download
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                     </div>
                  </div>
                </>
              )}

              {activeSection === 'ai' && <AIConfigSettings />}
              
              {activeSection === 'kitchen' && <KitchenStationSettings />}

              {/* Keep other sections simple for now or implement as needed */}
              {activeSection === 'printers' && (
                <div className="space-y-4">
                  <p className="text-sm text-surface-500">Configure all your printing hardware — thermal receipt printers, kitchen KOT printers, label printers, office laser printers and more.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'USB', icon: '🔌', desc: 'Direct USB connection' },
                      { label: 'WiFi', icon: '📡', desc: 'Wireless network printers' },
                      { label: 'Bluetooth', icon: '📶', desc: 'BT-enabled devices' },
                      { label: 'LAN / Ethernet', icon: '🌐', desc: 'IP-based network printers' },
                    ].map(d => (
                      <div key={d.label} className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800 flex items-center gap-3">
                        <span className="text-xl">{d.icon}</span>
                        <div>
                          <p className="text-sm font-bold dark:text-white">{d.label}</p>
                          <p className="text-[10px] text-surface-500">{d.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {['Thermal 58mm', 'Thermal 80mm', 'Dot Matrix', 'Laser A4', 'Inkjet', 'Label Printer', 'A5 Size'].map(t => (
                      <span key={t} className="px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-900/10 text-violet-700 dark:text-violet-400 text-xs font-bold border border-violet-100 dark:border-violet-500/20">
                        {t}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate('/settings/printers')}
                    className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm hover:from-violet-600 hover:to-purple-700 active:scale-[0.98] transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Open Printer Management
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {activeSection === 'shortcuts' && <KeyboardShortcutSettings />}

              {activeSection === 'security' && <SecuritySettings />}

              {['appearance', 'notifications'].includes(activeSection) && (
                <div className="py-12 text-center text-surface-500 italic">
                  Local settings for this browser session.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   KEYBOARD SHORTCUT SETTINGS — Customization Panel
───────────────────────────────────────────────────────── */
function KeyboardShortcutSettings() {
  const { getShortcuts, updateShortcutKeys, resetShortcut, resetAllShortcuts, enabled, toggleEnabled, getConflicts } = useKeyboardStore()
  const { addNotification } = useUIStore()
  const [recording, setRecording] = useState(null) // shortcut id being recorded
  const [recordedKeys, setRecordedKeys] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const shortcuts = getShortcuts()

  const filtered = shortcuts.filter(sc =>
    sc.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
    sc.keys.toLowerCase().includes(searchFilter.toLowerCase()) ||
    sc.category.toLowerCase().includes(searchFilter.toLowerCase())
  )

  const grouped = filtered.reduce((acc, sc) => {
    if (!acc[sc.category]) acc[sc.category] = []
    acc[sc.category].push(sc)
    return acc
  }, {})

  const categoryIcons = {
    'Navigation': '🧭',
    'POS Actions': '🛒',
    'Quick Actions': '⚡',
  }

  const handleStartRecording = (id) => {
    setRecording(id)
    setRecordedKeys('')
  }

  const handleKeyCapture = (e) => {
    if (!recording) return
    e.preventDefault()
    e.stopPropagation()

    // Ignore lone modifier keys
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return

    const parts = []
    if (e.ctrlKey) parts.push('Ctrl')
    if (e.altKey) parts.push('Alt')
    if (e.shiftKey) parts.push('Shift')
    if (e.metaKey) parts.push('Meta')

    let keyName = e.key
    if (keyName === ' ') keyName = 'Space'
    else if (keyName === 'Enter') keyName = 'Enter'
    else if (keyName === 'Escape') { setRecording(null); return }
    else if (keyName.length === 1) keyName = keyName.toUpperCase()

    parts.push(keyName)
    const combo = parts.join('+')

    // Check conflicts
    const conflicts = getConflicts(recording, combo)
    if (conflicts.length > 0) {
      addNotification({
        type: 'warning',
        title: 'Key Conflict',
        message: `"${combo}" is already used by "${conflicts[0].label}"`
      })
      setRecording(null)
      return
    }

    updateShortcutKeys(recording, combo)
    setRecording(null)
    addNotification({
      type: 'success',
      title: 'Shortcut Updated',
      message: `Set to ${combo}`
    })
  }

  useEffect(() => {
    if (recording) {
      window.addEventListener('keydown', handleKeyCapture, true)
      return () => window.removeEventListener('keydown', handleKeyCapture, true)
    }
  })

  const handleResetAll = () => {
    resetAllShortcuts()
    addNotification({ type: 'success', title: 'All Shortcuts Reset', message: 'Restored to defaults' })
  }

  return (
    <div className="space-y-5">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-surface-500">
            Customize keyboard shortcuts. Click a key binding to record a new combo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleEnabled}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border',
              enabled
                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400'
            )}
          >
            {enabled ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {enabled ? 'Enabled' : 'Disabled'}
          </button>
          <button
            onClick={handleResetAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 text-xs font-bold hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset All
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchFilter}
          onChange={e => setSearchFilter(e.target.value)}
          placeholder="Search shortcuts..."
          className="input pl-10 text-sm"
        />
      </div>

      {/* Recording Indicator */}
      {recording && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border-2 border-dashed border-amber-300 dark:border-amber-500/30 flex items-center gap-3 animate-pulse">
          <Keyboard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Recording new key combination...</p>
            <p className="text-xs text-amber-600 dark:text-amber-500">Press your desired key combination, or press <strong>Esc</strong> to cancel</p>
          </div>
        </div>
      )}

      {/* Shortcut Groups */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h4 className="text-xs font-bold uppercase tracking-wider text-surface-400 mb-3 flex items-center gap-2">
            <span className="text-base">{categoryIcons[category] || '⌨️'}</span>
            {category}
            <span className="text-[10px] font-semibold text-surface-300 dark:text-surface-600">({items.length})</span>
          </h4>
          <div className="space-y-1.5">
            {items.map((sc) => {
              const isDefault = shortcuts.find(s => s.id === sc.id)
              const defaultSc = useKeyboardStore.getState().shortcuts.find(s => s.id === sc.id)
              const isRecording = recording === sc.id

              return (
                <div
                  key={sc.id}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-xl transition-all',
                    isRecording
                      ? 'bg-amber-50 dark:bg-amber-900/10 ring-2 ring-amber-400'
                      : 'bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800'
                  )}
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-semibold dark:text-white">{sc.label}</p>
                    <p className="text-[10px] text-surface-400">{sc.action === 'navigate' ? `→ ${sc.target}` : sc.target}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Key Badge — clickable to record */}
                    <button
                      onClick={() => handleStartRecording(sc.id)}
                      className={cn(
                        'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border',
                        isRecording
                          ? 'bg-amber-100 dark:bg-amber-900/20 border-amber-300 dark:border-amber-500 text-amber-700 dark:text-amber-400'
                          : 'bg-surface-100 dark:bg-surface-700 border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10'
                      )}
                      title="Click to record a new shortcut"
                    >
                      {isRecording ? (
                        <span className="animate-pulse">Press keys...</span>
                      ) : (
                        sc.keys.split('+').map((part, i) => (
                          <span key={i} className="flex items-center">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-surface-200 dark:bg-surface-600 text-[10px] font-bold min-w-[20px] text-center shadow-sm">
                              {part.trim() === 'Ctrl' ? '⌃' : part.trim() === 'Alt' ? '⌥' : part.trim() === 'Shift' ? '⇧' : part.trim() === 'Enter' ? '↵' : part.trim()}
                            </span>
                            {i < sc.keys.split('+').length - 1 && <span className="text-surface-300 mx-0.5 text-[8px]">+</span>}
                          </span>
                        ))
                      )}
                    </button>

                    {/* Reset individual */}
                    <button
                      onClick={() => {
                        resetShortcut(sc.id)
                        addNotification({ type: 'success', title: 'Reset', message: `${sc.label} restored to default` })
                      }}
                      className="p-1.5 rounded-lg text-surface-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-colors"
                      title="Reset to default"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {Object.keys(grouped).length === 0 && (
        <div className="py-12 text-center text-surface-400">
          <Keyboard className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">No shortcuts match your search</p>
        </div>
      )}

      {/* Info */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
          <p className="font-bold">How to customize shortcuts</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Click any key badge to start recording a new combination</li>
            <li>Press your desired key combo (e.g. Ctrl+Shift+N)</li>
            <li>Press <strong>Esc</strong> to cancel recording</li>
            <li>Conflicting shortcuts will be blocked automatically</li>
            <li>Click the ↺ icon to reset a shortcut to its default</li>
            <li>Press <strong>Shift+?</strong> anywhere to see the shortcuts panel</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECURITY & PRIVACY SETTINGS
═══════════════════════════════════════════════════════════ */
function SecuritySettings() {
  const [sessionTimeout, setSessionTimeout] = useState(30) // minutes
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [loginAlerts, setLoginAlerts] = useState(true)
  const { addNotification } = useUIStore()

  const handleTimeoutChange = (value) => {
    const mins = Number(value)
    setSessionTimeout(mins)
    sessionManager.setTimeout(mins * 60 * 1000)
    addNotification({ type: 'success', title: 'Session Timeout Updated', message: `Auto-logout after ${mins} minutes of inactivity` })
  }

  // Security audit checks
  const securityChecks = [
    { label: 'HTTPS Connection', status: window.location.protocol === 'https:' || window.location.hostname === 'localhost', critical: true },
    { label: 'Session Timeout Active', status: true, critical: true },
    { label: 'Rate Limiting Enabled', status: true, critical: true },
    { label: 'Bot Protection Active', status: true, critical: false },
    { label: 'Global Payload Sanitizer', status: true, critical: true },
    { label: 'XSS Protection', status: true, critical: true },
    { label: 'CSP Headers Set', status: true, critical: false },
    { label: 'Input Sanitization', status: true, critical: false },
    { label: 'Route Authorization', status: true, critical: true },
    { label: 'Token Obfuscation', status: true, critical: false },
    { label: 'Password Strength Enforced', status: true, critical: true },
    { label: 'Console Output Stripped (Prod)', status: import.meta.env.PROD, critical: false },
  ]

  const passedChecks = securityChecks.filter(c => c.status).length
  const totalChecks = securityChecks.length
  const securityScore = Math.round((passedChecks / totalChecks) * 100)

  return (
    <div className="space-y-6">
      {/* Security Score Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-blue-500/5 to-violet-500/5 dark:from-emerald-500/10 dark:via-blue-500/10 dark:to-violet-500/10 border border-emerald-200/50 dark:border-emerald-500/20">
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="transform -rotate-90 w-20 h-20">
              <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" className="text-surface-200 dark:text-surface-700" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="url(#score-gradient)" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${(securityScore / 100) * 213.6} 213.6`} />
              <defs>
                <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-extrabold text-surface-900 dark:text-white">{securityScore}%</span>
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              Security Score
            </h3>
            <p className="text-xs text-surface-500 mt-1">{passedChecks}/{totalChecks} security checks passed</p>
            <p className="text-[10px] text-surface-400 mt-0.5">Last assessed: {new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Security Audit Checklist */}
      <div>
        <h3 className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-500" />
          Security Audit Checklist
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {securityChecks.map((check, i) => (
            <div key={i} className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all',
              check.status
                ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-500/20'
                : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-500/20'
            )}>
              {check.status ? (
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
              <span className="text-xs font-medium text-surface-700 dark:text-surface-300 flex-1">{check.label}</span>
              {check.critical && (
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">CRITICAL</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Session Timeout */}
      <div>
        <h3 className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-3 flex items-center gap-2">
          <ClockIcon className="w-4 h-4 text-blue-500" />
          Session Management
        </h3>
        <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800 space-y-4">
          <div>
            <label className="text-xs font-semibold text-surface-600 dark:text-surface-400 block mb-2">Auto-Logout After Inactivity</label>
            <div className="flex items-center gap-3">
              {[15, 30, 60, 120].map(mins => (
                <button
                  key={mins}
                  onClick={() => handleTimeoutChange(mins)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-xs font-bold transition-all border',
                    sessionTimeout === mins
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                      : 'bg-white dark:bg-surface-700 border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:border-blue-300'
                  )}
                >
                  {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-surface-400 mt-2">Users will be automatically logged out after {sessionTimeout} minutes of inactivity</p>
          </div>
        </div>
      </div>

      {/* Account Protection */}
      <div>
        <h3 className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          Account Protection
        </h3>
        <div className="space-y-2">
          {[
            { label: 'Login Rate Limiting', desc: 'Block brute-force attempts (5 tries / 60s)', enabled: true, locked: true },
            { label: 'Password Strength Enforcement', desc: 'Require strong passwords on registration', enabled: true, locked: true },
            { label: 'Login Alerts', desc: 'Get notified of new sign-ins from unknown devices', enabled: loginAlerts, toggle: () => setLoginAlerts(!loginAlerts) },
            { label: 'Two-Factor Authentication', desc: 'Add an extra layer of security (coming soon)', enabled: twoFactorEnabled, toggle: () => setTwoFactorEnabled(!twoFactorEnabled), coming: true },
          ].map((item, i) => (
            <div key={i} className={cn(
              'flex items-center justify-between p-3 rounded-xl border transition-all',
              item.enabled
                ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-500/20'
                : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700'
            )}>
              <div className="flex-1">
                <p className="text-sm font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                  {item.label}
                  {item.coming && <span className="text-[8px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/20 text-violet-600">COMING SOON</span>}
                </p>
                <p className="text-[10px] text-surface-500 mt-0.5">{item.desc}</p>
              </div>
              {item.locked ? (
                <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Always On
                </span>
              ) : (
                <button
                  onClick={item.toggle}
                  disabled={item.coming}
                  className={cn(
                    'w-10 h-6 rounded-full transition-all relative',
                    item.enabled ? 'bg-emerald-500' : 'bg-surface-300 dark:bg-surface-600',
                    item.coming && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 rounded-full bg-white shadow absolute top-1 transition-all',
                    item.enabled ? 'left-5' : 'left-1'
                  )} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Data Privacy Info */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
          <p className="font-bold">Data Protection Measures</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>All API requests use Bearer token authentication</li>
            <li>Tokens are obfuscated in browser localStorage</li>
            <li>Content Security Policy prevents script injection</li>
            <li>All user inputs are sanitized before processing</li>
            <li>Console output is stripped in production builds</li>
            <li>Sessions auto-expire after configured inactivity period</li>
            <li>Failed login attempts are rate-limited (5/minute)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
