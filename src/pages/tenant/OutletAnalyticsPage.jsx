import React, { useEffect, useMemo } from 'react';
import useOutletStore from '@/store/outletStore';
import { BarChart3, MapPin, TrendingUp, IndianRupee, Store } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function OutletAnalyticsPage() {
  const { analytics, fetchAnalytics, isLoading, isMultiOutletEnabled } = useOutletStore();

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Transform data for charts
  const chartData = useMemo(() => {
    if (!analytics) return [];
    return analytics
      .filter(o => o.status === 'active') // Only show active outlets in comparison
      .map(o => ({
        name: o.name,
        revenue: o.analytics?.totalRevenue || 0,
        orders: o.analytics?.totalOrders || 0,
        avgOrder: o.analytics?.avgOrderValue || 0,
        code: o.code
      }))
      .sort((a, b) => b.revenue - a.revenue); // sort by highest revenue
  }, [analytics]);

  const totalNetworkRevenue = useMemo(() => {
    if (!analytics) return 0;
    return analytics.reduce((sum, o) => sum + (o.analytics?.totalRevenue || 0), 0);
  }, [analytics]);

  const topOutlet = chartData[0];

  if (!isMultiOutletEnabled) {
    return <div className="p-6">Multi-outlet is not enabled.</div>;
  }

  if (isLoading && (!analytics || analytics.length === 0)) {
    return <div className="p-6 text-surface-500">Loading network analytics...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Network Analytics</h1>
          <p className="text-surface-500">Compare performance across all your branches</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-violet-50 dark:bg-violet-900/30 text-violet-600 rounded-lg"><IndianRupee size={20}/></div>
            <p className="text-sm font-medium text-surface-500">Total Network Revenue</p>
          </div>
          <h3 className="text-3xl font-bold text-surface-900 dark:text-white mt-1">₹{totalNetworkRevenue.toLocaleString()}</h3>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg"><Store size={20}/></div>
            <p className="text-sm font-medium text-surface-500">Total Orders (Network)</p>
          </div>
          <h3 className="text-3xl font-bold text-surface-900 dark:text-white mt-1">
            {analytics?.reduce((sum, o) => sum + (o.analytics?.totalOrders || 0), 0).toLocaleString() || 0}
          </h3>
        </div>

        <div className="card p-5 md:col-span-2">
           <div className="flex items-center gap-4">
             <div className="p-4 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-xl">
               <TrendingUp size={32}/>
             </div>
             <div>
               <p className="text-sm font-medium text-surface-500 uppercase tracking-wider mb-1">Top Performing Branch</p>
               {topOutlet ? (
                 <>
                   <h3 className="text-xl font-bold text-surface-900 dark:text-white">{topOutlet.name}</h3>
                   <p className="text-sm text-surface-500 mt-0.5">₹{topOutlet.revenue.toLocaleString()} revenue generating {topOutlet.orders} orders.</p>
                 </>
               ) : (
                 <p className="text-surface-400">No data available yet</p>
               )}
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Revenue Comparison */}
         <div className="card p-6 overflow-hidden">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-6">Revenue by Branch</h3>
            <div className="h-80 w-full" style={{ minWidth: 0 }}>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                   <YAxis tickFormatter={(val) => `₹${val/1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                   <Tooltip 
                     cursor={{ fill: 'transparent' }}
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                     formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                   />
                   <Bar dataKey="revenue" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={60} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Orders Comparison */}
         <div className="card p-6 overflow-hidden">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-6">Orders Volume by Branch</h3>
            <div className="h-80 w-full" style={{ minWidth: 0 }}>
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                     <defs>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                   <XAxis dataKey="code" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                   <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                     formatter={(value) => [value, 'Orders']}
                   />
                   <Area type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

       <div className="card overflow-hidden">
         <div className="px-6 py-5 border-b border-surface-100 dark:border-surface-700">
           <h3 className="text-lg font-bold text-surface-900 dark:text-white">Branch Leaderboard</h3>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full text-left">
             <thead className="bg-surface-50 dark:bg-surface-900/50">
               <tr>
                 <th className="px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Branch</th>
                 <th className="px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider text-right">Revenue</th>
                 <th className="px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider text-right">Orders</th>
                 <th className="px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider text-right">Avg. Order Value</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
               {chartData.map((d, i) => (
                  <tr key={i} className="hover:bg-surface-50 dark:hover:bg-surface-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-xs font-bold text-surface-600 dark:text-surface-300">
                          {i+1}
                        </div>
                        <div>
                          <p className="font-semibold text-surface-900 dark:text-white">{d.name}</p>
                          <p className="text-xs text-surface-500 font-mono">{d.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-surface-900 dark:text-white">
                      ₹{d.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {d.orders}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-surface-600 dark:text-surface-400">
                      ₹{Math.round(d.avgOrder).toLocaleString()}
                    </td>
                  </tr>
               ))}
               {chartData.length === 0 && (
                 <tr>
                   <td colSpan="4" className="px-6 py-12 text-center text-surface-500">No branch data available.</td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
       </div>

    </div>
  );
}
