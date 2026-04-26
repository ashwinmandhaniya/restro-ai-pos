import { Brain, Key, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Shown when a tenant tries to use AI features without a Gemini API key configured.
 * @param {string} featureName - e.g. "AI Copilot", "Voice Billing", "AI Insights"
 */
export default function AIKeyRequired({ featureName = 'AI Features' }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 space-y-6">
      {/* Animated icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-600/20 border border-violet-500/30 flex items-center justify-center">
          <Brain className="w-10 h-10 text-violet-500" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 border-2 border-white dark:border-surface-800 flex items-center justify-center">
          <Key className="w-4 h-4 text-amber-500" />
        </div>
      </div>

      {/* Text */}
      <div className="max-w-sm space-y-2">
        <h3 className="text-xl font-bold text-surface-900 dark:text-white">
          Configure Your AI Key First
        </h3>
        <p className="text-surface-500 text-sm leading-relaxed">
          <strong className="text-surface-700 dark:text-surface-300">{featureName}</strong> requires a Gemini API key to work.
          Add your own key from Google AI Studio to unlock all AI-powered features.
        </p>
      </div>

      {/* Features preview */}
      <div className="flex flex-wrap justify-center gap-2">
        {['AI Copilot', 'Voice Billing', 'Sales Predictions', 'Menu Optimizer', 'Fraud Detection'].map(f => (
          <span key={f} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400">
            <Sparkles className="w-3 h-3" /> {f}
          </span>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate('/settings', { state: { section: 'ai' } })}
        className="btn-primary flex items-center gap-2 mt-2"
      >
        <Key className="w-4 h-4" />
        Configure API Key in Settings
        <ArrowRight className="w-4 h-4" />
      </button>

      <p className="text-xs text-surface-400">
        Get a free Gemini API key from{' '}
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-500 underline underline-offset-2 hover:text-primary-600"
        >
          Google AI Studio
        </a>
      </p>
    </div>
  );
}
