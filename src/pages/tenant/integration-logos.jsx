import razorpayImg from '@/assets/integrations/razorpay.png';
import paytmImg from '@/assets/integrations/paytm.png';
import googlepayImg from '@/assets/integrations/googlepay.png';
import phonepeImg from '@/assets/integrations/phonepe.png';
import upiImg from '@/assets/integrations/upi.png';
import stripeImg from '@/assets/integrations/stripe.png';
import cashfreeImg from '@/assets/integrations/cashfree.png';
import brevoImg from '@/assets/integrations/brevo.png';

/**
 * Hand-crafted inline SVG logos for every integration platform.
 * Zero external network requests — all logos are bundled with the app.
 * Each component accepts a `size` prop (number of pixels for width/height).
 */

/* ─────────────────────────────────────────────────────────────────────────
   FOOD DELIVERY
───────────────────────────────────────────────────────────────────────── */

// Zomato — red flame-letter Z
export function ZomatoLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#E23744"/>
      <text x="24" y="33" textAnchor="middle" fill="white" fontSize="26" fontWeight="900"
            fontFamily="Inter,sans-serif" letterSpacing="-1">Z</text>
    </svg>
  );
}

// Swiggy — orange S on dark brand bg
export function SwiggyLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#FC8019"/>
      <text x="24" y="34" textAnchor="middle" fill="white" fontSize="28" fontWeight="900"
            fontFamily="Inter,sans-serif">S</text>
    </svg>
  );
}

// Talabat — orange wordmark "t" beak shape
export function TalabatLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#FF6100"/>
      <rect x="20" y="10" width="8" height="28" rx="4" fill="white"/>
      <rect x="13" y="16" width="22" height="7" rx="3.5" fill="white"/>
    </svg>
  );
}

// Peppo — green circle P
export function PeppoLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#00B14F"/>
      <circle cx="24" cy="20" r="8" fill="white" fillOpacity="0.2"/>
      <text x="24" y="33" textAnchor="middle" fill="white" fontSize="26" fontWeight="900"
            fontFamily="Inter,sans-serif">P</text>
    </svg>
  );
}

// Yumzy — rose Y with fork icon
export function YumzyLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#FF2D55"/>
      <text x="24" y="33" textAnchor="middle" fill="white" fontSize="26" fontWeight="900"
            fontFamily="Inter,sans-serif">Y</text>
    </svg>
  );
}

// NOW — golden yellow "NOW" badge
export function NowLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#F59E0B"/>
      <text x="24" y="30" textAnchor="middle" fill="white" fontSize="13" fontWeight="900"
            fontFamily="Inter,sans-serif" letterSpacing="1">NOW</text>
    </svg>
  );
}

// Ele — green "ele" pill
export function EleLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#4CAF50"/>
      <text x="24" y="30" textAnchor="middle" fill="white" fontSize="14" fontWeight="900"
            fontFamily="Inter,sans-serif" letterSpacing="0.5">ele</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   POS & COMMERCE
───────────────────────────────────────────────────────────────────────── */

// DotPe — two dots on dark bg (their brand symbol)
export function DotpeLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#1A1A2E"/>
      <circle cx="17" cy="24" r="5" fill="#3B82F6"/>
      <circle cx="31" cy="24" r="5" fill="#A855F7"/>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MARKETING
───────────────────────────────────────────────────────────────────────── */

// Magicpin — purple map pin with sparkle
export function MagicpinLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#6F2EA3"/>
      {/* Pin shape */}
      <path d="M24 10 C18 10 13 15 13 21 C13 29 24 38 24 38 C24 38 35 29 35 21 C35 15 30 10 24 10Z"
            fill="white" fillOpacity="0.9"/>
      <circle cx="24" cy="21" r="5" fill="#6F2EA3"/>
    </svg>
  );
}

// Thrive — indigo upward arrow / growth
export function ThriveLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#4C3BCF"/>
      <path d="M13 34 L24 14 L35 34" stroke="white" strokeWidth="4" strokeLinecap="round"
            strokeLinejoin="round" fill="none"/>
      <path d="M17 34 L31 34" stroke="white" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   RESERVATIONS
───────────────────────────────────────────────────────────────────────── */

// EazyDiner — amber fork & knife
export function EazydinerLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#E86E0A"/>
      {/* Fork */}
      <path d="M18 12 L18 20 M15 12 L15 18 M21 12 L21 18 M15 18 Q15 22 18 22 L18 36"
            stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Knife */}
      <path d="M30 12 C30 12 33 15 33 20 L30 22 L30 36"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

// Dineout — orange fork + text "do"
export function DineoutLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#FF4B00"/>
      <text x="24" y="30" textAnchor="middle" fill="white" fontSize="15" fontWeight="900"
            fontFamily="Georgia,serif" letterSpacing="0.5">dineout</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   LOGISTICS
───────────────────────────────────────────────────────────────────────── */

// Jungleworks — teal leaf/tree icon
export function JungleworksLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#00B388"/>
      {/* Tree */}
      <path d="M24 10 C19 15 13 18 13 24 C13 28 17 31 24 31 C31 31 35 28 35 24 C35 18 29 15 24 10Z"
            fill="white" fillOpacity="0.9"/>
      <rect x="22" y="31" width="4" height="7" rx="2" fill="white"/>
    </svg>
  );
}

// Pidge — dark slate wing/arrow logo
export function PidgeLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#1C1C1C"/>
      {/* Wing shape */}
      <path d="M10 30 Q15 18 24 22 Q33 18 38 30 Q30 24 24 26 Q18 24 10 30Z"
            fill="white" fillOpacity="0.9"/>
    </svg>
  );
}

// Shadowfax — red-orange forward arrow
export function ShadowfaxLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#E8400C"/>
      {/* Arrow */}
      <path d="M12 24 L28 24 M22 16 L32 24 L22 32"
            stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

// Dunzo — teal D with circle
export function DunzoLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#00D69A"/>
      <text x="24" y="33" textAnchor="middle" fill="white" fontSize="24" fontWeight="900"
            fontFamily="Inter,sans-serif">DZ</text>
    </svg>
  );
}

// uEngage Flash — green lightning
export function UengageFlashLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#16A34A"/>
      {/* Lightning bolt */}
      <path d="M27 10 L18 26 L24 26 L21 38 L30 22 L24 22 Z"
            fill="white" fillOpacity="0.95"/>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   COMMERCE / ONDC
───────────────────────────────────────────────────────────────────────── */

// uEngage Edge+ONDC — green U with network dots
export function OndcLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#1DB954"/>
      <text x="24" y="32" textAnchor="middle" fill="white" fontSize="22" fontWeight="900"
            fontFamily="Inter,sans-serif">UE</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   LOYALTY & CRM
───────────────────────────────────────────────────────────────────────── */

// #loyalty — red hashtag
export function LoyaltyLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#FF5252"/>
      {/* # */}
      <text x="24" y="32" textAnchor="middle" fill="white" fontSize="24" fontWeight="900"
            fontFamily="Inter,sans-serif">#</text>
    </svg>
  );
}

// Bingage — violet B hexagon
export function BingageLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#6E3CF7"/>
      <text x="24" y="33" textAnchor="middle" fill="white" fontSize="26" fontWeight="900"
            fontFamily="Inter,sans-serif">B</text>
    </svg>
  );
}

// Reelo — cyan R with retention arc
export function ReeloLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#00B4D8"/>
      <path d="M14 12 L14 36" stroke="white" strokeWidth="4" strokeLinecap="round"/>
      <path d="M14 12 Q30 12 30 21 Q30 30 14 30" stroke="white" strokeWidth="4"
            strokeLinecap="round" fill="none"/>
      <path d="M22 30 L34 36" stroke="white" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  );
}

// Paytm m'loyal — sky blue Paytm checkmark style
export function MloyalLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#00B9F1"/>
      {/* Paytm-style M */}
      <path d="M12 34 L12 18 L24 28 L36 18 L36 34" stroke="white" strokeWidth="4"
            strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

// Kringle — blue gift box
export function KringleLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#3B82F6"/>
      {/* Gift box */}
      <rect x="11" y="22" width="26" height="16" rx="2" fill="white" fillOpacity="0.9"/>
      <rect x="11" y="17" width="26" height="7" rx="2" fill="white"/>
      {/* Ribbon */}
      <rect x="22" y="17" width="4" height="21" fill="#3B82F6"/>
      <path d="M24 17 Q16 13 14 16 Q12 19 24 17Z" fill="white"/>
      <path d="M24 17 Q32 13 34 16 Q36 19 24 17Z" fill="white"/>
    </svg>
  );
}

// Ewards — purple star/E badge
export function EwardsLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#8B5CF6"/>
      {/* Star */}
      <path d="M24 10 L27 20 L37 20 L29 26 L32 37 L24 30 L16 37 L19 26 L11 20 L21 20 Z"
            fill="white" fillOpacity="0.9"/>
    </svg>
  );
}

// Froogal — indigo F with gamification dots
export function FroogalLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#7C3AED"/>
      {/* F */}
      <path d="M15 12 L15 36 M15 12 L33 12 M15 23 L28 23"
            stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// uEngage Prism — green prism triangle
export function UengagePrismLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#16A34A"/>
      {/* Upward triangle */}
      <path d="M24 12 L38 36 L10 36 Z" fill="none" stroke="white" strokeWidth="3.5"
            strokeLinejoin="round"/>
      {/* Inner fill gradient hint */}
      <circle cx="24" cy="28" r="3" fill="white" fillOpacity="0.8"/>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ACCOUNTING
───────────────────────────────────────────────────────────────────────── */

// Tally — dark red script "T" with ledger lines
export function TallyLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#7F1D1D"/>
      {/* Ledger lines evoking Tally's classic look */}
      <path d="M12 20 L36 20 M12 26 L36 26 M12 32 L28 32" stroke="#FCA5A5"
            strokeWidth="2" strokeLinecap="round"/>
      <text x="24" y="18" textAnchor="middle" fill="white" fontSize="11" fontWeight="900"
            fontFamily="Georgia,serif" letterSpacing="0">Tally</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PAYMENT GATEWAYS
───────────────────────────────────────────────────────────────────────── */

// Razorpay — Official high-fidelity logo
export function RazorpayLogo({ size = 36 }) {
  return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 8 }}>
      <img src={razorpayImg} alt="Razorpay" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
}

// Paytm — Official high-fidelity logo
export function PaytmLogo({ size = 36 }) {
  return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 8 }}>
      <img src={paytmImg} alt="Paytm" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
}

// Google Pay — Official high-fidelity logo
export function GooglePayLogo({ size = 36 }) {
  return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 8 }}>
      <img src={googlepayImg} alt="Google Pay" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
}

// PhonePe — Official high-fidelity logo
export function PhonePeLogo({ size = 36 }) {
  return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 8 }}>
      <img src={phonepeImg} alt="PhonePe" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
}

// UPI — Official high-fidelity logo
export function UpiLogo({ size = 36 }) {
  return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 8 }}>
      <img src={upiImg} alt="UPI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
}

// Stripe — Official high-fidelity logo
export function StripeLogo({ size = 36 }) {
  return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 8 }}>
      <img src={stripeImg} alt="Stripe" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
}

// Cashfree — Official high-fidelity logo
export function CashfreeLogo({ size = 36 }) {
  return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 8 }}>
      <img src={cashfreeImg} alt="Cashfree" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
}

// Brevo — Official high-fidelity logo
export function BrevoLogo({ size = 36 }) {
  return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 8, backgroundColor: '#009286' }}>
      <img src={brevoImg} alt="Brevo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
}
