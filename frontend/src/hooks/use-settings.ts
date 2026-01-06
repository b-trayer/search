import { useState, useCallback, useEffect } from 'react';
import { getWeights, setWeights, applyPreset, getPresets } from '@/lib/api';
import type { RankingWeights, WeightPreset } from '@/lib/types';
import { DEFAULT_WEIGHTS, UseSettingsReturn } from './settings/settings-types';

export function useSettings(): UseSettingsReturn {
  const [weights, setWeightsState] = useState<RankingWeights>(DEFAULT_WEIGHTS);
  const [preset, setPreset] = useState<WeightPreset | null>('default');
  const [isModified, setIsModified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [weightsRes, presetsRes] = await Promise.all([getWeights(), getPresets()]);
      setWeightsState(weightsRes);
      setPreset(presetsRes.current);
      setIsModified(false);
    } catch {
      setError('Не удалось загрузить настройки');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const updateWeight = useCallback(<K extends keyof RankingWeights>(key: K, value: number) => {
    setWeightsState(prev => ({ ...prev, [key]: value }));
    setIsModified(true);
    setPreset(null);
  }, []);

  const handleApplyPreset = useCallback(async (presetName: WeightPreset) => {
    setIsLoading(true);
    setError(null);
    try {
      const newWeights = await applyPreset(presetName);
      setWeightsState(newWeights);
      setPreset(presetName);
      setIsModified(false);
    } catch {
      setError('Не удалось применить пресет');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const save = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await setWeights(weights);
      setIsModified(false);
    } catch {
      setError('Не удалось сохранить настройки');
    } finally {
      setIsLoading(false);
    }
  }, [weights]);

  return {
    weights, preset, isModified, isLoading, error,
    updateWeight, applyPreset: handleApplyPreset, save,
    reset: useCallback(async () => handleApplyPreset('default'), [handleApplyPreset]),
    reload: loadSettings,
  };
}
