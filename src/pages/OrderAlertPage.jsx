import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellRing, Check, X, Clock, Package, ChefHat, Truck,
  CheckCircle2, XCircle, AlertTriangle, Volume2, VolumeX,
  Filter, RefreshCw, TrendingUp, IndianRupee, Eye,
  ChevronDown, Timer, MapPin, Phone, User, UtensilsCrossed, ArrowRight
} from 'lucide-react';
import usePlatformOrderStore from '@/store/platformOrderStore';
import useUIStore from '@/store/uiStore';
import { cn, formatCurrency } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

// ── Platform metadata ────────────────────────────────────
const PLATFORM_META = {
  swiggy:     { name: 'Swiggy',     color: '#FC8019', bg: 'bg-orange-500/10', text: 'text-orange-500', icon: '🟠' },
  zomato:     { name: 'Zomato',     color: '#E23744', bg: 'bg-red-500/10',    text: 'text-red-500',    icon: '🔴' },
  dotpe:      { name: 'DotPe',      color: '#1A1A2E', bg: 'bg-slate-500/10',  text: 'text-slate-400',  icon: '⚫' },
  magicpin:   { name: 'Magicpin',   color: '#6F2EA3', bg: 'bg-purple-500/10', text: 'text-purple-400', icon: '🟣' },
  talabat:    { name: 'Talabat',    color: '#FF6100', bg: 'bg-orange-500/10', text: 'text-orange-400', icon: '🟠' },
  peppo:      { name: 'Peppo',      color: '#00B14F', bg: 'bg-green-500/10',  text: 'text-green-400',  icon: '🟢' },
  yumzy:      { name: 'Yumzy',      color: '#FF2D55', bg: 'bg-rose-500/10',   text: 'text-rose-400',   icon: '🔴' },
  now:        { name: 'NOW',        color: '#F59E0B', bg: 'bg-amber-500/10',  text: 'text-amber-400',  icon: '🟡' },
  ele:        { name: 'Ele',        color: '#4CAF50', bg: 'bg-green-500/10',  text: 'text-green-400',  icon: '🟢' },
  ondc:       { name: 'ONDC',       color: '#1DB954', bg: 'bg-emerald-500/10',text: 'text-emerald-400',icon: '🟢' },
  uengageFlash: { name: 'uEngage Flash', color: '#22C55E', bg: 'bg-green-500/10', text: 'text-green-400', icon: '⚡' },
  jungleworks: { name: 'Jungleworks', color: '#00B388', bg: 'bg-teal-500/10', text: 'text-teal-400', icon: '🟢' },
  dunzo:      { name: 'Dunzo',      color: '#00D69A', bg: 'bg-teal-500/10',   text: 'text-teal-400',   icon: '🟢' },
  pidge:      { name: 'Pidge',      color: '#1C1C1C', bg: 'bg-slate-500/10',  text: 'text-slate-300',  icon: '⬛' },
  shadowfax:  { name: 'Shadowfax',  color: '#E8400C', bg: 'bg-red-500/10',    text: 'text-red-400',    icon: '🔴' },
  other:      { name: 'Other',      color: '#6366f1', bg: 'bg-indigo-500/10', text: 'text-indigo-400', icon: '🔵' },
};

const STATUS_CONFIG = {
  new:        { label: 'New',        color: 'bg-blue-500',   ring: 'ring-blue-400',    badge: 'badge-info',    icon: BellRing },
  accepted:   { label: 'Accepted',   color: 'bg-emerald-500',ring: 'ring-emerald-400', badge: 'badge-success', icon: Check },
  preparing:  { label: 'Preparing',  color: 'bg-amber-500',  ring: 'ring-amber-400',   badge: 'badge-warning', icon: ChefHat },
  ready:      { label: 'Ready',      color: 'bg-green-500',  ring: 'ring-green-400',   badge: 'badge-success', icon: Package },
  picked_up:  { label: 'Picked Up',  color: 'bg-purple-500', ring: 'ring-purple-400',  badge: 'badge-primary', icon: Truck },
  delivered:  { label: 'Delivered',  color: 'bg-teal-500',   ring: 'ring-teal-400',    badge: 'badge-success', icon: CheckCircle2 },
  rejected:   { label: 'Rejected',   color: 'bg-red-500',    ring: 'ring-red-400',     badge: 'badge-danger',  icon: XCircle },
  cancelled:  { label: 'Cancelled',  color: 'bg-gray-500',   ring: 'ring-gray-400',    badge: 'badge-secondary', icon: X },
};

// ── Platform Logo Component ──────────────────────────────
function PlatformBadge({ platform, size = 'md' }) {
  const meta = PLATFORM_META[platform] || PLATFORM_META.other;
  const px = size === 'lg' ? 48 : size === 'sm' ? 28 : 36;
  const [imgFailed, setImgFailed] = useState(false);

  if (!imgFailed) {
    return (
      <div
        className="flex items-center justify-center bg-white overflow-hidden flex-shrink-0"
        style={{
          width: px, height: px, borderRadius: 10,
          boxShadow: '0 1px 6px rgba(0,0,0,0.12)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <img
          src={`/logos/${platform}.png`}
          alt={meta.name}
          width={px}
          height={px}
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          onError={() => setImgFailed(true)}
          loading="eager"
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{
        width: px, height: px, borderRadius: 10,
        background: `linear-gradient(135deg, ${meta.color}dd 0%, ${meta.color}88 100%)`,
        boxShadow: `0 2px 12px ${meta.color}44`,
      }}
    >
      <span style={{ fontSize: px * 0.4 }}>{meta.icon}</span>
    </div>
  );
}

// ── Alert Sound Hook ─────────────────────────────────────
function useAlertSound(enabled) {
  const audioRef = useRef(null);

  const play = useCallback(() => {
    if (!enabled) return;
    try {
      if (!audioRef.current) {
        // Simple beep sound from a web-safe OscillatorNode
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gain.gain.value = 0.3;
        oscillator.start();
        setTimeout(() => {
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          setTimeout(() => oscillator.stop(), 400);
        }, 200);
        // Second beep
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const g2 = ctx.createGain();
          osc2.connect(g2);
          g2.connect(ctx.destination);
          osc2.frequency.value = 1100;
          osc2.type = 'sine';
          g2.gain.value = 0.3;
          osc2.start();
          setTimeout(() => {
            g2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            setTimeout(() => osc2.stop(), 400);
          }, 200);
        }, 300);
      }
    } catch (e) { /* silently fail if AudioContext not available */ }
  }, [enabled]);

  return { play };
}

// ── Order Detail Modal ───────────────────────────────────
function OrderDetailModal({ order, onClose, onAccept, onReject, onUpdateStatus }) {
  const meta = PLATFORM_META[order.platform] || PLATFORM_META.other;
  const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
  const StatusIcon = statusConf.icon;
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [prep, setPrep] = useState(order.estimatedPrepTime || 20);

  const nextStatusMap = {
    accepted: 'preparing',
    preparing: 'ready',
    ready: 'picked_up',
    picked_up: 'delivered',
  };
  const nextStatus = nextStatusMap[order.status];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div
          className="p-5 text-white"
          style={{ background: `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}cc 100%)` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PlatformBadge platform={order.platform} size="lg" />
              <div>
                <h2 className="text-xl font-black">{meta.name} Order</h2>
                <p className="text-sm opacity-80 font-mono">#{order.platformOrderId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-white/20 rounded-full text-xs font-bold flex items-center gap-1.5">
                <StatusIcon size={14} />
                {statusConf.label}
              </span>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Customer Info */}
          {(order.customerName || order.customerPhone || order.customerAddress) && (
            <div className="p-4 bg-surface-50 dark:bg-slate-800/60 rounded-xl space-y-2">
              <p className="text-xs uppercase tracking-wider text-surface-400 font-bold">Customer</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {order.customerName && (
                  <div className="flex items-center gap-2 text-sm">
                    <User size={14} className="text-surface-400" />
                    <span className="dark:text-white font-medium">{order.customerName}</span>
                  </div>
                )}
                {order.customerPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} className="text-surface-400" />
                    <span className="dark:text-white">{order.customerPhone}</span>
                  </div>
                )}
              </div>
              {order.customerAddress && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin size={14} className="text-surface-400 mt-0.5 flex-shrink-0" />
                  <span className="text-surface-600 dark:text-slate-300">{order.customerAddress}</span>
                </div>
              )}
              {order.deliveryInstructions && (
                <div className="flex items-start gap-2 text-sm bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
                  <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-amber-700 dark:text-amber-300">{order.deliveryInstructions}</span>
                </div>
              )}
            </div>
          )}

          {/* Items */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-surface-400 font-bold">Items ({order.items?.length || 0})</p>
            <div className="divide-y divide-surface-100 dark:divide-slate-800 rounded-xl border border-surface-100 dark:border-slate-800 overflow-hidden">
              {(order.items || []).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-surface-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {item.quantity}×
                    </span>
                    <div>
                      <p className="text-sm font-semibold dark:text-white">{item.name}</p>
                      {item.variant && <p className="text-xs text-surface-400">{item.variant}</p>}
                      {item.specialInstructions && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 italic mt-0.5">📝 {item.specialInstructions}</p>
                      )}
                      {item.addons?.length > 0 && (
                        <p className="text-xs text-surface-400">+ {item.addons.map(a => a.name).join(', ')}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-mono font-bold dark:text-white">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Billing */}
          <div className="pt-2 border-t border-surface-100 dark:border-slate-800 space-y-1.5 text-sm">
            <div className="flex justify-between text-surface-500">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(order.subtotal || 0)}</span>
            </div>
            {order.taxes > 0 && (
              <div className="flex justify-between text-surface-500">
                <span>Taxes</span>
                <span className="font-mono">{formatCurrency(order.taxes)}</span>
              </div>
            )}
            {order.deliveryCharge > 0 && (
              <div className="flex justify-between text-surface-500">
                <span>Delivery</span>
                <span className="font-mono">{formatCurrency(order.deliveryCharge)}</span>
              </div>
            )}
            {order.packagingCharge > 0 && (
              <div className="flex justify-between text-surface-500">
                <span>Packaging</span>
                <span className="font-mono">{formatCurrency(order.packagingCharge)}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span className="font-mono">-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold dark:text-white pt-2 border-t border-surface-100 dark:border-slate-800">
              <span>Total</span>
              <span className="font-mono text-primary-500">{formatCurrency(order.total)}</span>
            </div>
          </div>

          {/* Reject form */}
          {rejecting && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl space-y-3 border border-red-200 dark:border-red-900/40">
              <p className="text-sm font-bold text-red-700 dark:text-red-300">Rejection Reason</p>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <option value="">Select reason...</option>
                <option value="Item out of stock">Item out of stock</option>
                <option value="Kitchen overloaded">Kitchen overloaded</option>
                <option value="Closing soon">Closing soon</option>
                <option value="Delivery area not serviceable">Delivery area not serviceable</option>
                <option value="Other">Other</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => { onReject(order._id, rejectReason || 'Rejected by restaurant'); setRejecting(false); }}
                  className="flex-1 btn bg-red-500 text-white hover:bg-red-600 text-sm font-bold"
                  disabled={!rejectReason}
                >
                  Confirm Rejection
                </button>
                <button onClick={() => setRejecting(false)} className="btn-secondary text-sm px-4">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-surface-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-800/40">
          {order.status === 'new' && !rejecting && (
            <div className="space-y-3">
              {/* Prep time selector */}
              <div className="flex items-center gap-3">
                <Timer size={16} className="text-surface-400" />
                <span className="text-sm text-surface-500 dark:text-slate-400">Prep time:</span>
                <div className="flex items-center gap-1">
                  {[15, 20, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setPrep(mins)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-bold transition-all',
                        prep === mins
                          ? 'bg-primary-500 text-white shadow-md'
                          : 'bg-surface-100 dark:bg-slate-700 text-surface-500 dark:text-slate-400 hover:bg-surface-200'
                      )}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onAccept(order._id, prep)}
                  className="flex-1 btn bg-emerald-500 text-white hover:bg-emerald-600 font-bold text-sm shadow-lg shadow-emerald-500/20"
                >
                  <Check size={18} className="mr-1.5" /> Accept Order
                </button>
                <button
                  onClick={() => setRejecting(true)}
                  className="btn bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 font-bold text-sm px-5"
                >
                  <X size={18} className="mr-1" /> Reject
                </button>
              </div>
            </div>
          )}

          {nextStatus && (
            <button
              onClick={() => onUpdateStatus(order._id, nextStatus)}
              className="w-full btn-primary font-bold text-sm flex items-center justify-center gap-2"
            >
              Move to: {STATUS_CONFIG[nextStatus]?.label}
              <ArrowRight size={16} />
            </button>
          )}

          {(order.status === 'delivered' || order.status === 'rejected' || order.status === 'cancelled') && (
            <p className="text-center text-sm text-surface-400 py-1">
              {order.status === 'delivered' ? '✅ Order delivered' :
               order.status === 'rejected' ? `❌ Rejected: ${order.rejectionReason || 'N/A'}` :
               '🚫 Cancelled'}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────
//  MAIN PAGE
// ──────────────────────────────────────────────────────────
export default function OrderAlertPage() {
  const {
    orders, stats, newCount, isLoading,
    fetchOrders, fetchStats,
    acceptOrder, rejectOrder, updateStatus, dismissAlert,
    handleNewOrder, handleOrderUpdated,
  } = usePlatformOrderStore();

  const { socket } = useUIStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const alertSound = useAlertSound(soundEnabled);
  const prevNewCountRef = useRef(0);

  // Fetch on mount and poll every 15s
  useEffect(() => {
    fetchOrders();
    fetchStats();
    const interval = setInterval(() => {
      fetchOrders();
      fetchStats();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders, fetchStats]);

  // Socket.IO real-time listeners
  useEffect(() => {
    if (!socket) return;
    socket.on('platform_order:new', handleNewOrder);
    socket.on('platform_order:updated', handleOrderUpdated);
    return () => {
      socket.off('platform_order:new', handleNewOrder);
      socket.off('platform_order:updated', handleOrderUpdated);
    };
  }, [socket, handleNewOrder, handleOrderUpdated]);

  // Play sound on new orders
  useEffect(() => {
    if (newCount > prevNewCountRef.current) {
      alertSound.play();
    }
    prevNewCountRef.current = newCount;
  }, [newCount, alertSound]);

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (platformFilter !== 'all' && o.platform !== platformFilter) return false;
    return true;
  });

  // Active platforms (from data)
  const activePlatforms = [...new Set(orders.map((o) => o.platform))];

  // Status counts
  const statusCounts = {};
  orders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

  const handleAccept = async (id, prepTime) => {
    await acceptOrder(id, prepTime);
    setSelectedOrder(null);
    fetchStats();
  };

  const handleReject = async (id, reason) => {
    await rejectOrder(id, reason);
    setSelectedOrder(null);
    fetchStats();
  };

  const handleUpdateStatus = async (id, status) => {
    await updateStatus(id, status);
    setSelectedOrder(null);
    fetchStats();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
            <div className="relative">
              <Bell className="w-7 h-7 text-primary-500" />
              {newCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900"
                >
                  {newCount}
                </motion.span>
              )}
            </div>
            Order Alerts
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">
            Incoming orders from Swiggy, Zomato & other platforms
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              'p-2.5 rounded-xl border transition-all',
              soundEnabled
                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-600'
                : 'bg-surface-100 dark:bg-slate-800 border-surface-200 dark:border-slate-700 text-surface-400'
            )}
            title={soundEnabled ? 'Sound ON' : 'Sound OFF'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            onClick={() => { fetchOrders(); fetchStats(); }}
            className="p-2.5 rounded-xl bg-surface-100 dark:bg-slate-800 border border-surface-200 dark:border-slate-700 text-surface-500 hover:text-primary-500 transition-all"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* New Orders */}
        <div className={cn('card p-4 transition-all', newCount > 0 && 'ring-2 ring-blue-400 animate-pulse')}>
          <div className="flex items-center justify-between mb-2">
            <BellRing size={20} className="text-blue-500" />
            <span className="text-[10px] uppercase tracking-wider text-surface-400 font-bold">New</span>
          </div>
          <p className="text-3xl font-black font-mono text-surface-900 dark:text-white">{statusCounts.new || 0}</p>
          <p className="text-xs text-surface-500 mt-1">Awaiting response</p>
        </div>

        {/* Active Orders */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <ChefHat size={20} className="text-amber-500" />
            <span className="text-[10px] uppercase tracking-wider text-surface-400 font-bold">Active</span>
          </div>
          <p className="text-3xl font-black font-mono text-surface-900 dark:text-white">
            {(statusCounts.accepted || 0) + (statusCounts.preparing || 0) + (statusCounts.ready || 0)}
          </p>
          <p className="text-xs text-surface-500 mt-1">In progress</p>
        </div>

        {/* Today Revenue */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <IndianRupee size={20} className="text-emerald-500" />
            <span className="text-[10px] uppercase tracking-wider text-surface-400 font-bold">Today</span>
          </div>
          <p className="text-3xl font-black font-mono text-surface-900 dark:text-white">
            {formatCurrency(stats?.today?.revenue || 0)}
          </p>
          <p className="text-xs text-surface-500 mt-1">{stats?.today?.orders || 0} orders</p>
        </div>

        {/* Top Platform */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={20} className="text-purple-500" />
            <span className="text-[10px] uppercase tracking-wider text-surface-400 font-bold">Top</span>
          </div>
          {stats?.byPlatform?.[0] ? (
            <>
              <p className="text-xl font-black text-surface-900 dark:text-white">
                {PLATFORM_META[stats.byPlatform[0]._id]?.name || stats.byPlatform[0]._id}
              </p>
              <p className="text-xs text-surface-500 mt-1">{stats.byPlatform[0].count} orders</p>
            </>
          ) : (
            <>
              <p className="text-xl font-black text-surface-400">—</p>
              <p className="text-xs text-surface-500 mt-1">No data yet</p>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status filter */}
        <div className="flex bg-surface-100 dark:bg-surface-800 rounded-xl p-1 gap-0.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              statusFilter === 'all' ? 'bg-white dark:bg-surface-700 shadow-sm text-surface-900 dark:text-white' : 'text-surface-500')}
          >
            All
          </button>
          {['new', 'accepted', 'preparing', 'ready', 'delivered'].map((s) => {
            const conf = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                  statusFilter === s ? 'bg-white dark:bg-surface-700 shadow-sm text-surface-900 dark:text-white' : 'text-surface-500')}
              >
                <div className={cn('w-2 h-2 rounded-full', conf.color)} />
                {conf.label}
                {statusCounts[s] ? <span className="ml-0.5 text-[10px] opacity-60">({statusCounts[s]})</span> : null}
              </button>
            );
          })}
        </div>

        {/* Platform filter */}
        {activePlatforms.length > 1 && (
          <div className="flex bg-surface-100 dark:bg-surface-800 rounded-xl p-1 gap-0.5">
            <button
              onClick={() => setPlatformFilter('all')}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                platformFilter === 'all' ? 'bg-white dark:bg-surface-700 shadow-sm' : 'text-surface-500')}
            >
              All Platforms
            </button>
            {activePlatforms.map((p) => {
              const meta = PLATFORM_META[p] || PLATFORM_META.other;
              return (
                <button
                  key={p}
                  onClick={() => setPlatformFilter(platformFilter === p ? 'all' : p)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    platformFilter === p ? 'bg-white dark:bg-surface-700 shadow-sm' : 'text-surface-500')}
                >
                  {meta.icon} {meta.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Orders Grid */}
      {isLoading && orders.length === 0 ? (
        <div className="text-center py-20 text-surface-500">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-16 h-16 text-surface-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-lg font-bold text-surface-400 dark:text-slate-500">No orders found</p>
          <p className="text-sm text-surface-400 dark:text-slate-600 mt-1">
            {statusFilter !== 'all'
              ? 'Try changing the filter'
              : 'Orders from Swiggy, Zomato & other platforms will appear here'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredOrders.map((order) => {
              const meta = PLATFORM_META[order.platform] || PLATFORM_META.other;
              const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
              const StatusIcon = statusConf.icon;
              const isNew = order.status === 'new';
              const timeAgo = formatDistanceToNow(new Date(order.createdAt), { addSuffix: true });

              return (
                <motion.div
                  key={order._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setSelectedOrder(order)}
                  className={cn(
                    'card overflow-hidden cursor-pointer hover:shadow-lg transition-all group',
                    isNew && 'ring-2 ring-blue-400 dark:ring-blue-500 shadow-lg shadow-blue-500/10'
                  )}
                >
                  {/* Card Header */}
                  <div className="flex items-center gap-3 p-4 pb-3">
                    <PlatformBadge platform={order.platform} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold dark:text-white truncate">{meta.name}</p>
                        {isNew && (
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-surface-400 font-mono">#{order.platformOrderId}</p>
                    </div>
                    <span className={cn('badge text-[10px] flex items-center gap-1', statusConf.badge)}>
                      <StatusIcon size={12} />
                      {statusConf.label}
                    </span>
                  </div>

                  {/* Items preview */}
                  <div className="px-4 pb-2">
                    <div className="space-y-1 max-h-24 overflow-hidden">
                      {order.items?.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-surface-600 dark:text-slate-300 truncate">
                            {item.quantity}× {item.name}
                          </span>
                          <span className="text-xs font-mono text-surface-400 ml-2 flex-shrink-0">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                      {(order.items?.length || 0) > 3 && (
                        <p className="text-xs text-surface-400">+{order.items.length - 3} more items</p>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 py-3 border-t border-surface-100 dark:border-slate-800 flex items-center justify-between bg-surface-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-1.5 text-xs text-surface-400">
                      <Clock size={12} />
                      {timeAgo}
                    </div>
                    <p className="text-sm font-bold font-mono dark:text-white">
                      {formatCurrency(order.total)}
                    </p>
                  </div>

                  {/* Quick actions for new orders */}
                  {isNew && (
                    <div className="flex border-t border-surface-100 dark:border-slate-800">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAccept(order._id, 20); }}
                        className="flex-1 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Check size={14} /> Accept
                      </button>
                      <div className="w-px bg-surface-200 dark:bg-slate-700" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                        className="flex-1 py-2.5 text-xs font-bold text-surface-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Eye size={14} /> View
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onAccept={handleAccept}
            onReject={handleReject}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
