import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'
import useUIStore from '@/store/uiStore'
import useAuthStore from '@/store/authStore'
import useOrderStore from '@/store/orderStore'
import useTableStore from '@/store/tableStore'
import useTenantSettingsStore from '@/store/tenantSettingsStore'
import VoiceBilling from '@/components/ai/VoiceBilling'
import OwnerCopilot from '@/components/ai/OwnerCopilot'
import NotificationToast from '@/components/ui/NotificationToast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import KeyboardShortcuts from '@/components/ui/KeyboardShortcuts'
import NetworkStatus from '@/components/ui/NetworkStatus'
import socketClient from '@/lib/socket'
import SubscriptionBanner from '@/components/ui/SubscriptionBanner'

export default function AppLayout() {
  const { sidebarCollapsed, showVoiceBilling, showCopilot, addNotification } = useUIStore()
  const { token } = useAuthStore()
  const location = useLocation()
  const { fetchSettings } = useTenantSettingsStore()

  useEffect(() => {
    if (token) {
      // Fetch core global settings
      fetchSettings().catch(err => console.error("Failed to load settings:", err));

      socketClient.connect(token);
      
      socketClient.on('new_order', (order) => {
        useOrderStore.getState().handleRealtimeNewOrder(order);

        const isQR = order.source === 'qr';
        addNotification({ 
          type: isQR ? 'warning' : 'success', 
          title: isQR ? '📱 QR Order Received!' : 'New Order Received',
          message: isQR 
            ? `Table ${order.tableId?.name || '?'} • ${order.items?.length || 0} items • ${order.orderId}`
            : `ID: ${order.orderId || order._id?.slice(-6).toUpperCase()}`
        });

        // Play audio chime for QR orders (attention-grabbing)
        if (isQR) {
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const playTone = (freq, start, dur) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.value = freq;
              gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(ctx.currentTime + start);
              osc.stop(ctx.currentTime + start + dur);
            };
            playTone(880, 0, 0.15);
            playTone(1100, 0.15, 0.15);
            playTone(1320, 0.3, 0.3);
          } catch (e) { /* AudioContext may be blocked */ }
        }
      });

      socketClient.on('kot_status_change', (data) => {
         useOrderStore.getState().handleRealtimeKOT(data);
         addNotification({ 
          type: 'info', 
          title: 'KOT Update', 
          message: `Order ${data.orderId?.toString().slice(-6).toUpperCase()} → ${data.status}` 
        });
      });

      socketClient.on('table_updated', (table) => {
        useTableStore.getState().handleRealtimeTableUpdate(table);
      });
      
      socketClient.on('order_updated', (order) => {
        // Wait, useOrderStore might not have handleRealtimeOrderUpdate, let's just refresh orders
        useOrderStore.getState().fetchOrders('active');
      });
    }

    return () => {
      socketClient.disconnect();
    };
  }, [token, addNotification]);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 transition-all duration-200" style={{ paddingTop: 'var(--offline-banner-height, 0px)' }}>
      <NetworkStatus />
      <SubscriptionBanner />
      <Sidebar />
      <main
        className="transition-all duration-200"
        style={{ marginLeft: sidebarCollapsed ? 72 : 256 }}
      >
        <Header />
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-6"
        >
          <Outlet />
        </motion.div>
      </main>
      
      {/* AI Overlays */}
      {showVoiceBilling && <VoiceBilling />}
      {showCopilot && <OwnerCopilot />}
      
      {/* Notifications */}
      <NotificationToast />
      
      {/* Global Confirm Dialog */}
      <ConfirmDialog />
      
      {/* Global Keyboard Shortcuts */}
      <KeyboardShortcuts />
    </div>
  )
}
