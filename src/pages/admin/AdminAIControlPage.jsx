import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Mic, ShoppingCart, Shield, BarChart3, Zap, Users, Eye,
  MessageSquare, Package, TrendingUp, Settings, Save, RefreshCw,
  ChevronDown, ChevronUp, Sparkles, AlertTriangle
} from 'lucide-react';
import useAdminFeatureFlagStore from '@/store/adminFeatureFlagStore';
import useAdminConfigStore from '@/store/adminConfigStore';
import { cn } from '@/lib/utils';

const AI_MODULES = [
  { key: 'ai_sales_prediction', label: 'Sales Prediction Engine', icon: TrendingUp, desc: 'ML-powered demand forecasting and daily sales trends', color: 'from-blue-500 to-blue-600', configKeys: ['ai_sales_lookback_days'] },
  { key: 'ai_menu_optimization', label: 'Smart Menu AI', icon: BarChart3, desc: 'Auto-detect dead items, optimize pricing & identify top performers', color: 'from-green-500 to-green-600', configKeys: ['ai_dead_item_threshold'] },
  { key: 'ai_inventory', label: 'Inventory AI', icon: Package, desc: 'Predict stock needs and auto-generate purchase order recommendations', color: 'from-amber-500 to-amber-600', configKeys: [] },
  { key: 'ai_voice_billing', label: 'Voice Billing', icon: Mic, desc: 'Natural language voice commands for order entry in Hindi & English', color: 'from-purple-500 to-purple-600', configKeys: [] },
  { key: 'ai_customer_insights', label: 'Customer Insights', icon: Users, desc: 'Identify VIPs, predict churn & send personalized offers', color: 'from-pink-500 to-pink-600', configKeys: ['ai_churn_days'] },
  { key: 'ai_fraud_detection', label: 'Fraud Detection', icon: Shield, desc: 'Detect unusual billing patterns, void anomalies & staff misuse', color: 'from-red-500 to-red-600', configKeys: ['ai_fraud_sensitivity'] },
  { key: 'ai_copilot', label: 'AI Copilot', icon: MessageSquare, desc: 'Natural language analytics — ask anything about your restaurant', color: 'from-indigo-500 to-indigo-600', configKeys: [] },
  { key: 'ai_recommendations', label: 'QR Menu Recommendations', icon: Sparkles, desc: 'AI-powered recommendations on customer QR ordering app', color: 'from-cyan-500 to-cyan-600', configKeys: ['ai_recommendation_count', 'ai_time_bonus_weight'] },
  { key: 'ai_wait_time', label: 'Wait Time Prediction', icon: Eye, desc: 'Predict customer wait time based on kitchen load and peak hours', color: 'from-teal-500 to-teal-600', configKeys: ['ai_wait_time_multiplier', 'ai_peak_hours'] },
];

const CONFIG_META = {
  ai_recommendation_count: { label: 'Recommendation Count', type: 'number', hint: 'Items shown in QR menu recommendations' },
  ai_wait_time_multiplier: { label: 'Wait Multiplier (min/item)', type: 'number', hint: 'Minutes per pending kitchen item' },
  ai_peak_hours: { label: 'Peak Hours', type: 'text', hint: 'e.g. 12-14,19-21' },
  ai_fraud_sensitivity: { label: 'Sensitivity', type: 'select', options: ['low', 'medium', 'high'], hint: 'Detection strictness' },
  ai_time_bonus_weight: { label: 'Time Bonus Weight', type: 'number', hint: 'Score bonus for meal-time matching' },
  ai_sales_lookback_days: { label: 'Lookback Days', type: 'number', hint: 'Past days for prediction model' },
  ai_dead_item_threshold: { label: 'Dead Item Threshold', type: 'number', hint: 'Orders below this = dead item' },
  ai_churn_days: { label: 'Churn Window (days)', type: 'number', hint: 'Days since last visit to flag churn' },
};

export default function AdminAIControlPage() {
  const { flags, fetchFlags, toggleFlag } = useAdminFeatureFlagStore();
  const { configs, fetchConfigs, upsertConfig } = useAdminConfigStore();
  const [expandedModule, setExpandedModule] = useState(null);
  const [configEdits, setConfigEdits] = useState({});
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchFlags();
    fetchConfigs('ai');
  }, []);

  const getFlag = (key) => flags.find(f => f.key === key);
  const getConfigVal = (key) => {
    // Check local edits first, then store
    if (configEdits[key] !== undefined) return configEdits[key];
    const c = configs.find(c => c.key === key);
    return c ? c.value : '';
  };

  const aiFlags = flags.filter(f => f.category === 'ai');
  const enabledCount = aiFlags.filter(f => f.isGloballyEnabled).length;

  const handleConfigEdit = (key, value) => {
    setConfigEdits(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = async (moduleKey) => {
    setSaving(true);
    const mod = AI_MODULES.find(m => m.key === moduleKey);
    if (!mod) return;

    for (const cfgKey of mod.configKeys) {
      if (configEdits[cfgKey] !== undefined) {
        const meta = CONFIG_META[cfgKey];
        await upsertConfig(cfgKey, {
          value: configEdits[cfgKey],
          label: meta?.label || cfgKey,
          category: 'ai',
          valueType: meta?.type === 'number' ? 'number' : 'string',
          isSecret: false
        });
      }
    }

    setConfigEdits({});
    await fetchConfigs('ai');
    setSaving(false);
  };

  const handleSeedFlags = async () => {
    setSeeding(true);
    try {
      for (const mod of AI_MODULES) {
        const existing = flags.find(f => f.key === mod.key);
        if (!existing) {
          await useAdminFeatureFlagStore.getState().createFlag({
            key: mod.key,
            label: mod.label,
            description: mod.desc,
            category: 'ai',
            isGloballyEnabled: true,
            isPremium: !['ai_menu_optimization', 'ai_recommendations', 'ai_wait_time'].includes(mod.key)
          });
        }
      }
      await fetchFlags();
    } catch (err) {
      console.error('Seed failed:', err);
    }
    setSeeding(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Brain className="w-8 h-8 text-violet-400" />
            AI Intelligence Hub
          </h1>
          <p className="text-slate-400 mt-1">Configure and manage all AI modules across the platform</p>
        </div>
        <div className="flex gap-3">
          {aiFlags.length < AI_MODULES.length && (
            <button
              onClick={handleSeedFlags}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all disabled:opacity-50"
            >
              <RefreshCw className={cn("w-4 h-4", seeding && "animate-spin")} />
              {seeding ? 'Seeding...' : 'Initialize AI Flags'}
            </button>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-gradient-to-br from-violet-600/20 to-violet-800/10 border border-violet-500/20 p-4">
          <p className="text-xs text-violet-400 font-semibold">Total Modules</p>
          <p className="text-3xl font-bold text-white mt-1">{AI_MODULES.length}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-emerald-600/20 to-emerald-800/10 border border-emerald-500/20 p-4">
          <p className="text-xs text-emerald-400 font-semibold">Active</p>
          <p className="text-3xl font-bold text-white mt-1">{enabledCount}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-amber-600/20 to-amber-800/10 border border-amber-500/20 p-4">
          <p className="text-xs text-amber-400 font-semibold">Config Keys</p>
          <p className="text-3xl font-bold text-white mt-1">{configs.filter(c => c.category === 'ai').length}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-red-600/20 to-red-800/10 border border-red-500/20 p-4">
          <p className="text-xs text-red-400 font-semibold">Disabled</p>
          <p className="text-3xl font-bold text-white mt-1">{aiFlags.length - enabledCount}</p>
        </div>
      </div>

      {/* AI Module Cards */}
      <div className="space-y-3">
        {AI_MODULES.map((mod, i) => {
          const flag = getFlag(mod.key);
          const isEnabled = flag?.isGloballyEnabled ?? false;
          const isExpanded = expandedModule === mod.key;
          const hasConfig = mod.configKeys.length > 0;

          return (
            <motion.div
              key={mod.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                'rounded-2xl bg-slate-900 border transition-all',
                isEnabled ? 'border-slate-700' : 'border-slate-800 opacity-60'
              )}
            >
              {/* Module Header */}
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0', mod.color)}>
                    <mod.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{mod.label}</h3>
                      {flag?.isPremium && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">PREMIUM</span>}
                      {!flag && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">NOT SEEDED</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{mod.desc}</p>
                    <code className="text-[10px] text-slate-600 font-mono">{mod.key}</code>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Status badge */}
                  <div className="flex items-center gap-1.5">
                    <span className={cn('w-2 h-2 rounded-full', isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600')} />
                    <span className="text-xs text-slate-500">{isEnabled ? 'Active' : 'Off'}</span>
                  </div>

                  {/* Toggle */}
                  {flag && (
                    <button onClick={() => toggleFlag(flag._id)}
                      className={cn('relative w-12 h-7 rounded-full transition-all', isEnabled ? 'bg-violet-600' : 'bg-slate-700')}>
                      <span className={cn('absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all', isEnabled ? 'left-6' : 'left-1')} />
                    </button>
                  )}

                  {/* Expand config */}
                  {hasConfig && (
                    <button
                      onClick={() => setExpandedModule(isExpanded ? null : mod.key)}
                      className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Config Panel */}
              <AnimatePresence>
                {isExpanded && hasConfig && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-0 border-t border-slate-800">
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mod.configKeys.map(cfgKey => {
                          const meta = CONFIG_META[cfgKey];
                          const val = getConfigVal(cfgKey);

                          return (
                            <div key={cfgKey} className="space-y-1.5">
                              <label className="text-xs text-slate-400 font-semibold">{meta?.label || cfgKey}</label>
                              {meta?.type === 'select' ? (
                                <select
                                  value={val}
                                  onChange={e => handleConfigEdit(cfgKey, e.target.value)}
                                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none"
                                >
                                  {meta.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              ) : (
                                <input
                                  type={meta?.type || 'text'}
                                  value={val}
                                  onChange={e => handleConfigEdit(cfgKey, e.target.value)}
                                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white font-mono focus:border-violet-500 focus:outline-none"
                                />
                              )}
                              {meta?.hint && <p className="text-[10px] text-slate-600">{meta.hint}</p>}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => handleSaveConfig(mod.key)}
                          disabled={saving}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Platform AI Insights */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-violet-400" /> Platform AI Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-slate-800/60 p-4 border border-slate-700/50">
            <p className="text-xs text-slate-500 mb-1">🏆 Adoption</p>
            <p className="text-sm text-white font-medium">Top performing restaurants have 3x higher AI module adoption</p>
            <p className="text-xs text-violet-400 mt-2">Recommend enabling all AI modules for Growth plans</p>
          </div>
          <div className="rounded-xl bg-slate-800/60 p-4 border border-slate-700/50">
            <p className="text-xs text-slate-500 mb-1">⚠️ Churn Risk</p>
            <p className="text-sm text-white font-medium">Tenants without Voice Billing churn 2x faster</p>
            <p className="text-xs text-amber-400 mt-2">Enable for Starter plans to reduce churn</p>
          </div>
          <div className="rounded-xl bg-slate-800/60 p-4 border border-slate-700/50">
            <p className="text-xs text-slate-500 mb-1">💰 Revenue</p>
            <p className="text-sm text-white font-medium">QR Recommendations drive 15% more reorders vs. non-AI menus</p>
            <p className="text-xs text-emerald-400 mt-2">Upsell as add-on to Growth tier</p>
          </div>
        </div>
      </div>
    </div>
  );
}
