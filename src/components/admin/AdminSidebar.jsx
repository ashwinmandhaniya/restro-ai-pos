import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Building2, CreditCard, IndianRupee,
  Brain, ToggleLeft, HeadphonesIcon, Settings, ScrollText, LogOut, Shield, Users, Store
} from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/admin/restaurants', icon: Building2, label: 'Restaurants' },
  { path: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { path: '/admin/revenue', icon: IndianRupee, label: 'Revenue' },
  { path: '/admin/invoices', icon: ScrollText, label: 'Transactions' },
  { path: '/admin/ai-control', icon: Brain, label: 'AI Control' },
  { path: '/admin/feature-flags', icon: ToggleLeft, label: 'Feature Flags' },
  { path: '/admin/support', icon: HeadphonesIcon, label: 'Support' },
  { path: '/admin/outlets', icon: Store, label: 'Outlets' },
  { path: '/admin/users', icon: Users, label: 'Users' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminSidebar() {
  const { logout, user } = useAuthStore();

  return (
    <aside className="w-64 h-screen flex flex-col bg-slate-950 border-r border-slate-800 sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">RestroAI</h1>
            <p className="text-[10px] text-violet-400 font-semibold uppercase tracking-widest">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map(({ path, icon: Icon, label, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-violet-600/20 text-violet-300 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              )
            }
          >
            <Icon className="w-[18px] h-[18px] flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.[0] || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'Super Admin'}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-red-950/50 hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
