import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import AdminLayout from './components/admin/AdminLayout';
import useAuthStore from './store/authStore';
import useUIStore from './store/uiStore';

// Pages
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import TablesPage from './pages/TablesPage';
import OrdersPage from './pages/OrdersPage';
import MenuPage from './pages/MenuPage';
import InventoryPage from './pages/InventoryPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import CustomersPage from './pages/CustomersPage';
import AIInsightsPage from './pages/AIInsightsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import QRManagementPage from './pages/QRManagementPage';
import QRAnalyticsDashboardPage from './pages/QRAnalyticsDashboardPage';
import WhatsAppSettingsPage from './pages/WhatsAppSettingsPage';
import ReservationsPage from './pages/ReservationsPage';
import AuthPage from './pages/AuthPage';
const KitchenDisplayPage = lazy(() => import('./pages/KitchenDisplayPage'));
const TokenManagementPage = lazy(() => import('./pages/TokenManagementPage'));
const TokenDisplayPage = lazy(() => import('./pages/public/TokenDisplayPage'));
const ChefManagementPage = lazy(() => import('./pages/ChefManagementPage'));
const OutletManagementPage = lazy(() => import('./pages/tenant/OutletManagementPage'));
const IntegrationsPage = lazy(() => import('./pages/tenant/IntegrationsPage'));
const TouchScreenPOSPage = lazy(() => import('./pages/TouchScreenPOSPage'));
const CustomerLoyaltyPage = lazy(() => import('./pages/CustomerLoyaltyPage'));
const WaiterManagementPage = lazy(() => import('./pages/WaiterManagementPage'));
const StaffManagementPage = lazy(() => import('./pages/StaffManagementPage'));
const WaiterDisplayPage = lazy(() => import('./pages/WaiterDisplayPage'));
const PrinterManagementPage = lazy(() => import('./pages/PrinterManagementPage'));
import MenuSyncPage from './pages/MenuSyncPage';
const InventoryTransferPage = lazy(() => import('./pages/tenant/InventoryTransferPage'));
const OutletAnalyticsPage = lazy(() => import('./pages/tenant/OutletAnalyticsPage'));
const UserManagementPage = lazy(() => import('./pages/tenant/Settings/UserManagementPage'));
const RoleManagementPage = lazy(() => import('./pages/tenant/Settings/RoleManagementPage'));
const CrashPreventionPage = lazy(() => import('./pages/CrashPreventionPage'));
const WasteManagementPage = lazy(() => import('./pages/WasteManagementPage'));
const RecipeManagementPage = lazy(() => import('./pages/RecipeManagementPage'));
const OrderAlertPage = lazy(() => import('./pages/OrderAlertPage'));
const MultiCounterPage = lazy(() => import('./pages/MultiCounterPage'));

// Admin Pages (lazy loaded for bundle splitting)
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminTenantsPage = lazy(() => import('./pages/admin/AdminTenantsPage'));
const AdminSubscriptionsPage = lazy(() => import('./pages/admin/AdminSubscriptionsPage'));
const AdminRevenuePage = lazy(() => import('./pages/admin/AdminRevenuePage'));
const AdminAIControlPage = lazy(() => import('./pages/admin/AdminAIControlPage'));
const AdminFeatureFlagsPage = lazy(() => import('./pages/admin/AdminFeatureFlagsPage'));
const AdminSupportPage = lazy(() => import('./pages/admin/AdminSupportPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminOutletControlPage = lazy(() => import('./pages/admin/AdminOutletControlPage'));
const AdminInvoicesPage = lazy(() => import('./pages/admin/AdminInvoicesPage'));

// Simple Route Guard
const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore();
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

// Admin Route Guard (checks superadmin role)
const AdminProtectedRoute = ({ children }) => {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/auth" replace />;
  if (user?.role !== 'superadmin') return <Navigate to="/pos" replace />;
  return children;
};

// Public Route Guard (prevents logged in users from seeing auth page)
const PublicRoute = ({ children }) => {
  const { token, user } = useAuthStore();
  if (token) {
    // Redirect superadmin to admin dashboard, others to POS
    if (user?.role === 'superadmin') return <Navigate to="/admin" replace />;
    return <Navigate to="/pos" replace />;
  }
  return children;
};

// Permission Route Guard
const PermissionRoute = ({ children, permission }) => {
  const { user } = useAuthStore();
  
  if (!user) return <Navigate to="/auth" replace />;
  
  // Super Admin has full access
  if (user.role === 'superadmin') {
    return children;
  }
  
  const hasPermission = user.permissions?.includes(permission) || user.permissions?.includes('*');
  
  if (!hasPermission) {
    // If no access to current page, try landing them on a safe page
    // For now, redirect to POS as default, or let them stay on the current layout without the child
    return <Navigate to="/pos" replace />;
  }
  
  return children;
};

// Fallback loader for lazy routes
const AdminLoader = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  const { checkAuth } = useAuthStore();
  const { darkMode } = useUIStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Default to light mode
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        } />
        
        <Route path="/display/:restaurantCode" element={
          <Suspense fallback={<div className="bg-surface-950 min-h-screen" />}>
            <TokenDisplayPage />
          </Suspense>
        } />
        
        {/* Tenant Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/pos" replace />} />
          <Route path="pos" element={<PermissionRoute permission="pos.billing"><POSPage /></PermissionRoute>} />
          <Route path="dashboard" element={<PermissionRoute permission="dashboard.view"><DashboardPage /></PermissionRoute>} />
          <Route path="tables" element={<PermissionRoute permission="tables.manage"><TablesPage /></PermissionRoute>} />
          <Route path="reservations" element={<PermissionRoute permission="reservations.manage"><ReservationsPage /></PermissionRoute>} />
          <Route path="orders" element={<PermissionRoute permission="orders.view"><OrdersPage /></PermissionRoute>} />
          <Route path="kitchen" element={<PermissionRoute permission="kitchen.display"><Suspense fallback={<AdminLoader />}><KitchenDisplayPage /></Suspense></PermissionRoute>} />
          <Route path="chef-management" element={<PermissionRoute permission="kitchen.display"><Suspense fallback={<AdminLoader />}><ChefManagementPage /></Suspense></PermissionRoute>} />
          <Route path="tokens" element={<PermissionRoute permission="tokens.manage"><Suspense fallback={<AdminLoader />}><TokenManagementPage /></Suspense></PermissionRoute>} />
          <Route path="order-history" element={<PermissionRoute permission="orders.view"><OrderHistoryPage /></PermissionRoute>} />
          <Route path="qr-codes" element={<PermissionRoute permission="qr.manage"><QRManagementPage /></PermissionRoute>} />
          <Route path="qr-analytics" element={<PermissionRoute permission="qr.manage"><QRAnalyticsDashboardPage /></PermissionRoute>} />
          <Route path="whatsapp-settings" element={<PermissionRoute permission="whatsapp.marketing"><WhatsAppSettingsPage /></PermissionRoute>} />
          <Route path="menu" element={<PermissionRoute permission="menu.manage"><MenuPage /></PermissionRoute>} />
          <Route path="inventory" element={<PermissionRoute permission="inventory.manage"><InventoryPage /></PermissionRoute>} />
          <Route path="outlets/management" element={<PermissionRoute permission="outlets.manage"><Suspense fallback={<AdminLoader />}><OutletManagementPage /></Suspense></PermissionRoute>} />
          <Route path="outlets/menu-sync" element={<PermissionRoute permission="outlets.manage"><MenuSyncPage /></PermissionRoute>} />
          <Route path="outlets/transfers" element={<PermissionRoute permission="outlets.manage"><Suspense fallback={<AdminLoader />}><InventoryTransferPage /></Suspense></PermissionRoute>} />
          <Route path="outlets/analytics" element={<PermissionRoute permission="outlets.manage"><Suspense fallback={<AdminLoader />}><OutletAnalyticsPage /></Suspense></PermissionRoute>} />
          <Route path="integrations" element={<PermissionRoute permission="settings.manage"><Suspense fallback={<AdminLoader />}><IntegrationsPage /></Suspense></PermissionRoute>} />
          <Route path="touch-pos" element={<PermissionRoute permission="pos.billing"><Suspense fallback={<AdminLoader />}><TouchScreenPOSPage /></Suspense></PermissionRoute>} />
          <Route path="customers" element={<PermissionRoute permission="customers.manage"><CustomersPage /></PermissionRoute>} />
          <Route path="loyalty" element={<PermissionRoute permission="customers.manage"><Suspense fallback={<AdminLoader />}><CustomerLoyaltyPage /></Suspense></PermissionRoute>} />
          <Route path="waiter-management" element={<PermissionRoute permission="staff.manage"><Suspense fallback={<AdminLoader />}><WaiterManagementPage /></Suspense></PermissionRoute>} />
          <Route path="waiter-display" element={<PermissionRoute permission="staff.manage"><Suspense fallback={<AdminLoader />}><WaiterDisplayPage /></Suspense></PermissionRoute>} />
          <Route path="staff" element={<PermissionRoute permission="settings.manage"><Suspense fallback={<AdminLoader />}><StaffManagementPage /></Suspense></PermissionRoute>} />
          <Route path="settings/printers" element={<PermissionRoute permission="settings.manage"><Suspense fallback={<AdminLoader />}><PrinterManagementPage /></Suspense></PermissionRoute>} />
          <Route path="ai-insights" element={<PermissionRoute permission="ai.insights"><AIInsightsPage /></PermissionRoute>} />
          <Route path="reports" element={<PermissionRoute permission="reports.view"><ReportsPage /></PermissionRoute>} />
          <Route path="crash-prevention" element={<PermissionRoute permission="settings.manage"><Suspense fallback={<AdminLoader />}><CrashPreventionPage /></Suspense></PermissionRoute>} />
          <Route path="waste-management" element={<PermissionRoute permission="inventory.manage"><Suspense fallback={<AdminLoader />}><WasteManagementPage /></Suspense></PermissionRoute>} />
          <Route path="recipe-management" element={<PermissionRoute permission="menu.manage"><Suspense fallback={<AdminLoader />}><RecipeManagementPage /></Suspense></PermissionRoute>} />
          <Route path="order-alerts" element={<PermissionRoute permission="orders.view"><Suspense fallback={<AdminLoader />}><OrderAlertPage /></Suspense></PermissionRoute>} />
          <Route path="multi-counter" element={<PermissionRoute permission="pos.billing"><Suspense fallback={<AdminLoader />}><MultiCounterPage /></Suspense></PermissionRoute>} />
          <Route path="settings" element={<PermissionRoute permission="settings.manage"><SettingsPage /></PermissionRoute>} />
          <Route path="settings/users" element={<PermissionRoute permission="settings.manage"><Suspense fallback={<AdminLoader />}><UserManagementPage /></Suspense></PermissionRoute>} />
          <Route path="settings/roles" element={<PermissionRoute permission="settings.manage"><Suspense fallback={<AdminLoader />}><RoleManagementPage /></Suspense></PermissionRoute>} />
        </Route>

        {/* Super Admin Routes */}
        <Route path="/admin" element={
          <AdminProtectedRoute>
            <Suspense fallback={<AdminLoader />}>
              <AdminLayout />
            </Suspense>
          </AdminProtectedRoute>
        }>
          <Route index element={<Suspense fallback={<AdminLoader />}><AdminDashboardPage /></Suspense>} />
          <Route path="restaurants" element={<Suspense fallback={<AdminLoader />}><AdminTenantsPage /></Suspense>} />
          <Route path="subscriptions" element={<Suspense fallback={<AdminLoader />}><AdminSubscriptionsPage /></Suspense>} />
          <Route path="revenue" element={<Suspense fallback={<AdminLoader />}><AdminRevenuePage /></Suspense>} />
          <Route path="ai-control" element={<Suspense fallback={<AdminLoader />}><AdminAIControlPage /></Suspense>} />
          <Route path="feature-flags" element={<Suspense fallback={<AdminLoader />}><AdminFeatureFlagsPage /></Suspense>} />
          <Route path="support" element={<Suspense fallback={<AdminLoader />}><AdminSupportPage /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<AdminLoader />}><AdminSettingsPage /></Suspense>} />
          <Route path="users" element={<Suspense fallback={<AdminLoader />}><AdminUsersPage /></Suspense>} />
          <Route path="outlets" element={<Suspense fallback={<AdminLoader />}><AdminOutletControlPage /></Suspense>} />
          <Route path="invoices" element={<Suspense fallback={<AdminLoader />}><AdminInvoicesPage /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

