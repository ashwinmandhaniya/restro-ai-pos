import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ShoppingCart, UtensilsCrossed, TableProperties,
  ClipboardList, Package, Users, Brain, BarChart3, Settings, Shield,
  ChevronLeft, ChevronRight, Sparkles, Mic, MessageSquareText,
  X, ChefHat, History, QrCode, CalendarCheck, Store, RefreshCw, Ticket, Plug, Monitor, Trophy, UserCheck, Printer,
  ShieldCheck, Leaf, BookOpen, BellRing
} from 'lucide-react'
import useUIStore from '@/store/uiStore'
import useOutletStore from '@/store/outletStore'
import useAuthStore from '@/store/authStore'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { path: '/pos', label: 'POS Billing', icon: ShoppingCart, highlight: true, permission: 'pos.billing' },
  { path: '/touch-pos', label: 'Touch Screen POS', icon: Monitor, permission: 'pos.billing' },
  { path: '/tables', label: 'Tables', icon: TableProperties, permission: 'tables.manage' },
  { path: '/reservations', label: 'Reservations', icon: CalendarCheck, permission: 'reservations.manage' },
  { path: '/orders', label: 'Orders (POS)', icon: ClipboardList, permission: 'orders.view' },
  { path: '/kitchen', label: 'Kitchen Display', icon: ChefHat, permission: 'kitchen.display' },
  { path: '/chef-management', label: 'Chef Management', icon: Users, permission: 'kitchen.display' },
  { path: '/waiter-management', label: 'Waiter Management', icon: UserCheck, permission: 'settings.manage' },
  { path: '/tokens', label: 'Token Management', icon: Ticket, permission: 'tokens.manage' },
  { path: '/order-history', label: 'Order History', icon: History, permission: 'orders.view' },
  { path: '/qr-codes', label: 'QR Codes', icon: QrCode, permission: 'menu.manage' },
  { path: '/qr-analytics', label: 'QR Analytics', icon: BarChart3, permission: 'reports.view' },
  { path: '/whatsapp-settings', label: 'WhatsApp', icon: MessageSquareText, permission: 'whatsapp.marketing' },
  { path: '/menu', label: 'Menu', icon: UtensilsCrossed, permission: 'menu.manage' },
  { path: '/recipe-management', label: 'Recipe Management', icon: BookOpen, permission: 'menu.manage' },
  { path: '/inventory', label: 'Inventory', icon: Package, permission: 'inventory.manage' },
  { path: '/outlets/management', label: 'Outlets Settings', icon: Store, requirement: 'multi-outlet', permission: 'settings.manage' },
  { path: '/outlets/transfers', label: 'Inventory Transfers', icon: Package, requirement: 'multi-outlet', permission: 'inventory.manage' },
  { path: '/outlets/analytics', label: 'Network Analytics', icon: BarChart3, requirement: 'multi-outlet', permission: 'reports.view' },
  { path: '/outlets/menu-sync', label: 'Menu Sync Policy', icon: RefreshCw, requirement: 'multi-outlet', permission: 'menu.manage' },
  { path: '/customers', label: 'Customers', icon: Users, permission: 'customers.manage' },
  { path: '/loyalty', label: 'Customer Loyalty', icon: Trophy, permission: 'customers.manage' },
  { path: '/ai-insights', label: 'AI Insights', icon: Brain, permission: 'reports.view' },
  { path: '/integrations', label: 'Integrations', icon: Plug, permission: 'settings.manage' },
  { path: '/order-alerts', label: 'Order Alerts', icon: BellRing, highlight: true, permission: 'orders.view' },
  { path: '/reports', label: 'Reports', icon: BarChart3, permission: 'reports.view' },
  { path: '/settings/users', label: 'User Management', icon: Users, permission: 'settings.manage' },
  { path: '/settings/roles', label: 'Role Management', icon: Shield, permission: 'settings.manage' },
  { path: '/crash-prevention', label: 'Crash Prevention', icon: ShieldCheck, permission: 'settings.manage' },
  { path: '/waste-management', label: 'Waste Management', icon: Leaf, permission: 'inventory.manage' },
  { path: '/settings', label: 'Settings', icon: Settings, permission: 'settings.manage' },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebarCollapse, darkMode, setShowVoiceBilling, setShowCopilot } = useUIStore()
  const { isMultiOutletEnabled } = useOutletStore()
  const { user } = useAuthStore()
  const location = useLocation()

  const hasPermission = (permission) => {
    if (!permission) return true;
    if (user?.role === 'superadmin') return true;
    return user?.permissions?.includes(permission) || user?.permissions?.includes('*');
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 256 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'fixed left-0 top-0 h-screen z-40 flex flex-col border-r',
        'bg-white dark:bg-surface-900 border-surface-100 dark:border-surface-800'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-100 dark:border-surface-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
          <ChefHat className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <h1 className="text-lg font-bold whitespace-nowrap">
                <span className="text-gradient">Restro</span>
                <span className="text-surface-900 dark:text-white">AI</span>
              </h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Actions */}
      {!sidebarCollapsed && (
        <div className="px-3 py-3 border-b border-surface-100 dark:border-surface-800">
          <div className="flex gap-2">
            <button
              onClick={() => setShowVoiceBilling(true)}
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg 
                         bg-gradient-to-r from-accent-500 to-accent-600 text-white text-xs font-semibold
                         hover:from-accent-600 hover:to-accent-700 transition-all duration-150 active:scale-[0.97]"
            >
              <Mic className="w-3.5 h-3.5" />
              Voice
            </button>
            <button
              onClick={() => setShowCopilot(true)}
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg 
                         bg-gradient-to-r from-secondary-500 to-secondary-600 text-white text-xs font-semibold
                         hover:from-secondary-600 hover:to-secondary-700 transition-all duration-150 active:scale-[0.97]"
            >
              <MessageSquareText className="w-3.5 h-3.5" />
              Copilot
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1 scrollbar-thin">
        {navItems.map((item) => {
          // Hide multi-outlet items if feature is disabled
          if (item.requirement === 'multi-outlet' && !isMultiOutletEnabled) return null;
          
          // Hide if user lacks permission
          if (!hasPermission(item.permission)) return null;
          
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 font-semibold'
                  : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100',
                item.highlight && !isActive && 'text-primary-500 dark:text-primary-400',
                sidebarCollapsed && 'justify-center px-2',
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon className={cn(
                'w-5 h-5 flex-shrink-0',
                item.highlight && !isActive && 'text-primary-500'
              )} />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {item.highlight && !sidebarCollapsed && (
                <Sparkles className="w-3 h-3 text-amber-400 ml-auto" />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-surface-100 dark:border-surface-800">
        <button
          onClick={toggleSidebarCollapse}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm
                     text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  )
}
