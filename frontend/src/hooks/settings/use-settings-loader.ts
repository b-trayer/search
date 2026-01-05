import { useCallback } from 'react';
import {
  getWeights, getPresets, getRoleTypeMatrix,
  getTopicScores, getSpecializationTopics,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { type SettingsData, deepClone } from './types';

export function useSettingsLoader(
  setData: React.Dispatch<React.SetStateAction<SettingsData>>
) {
  const { toast } = useToast();

  const loadAll = useCallback(async () => {
    try {
      const [weightsData, presetsData, matrixData, scoresData, topicsData] = await Promise.all([
        getWeights(),
        getPresets(),
        getRoleTypeMatrix(),
        getTopicScores(),
        getSpecializationTopics(),
      ]);
      setData({
        weights: { ...weightsData },
        originalWeights: { ...weightsData },
        currentPreset: presetsData.current,
        roleTypeMatrix: deepClone(matrixData),
        originalRoleTypeMatrix: deepClone(matrixData),
        topicScores: { ...scoresData },
        originalTopicScores: { ...scoresData },
        specializationTopics: deepClone(topicsData),
        originalSpecializationTopics: deepClone(topicsData),
        isLoading: false,
        isSaving: false,
        hasChanges: false,
      });
    } catch {
      toast({ title: 'Ошибка загрузки', variant: 'destructive' });
      setData(prev => ({ ...prev, isLoading: false }));
    }
  }, [setData, toast]);

  return { loadAll };
}
