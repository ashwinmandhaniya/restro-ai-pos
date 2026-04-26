import { useState, useEffect } from 'react';
import api from '@/lib/api';

/**
 * Hook that checks if the tenant has a valid Gemini API key configured.
 * Returns: { isReady, isLoading, config }
 *   isReady: true only if useOwnKey=true AND hasKey=true
 */
export function useAIGate() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.get('/tenant/settings/ai-config')
      .then(res => {
        if (cancelled) return;
        const data = res.data.data;
        setConfig(data);
        setIsReady(data.useOwnKey === true && data.hasKey === true);
      })
      .catch(() => {
        if (!cancelled) setIsReady(false);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { isReady, isLoading, config };
}
