import { Bell, Moon, Sun, Search, User, ChevronDown, Wifi, WifiOff, LogOut, Settings } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Link } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import useUIStore from '@/store/uiStore'
import { formatTime } from '@/lib/utils'
import { useState, useEffect } from 'react'
import OutletSwitcher from './OutletSwitcher'

export default function Header() {
  const { darkMode, toggleDarkMode, notifications, clearNotifications } = useUIStore()
  const { user, logout } = useAuthStore()
  const [time, setTime] = useState(new Date())
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      clearInterval(timer)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <header className="h-16 border-b border-surface-100 dark:border-surface-800 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search menu, orders, customers... (⌘K)"
            className="input pl-10 py-2 text-sm bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Outlet Switcher */}
        <OutletSwitcher />

        {/* Connection Status */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          online 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        }`}>
          {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {online ? 'Online' : 'Offline'}
        </div>

        {/* Clock */}
        <div className="text-sm font-mono text-surface-500 dark:text-surface-400 tabular-nums">
          {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="relative p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all outline-none">
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
              )}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={8} className="w-80 bg-white dark:bg-surface-900 rounded-xl shadow-lg border border-surface-200 dark:border-surface-800 p-2 z-50">
              <div className="flex items-center justify-between px-2 py-2 border-b border-surface-100 dark:border-surface-800 mb-2">
                <span className="font-semibold text-surface-900 dark:text-white">Recent Alerts</span>
                {notifications.length > 0 && (
                  <button 
                    onClick={clearNotifications}
                    className="text-xs text-primary-500 font-medium hover:text-primary-600 outline-none"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              {notifications.length === 0 ? (
                <div className="text-center py-6">
                  <Bell className="w-8 h-8 text-surface-300 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-surface-500">No new alerts right now.</p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                  {notifications.map(n => (
                    <div key={n.id} className="p-3 bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg cursor-pointer transition-colors">
                      <p className="text-sm font-semibold text-surface-900 dark:text-white">{n.title}</p>
                      <p className="text-xs text-surface-500 mt-1 line-clamp-2">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* User Profile */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-all outline-none">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold uppercase">
                {user?.name ? user.name.substring(0, 2) : 'US'}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-sm font-semibold text-surface-900 dark:text-white capitalize truncate max-w-[120px]">{user?.name || 'Admin'}</p>
                <p className="text-xs text-surface-500 capitalize">{user?.role || 'Owner'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-surface-400 hidden lg:block" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={8} className="w-56 bg-white dark:bg-surface-900 rounded-xl shadow-lg border border-surface-200 dark:border-surface-800 p-1 z-50">
              <div className="px-3 py-2 border-b border-surface-100 dark:border-surface-800 mb-1">
                <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-surface-500 truncate">{user?.email || 'admin@example.com'}</p>
              </div>
              
              <DropdownMenu.Item asChild>
                <Link to="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg cursor-pointer outline-none">
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </DropdownMenu.Item>
              
              <DropdownMenu.Separator className="h-px bg-surface-100 dark:bg-surface-800 my-1" />
              
              <DropdownMenu.Item 
                onSelect={() => logout()}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer outline-none"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}
