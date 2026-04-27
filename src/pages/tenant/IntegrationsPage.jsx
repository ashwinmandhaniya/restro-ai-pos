import React, { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plug, CheckCircle, XCircle, Loader2, ExternalLink,
  AlertCircle, ChevronRight, X, Eye, EyeOff, Info,
  Zap, ShoppingBag, TrendingUp, Globe, CreditCard
} from 'lucide-react';
import { siZomato, siSwiggy, siDunzo } from 'simple-icons';
import {
  ZomatoLogo, SwiggyLogo, TalabatLogo, PeppoLogo, YumzyLogo, NowLogo, EleLogo,
  DotpeLogo, MagicpinLogo, ThriveLogo,
  EazydinerLogo, DineoutLogo,
  JungleworksLogo, PidgeLogo, ShadowfaxLogo, DunzoLogo, UengageFlashLogo,
  OndcLogo,
  LoyaltyLogo, BingageLogo, ReeloLogo, MloyalLogo, KringleLogo, EwardsLogo, FroogalLogo, UengagePrismLogo,
  TallyLogo,
  RazorpayLogo, PaytmLogo, GooglePayLogo, PhonePeLogo, UpiLogo, StripeLogo, CashfreeLogo,
} from './integration-logos.jsx';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// ── Platform definitions ──────────────────────────────────────────────
const PLATFORMS = [
  {
    id: 'zomato',
    name: 'Zomato',
    category: 'Food Delivery',
    description: 'Sync your menu and receive Zomato orders directly in your POS.',
    color: '#E23744',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-500',
    borderColor: 'border-red-500/20',
    fields: [
      { key: 'restaurantId', label: 'Restaurant ID', placeholder: 'Your Zomato Restaurant ID', type: 'text' },
      { key: 'apiKey',       label: 'API Key',        placeholder: 'zmt_live_xxxxxxxxxxxx',       type: 'password' },
    ],
    docsUrl: 'https://www.zomato.com/partner',
    logo: 'Z',
    domain: 'zomato.com',
    siIcon: siZomato,
    LogoComponent: ZomatoLogo,
  },
  {
    id: 'swiggy',
    name: 'Swiggy',
    category: 'Food Delivery',
    description: 'Accept Swiggy orders and manage delivery status from your kitchen.',
    color: '#FC8019',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-500',
    borderColor: 'border-orange-500/20',
    fields: [
      { key: 'restaurantId', label: 'Restaurant ID', placeholder: 'Your Swiggy Restaurant ID', type: 'text' },
      { key: 'apiKey',       label: 'API Key',        placeholder: 'swg_live_xxxxxxxxxxxx',      type: 'password' },
    ],
    docsUrl: 'https://partner.swiggy.com',
    logo: 'S',
    domain: 'swiggy.com',
    siIcon: siSwiggy,
    LogoComponent: SwiggyLogo,
  },
  {
    id: 'dotpe',
    name: 'DotPe',
    category: 'POS & Commerce',
    description: 'Connect DotPe for unified order management and digital payments.',
    color: '#1A1A2E',
    bgColor: 'bg-slate-500/10',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-500/20',
    fields: [
      { key: 'restaurantId', label: 'Restaurant ID', placeholder: 'DotPe Restaurant ID', type: 'text' },
      { key: 'secretKey',    label: 'Secret Key',    placeholder: 'dp_sk_xxxxxxxxxxxx',   type: 'password' },
    ],
    docsUrl: 'https://dotpe.in',
    logo: '●●',
    domain: 'dotpe.in',
    LogoComponent: DotpeLogo,
  },
  {
    id: 'magicpin',
    name: 'Magicpin',
    category: 'Marketing',
    description: 'Grow your customer base with Magicpin offers and loyalty programs.',
    color: '#6F2EA3',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/20',
    fields: [
      { key: 'merchantId', label: 'Merchant ID', placeholder: 'Your Magicpin Merchant ID', type: 'text' },
      { key: 'apiKey',     label: 'API Key',     placeholder: 'mgp_xxxxxxxxxxxx',           type: 'password' },
    ],
    docsUrl: 'https://magicpin.in/partner',
    logo: 'M',
    domain: 'magicpin.in',
    LogoComponent: MagicpinLogo,
  },
  {
    id: 'talabat',
    name: 'Talabat',
    category: 'Food Delivery',
    description: 'Reach international customers via Talabat food delivery network.',
    color: '#FF6100',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/20',
    fields: [
      { key: 'restaurantId', label: 'Restaurant ID', placeholder: 'Talabat Restaurant ID', type: 'text' },
      { key: 'apiKey',       label: 'API Key',        placeholder: 'tal_xxxxxxxxxxxx',      type: 'password' },
    ],
    docsUrl: 'https://partner.talabat.com',
    logo: 'T',
    domain: 'talabat.com',
    LogoComponent: TalabatLogo,
  },
  {
    id: 'eazydiner',
    name: 'EazyDiner',
    category: 'Reservations',
    description: 'Accept table reservations from EazyDiner with real-time slot management.',
    color: '#E86E0A',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/20',
    fields: [
      { key: 'propertyId', label: 'Property ID', placeholder: 'EazyDiner Property ID', type: 'text' },
      { key: 'apiKey',     label: 'API Key',     placeholder: 'ezd_xxxxxxxxxxxx',       type: 'password' },
    ],
    docsUrl: 'https://eazydiner.com/partners',
    logo: 'E',
    domain: 'eazydiner.com',
    LogoComponent: EazydinerLogo,
  },
  {
    id: 'thrive',
    name: 'Thrive',
    category: 'Marketing',
    description: 'Run targeted campaigns and loyalty rewards via Thrive platform.',
    color: '#4C3BCF',
    bgColor: 'bg-indigo-500/10',
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/20',
    fields: [
      { key: 'accountId', label: 'Account ID', placeholder: 'Thrive Account ID', type: 'text' },
      { key: 'apiKey',    label: 'API Key',    placeholder: 'thr_xxxxxxxxxxxx',   type: 'password' },
    ],
    docsUrl: 'https://thrivepos.com',
    logo: 'T',
    domain: 'thrivepos.com',
    LogoComponent: ThriveLogo,
  },
  {
    id: 'peppo',
    name: 'Peppo',
    category: 'Food Delivery',
    description: 'Manage online orders from Peppo and track delivery in real time.',
    color: '#00B14F',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/20',
    fields: [
      { key: 'outletId',  label: 'Outlet ID',   placeholder: 'Peppo Outlet ID',     type: 'text' },
      { key: 'apiToken',  label: 'API Token',   placeholder: 'peppo_xxxxxxxxxxxx',  type: 'password' },
    ],
    docsUrl: 'https://peppo.in',
    logo: 'P',
    domain: 'peppo.in',
    LogoComponent: PeppoLogo,
  },
  {
    id: 'yumzy',
    name: 'Yumzy',
    category: 'Food Delivery',
    description: 'Connect to Yumzy for hyperlocal food delivery in your city.',
    color: '#FF2D55',
    bgColor: 'bg-rose-500/10',
    textColor: 'text-rose-400',
    borderColor: 'border-rose-500/20',
    fields: [
      { key: 'restaurantId', label: 'Restaurant ID', placeholder: 'Yumzy Restaurant ID', type: 'text' },
      { key: 'apiKey',       label: 'API Key',        placeholder: 'ymz_xxxxxxxxxxxx',    type: 'password' },
    ],
    docsUrl: 'https://yumzy.in',
    logo: 'Y',
    domain: 'yumzy.in',
    LogoComponent: YumzyLogo,
  },
  {
    id: 'jungleworks',
    name: 'Jungleworks',
    category: 'Logistics',
    description: 'Automate delivery dispatch using Jungleworks logistics platform.',
    color: '#00B388',
    bgColor: 'bg-teal-500/10',
    textColor: 'text-teal-400',
    borderColor: 'border-teal-500/20',
    fields: [
      { key: 'teamId', label: 'Team ID', placeholder: 'Jungleworks Team ID', type: 'text' },
      { key: 'apiKey', label: 'API Key', placeholder: 'jw_xxxxxxxxxxxx',     type: 'password' },
    ],
    docsUrl: 'https://jungleworks.com/yelo',
    logo: 'J',
    domain: 'jungleworks.com',
    LogoComponent: JungleworksLogo,
  },
  {
    id: 'ondc',
    name: 'uEngage Edge + ONDC',
    category: 'Commerce',
    description: 'List your restaurant on Open Network for Digital Commerce (ONDC) via uEngage.',
    color: '#1DB954',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
    fields: [
      { key: 'subscriberId', label: 'Subscriber ID', placeholder: 'uEngage Subscriber ID', type: 'text' },
      { key: 'apiKey',       label: 'API Key',        placeholder: 'ondc_xxxxxxxxxxxx',     type: 'password' },
    ],
    docsUrl: 'https://uengage.in',
    logo: 'U',
    domain: 'uengage.in',
    LogoComponent: OndcLogo,
  },
  {
    id: 'now',
    name: 'NOW',
    category: 'Food Delivery',
    description: 'Accept orders from NOW food delivery and manage fulfilment from the POS.',
    color: '#F59E0B',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/20',
    fields: [
      { key: 'restaurantId', label: 'Restaurant ID', placeholder: 'NOW Restaurant ID', type: 'text' },
      { key: 'apiKey',       label: 'API Key',        placeholder: 'now_xxxxxxxxxxxx',  type: 'password' },
    ],
    docsUrl: 'https://now.gg',
    logo: 'N',
    domain: 'now.gg',
    LogoComponent: NowLogo,
  },
  {
    id: 'pidge',
    name: 'Pidge',
    category: 'Logistics',
    description: 'On-demand last-mile delivery for your restaurant with real-time tracking.',
    color: '#1C1C1C',
    bgColor: 'bg-slate-500/10',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-500/20',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: 'Pidge Client ID',    type: 'text' },
      { key: 'apiKey',   label: 'API Key',   placeholder: 'pdg_xxxxxxxxxxxx',   type: 'password' },
    ],
    docsUrl: 'https://pidge.in',
    logo: 'Pi',
    domain: 'pidge.in',
    LogoComponent: PidgeLogo,
  },
  {
    id: 'shadowfax',
    name: 'Shadowfax',
    category: 'Logistics',
    description: "Scale delivery operations with Shadowfax's nationwide courier network.",
    color: '#E8400C',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/20',
    fields: [
      { key: 'clientCode', label: 'Client Code', placeholder: 'Shadowfax Client Code', type: 'text' },
      { key: 'apiKey',     label: 'API Key',      placeholder: 'sfx_xxxxxxxxxxxx',     type: 'password' },
    ],
    docsUrl: 'https://shadowfax.in/partner',
    logo: 'SF',
    domain: 'shadowfax.in',
    LogoComponent: ShadowfaxLogo,
  },
  {
    id: 'dunzo',
    name: 'Dunzo',
    category: 'Logistics',
    description: "Integrate Dunzo's hyperlocal delivery for quick 30-minute fulfilment.",
    color: '#00D69A',
    bgColor: 'bg-teal-500/10',
    textColor: 'text-teal-400',
    borderColor: 'border-teal-500/20',
    fields: [
      { key: 'clientId',     label: 'Client ID',     placeholder: 'Dunzo Client ID',     type: 'text' },
      { key: 'clientSecret', label: 'Client Secret', placeholder: 'dz_sk_xxxxxxxxxxxx', type: 'password' },
    ],
    docsUrl: 'https://dunzo.com/business',
    logo: 'DZ',
    domain: 'dunzo.com',
    siIcon: siDunzo,
    LogoComponent: DunzoLogo,
  },
  {
    id: 'ele',
    name: 'Ele',
    category: 'Food Delivery',
    description: 'Receive and manage orders from Ele platform directly in your POS system.',
    color: '#4CAF50',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/20',
    fields: [
      { key: 'restaurantId', label: 'Restaurant ID', placeholder: 'Ele Restaurant ID', type: 'text' },
      { key: 'apiKey',       label: 'API Key',        placeholder: 'ele_xxxxxxxxxxxx',  type: 'password' },
    ],
    docsUrl: 'https://ele.in',
    logo: 'ele',
    domain: 'ele.in',
    LogoComponent: EleLogo,
  },
  {
    id: 'uengageFlash',
    name: 'uEngage Flash',
    category: 'Logistics',
    description: 'Rapid hyperlocal delivery powered by uEngage Flash delivery network.',
    color: '#22C55E',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/20',
    fields: [
      { key: 'subscriberId', label: 'Subscriber ID', placeholder: 'uEngage Subscriber ID', type: 'text' },
      { key: 'apiKey',       label: 'API Key',        placeholder: 'flash_xxxxxxxxxxxx',   type: 'password' },
    ],
    docsUrl: 'https://uengage.in/flash',
    logo: '⚡',
    domain: 'uengage.in',
    LogoComponent: UengageFlashLogo,
  },
  // ── Loyalty & CRM ────────────────────────────────────────────────────
  {
    id: 'loyalty',
    name: '#Loyalty',
    category: 'Loyalty & CRM',
    description: 'Hashtag Loyalty CRM — run rewards programs and re-engage your customers.',
    color: '#FF5252',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/20',
    fields: [
      { key: 'brandId', label: 'Brand ID', placeholder: '#Loyalty Brand ID', type: 'text' },
      { key: 'apiKey',  label: 'API Key',  placeholder: 'hlt_xxxxxxxxxxxx',   type: 'password' },
    ],
    docsUrl: 'https://hashtagloyalty.com',
    logo: '#L',
    domain: 'hashtagloyalty.com',
    LogoComponent: LoyaltyLogo,
  },
  {
    id: 'bingage',
    name: 'Bingage',
    category: 'Loyalty & CRM',
    description: 'Drive repeat visits with Bingage loyalty, coupons, and cashback programs.',
    color: '#6E3CF7',
    bgColor: 'bg-violet-500/10',
    textColor: 'text-violet-400',
    borderColor: 'border-violet-500/20',
    fields: [
      { key: 'brandId', label: 'Brand ID', placeholder: 'Bingage Brand ID', type: 'text' },
      { key: 'apiKey',  label: 'API Key',  placeholder: 'bng_xxxxxxxxxxxx',   type: 'password' },
    ],
    docsUrl: 'https://bingage.com',
    logo: 'Bg',
    domain: 'bingage.com',
    LogoComponent: BingageLogo,
  },
  {
    id: 'reelo',
    name: 'Reelo',
    category: 'Loyalty & CRM',
    description: 'AI-powered customer retention — send personalized offers to lapsed customers.',
    color: '#00B4D8',
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/20',
    fields: [
      { key: 'businessId', label: 'Business ID', placeholder: 'Reelo Business ID', type: 'text' },
      { key: 'apiKey',     label: 'API Key',     placeholder: 'rlo_xxxxxxxxxxxx',   type: 'password' },
    ],
    docsUrl: 'https://reelo.io',
    logo: 'Re',
    domain: 'reelo.io',
    LogoComponent: ReeloLogo,
  },
  {
    id: 'mloyal',
    name: "Paytm m'loyal",
    category: 'Loyalty & CRM',
    description: "Reward your customers using Paytm's m'loyal digital loyalty platform.",
    color: '#00B9F1',
    bgColor: 'bg-sky-500/10',
    textColor: 'text-sky-400',
    borderColor: 'border-sky-500/20',
    fields: [
      { key: 'merchantId', label: 'Merchant ID', placeholder: "m'loyal Merchant ID", type: 'text' },
      { key: 'apiKey',     label: 'API Key',     placeholder: 'mly_xxxxxxxxxxxx',     type: 'password' },
    ],
    docsUrl: 'https://mloyal.com',
    logo: 'mL',
    domain: 'mloyal.com',
    LogoComponent: MloyalLogo,
  },
  {
    id: 'kringle',
    name: 'Kringle',
    category: 'Loyalty & CRM',
    description: 'Launch gift cards, referral programs, and loyalty campaigns with Kringle.',
    color: '#3B82F6',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/20',
    fields: [
      { key: 'programId', label: 'Program ID', placeholder: 'Kringle Program ID', type: 'text' },
      { key: 'apiKey',    label: 'API Key',    placeholder: 'krg_xxxxxxxxxxxx',    type: 'password' },
    ],
    docsUrl: 'https://kringle.io',
    logo: 'Kr',
    domain: 'kringle.io',
    LogoComponent: KringleLogo,
  },
  {
    id: 'ewards',
    name: 'Ewards',
    category: 'Loyalty & CRM',
    description: 'Omni-channel loyalty and CRM to grow customer lifetime value.',
    color: '#8B5CF6',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/20',
    fields: [
      { key: 'brandId', label: 'Brand ID', placeholder: 'Ewards Brand ID', type: 'text' },
      { key: 'apiKey',  label: 'API Key',  placeholder: 'ewd_xxxxxxxxxxxx', type: 'password' },
    ],
    docsUrl: 'https://ewards.in',
    logo: 'EW',
    domain: 'ewards.in',
    LogoComponent: EwardsLogo,
  },
  {
    id: 'froogal',
    name: 'Froogal',
    category: 'Loyalty & CRM',
    description: 'Next-gen loyalty platform with gamification, surveys, and instant rewards.',
    color: '#7C3AED',
    bgColor: 'bg-indigo-500/10',
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/20',
    fields: [
      { key: 'merchantId', label: 'Merchant ID', placeholder: 'Froogal Merchant ID', type: 'text' },
      { key: 'apiKey',     label: 'API Key',     placeholder: 'frg_xxxxxxxxxxxx',    type: 'password' },
    ],
    docsUrl: 'https://froogal.in',
    logo: 'Fr',
    domain: 'froogal.in',
    LogoComponent: FroogalLogo,
  },
  // ── Discovery & Reservations ─────────────────────────────────────────
  {
    id: 'dineout',
    name: 'Dineout',
    category: 'Reservations',
    description: 'Accept restaurant reservations and run dining offers via Dineout.',
    color: '#FF4B00',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/20',
    fields: [
      { key: 'restaurantId', label: 'Restaurant ID', placeholder: 'Dineout Restaurant ID', type: 'text' },
      { key: 'apiKey',       label: 'API Key',        placeholder: 'dno_xxxxxxxxxxxx',      type: 'password' },
    ],
    docsUrl: 'https://dineout.co.in/business',
    logo: 'do',
    domain: 'dineout.co.in',
    LogoComponent: DineoutLogo,
  },
  {
    id: 'uengagePrism',
    name: 'uEngage Prism',
    category: 'Loyalty & CRM',
    description: 'Unified customer analytics and engagement hub powered by uEngage Prism.',
    color: '#22C55E',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
    fields: [
      { key: 'subscriberId', label: 'Subscriber ID', placeholder: 'uEngage Subscriber ID', type: 'text' },
      { key: 'apiKey',       label: 'API Key',        placeholder: 'prism_xxxxxxxxxxxx',   type: 'password' },
    ],
    docsUrl: 'https://uengage.in/prism',
    logo: '▲',
    domain: 'uengage.in',
    LogoComponent: UengagePrismLogo,
  },
  // ── Accounting ───────────────────────────────────────────────────────
  {
    id: 'tally',
    name: 'Tally',
    category: 'Accounting',
    description: 'Sync daily sales, GST invoices, and ledgers directly into Tally ERP.',
    color: '#B91C1C',
    bgColor: 'bg-red-900/20',
    textColor: 'text-red-300',
    borderColor: 'border-red-900/30',
    fields: [
      { key: 'licenseKey', label: 'License Key', placeholder: 'Tally License Key',        type: 'password' },
      { key: 'serverUrl',  label: 'Server URL',  placeholder: 'http://localhost:9000',     type: 'text' },
    ],
    docsUrl: 'https://tallysolutions.com',
    logo: 'T®',
    domain: 'tallysolutions.com',
    LogoComponent: TallyLogo,
  },
  // ── Payment Gateways ────────────────────────────────────────────────
  {
    id: 'razorpay',
    name: 'Razorpay',
    category: 'Payment Gateway',
    description: 'Accept payments via UPI, Cards, NetBanking and Wallets with Razorpay.',
    color: '#072654',
    bgColor: 'bg-blue-900/20',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-900/30',
    fields: [
      { key: 'keyId',     label: 'Key ID',     placeholder: 'rzp_live_xxxxxxxxxxxx', type: 'text' },
      { key: 'keySecret', label: 'Key Secret', placeholder: 'rzp_secret_xxxxxxxxxxxx', type: 'password' },
    ],
    docsUrl: 'https://razorpay.com/docs/',
    logo: 'Rp',
    domain: 'razorpay.com',
    LogoComponent: RazorpayLogo,
  },
  {
    id: 'paytm',
    name: 'Paytm',
    category: 'Payment Gateway',
    description: 'Accept Paytm Wallet, UPI, Cards and Net Banking payments at your restaurant.',
    color: '#00B9F5',
    bgColor: 'bg-sky-500/10',
    textColor: 'text-sky-400',
    borderColor: 'border-sky-500/20',
    fields: [
      { key: 'merchantId', label: 'Merchant ID', placeholder: 'Paytm Merchant ID',      type: 'text' },
      { key: 'merchantKey', label: 'Merchant Key', placeholder: 'ptm_key_xxxxxxxxxxxx', type: 'password' },
    ],
    docsUrl: 'https://developer.paytm.com/docs/',
    logo: 'Pt',
    domain: 'paytm.com',
    LogoComponent: PaytmLogo,
  },
  {
    id: 'googlepay',
    name: 'Google Pay',
    category: 'Payment Gateway',
    description: 'Receive instant UPI payments through Google Pay for Business.',
    color: '#4285F4',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/20',
    fields: [
      { key: 'merchantId',   label: 'Merchant ID',   placeholder: 'Google Pay Merchant ID',  type: 'text' },
      { key: 'merchantName', label: 'Merchant Name', placeholder: 'Your Business Name',      type: 'text' },
      { key: 'upiVpa',       label: 'UPI VPA',       placeholder: 'yourbusiness@okaxis',      type: 'text' },
    ],
    docsUrl: 'https://developers.google.com/pay/api/web/overview',
    logo: 'GP',
    domain: 'pay.google.com',
    LogoComponent: GooglePayLogo,
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    category: 'Payment Gateway',
    description: 'Integrate PhonePe PG for UPI, Cards and Wallet-based payments.',
    color: '#5F259F',
    bgColor: 'bg-purple-600/10',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-600/20',
    fields: [
      { key: 'merchantId', label: 'Merchant ID',  placeholder: 'PhonePe Merchant ID',   type: 'text' },
      { key: 'saltKey',    label: 'Salt Key',     placeholder: 'ppe_salt_xxxxxxxxxxxx', type: 'password' },
      { key: 'saltIndex',  label: 'Salt Index',   placeholder: '1',                      type: 'text' },
    ],
    docsUrl: 'https://developer.phonepe.com/docs',
    logo: 'Pe',
    domain: 'phonepe.com',
    LogoComponent: PhonePeLogo,
  },
  {
    id: 'upi',
    name: 'UPI Direct',
    category: 'Payment Gateway',
    description: 'Accept direct UPI payments via any UPI app — no gateway fees.',
    color: '#097939',
    bgColor: 'bg-green-600/10',
    textColor: 'text-green-400',
    borderColor: 'border-green-600/20',
    fields: [
      { key: 'upiVpa',       label: 'UPI VPA',        placeholder: 'yourbusiness@upi',   type: 'text' },
      { key: 'merchantName', label: 'Merchant Name',  placeholder: 'Your Business Name', type: 'text' },
    ],
    docsUrl: 'https://www.npci.org.in/what-we-do/upi/product-overview',
    logo: 'UPI',
    domain: 'npci.org.in',
    LogoComponent: UpiLogo,
  },
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'Payment Gateway',
    description: 'Global payments with Stripe — accept international cards, wallets and bank transfers.',
    color: '#635BFF',
    bgColor: 'bg-indigo-500/10',
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/20',
    fields: [
      { key: 'publishableKey', label: 'Publishable Key', placeholder: 'pk_live_xxxxxxxxxxxx',  type: 'text' },
      { key: 'secretKey',      label: 'Secret Key',      placeholder: 'sk_live_xxxxxxxxxxxx',  type: 'password' },
    ],
    docsUrl: 'https://stripe.com/docs',
    logo: 'St',
    domain: 'stripe.com',
    LogoComponent: StripeLogo,
  },
  {
    id: 'cashfree',
    name: 'Cashfree',
    category: 'Payment Gateway',
    description: 'Accept UPI, Cards, Net Banking, and Wallets with Cashfree Payments — fast settlements & robust APIs.',
    color: '#0057FF',
    bgColor: 'bg-blue-600/10',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-600/20',
    fields: [
      { key: 'appId',     label: 'App ID',     placeholder: 'CF_xxxxxxxxxxxx',       type: 'text' },
      { key: 'secretKey', label: 'Secret Key', placeholder: 'cf_secret_xxxxxxxxxxxx', type: 'password' },
    ],
    docsUrl: 'https://docs.cashfree.com/docs',
    logo: 'CF',
    domain: 'cashfree.com',
    LogoComponent: CashfreeLogo,
  },
];


const CATEGORY_ICONS = {
  'Food Delivery':    ShoppingBag,
  'Marketing':        TrendingUp,
  'POS & Commerce':   Zap,
  'Reservations':     CheckCircle,
  'Logistics':        Globe,
  'Commerce':         Globe,
  'Loyalty & CRM':    TrendingUp,
  'Accounting':       Zap,
  'Payment Gateway':  CreditCard,
};

// ── Brand Logo ─────────────────────────────────────────────────────────
// Priority: real PNG icon (from /public/logos/{id}.png) →
//           custom SVG logo (from /public/logos/{id}.svg) →
//           inline JSX SVG component → gradient letter badge
function BrandLogo({ platform, size = 'md' }) {
  const [pngFailed, setPngFailed] = useState(false);
  const [svgFailed, setSvgFailed] = useState(false);
  const px = size === 'lg' ? 48 : 40;

  // ── Level 1: Real brand PNG icon ──
  if (!pngFailed) {
    return (
      <div
        className="transition-transform group-hover:scale-105 flex items-center justify-center bg-white overflow-hidden flex-shrink-0"
        style={{
          width: px, height: px, borderRadius: 10,
          boxShadow: '0 1px 6px rgba(0,0,0,0.12)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <img
          src={`/logos/${platform.id}.png`}
          alt={platform.name}
          width={px}
          height={px}
          style={{ objectFit: 'cover', display: 'block', width: '100%', height: '100%' }}
          onError={() => setPngFailed(true)}
          loading="eager"
        />
      </div>
    );
  }

  // ── Level 2: Custom SVG file ──
  if (!svgFailed) {
    return (
      <div style={{ width: px, height: px, flexShrink: 0, borderRadius: 10, overflow: 'hidden' }}
           className="transition-transform group-hover:scale-105">
        <img
          src={`/logos/${platform.id}.svg`}
          alt={platform.name}
          width={px}
          height={px}
          style={{ display: 'block', width: '100%', height: '100%' }}
          onError={() => setSvgFailed(true)}
          loading="eager"
        />
      </div>
    );
  }

  // ── Level 3: Inline JSX SVG component ──
  const { LogoComponent } = platform;
  if (LogoComponent) {
    return (
      <div style={{ width: px, height: px, flexShrink: 0, borderRadius: 10, overflow: 'hidden' }}
           className="transition-transform group-hover:scale-105">
        <LogoComponent size={px} />
      </div>
    );
  }

  // ── Level 4: Gradient letter badge ──
  const color = platform.color || '#6366f1';
  return (
    <div
      style={{
        width: px, height: px,
        background: `linear-gradient(135deg, ${color}dd 0%, ${color}88 100%)`,
        borderRadius: 10, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
        boxShadow: `0 2px 12px ${color}44`,
      }}
      className="transition-transform group-hover:scale-105"
    >
      <span style={{ color: 'white', fontWeight: 900, fontSize: px * 0.35, fontFamily: 'Inter,sans-serif' }}>
        {platform.logo}
      </span>
    </div>
  );
}

// ── Connect Drawer ─────────────────────────────────────────────────────
function ConnectDrawer({ platform, data, onClose, onSuccess }) {
  const [form, setForm] = useState({});
  const [showKey, setShowKey] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    // Pre-fill known safe values
    const prefilled = {};
    platform.fields.forEach(f => {
      prefilled[f.key] = (f.type === 'password') ? '' : (data?.[f.key] || '');
    });
    setForm(prefilled);
  }, [platform, data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setIsLoading(true);
    try {
      await api.post(`/tenant/integrations/${platform.id}/connect`, form);
      onSuccess();
      onClose();
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Connection failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 dark:bg-slate-950/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="w-full max-w-md h-full bg-white dark:bg-slate-950 border-l border-surface-200 dark:border-slate-800 flex flex-col shadow-2xl"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-surface-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo platform={platform} size="lg" />
            <div>
              <h2 className="text-xl font-black text-surface-900 dark:text-white">{platform.name}</h2>
              <p className="text-sm text-surface-500">{platform.category}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-slate-800 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <div className="flex gap-3 p-4 bg-surface-50 dark:bg-slate-800/60 rounded-xl border border-surface-200 dark:border-slate-800">
            <Info size={18} className="text-surface-400 dark:text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-surface-500 dark:text-slate-400 leading-relaxed">{platform.description}</p>
          </div>

          {/* Error */}
          {err && (
            <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-xl">
              <AlertCircle size={18} className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{err}</p>
            </div>
          )}

          {/* Form */}
          <form id="connect-form" onSubmit={handleSubmit} className="space-y-4">
            {platform.fields.map(field => (
              <div key={field.key}>
                <label className="block text-xs font-bold text-surface-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    type={field.type === 'password' && !showKey[field.key] ? 'password' : 'text'}
                    placeholder={field.placeholder}
                    value={form[field.key] || ''}
                    onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                    required
                    className="w-full bg-surface-50 dark:bg-slate-800 border border-surface-200 dark:border-slate-700 rounded-xl px-4 py-3 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-slate-600 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all pr-12"
                  />
                  {field.type === 'password' && (
                    <button
                      type="button"
                      onClick={() => setShowKey(p => ({ ...p, [field.key]: !p[field.key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-700 dark:hover:text-slate-300 transition-colors"
                    >
                      {showKey[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </form>

          {/* Docs link */}
          <a
            href={platform.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-violet-500 dark:text-violet-400 hover:text-violet-600 dark:hover:text-violet-300 transition-colors"
          >
            <ExternalLink size={14} />
            How to get your API credentials →
          </a>
        </div>

        {/* Drawer Footer */}
        <div className="p-6 border-t border-surface-200 dark:border-slate-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-surface-100 dark:bg-slate-800 border border-surface-200 dark:border-slate-700 text-surface-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-surface-200 dark:hover:bg-slate-700 transition-all"
          >
            Cancel
          </button>
          <button
            form="connect-form"
            type="submit"
            disabled={isLoading}
            className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-500/25 hover:bg-violet-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Plug size={16} />}
            {isLoading ? 'Connecting…' : 'Save & Connect'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Platform Card ──────────────────────────────────────────────────────
function PlatformCard({ platform, data, onConnect, onDisconnect, index }) {
  const [disconnecting, setDisconnecting] = useState(false);
  const isConnected = data?.enabled && data?.hasKey;

  const handleDisconnect = async () => {
    if (!confirm(`Disconnect ${platform.name}? Your credentials will be permanently removed.`)) return;
    setDisconnecting(true);
    await onDisconnect(platform.id);
    setDisconnecting(false);
  };

  const CatIcon = CATEGORY_ICONS[platform.category] || Plug;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "group relative bg-white dark:bg-slate-900 border rounded-2xl p-6 flex flex-col gap-5 transition-all duration-200",
        isConnected
          ? "border-surface-200 dark:border-slate-700 shadow-md dark:shadow-lg"
          : "border-surface-200 dark:border-slate-800 hover:border-surface-300 dark:hover:border-slate-600"
      )}
    >
      {/* Connected Glow (dark only) */}
      {isConnected && (
        <div className={cn("absolute -inset-px rounded-2xl opacity-10 dark:opacity-20 blur-sm pointer-events-none", platform.bgColor)} />
      )}

      {/* Top Row */}
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-4">
          <BrandLogo platform={platform} />
          <div>
            <h3 className="font-bold text-surface-900 dark:text-white text-base leading-tight">{platform.name}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <CatIcon size={11} className="text-surface-400" />
              <span className="text-[11px] text-surface-400 font-medium">{platform.category}</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        {isConnected ? (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            Connected
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 dark:bg-slate-800 text-surface-400 dark:text-slate-500 text-[11px] font-bold rounded-full border border-surface-200 dark:border-slate-700">
            Not Connected
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-surface-500 leading-relaxed relative z-10">{platform.description}</p>

      {/* Connected Info */}
      {isConnected && data.connectedAt && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/10 rounded-xl relative z-10">
          <CheckCircle size={13} className="text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Connected {format(new Date(data.connectedAt), 'MMM dd, yyyy')}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto flex gap-2 relative z-10">
        {isConnected ? (
          <>
            <button
              onClick={() => onConnect(platform)}
              className="flex-1 py-2.5 bg-surface-100 dark:bg-slate-800 border border-surface-200 dark:border-slate-700 text-surface-600 dark:text-slate-300 rounded-xl font-bold text-xs hover:border-violet-400 dark:hover:border-violet-500/50 hover:text-violet-600 dark:hover:text-violet-400 transition-all active:scale-95"
            >
              Edit Credentials
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="px-4 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-500 dark:text-red-400 rounded-xl font-bold text-xs hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {disconnecting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            </button>
          </>
        ) : (
          <button
            onClick={() => onConnect(platform)}
            className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-violet-500/20 hover:bg-violet-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plug size={13} /> Connect
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await api.get('/tenant/integrations');
      setIntegrations(res.data.data || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load integrations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchIntegrations(); }, [fetchIntegrations]);

  const handleDisconnect = async (platformId) => {
    try {
      await api.post(`/tenant/integrations/${platformId}/disconnect`);
      await fetchIntegrations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to disconnect');
    }
  };

  const connectedCount = PLATFORMS.filter(p => integrations[p.id]?.enabled && integrations[p.id]?.hasKey).length;
  const categories = ['All', ...new Set(PLATFORMS.map(p => p.category))];

  const filteredPlatforms = activeCategory === 'All'
    ? PLATFORMS
    : PLATFORMS.filter(p => p.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-violet-600 rounded-xl text-white shadow-lg shadow-violet-500/25">
              <Plug size={22} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-surface-900 dark:text-white">Integrations</h1>
          </div>
          <p className="text-surface-500 ml-[46px]">Connect your restaurant to the food-tech ecosystem.</p>
        </div>

        {/* Connected badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <CheckCircle size={16} className="text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">{connectedCount} / {PLATFORMS.length} Connected</span>
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" /> {error}
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all",
              activeCategory === cat
                ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                : "bg-surface-100 dark:bg-slate-800 text-surface-500 dark:text-slate-400 hover:bg-surface-200 dark:hover:bg-slate-700 border border-surface-200 dark:border-slate-700"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-surface-100 dark:bg-slate-800 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-surface-100 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-surface-100 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </div>
              <div className="h-12 bg-surface-100 dark:bg-slate-800 rounded-xl" />
              <div className="h-10 bg-surface-100 dark:bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredPlatforms.map((platform, i) => (
              <PlatformCard
                key={platform.id}
                platform={platform}
                data={integrations[platform.id]}
                onConnect={setSelectedPlatform}
                onDisconnect={handleDisconnect}
                index={i}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* How it works note */}
      <div className="p-5 bg-surface-50 dark:bg-slate-800/40 border border-surface-200 dark:border-slate-800 rounded-2xl flex gap-4">
        <div className="p-2.5 bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-xl flex-shrink-0 self-start">
          <Info size={18} />
        </div>
        <div>
          <p className="font-bold text-surface-900 dark:text-white text-sm mb-1">About integrations</p>
          <p className="text-sm text-surface-500 dark:text-slate-400 leading-relaxed">
            Each integration stores your API credentials securely. Once connected, orders from these platforms
            will be automatically pushed into your POS (requires platform-side webhook configuration).
            Contact each platform's partner support to obtain API keys and enable the webhook callback URL.
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs font-bold text-violet-500 dark:text-violet-400">
            <ChevronRight size={14} />
            Webhook base URL: <code className="bg-surface-100 dark:bg-slate-800 text-surface-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-mono">https://your-domain.com/api/webhooks/</code>
          </div>
        </div>
      </div>

      {/* Connect Drawer */}
      <AnimatePresence>
        {selectedPlatform && (
          <ConnectDrawer
            platform={selectedPlatform}
            data={integrations[selectedPlatform.id]}
            onClose={() => setSelectedPlatform(null)}
            onSuccess={fetchIntegrations}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
