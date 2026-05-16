import { AlertTriangle, Clock, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

/**
 * Global subscription expiry banner — shown in AppLayout when:
 * - Plan is expiring within 7 days (yellow warning)
 * - Plan is past_due / in grace period (red critical)
 */
export default function SubscriptionBanner() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Superadmins and users without subscription data don't see this
  if (!user || user.role === 'superadmin') return null;

  const { isExpiringSoon, isPastDue, daysRemaining, gracePeriodEnd, planName, currentPeriodEnd } = user;

  // Nothing to warn about
  if (!isExpiringSoon && !isPastDue) return null;

  const goToSubscription = () => navigate('/settings', { state: { section: 'subscription' } });

  // ─── Past Due (Grace Period — critical) ───
  if (isPastDue) {
    const graceEnd = gracePeriodEnd ? new Date(gracePeriodEnd) : null;
    const graceDaysLeft = graceEnd ? Math.max(0, Math.ceil((graceEnd - new Date()) / 86400000)) : 0;

    return (
      <div className="bg-red-600 text-white px-4 py-2.5 flex items-center justify-between text-sm relative z-50">
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-semibold">
            Your {planName || 'subscription'} plan has expired!
          </span>
          <span className="opacity-80">
            {graceDaysLeft > 0
              ? `You have ${graceDaysLeft} day${graceDaysLeft !== 1 ? 's' : ''} left before all services are suspended.`
              : 'Your services will be suspended shortly.'
            }
          </span>
        </div>
        <button
          onClick={goToSubscription}
          className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-all flex-shrink-0"
        >
          Renew Now
        </button>
      </div>
    );
  }

  // ─── Expiring Soon (Warning) ───
  if (isExpiringSoon) {
    const endDate = currentPeriodEnd
      ? new Date(currentPeriodEnd).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';

    return (
      <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm relative z-50">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="font-semibold">
            Your {planName || 'subscription'} plan expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
          </span>
          {endDate && <span className="opacity-80">({endDate})</span>}
        </div>
        <button
          onClick={goToSubscription}
          className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-all flex-shrink-0"
        >
          Renew
        </button>
      </div>
    );
  }

  return null;
}
