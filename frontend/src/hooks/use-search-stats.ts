import { useEffect, useCallback, useRef } from 'react';
import { getSearchStats, registerImpressions, type ImpressionsData } from '@/lib/api';

interface UseSearchStatsOptions {
  onImpressionsUpdate: (total: number) => void;
}

export function useSearchStats({ onImpressionsUpdate }: UseSearchStatsOptions) {
  const totalImpressionsRef = useRef(0);

  useEffect(() => {
    getSearchStats()
      .then((data) => {
        totalImpressionsRef.current = data.total_impressions;
        onImpressionsUpdate(data.total_impressions);
      })
      .catch((err) => {
        if (import.meta.env.DEV) {
          console.warn('Failed to load search stats:', err);
        }
      });
  }, [onImpressionsUpdate]);

  const trackImpressions = useCallback(async (data: ImpressionsData): Promise<number> => {
    const result = await registerImpressions(data);
    if (result) {
      totalImpressionsRef.current = result.total_impressions;
      return result.total_impressions;
    }
    return totalImpressionsRef.current;
  }, []);

  return {
    trackImpressions,
    getTotalImpressions: () => totalImpressionsRef.current,
  };
}
