import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ticket, Timer, Volume2, VolumeX, 
  ShoppingBag, Truck, Utensils, 
  Clock, AlertCircle, ChefHat
} from 'lucide-react';
import api from '@/lib/api';
import useTokenDisplaySocket from '@/hooks/useTokenDisplaySocket';
import { cn } from '@/lib/utils';

export default function TokenDisplayPage() {
  const { restaurantCode } = useParams();
  const [searchParams] = useSearchParams();
  const outletId = searchParams.get('outlet');

  const [restaurant, setRestaurant] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastCalledToken, setLastCalledToken] = useState(null);

  const pickupSoundRef = useRef(null);

  const fetchDisplayData = useCallback(async () => {
    try {
      const res = await api.get(`/public/token-display/${restaurantCode}${outletId ? `?outlet=${outletId}` : ''}`);
      setTokens(res.data.data);
      setStats(res.data.stats);
      setRestaurant(res.data.restaurant);
      
      // Initialize sound state from remote settings if not already explicitly toggled by user
      const remoteSoundEnabled = res.data.restaurant?.tokenSettings?.enableAudioAnnouncements ?? true;
      setSoundEnabled(remoteSoundEnabled);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch display data:', error);
      setIsLoading(false);
    }
  }, [restaurantCode, outletId]);

  useEffect(() => {
    fetchDisplayData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [fetchDisplayData]);

  // Audio Announcement Logic
  const announceToken = useCallback((token) => {
    if (!soundEnabled) return;
    
    // Play bell sound
    if (pickupSoundRef.current) {
      pickupSoundRef.current.play().catch(e => console.log('Audio play failed:', e));
    }

    // Text to Speech announcement
    setTimeout(() => {
      const msg = new SpeechSynthesisUtterance();
      msg.text = `Token number ${token.tokenNumber.replace('T-', '')}, please collect your order.`;
      msg.rate = 0.9;
      window.speechSynthesis.speak(msg);
    }, 1000);
  }, [soundEnabled]);

  const handleSocketEvent = useCallback((type, data) => {
    if (type === 'new') {
      setTokens(prev => [...prev, data]);
    } else if (type === 'updated') {
      setTokens(prev => prev.map(t => t._id === data._id ? data : t));
    } else if (type === 'called') {
      setLastCalledToken(data);
      announceToken(data);
      // Auto clear call alert after 10s
      setTimeout(() => setLastCalledToken(null), 10000);
    }
    // Refresh full data for stats or heavy updates
    fetchDisplayData();
  }, [fetchDisplayData, announceToken]);

  useTokenDisplaySocket(restaurantCode, outletId, handleSocketEvent);

  const preparingTokens = tokens.filter(t => t.status === 'preparing' || t.status === 'waiting');
  const readyTokens = tokens.filter(t => t.status === 'ready');

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-surface-950 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-surface-400 font-black uppercase tracking-widest animate-pulse">Initializing Display...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-surface-950 text-white font-sans flex flex-col overflow-hidden">
      <audio ref={pickupSoundRef} src="/sounds/notification.mp3" preload="auto" />
      
      {/* Header */}
      <header className="h-24 bg-surface-900 border-b border-surface-800 px-10 flex items-center justify-between shadow-2xl shrink-0">
        <div className="flex items-center gap-6">
          {restaurant?.logo ? (
            <img src={restaurant.logo} alt="Logo" className="h-14 w-14 rounded-xl object-contain bg-white p-1" />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-primary-600 flex items-center justify-center">
              <ChefHat className="w-8 h-8" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">{restaurant?.name || 'Restaurant Display'}</h1>
            <p className="text-primary-500 font-bold uppercase text-xs tracking-[0.3em] mt-2">Digital Token Queue</p>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="text-right">
             <div className="flex items-center gap-2 justify-end text-surface-400 font-black uppercase tracking-widest">
               <Clock className="w-5 h-5" />
               <span className="text-2xl">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
             </div>
             <p className="text-[10px] text-surface-600 font-bold mt-1 uppercase tracking-widest">{currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn("p-4 rounded-full transition-all border-2", soundEnabled ? "border-primary-500/50 text-primary-400 bg-primary-500/10 shadow-lg shadow-primary-500/20" : "border-surface-800 text-surface-600")}
          >
            {soundEnabled ? <Volume2 size={32} /> : <VolumeX size={32} />}
          </button>
        </div>
      </header>

      {/* Main Display Grid */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Section: NOW PREPARING */}
        <div className="w-[40%] border-r border-surface-800 flex flex-col bg-surface-900/30">
          <div className="h-20 bg-amber-500/10 border-b border-amber-500/20 flex items-center px-10 gap-3">
             <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
             <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-amber-500">Preparing</h2>
             <span className="ml-auto bg-surface-800 px-3 py-1 rounded-lg font-black text-amber-500">{preparingTokens.length}</span>
          </div>
          
          <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <AnimatePresence>
                {preparingTokens.map(token => (
                  <motion.div
                    key={token._id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2, x: 200 }}
                    className="bg-surface-800/80 border border-surface-700/50 rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg h-40"
                  >
                    <span className="text-5xl font-black font-mono tracking-tighter text-white opacity-80">
                      {token.tokenNumber.replace('T-', '')}
                    </span>
                    {token.estimatedWaitMinutes > 0 && (
                      <div className={cn(
                        "mt-4 px-4 py-2 rounded-full border flex items-center gap-2 shadow-sm transition-all",
                        token.estimatedWaitMinutes <= 3 
                          ? "bg-amber-500/20 border-amber-500 text-amber-500 animate-pulse" 
                          : "bg-surface-700/50 border-surface-600 text-surface-400"
                      )}>
                         <Timer size={16} className={token.estimatedWaitMinutes <= 3 ? "animate-spin-slow" : ""} />
                         <span className="text-sm font-black uppercase tracking-tight">
                           {token.estimatedWaitMinutes} mins to go
                         </span>
                         <span className="text-[10px] opacity-40 font-bold ml-1 hidden sm:inline">AI PREDICTED</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Section: NOW READY / SERVING */}
        <div className="flex-1 flex flex-col bg-surface-950">
          <div className="h-20 bg-green-500/10 border-b border-green-500/20 flex items-center px-10 gap-3">
             <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
             <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-green-500">Ready for Collection</h2>
          </div>

          <div className="flex-1 p-10 overflow-y-auto no-scrollbar relative">
             {/* Announcement Overlay */}
             <AnimatePresence>
               {lastCalledToken && (
                 <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    className="absolute inset-x-10 top-10 z-10 bg-gradient-to-br from-green-500 to-green-700 rounded-3xl p-12 shadow-[0_0_80px_rgba(34,197,94,0.4)] flex flex-col items-center justify-center border-4 border-white/20"
                 >
                    <div className="bg-white/20 rounded-2xl px-6 py-2 mb-6">
                       <span className="text-2xl font-black uppercase tracking-widest text-white">Pickup Alert</span>
                    </div>
                    <span className="text-[12rem] font-black font-mono leading-none tracking-tighter text-white drop-shadow-2xl">
                      {lastCalledToken.tokenNumber.replace('T-', '')}
                    </span>
                    <p className="text-3xl font-black uppercase tracking-widest text-white mt-10 opacity-90">Please Proceed to Counter</p>
                 </motion.div>
               )}
             </AnimatePresence>

             <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {readyTokens.map(token => (
                    <motion.div
                      key={token._id}
                      layout
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-500/10 border-4 border-green-500/30 rounded-3xl p-10 flex flex-col items-center justify-center relative shadow-2xl overflow-hidden group h-64"
                    >
                      <span className="text-[7rem] font-black font-mono tracking-tighter text-green-500 drop-shadow-lg leading-none">
                        {token.tokenNumber.replace('T-', '')}
                      </span>
                      <div className="mt-4 flex items-center gap-2 bg-green-500/20 px-4 py-1 rounded-full">
                         <span className="text-lg font-black text-green-400 uppercase tracking-widest">{token.type}</span>
                      </div>

                      {/* Animated Background Tick */}
                      <Ticket className="absolute -right-8 -bottom-8 w-40 h-40 text-green-500 opacity-[0.03] rotate-12" />
                    </motion.div>
                  ))}
                </AnimatePresence>
             </div>

             {readyTokens.length === 0 && !lastCalledToken && (
               <div className="h-full flex flex-col items-center justify-center text-surface-800">
                  <ChefHat size={120} className="mb-6 opacity-20" />
                  <p className="text-2xl font-black uppercase tracking-widest opacity-30 italic">Cooking Deliciousness...</p>
               </div>
             )}
          </div>
        </div>
      </main>

      {/* Footer Ticker */}
      <footer className="h-16 bg-surface-950 border-t border-surface-900 flex items-center shrink-0 overflow-hidden">
        <div className="bg-primary-600 h-full px-8 flex items-center shrink-0 z-10 shadow-2xl">
           <span className="font-black uppercase tracking-widest text-lg">Information</span>
        </div>
        <div className="flex-1 relative overflow-hidden h-full flex items-center">
           <motion.div 
             animate={{ x: [1000, -2000] }}
             transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
             className="whitespace-nowrap flex gap-20 items-center text-surface-400 font-bold text-xl"
           >
              <span>Welcome to {restaurant?.name}! Your patience is greatly appreciated as we serve you are freshly prepared meals.</span>
              <span>•</span>
              <span>Now accepting QR payments at your table. Simply scan the QR code to view the menu and pay instantly.</span>
              <span>•</span>
              <span>Join our loyalty program and get 10% off on your next visit! Scan the code at the counter.</span>
              <span>•</span>
              <span>We value your feedback. Please rate us on Google Maps!</span>
           </motion.div>
        </div>
      </footer>
    </div>
  );
}
