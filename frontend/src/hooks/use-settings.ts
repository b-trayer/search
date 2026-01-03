
import { useState, useCallback, useEffect } from 'react';
import { getWeights, setWeights, applyPreset, getPresets } from '@/lib/api';
import type { RankingWeights, WeightPreset } from '@/lib/types';

const DEFAULT_WEIGHTS: RankingWeights = {
  w_user: 1.5,
  alpha_type: 0.4,
  alpha_topic: 0.6,
  beta_ctr: 0.5,
  ctr_alpha_prior: 1.0,
  ctr_beta_prior: 10.0,
};

interface UseSettingsReturn {
  weights: RankingWeights;
  preset: WeightPreset | null;
  isModified: boolean;
  isLoading: boolean;
  error: string | null;

  updateWeight: <K extends keyof RankingWeights>(key: K, value: number) => void;
  applyPreset: (preset: WeightPreset) => Promise<void>;
  save: () => Promise<void>;
  reset: () => Promise<void>;
  reload: () => Promise<void>;
}

export function useSettings(): UseSettingsReturn {
  const [weights, setWeightsState] = useState<RankingWeights>(DEFAULT_WEIGHTS);
  const [preset, setPreset] = useState<WeightPreset | null>('default');
  const [isModified, setIsModified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [weightsRes, presetsRes] = await Promise.all([
          getWeights(),
          getPresets(),
        ]);
        setWeightsState(weightsRes);
        setPreset(presetsRes.current);
        setIsModified(false);
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('Не удалось загрузить настройки');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [weightsRes, presetsRes] = await Promise.all([
        getWeights(),
        getPresets(),
      ]);
      setWeightsState(weightsRes);
      setPreset(presetsRes.current);
      setIsModified(false);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Не удалось загрузить настройки');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateWeight = useCallback(<K extends keyof RankingWeights>(
    key: K,
    value: number
  ) => {
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
    } catch (err) {
      console.error('Failed to apply preset:', err);
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
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Не удалось сохранить настройки');
    } finally {
      setIsLoading(false);
    }
  }, [weights]);

  const reset = useCallback(async () => {
    await handleApplyPreset('default');
  }, [handleApplyPreset]);

  return {
    weights,
    preset,
    isModified,
    isLoading,
    error,
    updateWeight,
    applyPreset: handleApplyPreset,
    save,
    reset,
    reload,
  };
}
