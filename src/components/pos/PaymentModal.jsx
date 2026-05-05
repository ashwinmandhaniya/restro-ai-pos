import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, CreditCard, Smartphone, Banknote, Wallet, Check, Printer, Share2, SplitSquareHorizontal } from 'lucide-react'
import useUIStore from '@/store/uiStore'
import useOrderStore from '@/store/orderStore'
import useCartStore from '@/store/cartStore'
import useTenantSettingsStore from '@/store/tenantSettingsStore' // New store import
import { formatCurrency, generateOrderId } from '@/lib/utils'

const paymentMethods = [
  { id: 'cash', label: 'Cash', icon: Banknote, color: 'bg-green-500' },
  { id: 'upi', label: 'UPI', icon: Smartphone, color: 'bg-purple-500' },
  { id: 'card', label: 'Card', icon: CreditCard, color: 'bg-blue-500' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, color: 'bg-orange-500' },
]

export default function PaymentModal() {
  const { setShowPaymentModal, addNotification } = useUIStore()
  const { 
    getTotal, getSubtotal, getDiscountAmount, getTax, getItemCount, 
    items, table, orderType, clearCart, activeOrderId 
  } = useCartStore()
  const { restaurantSettings } = useTenantSettingsStore() // Get dynamic settings
  
  const [selectedMethod, setSelectedMethod] = useState('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [orderId] = useState(generateOrderId())
  const [realOrderId, setRealOrderId] = useState('')
  const [tokenNumber, setTokenNumber] = useState('')

  const total = getTotal()
  const change = cashReceived ? parseFloat(cashReceived) - total : 0

  const { createOrder, updateOrder } = useOrderStore()

  const handlePayment = async () => {
    setIsProcessing(true)
    
    try {
      const oType = useCartStore.getState().orderType || 'dine-in';
      const mappedType = oType === 'takeaway' ? 'Takeaway' : (oType === 'delivery' ? 'Delivery' : 'Dine-in');

      const orderPayload = {
        tableId: table ? table._id : undefined,
        type: mappedType,
        items: items.map(i => ({ 
           menuItem: i._id || i.id, 
           name: i.name,
           quantity: i.quantity, 
           price: i.price, 
           note: i.note,
           status: 'served'
        })),
        subtotal: getSubtotal(),
        discount: getDiscountAmount(),
        gst: getTax().total,
        total: total,
        paymentStatus: 'paid',
        paymentMethod: selectedMethod,
        status: 'completed'
      }
      let finalOrder;
      if (activeOrderId) {
        finalOrder = await updateOrder(activeOrderId, orderPayload)
      } else {
        finalOrder = await createOrder(orderPayload)
      }
      
      setRealOrderId(finalOrder.orderId || finalOrder._id.slice(-6).toUpperCase())
      if (finalOrder.tokenId) {
        setTokenNumber(finalOrder.tokenId.tokenNumber || finalOrder.tokenId)
      }

      setIsProcessing(false)
      setIsComplete(true)
      addNotification({ type: 'success', title: 'Payment Successful!', message: `Order #${finalOrder.orderId} Token: ${finalOrder.tokenId?.tokenNumber || 'N/A'}` })
    } catch(err) {
      console.error(err)
      setIsProcessing(false)
      addNotification({ type: 'error', title: 'Payment Failed', message: 'Could not connect to server' })
    }
  }
  
  const handlePrint = () => {
    window.print()
  }

  const handleDone = () => {
    clearCart()
    setShowPaymentModal(false)
  }

  const quickCashAmounts = [500, 1000, 2000, 5000]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg mx-4 bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {!isComplete ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-surface-100 dark:border-surface-700">
              <div>
                <h2 className="text-lg font-bold text-surface-900 dark:text-white">Payment</h2>
                <p className="text-sm text-surface-500">{orderId} • {getItemCount()} items</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Amount */}
            <div className="p-5 text-center bg-surface-50 dark:bg-surface-900">
              <p className="text-sm text-surface-500 mb-1">Total Amount</p>
              <p className="text-4xl font-bold font-mono text-surface-900 dark:text-white">{formatCurrency(total)}</p>
              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-surface-400">
                <span>Sub: {formatCurrency(getSubtotal())}</span>
                {getDiscountAmount() > 0 && <span className="text-green-500">-{formatCurrency(getDiscountAmount())}</span>}
                <span>Tax: {formatCurrency(getTax().total)}</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {paymentMethods.map(({ id, label, icon: Icon, color }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedMethod(id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-150 ${
                      selectedMethod === id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                        : 'border-surface-200 dark:border-surface-600 hover:border-surface-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${color} text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold">{label}</span>
                  </button>
                ))}
              </div>

              {/* Cash Input */}
              {selectedMethod === 'cash' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-surface-500 mb-1 block">Cash Received</label>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder="Enter amount"
                      className="input text-center text-xl font-mono font-bold py-3"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    {quickCashAmounts.map(amt => (
                      <button
                        key={amt}
                        onClick={() => setCashReceived(String(amt))}
                        className="flex-1 py-2 rounded-lg bg-surface-100 dark:bg-surface-700 text-sm font-semibold 
                                   hover:bg-surface-200 dark:hover:bg-surface-600 transition-all font-mono"
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                  {change > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">Change</span>
                      <span className="text-lg font-bold font-mono text-green-700 dark:text-green-400">{formatCurrency(change)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* UPI */}
              {selectedMethod === 'upi' && (
                <div className="text-center py-4">
                  <div className="w-40 h-40 mx-auto bg-surface-100 dark:bg-surface-700 rounded-xl flex items-center justify-center mb-3">
                    <div className="text-center">
                      <Smartphone className="w-10 h-10 text-surface-400 mx-auto mb-2" />
                      <p className="text-xs text-surface-500">QR Code</p>
                    </div>
                  </div>
                  <p className="text-sm text-surface-500">Scan to pay or enter UPI ID</p>
                </div>
              )}
            </div>

            {/* Pay Button */}
            <div className="p-5 pt-0">
              <button
                onClick={handlePayment}
                disabled={isProcessing || (selectedMethod === 'cash' && parseFloat(cashReceived) < total)}
                className="btn-primary w-full btn-lg text-base relative overflow-hidden"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <>Confirm Payment • {formatCurrency(total)}</>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Success Screen */
          <div className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4"
            >
              <Check className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-1">Payment Successful!</h2>
            <p className="text-surface-500 mb-1">Order #{realOrderId || orderId}</p>
            
            {tokenNumber && (
              <div className="my-4 inline-block px-6 py-3 bg-primary-500 text-white rounded-2xl shadow-lg shadow-primary-500/30">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Token Number</p>
                <p className="text-4xl font-black font-mono">{tokenNumber}</p>
              </div>
            )}

            <p className="text-3xl font-bold font-mono text-green-600 dark:text-green-400 mb-6">{formatCurrency(total)}</p>
            
            <div className="flex gap-3 mb-4">
              <button 
                onClick={handlePrint}
                className="btn-secondary flex-1"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button className="btn-secondary flex-1">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
            <button onClick={handleDone} className="btn-primary w-full btn-lg">
              New Order
            </button>
          </div>
        )}
      </motion.div>

      {/* Hidden Printable Receipt */}
      <div id="printable-receipt">
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          {restaurantSettings?.settings?.billSettings?.showLogo && (restaurantSettings?.settings?.billSettings?.logoUrl || restaurantSettings?.branding?.logo) && (
            <img 
              src={restaurantSettings?.settings?.billSettings?.logoUrl || restaurantSettings?.branding?.logo} 
              alt="Logo" 
              style={{ width: '40px', height: '40px', objectFit: 'contain', marginBottom: '5px', filter: 'grayscale(1)' }} 
            />
          )}
          <h2 style={{ fontSize: '18px', margin: '0' }}>
            {restaurantSettings?.settings?.billSettings?.brandName || restaurantSettings?.name || 'RestroxAI'}
          </h2>
          <p style={{ fontSize: '10px', margin: '2px 0', opacity: 0.8 }}>
            {restaurantSettings?.settings?.billSettings?.headerText}
          </p>
          <p style={{ fontSize: '12px', margin: '0' }}>Tax Invoice / Bill</p>
          <p style={{ fontSize: '10px' }}>{new Date().toLocaleString()}</p>
          {tokenNumber && (
            <div style={{ margin: '10px 0', border: '2px solid black', padding: '5px' }}>
              <p style={{ fontSize: '10px', margin: '0', fontWeight: 'bold' }}>TOKEN NUMBER</p>
              <p style={{ fontSize: '24px', margin: '0', fontWeight: '900' }}>{tokenNumber}</p>
            </div>
          )}
        </div>
        
        <div style={{ borderBottom: '1px dashed black', margin: '5px 0' }}></div>
        
        <div style={{ fontSize: '11px', marginBottom: '10px' }}>
          <p style={{ margin: '0' }}>Order: #{realOrderId || orderId}</p>
          <p style={{ margin: '0' }}>Type: {orderType?.toUpperCase()}</p>
          {table && <p style={{ margin: '0' }}>Table: {table.name || table}</p>}
          <p style={{ margin: '2px 0 0 0', fontSize: '9px', opacity: 0.7 }}>
            {restaurantSettings?.settings?.billSettings?.customAddress || restaurantSettings?.address}
          </p>
          <p style={{ margin: '0', fontSize: '9px', opacity: 0.7 }}>
            PH: {restaurantSettings?.settings?.billSettings?.customPhone || restaurantSettings?.phone}
          </p>
          {(restaurantSettings?.settings?.billSettings?.customGst || restaurantSettings?.kyc?.gstNumber) && (
            <p style={{ margin: '0', fontSize: '9px', opacity: 0.7 }}>
              GST: {restaurantSettings?.settings?.billSettings?.customGst || restaurantSettings?.kyc?.gstNumber}
            </p>
          )}
        </div>

        <div style={{ borderBottom: '1px dashed black', margin: '5px 0' }}></div>
        
        <table style={{ width: '100%', fontSize: '12px', textAlign: 'left' }}>
          <thead>
            <tr>
              <th>Item</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.name}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderBottom: '1px dashed black', margin: '10px 0' }}></div>

        <div style={{ fontSize: '12px', textAlign: 'right' }}>
          <p style={{ margin: '2px 0' }}>Subtotal: {getSubtotal().toFixed(2)}</p>
          {getDiscountAmount() > 0 && <p style={{ margin: '2px 0' }}>Discount: -{getDiscountAmount().toFixed(2)}</p>}
          <p style={{ margin: '2px 0' }}>GST (5%): {getTax().total.toFixed(2)}</p>
          <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '5px 0' }}>Total: {getTotal().toFixed(2)}</p>
        </div>

        <div style={{ borderBottom: '1px dashed black', margin: '10px 0' }}></div>
        
        <div style={{ textAlign: 'center', fontSize: '10px' }}>
          <p style={{ fontStyle: 'italic', marginBottom: '5px' }}>
            {restaurantSettings?.settings?.billSettings?.footerText || 'Thank you! Visit again.'}
          </p>
          <p style={{ opacity: 0.5, fontSize: '8px' }}>RestroxAI Cloud Billing</p>
          {restaurantSettings?.settings?.billSettings?.showFSSAI && restaurantSettings?.kyc?.fssaiNumber && (
            <p style={{ fontSize: '8px', opacity: 0.5 }}>FSSAI: {restaurantSettings?.kyc?.fssaiNumber}</p>
          )}
        </div>
      </div>
    </div>
  )
}
