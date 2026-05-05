import { useEffect, useState } from 'react';
import { Settings, ScrollText, Shield, Save, Plus, X, Trash2, Pencil, Globe, Eye, EyeOff, CheckCircle2, AlertCircle, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAdminConfigStore from '@/store/adminConfigStore';
import { cn } from '@/lib/utils';

/* ── Google OAuth Settings Tab ── */
function GoogleOAuthTab() {
  const { configs, upsertConfig, fetchConfigs, isLoading } = useAdminConfigStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const get = (key) => configs.find(c => c.key === key)?.value ?? '';
  const enabled = get('google_oauth_enabled') === true || get('google_oauth_enabled') === 'true';

  const [form, setForm] = useState({ enabled: false, clientId: '', clientSecret: '' });

  useEffect(() => {
    setForm({
      enabled: get('google_oauth_enabled') === true || get('google_oauth_enabled') === 'true',
      clientId: get('google_oauth_client_id'),
      clientSecret: get('google_oauth_client_secret'),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configs]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        upsertConfig('google_oauth_enabled', {
          key: 'google_oauth_enabled', value: form.enabled, label: 'Google OAuth Enabled',
          category: 'oauth', valueType: 'boolean', isSecret: false,
        }),
        upsertConfig('google_oauth_client_id', {
          key: 'google_oauth_client_id', value: form.clientId, label: 'Google Client ID',
          category: 'oauth', valueType: 'string', isSecret: false,
        }),
        upsertConfig('google_oauth_client_secret', {
          key: 'google_oauth_client_secret', value: form.clientSecret, label: 'Google Client Secret',
          category: 'oauth', valueType: 'string', isSecret: true,
        }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium',
        form.enabled
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-slate-800 border-slate-700 text-slate-400'
      )}>
        {form.enabled
          ? <><CheckCircle2 className="w-4 h-4" /> Google Login is <strong>enabled</strong> — users will see the Google button on the login page.</>
          : <><AlertCircle className="w-4 h-4" /> Google Login is <strong>disabled</strong> — the button won't appear on the login page.</>
        }
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Enable Google Login</p>
            <p className="text-xs text-slate-400 mt-0.5">Show "Sign in with Google" button on the auth page</p>
          </div>
          <button
            onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
            className={cn(
              'relative w-12 h-6 rounded-full transition-colors duration-200',
              form.enabled ? 'bg-emerald-500' : 'bg-slate-700'
            )}
          >
            <span className={cn(
              'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
              form.enabled ? 'translate-x-6' : 'translate-x-0.5'
            )} />
          </button>
        </div>

        <div className="border-t border-slate-800" />

        {/* Client ID */}
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block font-medium">
            Google OAuth Client ID
            <span className="ml-2 text-slate-600 font-normal">(from Google Cloud Console → Credentials)</span>
          </label>
          <input
            value={form.clientId}
            onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
            placeholder="123456789-abc.apps.googleusercontent.com"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white font-mono focus:border-violet-500 focus:outline-none placeholder:text-slate-600"
          />
        </div>

        {/* Client Secret */}
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block font-medium">
            Google OAuth Client Secret
            <span className="ml-2 text-slate-600 font-normal">(keep this secret)</span>
          </label>
          <div className="relative">
            <input
              type={showSecret ? 'text' : 'password'}
              value={form.clientSecret}
              onChange={e => setForm(f => ({ ...f, clientSecret: e.target.value }))}
              placeholder="GOCSPX-••••••••••••••••"
              className="w-full px-3 py-2.5 pr-10 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white font-mono focus:border-violet-500 focus:outline-none placeholder:text-slate-600"
            />
            <button
              type="button"
              onClick={() => setShowSecret(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* How-to guide */}
        <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4">
          <p className="text-xs font-semibold text-slate-300 mb-2">📋 Setup Guide</p>
          <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
            <li>Go to <span className="text-violet-400">console.cloud.google.com</span> → APIs &amp; Services → Credentials</li>
            <li>Click <strong className="text-slate-300">Create Credentials</strong> → OAuth 2.0 Client ID</li>
            <li>Set Application type to <strong className="text-slate-300">Web application</strong></li>
            <li>Add <span className="font-mono text-emerald-400">http://localhost:5173</span> to Authorized JavaScript origins</li>
            <li>Copy the Client ID and Client Secret above</li>
          </ol>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-violet-600 hover:bg-violet-700 text-white',
            saving && 'opacity-60 cursor-not-allowed'
          )}
        >
          {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : saving ? 'Saving…' : <><Save className="w-4 h-4" /> Save Google OAuth Settings</>}
        </button>
      </div>
    </div>
  );
}

/* ── Brevo Email Settings Tab ── */
function BrevoEmailTab() {
  const { configs, upsertConfig } = useAdminConfigStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const get = (key) => configs.find(c => c.key === key)?.value ?? '';
  const enabled = get('brevo_email_enabled') === true || get('brevo_email_enabled') === 'true';

  const [form, setForm] = useState({ enabled: false, apiKey: '', senderEmail: '', senderName: '' });

  useEffect(() => {
    setForm({
      enabled: get('brevo_email_enabled') === true || get('brevo_email_enabled') === 'true',
      apiKey: get('brevo_api_key'),
      senderEmail: get('brevo_sender_email'),
      senderName: get('brevo_sender_name'),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configs]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        upsertConfig('brevo_email_enabled', {
          key: 'brevo_email_enabled', value: form.enabled, label: 'Brevo Email Enabled',
          category: 'email', valueType: 'boolean', isSecret: false,
        }),
        upsertConfig('brevo_api_key', {
          key: 'brevo_api_key', value: form.apiKey, label: 'Brevo API Key',
          category: 'email', valueType: 'string', isSecret: true,
        }),
        upsertConfig('brevo_sender_email', {
          key: 'brevo_sender_email', value: form.senderEmail, label: 'Default Sender Email',
          category: 'email', valueType: 'string', isSecret: false,
        }),
        upsertConfig('brevo_sender_name', {
          key: 'brevo_sender_name', value: form.senderName, label: 'Default Sender Name',
          category: 'email', valueType: 'string', isSecret: false,
        }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium',
        form.enabled
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-slate-800 border-slate-700 text-slate-400'
      )}>
        {form.enabled
          ? <><CheckCircle2 className="w-4 h-4" /> Brevo Email is <strong>enabled</strong> — system transactional emails will be sent.</>
          : <><AlertCircle className="w-4 h-4" /> Brevo Email is <strong>disabled</strong> — email sending is paused.</>
        }
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Enable Brevo Transactional Emails</p>
            <p className="text-xs text-slate-400 mt-0.5">Allow the platform to send welcome emails, invoices, and password resets</p>
          </div>
          <button
            onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
            className={cn(
              'relative w-12 h-6 rounded-full transition-colors duration-200',
              form.enabled ? 'bg-emerald-500' : 'bg-slate-700'
            )}
          >
            <span className={cn(
              'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
              form.enabled ? 'translate-x-6' : 'translate-x-0.5'
            )} />
          </button>
        </div>

        <div className="border-t border-slate-800" />

        {/* API Key */}
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block font-medium">
            Brevo API Key (v3)
            <span className="ml-2 text-slate-600 font-normal">(from Brevo → SMTP &amp; API)</span>
          </label>
          <div className="relative">
            <input
              type={showSecret ? 'text' : 'password'}
              value={form.apiKey}
              onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
              placeholder="xkeysib-••••••••••••••••"
              className="w-full px-3 py-2.5 pr-10 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none placeholder:text-slate-600"
            />
            <button
              type="button"
              onClick={() => setShowSecret(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Sender Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Global Sender Name</label>
            <input
              value={form.senderName}
              onChange={e => setForm(f => ({ ...f, senderName: e.target.value }))}
              placeholder="RestroxAI Alerts"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none placeholder:text-slate-600"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Global Sender Email</label>
            <input
              value={form.senderEmail}
              onChange={e => setForm(f => ({ ...f, senderEmail: e.target.value }))}
              placeholder="noreply@restroxai.in"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none placeholder:text-slate-600"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-[#009286] hover:bg-[#007f74] text-white',
            saving && 'opacity-60 cursor-not-allowed'
          )}
        >
          {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : saving ? 'Saving…' : <><Save className="w-4 h-4" /> Save Brevo Config</>}
        </button>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { configs, activityLogs, logPagination, fetchConfigs, upsertConfig, deleteConfig, fetchActivityLogs, isLoading } = useAdminConfigStore();
  const [tab, setTab] = useState('config');
  const [catFilter, setCatFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [form, setForm] = useState({ key: '', value: '', label: '', category: 'general', valueType: 'string', isSecret: false });

  useEffect(() => { fetchConfigs(); fetchActivityLogs(); }, []);

  const categories = [...new Set(configs.map(c => c.category))];
  const filtered = catFilter ? configs.filter(c => c.category === catFilter) : configs;

  const handleSave = async (e) => {
    e.preventDefault();
    await upsertConfig(form.key, form);
    setShowModal(false);
    setForm({ key: '', value: '', label: '', category: 'general', valueType: 'string', isSecret: false });
  };
  
  const openEdit = (c) => {
    setEditingKey(c.key);
    setForm({ key: c.key, value: c.value, label: c.label || '', category: c.category, valueType: c.valueType || 'string', isSecret: c.isSecret });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">System configuration and activity logs</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'config', icon: Settings, label: 'System Config' },
          { key: 'google', icon: Globe, label: 'Google OAuth' },
          { key: 'brevo', icon: Mail, label: 'Brevo Email' },
          { key: 'logs', icon: ScrollText, label: 'Activity Logs' },
          { key: 'roles', icon: Shield, label: 'Roles & Access' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all', tab === t.key ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700')}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Google OAuth Tab ── */}
      {tab === 'google' && <GoogleOAuthTab />}

      {/* ── Brevo Email Tab ── */}
      {tab === 'brevo' && <BrevoEmailTab />}

      {tab === 'config' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => setCatFilter('')} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold', !catFilter ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400')}>All</button>
              {categories.map(c => (
                <button key={c} onClick={() => setCatFilter(c)} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold capitalize', catFilter === c ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400')}>{c}</button>
              ))}
            </div>
            <button onClick={() => { setEditingKey(null); setForm({ key: '', value: '', label: '', category: 'general', valueType: 'string', isSecret: false }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold"><Plus className="w-4 h-4" /> Add Config</button>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800">
                {['Key', 'Value', 'Category', 'Type', 'Updated', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs text-slate-500 font-semibold uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-500">No configs found. Add your first system config.</td></tr>
                ) : filtered.map(c => (
                  <tr key={c._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-violet-400">{c.key}</td>
                    <td className="py-3 px-4 text-white text-xs max-w-[200px] truncate">{c.isSecret ? '••••••••' : String(c.value)}</td>
                    <td className="py-3 px-4"><span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 capitalize">{c.category}</span></td>
                    <td className="py-3 px-4 text-xs text-slate-500">{c.valueType}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">{new Date(c.updatedAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { if(confirm("Delete this config?")) deleteConfig(c.key); }} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400/60 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-800">
              {['Action', 'User', 'Method', 'Path', 'IP', 'Time'].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs text-slate-500 font-semibold uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {activityLogs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500">No activity logs yet</td></tr>
              ) : activityLogs.map(log => (
                <tr key={log._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4"><span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', log.severity === 'critical' ? 'bg-red-500/20 text-red-400' : log.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700/50 text-slate-400')}>{log.action}</span></td>
                  <td className="py-3 px-4 text-white text-xs">{log.userName || '—'}</td>
                  <td className="py-3 px-4 text-xs"><span className={cn('font-mono', log.method === 'DELETE' ? 'text-red-400' : log.method === 'POST' ? 'text-emerald-400' : 'text-slate-400')}>{log.method}</span></td>
                  <td className="py-3 px-4 text-xs text-slate-500 font-mono max-w-[200px] truncate">{log.path}</td>
                  <td className="py-3 px-4 text-xs text-slate-500 font-mono">{log.ip}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'roles' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Role &amp; Permission Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800">
                <th className="text-left py-2 px-3 text-xs text-slate-500">Permission</th>
                {['Super Admin', 'Finance Admin', 'Support Admin', 'AI Analyst'].map(r => (
                  <th key={r} className="text-center py-2 px-3 text-xs text-slate-500">{r}</th>
                ))}
              </tr></thead>
              <tbody>
                {[
                  { perm: 'Manage Tenants', sa: true, fa: false, sup: false, ai: false },
                  { perm: 'View Billing', sa: true, fa: true, sup: false, ai: false },
                  { perm: 'Manage Subscriptions', sa: true, fa: true, sup: false, ai: false },
                  { perm: 'View Analytics', sa: true, fa: true, sup: false, ai: true },
                  { perm: 'AI Configuration', sa: true, fa: false, sup: false, ai: true },
                  { perm: 'Manage Support', sa: true, fa: false, sup: true, ai: false },
                  { perm: 'System Config', sa: true, fa: false, sup: false, ai: false },
                  { perm: 'Feature Flags', sa: true, fa: false, sup: false, ai: false },
                  { perm: 'Activity Logs', sa: true, fa: true, sup: true, ai: false },
                  { perm: 'Google OAuth', sa: true, fa: false, sup: false, ai: false },
                ].map(row => (
                  <tr key={row.perm} className="border-b border-slate-800/50">
                    <td className="py-2.5 px-3 text-slate-300 text-sm">{row.perm}</td>
                    {[row.sa, row.fa, row.sup, row.ai].map((v, i) => (
                      <td key={i} className="text-center py-2.5 px-3">
                        <span className={cn('w-5 h-5 rounded inline-flex items-center justify-center text-xs', v ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600')}>
                          {v ? '✓' : '—'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Config Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6">
              <div className="flex justify-between mb-5">
                <h3 className="text-xl font-bold text-white">{editingKey ? 'Edit Config' : 'Add Config'}</h3>
                <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs text-slate-400 mb-1 block">Key *</label>
                    <input required disabled={!!editingKey} placeholder="gst_cgst_rate" className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white font-mono focus:border-violet-500 focus:outline-none disabled:opacity-50" value={form.key} onChange={e => setForm({...form, key: e.target.value})} /></div>
                  <div><label className="text-xs text-slate-400 mb-1 block">Category</label>
                    <select className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      {['gst', 'payment', 'notification', 'email', 'sms', 'whatsapp', 'general', 'ai', 'storage', 'cloudinary', 'oauth'].map(c => <option key={c}>{c}</option>)}
                    </select></div>
                </div>
                <div><label className="text-xs text-slate-400 mb-1 block">Value *</label>
                  <input required className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none" value={form.value} onChange={e => setForm({...form, value: e.target.value})} /></div>
                <div><label className="text-xs text-slate-400 mb-1 block">Label</label>
                  <input className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:border-violet-500 focus:outline-none" value={form.label} onChange={e => setForm({...form, label: e.target.value})} /></div>
                <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                  <input type="checkbox" checked={form.isSecret} onChange={e => setForm({...form, isSecret: e.target.checked})} className="rounded bg-slate-800 border-slate-700" /> Secret (masked in UI)
                </label>
                <button type="submit" disabled={isLoading} className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-all mt-4">
                  {editingKey ? 'Save Changes' : 'Save Config'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


