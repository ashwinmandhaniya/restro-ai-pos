import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Activity, Award, Brain, Zap, Clock, TrendingUp, AlertTriangle, Menu as MenuIcon, EyeOff, LayoutDashboard, Shuffle, RefreshCw, Sparkles
} from 'lucide-react';
import useChefStore from '@/store/chefStore';
import useUIStore from '@/store/uiStore';
import useChefSocket from '@/hooks/useChefSocket';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ChefManagementPage() {
  const { 
    chefs, leaderboard, dashboard, aiInsights, stations, isLoading,
    fetchChefs, fetchLeaderboard, fetchDashboard, fetchAIInsights, fetchStations,
    toggleAvailability, triggerRebalance, updateChefStation
  } = useChefStore();
  const { darkMode } = useUIStore();
  const [activeTab, setActiveTab] = useState('board');
  
  // Initialize socket connection
  useChefSocket();

  useEffect(() => {
    fetchChefs();
    fetchLeaderboard();
    fetchDashboard();
    fetchStations();
  }, [fetchChefs, fetchLeaderboard, fetchDashboard, fetchStations]);

  // Lazy load AI insights
  useEffect(() => {
    if (activeTab === 'insights' && !aiInsights) {
      fetchAIInsights();
    }
  }, [activeTab, aiInsights, fetchAIInsights]);

  const stats = dashboard?.stats || { totalItemsCompleted: 0, averageEfficiency: 0, totalErrors: 0, totalDelayed: 0 };
  const onlineChefs = dashboard?.onlineChefs || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-500" />
            Chef Management
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Real-time kitchen workforce orchestration and performance tracking.
          </p>
        </div>
        
        {/* KPI Indicators */}
        <div className="flex gap-4">
           <div className="card !p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                 <Activity className="w-5 h-5"/>
              </div>
              <div>
                 <p className="text-[10px] text-surface-500 font-bold uppercase tracking-wider">Online Chefs</p>
                 <p className="text-lg font-bold text-surface-900 dark:text-white">{onlineChefs} <span className="text-xs font-medium text-surface-400">/ {chefs.length}</span></p>
              </div>
           </div>
           
           <div className="card !p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                 <TrendingUp className="w-5 h-5"/>
              </div>
              <div>
                 <p className="text-[10px] text-surface-500 font-bold uppercase tracking-wider">Avg Efficiency</p>
                 <p className="text-lg font-bold text-surface-900 dark:text-white">{Math.round(stats.averageEfficiency)}%</p>
              </div>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-surface-100 dark:bg-surface-800/50 rounded-lg overflow-x-auto">
         {[
           { id: 'board', label: 'Live Board', icon: LayoutDashboard },
           { id: 'leaderboard', label: 'Performance', icon: Award },
           { id: 'insights', label: 'AI Insights', icon: Brain },
           { id: 'stations', label: 'Station Mapping', icon: Shuffle }
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={cn(
               "flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all whitespace-nowrap outline-none",
               activeTab === tab.id 
                 ? "bg-white dark:bg-surface-800 text-primary-600 dark:text-primary-400 shadow-sm"
                 : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-white/50 dark:hover:bg-surface-700/50"
             )}
           >
             <tab.icon className="w-4 h-4" />
             {tab.label}
           </button>
         ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'board' && (
          <motion.div key="board" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            
            <div className="flex justify-between items-center">
               <h2 className="text-lg font-semibold flex items-center gap-2">
                 Active Kitchen Workforce
                 {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-surface-400" />}
               </h2>
               <button onClick={triggerRebalance} className="btn btn-secondary text-sm flex items-center gap-2">
                  <Shuffle className="w-4 h-4" /> Auto-Balance Load
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {chefs.length === 0 ? (
                 <div className="col-span-full py-12 text-center text-surface-500 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-dashed border-surface-200 dark:border-surface-700">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No chefs registered yet.</p>
                 </div>
              ) : chefs.map(chef => {
                const profile = chef.chefProfile || {};
                const isOnline = profile.isAvailable;
                const loadPercentage = Math.min((profile.currentLoad / (profile.maxConcurrentItems || 8)) * 100, 100);
                
                return (
                  <div key={chef._id} className={cn(
                    "card !p-0 relative overflow-hidden transition-all",
                    !isOnline && "opacity-60 grayscale-[0.5]"
                  )}>
                    {/* Status indicator strip */}
                    <div className={cn(
                       "absolute top-0 left-0 w-full h-1",
                       isOnline 
                         ? (loadPercentage >= 90 ? "bg-red-500" : loadPercentage >= 70 ? "bg-amber-500" : "bg-emerald-500") 
                         : "bg-surface-300 dark:bg-surface-600"
                    )} />

                    <div className="p-5">
                       <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-lg font-bold text-surface-600 dark:text-surface-400 uppercase border border-surface-200 dark:border-surface-700">
                                {chef.name.substring(0,2)}
                             </div>
                             <div>
                                <h3 className="font-bold text-surface-900 dark:text-white leading-tight">{chef.name}</h3>
                                <p className="text-xs text-surface-500 mt-0.5">{profile.primaryStationId?.name || "Floating Chef"}</p>
                             </div>
                          </div>
                          
                          <label className="relative inline-flex items-center cursor-pointer" title="Toggle shift availability">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={isOnline}
                              onChange={(e) => toggleAvailability(chef._id, e.target.checked)}
                            />
                            <div className="w-8 h-4 bg-surface-200 peer-focus:outline-none rounded-full peer dark:bg-surface-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-surface-600 peer-checked:bg-emerald-500"></div>
                          </label>
                       </div>

                       <div className="space-y-3">
                          <div>
                             <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-1">
                                <span className="text-surface-500">Active Load</span>
                                <span className={cn(
                                   loadPercentage >= 90 ? "text-red-500" : "text-primary-500"
                                )}>
                                   {profile.currentLoad} / {profile.maxConcurrentItems || 8}
                                </span>
                             </div>
                             <div className="w-full bg-surface-100 dark:bg-surface-800 h-1.5 rounded-full overflow-hidden border border-surface-200/50 dark:border-surface-700/50">
                                <motion.div 
                                  className={cn(
                                     "h-full rounded-full",
                                     loadPercentage >= 90 ? "bg-red-500" : loadPercentage >= 70 ? "bg-amber-500" : "bg-primary-500"
                                  )}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${loadPercentage}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div key="leaderboards" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
             <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700 text-sm text-surface-500">
                            <th className="p-4 font-semibold">Rank & Chef</th>
                            <th className="p-4 font-semibold text-center">Efficiency Score</th>
                            <th className="p-4 font-semibold text-center">Items Done today</th>
                            <th className="p-4 font-semibold text-center">Avg Time</th>
                            <th className="p-4 font-semibold text-center">Error Rate</th>
                         </tr>
                      </thead>
                      <tbody>
                         {leaderboard.length === 0 ? (
                           <tr>
                              <td colSpan={5} className="p-8 text-center text-surface-500">No performance data for today yet.</td>
                           </tr>
                         ) : leaderboard.map((entry, index) => (
                            <tr key={index} className="border-b border-surface-100 dark:border-surface-700/50 last:border-0 hover:bg-surface-50 dark:hover:bg-surface-800/80 transition-colors">
                               <td className="p-4">
                                  <div className="flex items-center gap-3">
                                     <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                        index === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" : 
                                        index === 1 ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" :
                                        index === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400" :
                                        "bg-surface-100 text-surface-500 dark:bg-surface-800"
                                     )}>
                                        #{index + 1}
                                     </div>
                                     <span className="font-medium">{entry.chefId?.name || 'Unknown'}</span>
                                  </div>
                               </td>
                               <td className="p-4 text-center">
                                  <span className={cn(
                                     "px-3 py-1 rounded-full text-sm font-bold",
                                     entry.efficiencyScore > 85 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                     entry.efficiencyScore > 65 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                     "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  )}>{entry.efficiencyScore}%</span>
                               </td>
                               <td className="p-4 text-center font-medium">{entry.itemsCompleted}</td>
                               <td className="p-4 text-center text-surface-600 dark:text-surface-300">{Math.round(entry.avgPrepTime / 60)} min</td>
                               <td className="p-4 text-center">
                                  {entry.itemsCompleted > 0 ? Math.round((entry.errorCount / entry.itemsCompleted) * 100) : 0}%
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'insights' && (
          <motion.div key="insights" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
             {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-surface-500">
                   <Brain className="w-12 h-12 mb-4 animate-pulse text-indigo-500 opacity-50" />
                   <p>Gemini AI is analyzing performance signals...</p>
                </div>
             ) : aiInsights ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-primary-600 rounded-2xl p-6 text-white shadow-lg border border-primary-500">
                         <div className="flex items-center gap-2 mb-4 text-primary-100 uppercase text-[10px] tracking-widest font-black">
                            <SparklesIcon className="w-4 h-4"/> AI Executive Summary
                         </div>
                         <p className="text-lg leading-relaxed text-white">
                            {aiInsights.narrative}
                         </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="card !p-5">
                            <h3 className="font-bold flex items-center gap-2 mb-4 text-red-600 dark:text-red-400 text-sm uppercase tracking-wider">
                               <AlertTriangle className="w-4 h-4"/> Risk Flags
                            </h3>
                            <ul className="space-y-3">
                               {aiInsights.flags?.length > 0 ? aiInsights.flags.map((flag, i) => (
                                  <li key={i} className="flex gap-2 text-sm text-surface-600 dark:text-surface-400">
                                     <span className="shrink-0 text-red-500 mt-1">•</span>
                                     <span>{flag}</span>
                                  </li>
                               )) : <li className="text-sm text-surface-500 italic">No operational risks detected.</li>}
                            </ul>
                         </div>
                         <div className="card !p-5">
                            <h3 className="font-bold flex items-center gap-2 mb-4 text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider">
                               <TrendingUp className="w-4 h-4"/> Recommendations
                            </h3>
                            <ul className="space-y-3">
                               {aiInsights.recommendations?.length > 0 ? aiInsights.recommendations.map((rec, i) => (
                                  <li key={i} className="flex gap-2 text-sm text-surface-600 dark:text-surface-400">
                                     <span className="shrink-0 text-emerald-500 mt-1">→</span>
                                     <span>{rec}</span>
                                  </li>
                               )) : <li className="text-sm text-surface-500 italic">Kitchen is operating at peak efficiency.</li>}
                            </ul>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="card !p-6 flex flex-col justify-center min-h-[120px]">
                         <p className="text-[10px] font-black uppercase text-surface-500 tracking-wider mb-2">Predicted Busiest Hour</p>
                         <div className="text-3xl font-black text-primary-600">
                            {aiInsights.busiestHourPredicted}
                         </div>
                         <p className="text-xs text-surface-400 mt-2 italic">Based on historical order density.</p>
                      </div>
                   </div>
                </div>
             ) : (
               <div className="py-12 text-center text-surface-500">
                  Could not load insights. Ensure your Gemini API Key is configured.
               </div>
             )}
          </motion.div>
        )}

        {activeTab === 'stations' && (
          <motion.div key="stations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Kitchen Station Mapping</h2>
                <p className="text-xs text-surface-500 italic">Drag-and-drop support coming soon. Using quick-transfer for now.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                {/* Floating / Unassigned Column */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-surface-400">Floating / Unassigned</h3>
                    <span className="bg-surface-100 dark:bg-surface-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {chefs.filter(c => !c.chefProfile?.primaryStationId).length}
                    </span>
                  </div>
                  <div className="bg-surface-50 dark:bg-surface-900/40 rounded-2xl p-3 min-h-[200px] border border-surface-200 dark:border-surface-800 space-y-3">
                    {chefs.filter(c => !c.chefProfile?.primaryStationId).map(chef => (
                      <StationChefCard key={chef._id} chef={chef} stations={stations} onMove={updateChefStation} />
                    ))}
                  </div>
                </div>

                {/* Station Columns */}
                {stations.map(station => (
                  <div key={station._id} className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <h3 className="text-xs font-black uppercase tracking-widest text-primary-500">{station.name}</h3>
                      <span className="bg-primary-50 dark:bg-primary-950/30 text-primary-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {chefs.filter(c => c.chefProfile?.primaryStationId?._id === station._id).length}
                      </span>
                    </div>
                    <div className="bg-surface-50 dark:bg-surface-900/40 rounded-2xl p-3 min-h-[200px] border border-surface-200 dark:border-surface-800 space-y-3">
                      {chefs.filter(c => c.chefProfile?.primaryStationId?._id === station._id).map(chef => (
                        <StationChefCard key={chef._id} chef={chef} stations={stations} onMove={updateChefStation} />
                      ))}
                    </div>
                  </div>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StationChefCard({ chef, stations, onMove }) {
  return (
    <div className="bg-white dark:bg-surface-800 p-3 rounded-xl shadow-sm border border-surface-100 dark:border-surface-700 group hover:border-primary-300 dark:hover:border-primary-800 transition-all">
       <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded bg-surface-100 dark:bg-surface-700 text-[10px] font-bold flex items-center justify-center">
                {chef.name.substring(0,2)}
             </div>
             <span className="text-xs font-bold text-surface-900 dark:text-white truncate max-w-[80px]">{chef.name}</span>
          </div>
          <div className={cn(
             "w-2 h-2 rounded-full",
             chef.chefProfile?.isAvailable ? "bg-emerald-500" : "bg-surface-300"
          )} />
       </div>

       <div className="relative">
          <select 
            className="w-full text-[10px] bg-surface-50 dark:bg-surface-700/50 border-none rounded p-1.5 focus:ring-1 focus:ring-primary-500 outline-none cursor-pointer appearance-none"
            value={chef.chefProfile?.primaryStationId?._id || ''}
            onChange={(e) => onMove(chef._id, e.target.value || null)}
          >
             <option value="">Floating / Unassigned</option>
             {stations.map(s => (
               <option key={s._id} value={s._id}>{s.name}</option>
             ))}
          </select>
          <Shuffle className="w-3 h-3 absolute right-2 top-2 pointer-events-none text-surface-400" />
       </div>
    </div>
  );
}

function SparklesIcon(props) {
  return (
    <Sparkles {...props} />
  )
}


