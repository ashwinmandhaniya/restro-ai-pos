import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ticket, Timer, CheckCircle, Bell, ArrowRight, 
  Search, Filter, MoreVertical, RefreshCw, 
  ShoppingBag, Truck, Utensils, AlertCircle,
  Volume2, VolumeX, Maximize, Minimize, History,
  Sparkles, Trash2
} from 'lucide-react';

import useTokenStore from '@/store/tokenStore';
import useAuthStore from '@/store/authStore';
import useTokenSocket from '@/hooks/useTokenSocket';
import { cn, formatCurrency } from '@/lib/utils';

const STATUS_COLUMNS = [
  { id: 'waiting', label: 'Waiting', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 'preparing', label: 'Preparing', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { id: 'ready', label: 'Ready', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { id: 'served', label: 'Served', color: 'text-surface-500', bg: 'bg-surface-800/50', border: 'border-surface-700/50' }
];

const TYPE_ICONS = {
  'Dine-in': Utensils,
  'Takeaway': ShoppingBag,
  'Delivery': Truck
};

const PRIORITY_COLORS = {
  'normal': 'bg-surface-700 text-surface-300',
  'high': 'bg-orange-500 text-white animate-pulse',
  'rush': 'bg-red-600 text-white animate-bounce'
};

export default function TokenManagementPage() {
  const { user } = useAuthStore();
  const { 
    tokens, stats, fetchQueue, fetchStats, 
    advanceToken, updatePriority, recallToken, optimizeQueue, isLoading 
  } = useTokenStore();
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Connect to Token Socket
  useTokenSocket();

  useEffect(() => {
    fetchQueue();
    fetchStats();
    
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const statsTimer = setInterval(() => fetchStats(), 30000); // Auto refresh stats every 30s
    
    return () => {
      clearInterval(timer);
      clearInterval(statsTimer);
    };
  }, [fetchQueue, fetchStats]);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const msg = await optimizeQueue();
      // We assume toast is available via some context or global
      alert(msg || "Queue optimized successfully!");
    } catch (err) {
      alert(err.message || "AI Optimization failed");
    } finally {
      setIsOptimizing(false);
    }
  };


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

  const filteredTokens = useMemo(() => {
    return tokens.filter(t => {
      const matchesSearch = t.tokenNumber.toLowerCase().includes(search.toLowerCase()) || 
                            (t.orderId?.orderId && t.orderId.orderId.toLowerCase().includes(search.toLowerCase()));
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [tokens, search, typeFilter]);

  const [activeMenu, setActiveMenu] = useState(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = () => setActiveMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleStatusAdvance = async (tokenId, currentStatus) => {
    const nextStatusMap = {
      'waiting': 'preparing',
      'preparing': 'ready',
      'ready': 'served',
      'served': 'completed'
    };
    const nextStatus = nextStatusMap[currentStatus];
    if (nextStatus) {
      await advanceToken(tokenId, nextStatus);
    }
  };

  const handlePriorityUpdate = async (tokenId, priority) => {
     try {
       await updatePriority(tokenId, priority);
       setActiveMenu(null);
     } catch (err) {
       alert(err.message || "Failed to update priority");
     }
  };

  const handleCancelToken = async (tokenId) => {
    if (window.confirm("Are you sure you want to cancel this token?")) {
      try {
        await cancelToken(tokenId);
        setActiveMenu(null);
      } catch (err) {
        alert(err.message || "Failed to cancel token");
      }
    }
  };

  const getElapsedTime = (createdAt) => {
    const diff = Math.floor((currentTime - new Date(createdAt)) / 1000 / 60);
    return diff;
  };

  return (
    <div className="fixed inset-0 bg-surface-50 dark:bg-surface-950 z-50 flex flex-col font-sans overflow-hidden">
      {/* Header omitted for brevity in diff, but remains same */}
      <header className="h-16 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 px-6 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl leading-none tracking-tight uppercase text-surface-900 dark:text-white">Token Queue</h1>
              <p className="text-[10px] text-surface-500 font-mono mt-1 uppercase tracking-widest">{currentTime.toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="h-8 w-px bg-surface-800 hidden md:block" />

          {/* Stats Bar */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-surface-500 uppercase font-black tracking-wider">Waiting</span>
              <span className="text-lg font-bold text-blue-400 leading-none">{stats.waiting}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-surface-500 uppercase font-black tracking-wider">Ready</span>
              <span className="text-lg font-bold text-green-400 leading-none">{stats.ready}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-surface-500 uppercase font-black tracking-wider">Avg Wait</span>
              <span className="text-lg font-bold text-amber-400 leading-none">{stats.avgWaitMinutes}m</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Search/Filter Controls */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input 
              type="text" 
              placeholder="Search token..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-surface-100 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 text-sm rounded-lg pl-9 pr-4 py-2 focus:ring-1 focus:ring-primary-500 outline-none w-48 transition-all focus:w-64"
            />
          </div>

          <div className="flex bg-surface-100 dark:bg-surface-800 rounded-lg p-1">
            {['all', 'Dine-in', 'Takeaway', 'Delivery'].map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={cn(
                  "px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all",
                  typeFilter === type ? "bg-primary-600 text-white shadow-lg" : "text-surface-500 hover:text-surface-900 dark:hover:text-surface-300"
                )}
              >
                {type === 'all' ? 'All' : type}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-surface-800" />

          <button 
            onClick={handleOptimize}
            disabled={isOptimizing}
            className={cn(
              "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all",
              isOptimizing 
                ? "bg-surface-800 border-surface-700 text-surface-500 animate-pulse" 
                : "bg-surface-800 border-primary-500/30 text-primary-400 hover:bg-primary-500/10 hover:border-primary-500"
            )}
          >
            <Sparkles size={14} className={isOptimizing ? 'animate-spin' : ''} />
            {isOptimizing ? 'Optimizing...' : 'AI Reorder'}
          </button>

          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn("p-2 rounded-lg transition-all", soundEnabled ? "text-primary-600 dark:text-primary-400 bg-primary-400/10" : "text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800")}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          
          <button 
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-white transition-all"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="flex-1 overflow-hidden flex p-4 gap-4">
        {STATUS_COLUMNS.map(col => {
          const colTokens = filteredTokens.filter(t => t.status === col.id);
          
          return (
            <div key={col.id} className="flex-1 flex flex-col min-w-[300px] h-full">
              <div className={cn("px-4 py-3 rounded-t-xl border-b-2 flex items-center justify-between shrink-0", col.bg, col.border)}>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", col.color.replace('text', 'bg'))} />
                  <h3 className="font-black uppercase tracking-widest text-sm text-surface-900 dark:text-white">{col.label}</h3>
                  <span className="bg-surface-200 dark:bg-surface-900/50 px-2 py-0.5 rounded text-[10px] font-bold text-surface-600 dark:text-surface-400 ml-2">
                    {colTokens.length}
                  </span>
                </div>
                {col.id === 'served' && (
                  <button onClick={() => fetchQueue()} className="text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors">
                    <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-3 bg-surface-100/50 dark:bg-surface-900/30 rounded-b-xl scrollbar-thin scrollbar-thumb-surface-200 dark:scrollbar-thumb-surface-700">
                <AnimatePresence mode="popLayout">
                  {colTokens.map((token, index) => {
                    const TypeIcon = TYPE_ICONS[token.type] || ShoppingBag;
                    const elapsed = getElapsedTime(token.createdAt);
                    
                    return (
                      <motion.div
                        key={token._id}
                        layout
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "bg-white dark:bg-surface-800 border-l-4 rounded-xl p-4 shadow-lg dark:shadow-xl relative group overflow-visible",
                          col.id === 'waiting' && elapsed > 15 ? 'border-red-500' : 
                          col.id === 'ready' ? 'border-green-500' : 'border-surface-200 dark:border-surface-700'
                        )}
                      >
                        {/* Token Header */}
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-2xl font-black font-mono tracking-tighter text-surface-900 dark:text-white">
                              {token.tokenNumber}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                               <TypeIcon size={12} className="text-surface-500" />
                               <span className="text-[10px] font-bold text-surface-500 uppercase">{token.type}</span>
                            </div>
                          </div>
                          <div className="text-right">
                             <div className="flex items-center gap-1 text-[10px] font-bold text-surface-400">
                                <Timer size={10} />
                                {elapsed} min
                             </div>
                             {token.priority !== 'normal' && (
                               <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full mt-1 inline-block", PRIORITY_COLORS[token.priority])}>
                                 {token.priority}
                               </span>
                             )}
                          </div>
                        </div>

                        {/* Order Info */}
                        <div className="border-t border-surface-700/50 py-3">
                           <p className="text-xs font-bold text-surface-900 dark:text-surface-200 truncate">
                             Order #{token.orderId?.orderId || 'N/A'}
                           </p>
                           <p className="text-[10px] text-surface-500 mt-1 uppercase font-bold">
                             {token.customerName || 'Walk-in Customer'}
                           </p>
                        </div>

                        {/* Waiting/Predict Info */}
                        {col.id === 'waiting' && token.estimatedWaitMinutes > 0 && (
                          <div className="bg-surface-900/50 rounded-lg p-2 mb-3 border border-surface-700/30 flex items-center gap-2">
                             <div className="w-6 h-6 rounded bg-amber-500/10 flex items-center justify-center">
                                <Timer size={12} className="text-amber-500" />
                             </div>
                             <div>
                               <p className="text-[8px] text-surface-500 uppercase font-black">Est. Wait</p>
                               <p className="text-[10px] font-bold text-amber-400">{token.estimatedWaitMinutes} mins</p>
                             </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 mt-2">
                          {col.id !== 'served' ? (
                            <button
                              onClick={() => handleStatusAdvance(token._id, token.status)}
                              className={cn(
                                "flex-1 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all",
                                col.id === 'ready' ? "bg-green-600 hover:bg-green-500 text-white" : "bg-surface-700 hover:bg-surface-600 text-white"
                              )}
                            >
                              {col.id === 'ready' ? (
                                <><CheckCircle size={14} /> Completed</>
                              ) : (
                                <><ArrowRight size={14} /> Next Step</>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => recallToken(token._id)}
                              className="flex-1 py-2 rounded-lg bg-surface-700 hover:bg-surface-600 text-white font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2"
                            >
                              <History size={14} /> Recall
                            </button>
                          )}
                          
                          {/* Three-Dot Menu Button */}
                          <div className="relative">
                            <button 
                              className={cn(
                                "p-2 rounded-lg transition-all",
                                activeMenu === token._id ? "bg-primary-600 text-white shadow-lg" : "bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenu(activeMenu === token._id ? null : token._id);
                              }}
                            >
                               <MoreVertical size={16} />
                            </button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                              {activeMenu === token._id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                  className="absolute right-0 bottom-full mb-3 w-52 bg-white/90 dark:bg-surface-900/90 backdrop-blur-xl border border-surface-200/50 dark:border-surface-700/50 rounded-2xl shadow-2xl p-2 z-[60] ring-1 ring-black/5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="px-3 py-2 border-b border-surface-100 dark:border-surface-800 mb-1">
                                    <p className="text-[10px] font-black uppercase text-surface-400 tracking-widest flex items-center gap-2">
                                       <Sparkles size={10} className="text-primary-500" />
                                       Set Importance
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    {[
                                      { id: 'normal', label: 'Normal', color: 'bg-surface-400' },
                                      { id: 'high', label: 'High Priority', color: 'bg-amber-500' },
                                      { id: 'rush', label: 'Rush / Immediate', color: 'bg-red-500' }
                                    ].map(pri => (
                                      <button
                                        key={pri.id}
                                        onClick={() => handlePriorityUpdate(token._id, pri.id)}
                                        className={cn(
                                          "w-full px-3 py-2.5 rounded-xl text-left text-[11px] font-black uppercase tracking-tight flex items-center justify-between transition-all group",
                                          token.priority === pri.id 
                                            ? "bg-primary-500 text-white shadow-md shadow-primary-500/20" 
                                            : "text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
                                        )}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className={cn("w-2 h-2 rounded-full", pri.color)} />
                                          {pri.label}
                                        </div>
                                        {token.priority === pri.id && <CheckCircle size={14} className="text-white" />}
                                      </button>
                                    ))}
                                  </div>
                                  
                                  <div className="my-2 border-t border-surface-100 dark:border-surface-800" />
                                  
                                  <button
                                    onClick={() => handleCancelToken(token._id)}
                                    className="w-full px-3 py-2.5 rounded-xl text-left text-[11px] font-black uppercase tracking-tight text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-all"
                                  >
                                    <Trash2 size={14} /> 
                                    <span>Cancel Token</span>
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                           <Ticket size={80} />
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {colTokens.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-surface-700 opacity-30 mt-10">
                    <AlertCircle size={48} />
                    <p className="text-xs font-black uppercase mt-2">Empty Column</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
