import { useState, useEffect } from 'react';
import { Brain, Key, Trash2, CheckCircle, AlertTriangle, ExternalLink, RefreshCw, Eye, EyeOff, ArrowUpRight } from 'lucide-react';
import api from '@/lib/api';
import useUIStore from '@/store/uiStore';
import { cn } from '@/lib/utils';

const GEMINI_MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Fastest, best for real-time features (Recommended)' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Most capable — higher quota cost' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', description: 'Efficient, great for voice and copilot' },
];

export default function AIConfigSettings() {
  const { addNotification } = useUIStore();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // null | { success, message }
  const [showKey, setShowKey] = useState(false);

  // Form state
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [useOwnKey, setUseOwnKey] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tenant/settings/ai-config');
      const data = res.data.data;
      setConfig(data);
      setSelectedModel(data.preferredModel || 'gemini-2.5-flash');
      setUseOwnKey(data.useOwnKey || false);
    } catch (err) {
      console.error('Failed to load AI config', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  const handleTest = async () => {
    if (!apiKeyInput.trim()) {
      setTestResult({ success: false, message: 'Please enter an API key to test.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.post('/tenant/settings/ai-config/test', { geminiApiKey: apiKeyInput });
      setTestResult({ success: res.data.success, message: res.data.message });
    } catch (err) {
      setTestResult({ success: false, message: err.response?.data?.message || 'Connection test failed.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/tenant/settings/ai-config', {
        geminiApiKey: apiKeyInput.trim() || undefined,
        preferredModel: selectedModel,
        useOwnKey,
      });
      addNotification({ type: 'success', title: 'AI Config Saved', message: 'Your Gemini API configuration has been updated.' });
      setApiKeyInput('');
      await fetchConfig();
    } catch (err) {
      addNotification({ type: 'error', title: 'Save Failed', message: err.response?.data?.message || 'Something went wrong.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveKey = async () => {
    if (!confirm('Remove your custom API key and revert to the platform shared key?')) return;
    try {
      await api.delete('/tenant/settings/ai-config');
      addNotification({ type: 'success', title: 'Key Removed', message: 'Reverted to platform AI key.' });
      setApiKeyInput('');
      setUseOwnKey(false);
      await fetchConfig();
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to remove key.' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-8 text-surface-500">
        <RefreshCw className="w-5 h-5 animate-spin" /> Loading AI configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status Banner */}
      <div className={cn(
        'flex items-start gap-4 p-4 rounded-xl border',
        config?.hasKey && config?.useOwnKey
          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50'
          : 'bg-surface-50 dark:bg-surface-800/50 border-surface-200 dark:border-surface-700'
      )}>
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
          config?.hasKey && config?.useOwnKey
            ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
            : 'bg-surface-200 dark:bg-surface-700 text-surface-500'
        )}>
          <Brain className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          {config?.hasKey && config?.useOwnKey ? (
            <>
              <p className="font-semibold text-green-700 dark:text-green-300">Using Your Own Gemini API Key</p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-0.5">
                Key: <span className="font-mono">{config.geminiApiKeyMasked}</span>
                {config.configuredAt && (
                  <span className="ml-2 text-xs opacity-70">
                    · Configured {new Date(config.configuredAt).toLocaleDateString()}
                  </span>
                )}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-surface-700 dark:text-surface-300">Using Platform Shared Key</p>
              <p className="text-sm text-surface-500 mt-0.5">
                AI features run on the platform's shared Gemini API key. Configure your own key for dedicated quota and full control.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Use own key toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
        <div>
          <p className="font-semibold text-surface-800 dark:text-white text-sm">Use My Own Gemini API Key</p>
          <p className="text-xs text-surface-500 mt-0.5">Enable to use your personal/organization API quota for all AI features</p>
        </div>
        <button
          onClick={() => setUseOwnKey(prev => !prev)}
          className={cn('relative w-11 h-6 rounded-full transition-all flex-shrink-0', useOwnKey ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600')}
        >
          <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-sm', useOwnKey && 'translate-x-5')} />
        </button>
      </div>

      {/* API Key Input — shown when useOwnKey is on */}
      {useOwnKey && (
        <div className="space-y-4 border border-dashed border-primary-300 dark:border-primary-800 rounded-xl p-5 bg-primary-50/30 dark:bg-primary-950/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-surface-800 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-primary-500" /> Gemini API Key
            </h3>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 transition-colors"
            >
              Get API Key <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={e => { setApiKeyInput(e.target.value); setTestResult(null); }}
              placeholder={config?.hasKey ? 'Enter new key to replace existing key...' : 'AIzaSy...'}
              className="input pr-10 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowKey(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Test result badge */}
          {testResult && (
            <div className={cn(
              'flex items-center gap-2 text-sm px-3 py-2 rounded-lg font-medium',
              testResult.success
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            )}>
              {testResult.success ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {testResult.message}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleTest}
              disabled={testing || !apiKeyInput.trim()}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            {config?.hasKey && (
              <button
                onClick={handleRemoveKey}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Remove Key
              </button>
            )}
          </div>
        </div>
      )}

      {/* Model Selection */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-surface-700 dark:text-surface-300">Preferred Gemini Model</label>
        <div className="grid gap-3">
          {GEMINI_MODELS.map(m => (
            <label
              key={m.value}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all',
                selectedModel === m.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 ring-1 ring-primary-500/30'
                  : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800/30 hover:border-surface-300 dark:hover:border-surface-600'
              )}
            >
              <input
                type="radio"
                name="gemini_model"
                value={m.value}
                checked={selectedModel === m.value}
                onChange={() => setSelectedModel(m.value)}
                className="w-4 h-4 text-primary-500 focus:ring-primary-500 border-surface-300"
              />
              <div>
                <p className="font-semibold text-surface-800 dark:text-white text-sm">{m.label}</p>
                <p className="text-xs text-surface-500 mt-0.5">{m.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-sm text-amber-700 dark:text-amber-400 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <strong>Privacy Note:</strong> Your API key is stored securely in the database and is never exposed in API responses — only the last 4 characters are shown for verification.
          <a
            href="https://cloud.google.com/vertex-ai/docs/generative-ai/start/quickstarts/api-quickstart"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 underline underline-offset-2 inline-flex items-center gap-0.5"
          >
            Gemini API Docs <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save AI Configuration'}
        </button>
      </div>
    </div>
  );
}
