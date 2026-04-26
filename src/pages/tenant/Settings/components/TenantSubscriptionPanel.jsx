import { Crown, CheckCircle2, AlertCircle } from 'lucide-react';
import useAuthStore from '@/store/authStore';

export default function TenantSubscriptionPanel() {
  const { user } = useAuthStore();
  const restaurant = user?.restaurantId;
  const currentPlan = restaurant?.currentPlanId;
  const subscriptionStats = restaurant?.subscriptionStatus || 'active'; // Assuming field exists, fallback to active
  const endPeriod = restaurant?.subscriptionPeriodEnd; // Optional
  
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
               {subscriptionStats === 'active' ? (
                 <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">Active</span>
               ) : (
                 <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">{subscriptionStats}</span>
               )}
             </div>
             <p className="text-sm text-surface-600 dark:text-surface-400 max-w-xl">{currentPlan.description}</p>
          </div>
        </div>
        
        {endPeriod && (
          <div className="mt-6 pt-6 border-t border-primary-500/10">
            <p className="text-sm text-surface-600 dark:text-surface-400">
              Current billing cycle ends on <span className="font-semibold text-surface-900 dark:text-white">{new Date(endPeriod).toLocaleDateString()}</span>
            </p>
          </div>
        )}
      </div>

      {/* Plan Limits */}
      <div>
        <h4 className="text-base font-bold text-surface-900 dark:text-white mb-4">Plan Limits & Capabilities</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <LimitCard label="Orders / Month" value={isUnlimited(currentPlan.limits?.maxOrders)} />
          <LimitCard label="Outlets Allowed" value={isUnlimited(currentPlan.limits?.maxOutlets)} />
          <LimitCard label="Staff Users" value={isUnlimited(currentPlan.limits?.maxUsers)} />
          <LimitCard label="Custom Roles" value={isUnlimited(currentPlan.limits?.maxRoles)} />
          <LimitCard label="Menu Items" value={isUnlimited(currentPlan.limits?.maxMenuItems)} />
        </div>
      </div>

      {/* Plan Features */}
      {currentPlan.features && currentPlan.features.length > 0 && (
        <div>
          <h4 className="text-base font-bold text-surface-900 dark:text-white mb-4">Included Features</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
             {currentPlan.features.map(feature => (
               <div key={feature} className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300">
                 <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                 <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
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
