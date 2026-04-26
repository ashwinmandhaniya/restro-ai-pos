import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, Timer, CheckCircle, Volume2, VolumeX, Maximize, Minimize, 
  AlertTriangle, Phone, Flame, QrCode, ClipboardList, Layers, 
  ShoppingBag, MoreVertical, History, RefreshCw
} from 'lucide-react';
import useKdsStore from '@/store/kdsStore';
import useAuthStore from '@/store/authStore';
import useChefStore from '@/store/chefStore';
import useKDSSocket from '@/hooks/useKDSSocket';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import AIKeyRequired from '@/components/ai/AIKeyRequired';

const KDS_STATUS = {
  new: { label: 'New Ticket', bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500' },
  preparing: { label: 'Preparing', bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-500' },
  ready: { label: 'Ready', bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-500' }
};

export default function KitchenDisplayPage() {
  const { user } = useAuthStore();
  const { 
    stations, tickets, batches, fetchStations, fetchQueue, fetchBatches,
    selectedStation, setSelectedStation, soundEnabled, setSoundEnabled, 
    updateItemStatus, bumpOrder, recallOrder, assignChefToOrder, isLoading 
  } = useKdsStore();
  const { chefs, fetchChefs } = useChefStore();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewMode, setViewMode] = useState('tickets'); // 'tickets' or 'batches'

  // Connect to KDS Socket
  useKDSSocket();

  useEffect(() => {
    fetchStations();
    fetchQueue();
    fetchBatches();
    fetchChefs();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [fetchStations, fetchQueue, fetchBatches, fetchChefs]);

  // Re-fetch batches when station changes or queue updates
  useEffect(() => {
    fetchBatches();
  }, [selectedStation, tickets, fetchBatches]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.log(e));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Filter out completely served/bumped tickets
  const activeTickets = useMemo(() => {
    return tickets.filter(t => t.status === 'active' || t.status === 'new' || t.status === 'payment_pending');
  }, [tickets]);

  const recentTickets = useMemo(() => {
    return tickets.filter(t => t.status === 'completed').slice(0, 20); // Last 20 completed
  }, [tickets]);

  // Compute what to show on ticket based on station filter
  const getVisibleTickets = (sourceTickets) => {
    return sourceTickets.map(ticket => {
      // Filter items in this ticket based on station
      const filteredItems = selectedStation === 'all' 
        ? ticket.items 
        : ticket.items.filter(i => i.stationId?._id === selectedStation || i.stationId === selectedStation);
      
      return { ...ticket, visibleItems: filteredItems };
    }).filter(t => t.visibleItems.length > 0);
  };

  const visibleTickets = useMemo(() => getVisibleTickets(activeTickets), [activeTickets, selectedStation]);
  const visibleRecentTickets = useMemo(() => getVisibleTickets(recentTickets), [recentTickets, selectedStation]);


  const getTicketStatus = (items) => {
    if (items.some(i => i.status === 'preparing')) return 'preparing';
    if (items.every(i => i.status === 'ready' || i.status === 'served')) return 'ready';
    return 'new';
  };

  const handleNextStatus = async (orderId, item, currentStatus) => {
    const flow = { new: 'preparing', preparing: 'ready', ready: 'served' };
    const nextStatus = flow[currentStatus] || currentStatus;
    if (nextStatus !== currentStatus) {
      await updateItemStatus(orderId, item._id, nextStatus);
    }
  };

  return (
    <div className="fixed inset-0 bg-surface-50 dark:bg-surface-950 z-50 flex flex-col font-sans overflow-hidden">
      {/* KDS Header */}
      <header className="min-h-16 h-auto py-2 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 px-4 flex flex-col md:flex-row items-center justify-between shadow-md shrink-0 gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-surface-900 dark:text-white shrink-0">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <ChefHat className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
            <div>
              <h1 className="font-black text-lg md:text-xl leading-tight uppercase tracking-tighter text-surface-900 dark:text-white">KDS</h1>
              <p className="text-[9px] font-bold text-surface-500 uppercase tracking-[0.2em] leading-none">Command Center</p>
            </div>
            </div>
          </div>
          
          <div className="hidden sm:block h-8 w-px bg-surface-200 dark:bg-surface-800 mx-1" />

          {/* Station Filters - Scrollable Row */}
          <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedStation('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                selectedStation === 'all' 
                  ? "bg-primary-600 border-primary-600 text-white shadow-lg" 
                  : "bg-surface-100 dark:bg-surface-900 border-surface-200 dark:border-surface-800 text-surface-500 hover:text-surface-900 dark:hover:text-white"
              )}
            >
              All Stations
            </button>
            {stations.map(station => (
              <button
                key={station._id}
                onClick={() => setSelectedStation(station._id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 border",
                  selectedStation === station._id 
                    ? "text-white shadow-lg border-transparent" 
                    : "bg-surface-100 dark:bg-surface-900 border-surface-200 dark:border-surface-800 text-surface-500 hover:text-surface-900 dark:hover:text-white"
                )}
                style={{ backgroundColor: selectedStation === station._id ? station.color || '#8B5CF6' : undefined }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                {station.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          {/* View Mode Toggle */}
          <div className="flex bg-surface-100 dark:bg-surface-900 rounded-xl p-1 border border-surface-200 dark:border-surface-800">
            {[
              { id: 'tickets', label: 'Tickets', icon: ClipboardList },
              { id: 'batches', label: 'Batched', icon: Layers },
              { id: 'recent', label: 'Recent', icon: History }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={cn(
                  "px-3 md:px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                  viewMode === mode.id 
                    ? "bg-white dark:bg-surface-800 text-surface-900 dark:text-white shadow-md border border-surface-200/50 dark:border-surface-700/50" 
                    : "text-surface-500 hover:text-surface-700 dark:hover:text-white"
                )}
              >
                <mode.icon size={12} className="shrink-0" />
                <span className={cn(viewMode === mode.id ? "block" : "hidden sm:block")}>{mode.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-surface-900 dark:bg-black rounded-lg px-3 py-2 border border-surface-800">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-black text-surface-300 uppercase leading-none">
                {activeTickets.length} Pending
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors border",
                  soundEnabled 
                    ? "text-amber-500 border-amber-500/20 bg-amber-500/10" 
                    : "bg-surface-100 dark:bg-surface-900 text-surface-500 hover:text-primary-500 border-surface-200 dark:border-surface-800"
                )}
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-900 flex items-center justify-center text-surface-500 hover:text-primary-500 transition-colors border border-surface-200 dark:border-surface-800"
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            </div>

            {/* Premium Digital Clock */}
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm transition-all hover:bg-surface-50 dark:hover:bg-surface-800/80">
              <div className="flex flex-col items-end">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-surface-900 dark:text-white leading-none tracking-tighter tabular-nums">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).split(' ')[0]}
                  </span>
                  <span className="text-[10px] font-black text-primary-500 uppercase">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', hour12: true }).split(' ')[1]}
                  </span>
                </div>
                <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest leading-none mt-1">
                  {currentTime.toLocaleTimeString([], { second: '2-digit' })}s
                </span>
              </div>
              <div className="w-px h-8 bg-surface-200 dark:bg-surface-800" />
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-black text-surface-900 dark:text-white uppercase tracking-tighter">
                  {currentTime.toLocaleDateString([], { weekday: 'short' })}
                </span>
                <span className="text-[9px] font-bold text-surface-500 uppercase">
                  {currentTime.toLocaleDateString([], { day: '2-digit', month: 'short' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main KDS Board */}
      <div className="flex-1 overflow-x-auto p-4 bg-surface-50 dark:bg-surface-950 scrollbar-thin scrollbar-thumb-surface-200 dark:scrollbar-thumb-surface-700 flex flex-col">
        {isLoading && tickets.length === 0 ? (
           <div className="flex-1 flex items-center justify-center">
             <div className="text-surface-500 flex flex-col items-center gap-3">
               <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
               <p>Loading kitchen queue...</p>
             </div>
           </div>
        ) : viewMode === 'batches' ? (
          /* BATCHED VIEW MODE */
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-surface-200 dark:scrollbar-thumb-surface-700">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence>
                  {batches.map(batch => (
                    <motion.div
                      key={batch.menuItemId}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl p-5 shadow-xl relative group overflow-hidden"
                    >
                       <div className="flex justify-between items-start mb-4">
                          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-primary-500/20">
                             {batch.totalQuantity}
                          </div>
                          <div className="text-right">
                             <div className="flex items-center gap-1.5 justify-end text-surface-500 font-bold text-[10px] uppercase">
                                <ShoppingBag size={12} /> {batch.orders.length} Orders
                             </div>
                             <div className="flex gap-1 mt-2 justify-end">
                               {batch.orders.some(o => o.type === 'Takeaway') && <span className="bg-amber-500/20 text-amber-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded">Takeaway</span>}
                               {batch.orders.some(o => o.type === 'Delivery') && <span className="bg-blue-500/20 text-blue-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded">Delivery</span>}
                             </div>
                          </div>
                       </div>
                       
                       <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-4 line-clamp-2 leading-tight">
                         {batch.name}
                       </h3>

                       <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                          {batch.orders.map((order, i) => (
                             <div key={i} className="flex items-center justify-between text-[10px] py-1.5 border-t border-surface-100 dark:border-surface-800/50">
                                <span className={cn(
                                   "font-bold px-1.5 rounded",
                                   order.type === 'Takeaway' ? 'bg-amber-500/10 text-amber-600' : 
                                   order.type === 'Delivery' ? 'bg-blue-500/10 text-blue-600' :
                                   'text-surface-500 dark:text-surface-400'
                                )}>
                                  #{order.orderId}
                                </span>
                                <span className="text-surface-900 dark:text-white font-black">x{order.quantity}</span>
                             </div>
                          ))}
                       </div>

                       {batch.notes.length > 0 && (
                         <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
                            <p className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-1 mb-1">
                               <AlertTriangle size={10} /> Chef Notes
                            </p>
                            <div className="space-y-1">
                               {batch.notes.map((note, i) => (
                                 <p key={i} className="text-[9px] text-amber-200/80 italic">
                                    <span className="font-bold opacity-60">#{note.orderId}:</span> {note.text}
                                 </p>
                               ))}
                            </div>
                         </div>
                       )}

                       <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="bg-surface-700 hover:bg-surface-600 p-2 rounded-lg text-white"
                          >
                             <MoreVertical size={16} />
                          </button>
                       </div>
                       
                       <div className="absolute -left-4 -bottom-4 text-surface-700/10 pointer-events-none">
                          <ChefHat size={100} />
                       </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
             </div>
             {batches.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-surface-700 mt-20">
                   <Layers size={80} className="mb-4 opacity-20" />
                   <h3 className="text-2xl font-black uppercase tracking-tighter">No Active Batches</h3>
                   <p className="text-sm">Wait for identical items to arrive across multiple orders.</p>
                </div>
             )}
          </div>
        ) : viewMode === 'recent' ? (
          /* RECENT / HISTORY VIEW MODE - Grid Based */
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              <AnimatePresence mode="popLayout">
                {visibleRecentTickets.map(ticket => {
                  const elapsedMinutes = Math.floor((new Date(ticket.kdsCompletedAt || ticket.updatedAt) - new Date(ticket.createdAt)) / 1000 / 60);
                  
                  return (
                    <motion.div
                      key={ticket._id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white dark:bg-surface-900 rounded-2xl overflow-hidden flex flex-col border border-surface-200 dark:border-surface-800 shadow-lg dark:shadow-2xl/40 opacity-90 hover:opacity-100 transition-all hover:border-primary-500/30 group h-full"
                    >
                      {/* History Ticket Header */}
                      <div className="px-4 py-3 flex items-center justify-between bg-surface-50 dark:bg-surface-800/80 border-b border-surface-200 dark:border-surface-800 shrink-0">
                        <div>
                          <h2 className="text-base font-black tracking-tight text-surface-900 dark:text-white">
                            #{ticket.orderId || ticket._id.slice(-4).toUpperCase()}
                          </h2>
                          <div className="flex items-center gap-1.5 mt-0.5">
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                             <p className="text-[9px] font-black text-surface-500 uppercase tracking-widest">Completed</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-[10px] font-black text-primary-500 uppercase">
                             <Timer size={10} /> {elapsedMinutes}m Total
                          </div>
                        </div>
                      </div>

                      {/* History Items */}
                      <div className="p-3 space-y-1.5 flex-1 overflow-y-auto scrollbar-thin">
                        {ticket.items.map(item => (
                          <div key={item._id} className="p-2.5 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-700/30 flex items-center justify-between">
                             <div className="flex items-center gap-2.5 min-w-0">
                                <span className="flex items-center justify-center w-5 h-5 rounded-md bg-white dark:bg-surface-900 text-[10px] font-black text-primary-500 shadow-sm border border-surface-100 dark:border-surface-800 shrink-0">
                                  {item.quantity}
                                </span>
                                <span className="text-[11px] font-bold text-surface-700 dark:text-surface-300 truncate">{item.menuItem?.name || item.name}</span>
                             </div>
                             <CheckCircle size={14} className="text-green-500 shrink-0 opacity-40" />
                          </div>
                        ))}
                      </div>

                      {/* Recall Action - Pinned to bottom */}
                      <div className="p-3 bg-surface-50/50 dark:bg-surface-800/20 mt-auto border-t border-surface-100 dark:border-surface-800/50">
                        <button
                          onClick={() => recallOrder(ticket._id)}
                          className="w-full py-2.5 rounded-xl bg-primary-500/5 hover:bg-primary-500 text-primary-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all duration-200 border border-primary-500/20 hover:border-primary-500 flex items-center justify-center gap-2 shadow-sm hover:shadow-primary-500/20 active:scale-[0.98]"
                        >
                           <RefreshCw size={12} className="group-hover:animate-spin-slow" /> Recall to Kitchen
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            {visibleRecentTickets.length === 0 && (
              <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center text-surface-500/30">
                 <History size={120} strokeWidth={1} className="mb-4" />
                 <h3 className="text-2xl font-black uppercase tracking-tighter">No History Available</h3>
                 <p className="text-sm font-bold opacity-60">Completed orders will appear here for review or recall.</p>
              </div>
            )}
          </div>
        ) : (
          /* TRADITIONAL TICKET VIEW MODE */
          <div className="flex gap-6 px-4 pb-6 items-start h-full overflow-x-auto scrollbar-thin scrollbar-thumb-surface-200 dark:scrollbar-thumb-surface-700">

            <AnimatePresence>
              {visibleTickets.map(ticket => {
                const progress = ticket.visibleItems.length > 0 
                  ? Math.round((ticket.visibleItems.filter(i => i.status === 'ready' || i.status === 'served').length / ticket.visibleItems.length) * 100)
                  : 0;
                
                // Get most common chef assigned if any
                const assignedChefId = ticket.visibleItems.find(i => i.chefId)?.chefId;

                return (
                  <motion.div
                    key={ticket._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    className={cn(
                      "flex-shrink-0 w-80 md:w-96 bg-white dark:bg-surface-950 rounded-2xl overflow-hidden flex flex-col border border-surface-200 dark:border-surface-800 shadow-2xl dark:shadow-black/60 max-h-full",
                      ticket.isDelayed && "ring-2 ring-red-500/50"
                    )}
                  >
                    {/* New Detailed Header */}
                    <div className="bg-surface-50 dark:bg-surface-900/50 p-4 border-b border-surface-200 dark:border-surface-800 relative">
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-tighter">Type :</span>
                            <span className="text-[10px] font-black text-surface-900 dark:text-white uppercase">{ticket.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-tighter">Customer :</span>
                            <span className="text-[10px] font-black text-surface-900 dark:text-white uppercase">{ticket.customerName || 'Walking Customer'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-bold text-surface-400 uppercase tracking-tighter">Taken at :</span>
                             <span className="text-[10px] font-black text-surface-900 dark:text-white tabular-nums">
                               {ticket.createdAt ? format(new Date(ticket.createdAt), 'dd-MM-yyyy HH:mm:ss') : '-'}
                             </span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-bold text-surface-400 uppercase tracking-tighter">Dinning table :</span>
                             <span className="text-[10px] font-black text-surface-900 dark:text-white">
                                {ticket.tableId?.name || 'Table one(1)'}
                             </span>
                          </div>
                        </div>
                        
                        {/* Order Type Badge */}
                        <div className="bg-amber-400 text-black text-[10px] font-black px-2.5 py-1 rounded-md uppercase shadow-sm">
                          {ticket.type === 'Dining' ? 'Dining' : 'Pickup'}
                        </div>
                      </div>

                      <div className="flex items-end justify-between mt-2">
                        <h2 className="text-lg font-black text-surface-900 dark:text-white tracking-tighter leading-none">
                          Order # {ticket.orderId || ticket._id.slice(-8).toUpperCase()}
                        </h2>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block">Progress : {progress}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-surface-100 dark:bg-surface-900 relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="absolute inset-0 bg-primary-500 shadow-[0_0_8px_rgba(var(--primary-500-rgb),0.5)] transition-all duration-500"
                      />
                    </div>

                    {/* Chef Selection Dropdown */}
                    <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-800">
                      <div className="relative group">
                        <select
                          value={assignedChefId || ""}
                          onChange={(e) => assignChefToOrder(ticket._id, e.target.value)}
                          className={cn(
                            "w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl px-4 py-2.5 text-xs font-bold text-surface-700 dark:text-surface-300 appearance-none focus:ring-2 focus:ring-primary-500/20 transition-all outline-none cursor-pointer",
                            assignedChefId && "text-primary-600 dark:text-primary-400 border-primary-500/30 bg-primary-500/5"
                          )}
                        >
                          <option value="">Select who is cooking</option>
                          {chefs?.filter(c => c.chefProfile?.isAvailable).map(chef => (
                            <option key={chef._id} value={chef._id}>{chef.name}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-surface-400 group-hover:text-primary-500 transition-colors">
                          <ChefHat size={14} />
                        </div>
                      </div>
                    </div>

                    {/* Ticket Items Container */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                      {ticket.visibleItems.map(item => {
                          const isReady = item.status === 'ready' || item.status === 'served';
                          
                          return (
                            <div 
                              key={item._id} 
                              className={cn(
                                "flex items-start gap-3 transition-opacity duration-200",
                                isReady && "opacity-60"
                              )}
                            >
                              <button
                                onClick={() => handleNextStatus(ticket._id, item, item.status)}
                                className={cn(
                                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 mt-0.5",
                                  isReady 
                                    ? "bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/20" 
                                    : "border-surface-300 dark:border-surface-700 hover:border-primary-500"
                                )}
                              >
                                {isReady && <CheckCircle size={14} strokeWidth={3} />}
                              </button>
                              
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "font-bold text-sm text-surface-900 dark:text-white leading-tight",
                                  isReady && "line-through text-surface-400"
                                )}>
                                  {item.quantity} x {item.menuItem?.name || item.name}
                                </p>
                                {item.note && (
                                  <p className="text-amber-500 text-[11px] font-medium mt-1 flex items-center gap-1">
                                     <AlertTriangle size={10} /> {item.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                      })}
                    </div>

                    {/* Ticket Footer Action */}
                    <div className="p-4 bg-surface-50 dark:bg-surface-900/50 border-t border-surface-200 dark:border-surface-800">
                      <button
                        onClick={() => bumpOrder(ticket._id)}
                        disabled={progress < 100}
                        className={cn(
                          "w-full py-3.5 rounded-xl font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-lg",
                          progress === 100 
                            ? "bg-primary-500 hover:bg-primary-600 text-white shadow-primary-500/20 active:scale-[0.98]" 
                            : "bg-surface-200 dark:bg-surface-800 text-surface-400 cursor-not-allowed opacity-50"
                        )}
                      >
                         <CheckCircle size={18} /> Complete Order
                      </button>
                    </div>
                  </motion.div>
                );
              })}
              {visibleTickets.length === 0 && !isLoading && (
                 <div className="w-full h-full flex items-center justify-center text-surface-500 mt-20">
                    <div className="text-center">
                       <ChefHat size={64} className="mx-auto text-surface-700 mb-4 opacity-50" />
                       <h3 className="text-xl font-bold">Kitchen is Clear</h3>
                       <p className="text-sm">No active tickets for the selected station.</p>
                    </div>
                 </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
