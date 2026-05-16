import { useState, useEffect } from 'react';
import { Crown, CheckCircle2, AlertCircle, Loader2, Calendar, CreditCard, Zap } from 'lucide-react';
import api from '@/lib/api';

export default function TenantSubscriptionPanel() {
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/tenant/restaurant/settings');
        setRestaurant(data.data);
      } catch (err) {
        console.error('[Subscription] Failed to load:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
        <p className="text-sm text-surface-500">Loading subscription...</p>
      </div>
    );
  }

  const currentPlan = restaurant?.currentPlanId;
  const subscriptionStatus = restaurant?.subscriptionStatus || 'active';
  const endPeriod = restaurant?.subscriptionPeriodEnd;
  const billingCycle = restaurant?.billingCycle;

  if (!currentPlan) {
    return (
      <div className="py-12 text-center text-surface-500">
        <Crown className="w-12 h-12 text-surface-300 mx-auto mb-4" />
        <p className="font-medium text-surface-900 dark:text-white mb-2">No Active Subscription Detected</p>
        <p className="text-sm">Please contact your administrator to assign a subscription plan.</p>
      </div>
    );
  }

  const isUnlimited = (val) => val === -1 ? 'Unlimited' : val;

  // Format price display
  const price = currentPlan.price;
  const displayPrice = billingCycle === 'yearly'
    ? (price?.yearly ? `₹${price.yearly.toLocaleString()}/yr` : 'Custom')
    : (price?.monthly ? `₹${price.monthly.toLocaleString()}/mo` : 'Free');

  return (
    <div className="space-y-8">
      {/* Current Plan Overview */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-primary-500/10 to-primary-600/5 border border-primary-500/20">
        <div className="flex items-start justify-between">
          <div>
             <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
                 <Crown className="w-5 h-5 text-primary-600 dark:text-primary-400" />
               </div>
               <h3 className="text-xl font-bold text-surface-900 dark:text-white">{currentPlan.name} Plan</h3>
               {subscriptionStatus === 'active' ? (
                 <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">Active</span>
               ) : subscriptionStatus === 'trialing' ? (
                 <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">Trial</span>
               ) : (
                 <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">{subscriptionStatus}</span>
               )}
             </div>
             <p className="text-sm text-surface-600 dark:text-surface-400 max-w-xl">{currentPlan.description}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{displayPrice}</p>
            {billingCycle && (
              <p className="text-xs text-surface-500 mt-0.5 capitalize">{billingCycle} billing</p>
            )}
          </div>
        </div>
        
        {endPeriod && (
          <div className="mt-6 pt-6 border-t border-primary-500/10 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-surface-400" />
            <p className="text-sm text-surface-600 dark:text-surface-400">
              Current billing cycle ends on <span className="font-semibold text-surface-900 dark:text-white">{new Date(endPeriod).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </p>
          </div>
        )}
      </div>

      {/* Plan Limits */}
      {currentPlan.limits && (
        <div>
          <h4 className="text-base font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Plan Limits & Capabilities
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentPlan.limits.maxOrders != null && <LimitCard label="Orders / Month" value={isUnlimited(currentPlan.limits.maxOrders)} />}
            {currentPlan.limits.maxOutlets != null && <LimitCard label="Outlets Allowed" value={isUnlimited(currentPlan.limits.maxOutlets)} />}
            {currentPlan.limits.maxUsers != null && <LimitCard label="Staff Users" value={isUnlimited(currentPlan.limits.maxUsers)} />}
            {currentPlan.limits.maxRoles != null && <LimitCard label="Custom Roles" value={isUnlimited(currentPlan.limits.maxRoles)} />}
            {currentPlan.limits.maxMenuItems != null && <LimitCard label="Menu Items" value={isUnlimited(currentPlan.limits.maxMenuItems)} />}
            {currentPlan.limits.maxTables != null && <LimitCard label="Tables" value={isUnlimited(currentPlan.limits.maxTables)} />}
          </div>
        </div>
      )}

      {/* Plan Features */}
      {currentPlan.features && currentPlan.features.length > 0 && (
        <div>
          <h4 className="text-base font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Included Features
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
             {currentPlan.features.map(feature => (
               <div key={feature} className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/5 border border-emerald-100 dark:border-emerald-500/10">
                 <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                 <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* Add-ons */}
      {currentPlan.addOns && currentPlan.addOns.length > 0 && (
        <div>
          <h4 className="text-base font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-violet-500" />
            Available Add-ons
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentPlan.addOns.map(addon => (
              <div key={addon.key} className="p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-surface-900 dark:text-white">{addon.name}</p>
                  {addon.description && <p className="text-xs text-surface-500 mt-0.5">{addon.description}</p>}
                </div>
                <span className="text-sm font-bold text-primary-600 dark:text-primary-400">₹{addon.price}/mo</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade Notice */}
      <div className="p-4 rounded-xl bg-surface-100 dark:bg-surface-800/50 flex flex-col sm:flex-row gap-4 items-center justify-between mt-8">
         <div className="flex items-center gap-3">
           <AlertCircle className="w-5 h-5 text-surface-500 flex-shrink-0" />
           <p className="text-sm text-surface-600 dark:text-surface-400">Need to increase your limits or unlock more features?</p>
         </div>
         <button className="btn-secondary whitespace-nowrap">Contact Support</button>
      </div>

    </div>
  );
}

function LimitCard({ label, value }) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm">
      <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-bold text-surface-900 dark:text-white">{value}</p>
    </div>
  );
}
