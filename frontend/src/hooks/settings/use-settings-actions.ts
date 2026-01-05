import { useCallback } from 'react';
import {
  setWeights, setRoleTypeMatrix, setTopicScores,
  setSpecializationTopics, resetWeights, resetPreferences, applyPreset,
} from '@/lib/api';
import type { WeightPreset } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { type SettingsData, deepClone } from './types';

export function useSettingsActions(
  data: SettingsData,
  setData: React.Dispatch<React.SetStateAction<SettingsData>>
) {
  const { toast } = useToast();

  const handleSave = useCallback(async () => {
    setData(prev => ({ ...prev, isSaving: true }));
    try {
      const { weights, originalWeights, roleTypeMatrix, originalRoleTypeMatrix,
        topicScores, originalTopicScores, specializationTopics, originalSpecializationTopics } = data;

      if (weights && JSON.stringify(weights) !== JSON.stringify(originalWeights)) {
        const saved = await setWeights(weights);
        setData(prev => ({ ...prev, weights: { ...saved }, originalWeights: { ...saved } }));
      }
      if (roleTypeMatrix && JSON.stringify(roleTypeMatrix) !== JSON.stringify(originalRoleTypeMatrix)) {
        const saved = await setRoleTypeMatrix(roleTypeMatrix);
        setData(prev => ({ ...prev, roleTypeMatrix: deepClone(saved), originalRoleTypeMatrix: deepClone(saved) }));
      }
      if (topicScores && JSON.stringify(topicScores) !== JSON.stringify(originalTopicScores)) {
        const saved = await setTopicScores(topicScores);
        setData(prev => ({ ...prev, topicScores: { ...saved }, originalTopicScores: { ...saved } }));
      }
      if (specializationTopics && JSON.stringify(specializationTopics) !== JSON.stringify(originalSpecializationTopics)) {
        const saved = await setSpecializationTopics(specializationTopics);
        setData(prev => ({ ...prev, specializationTopics: deepClone(saved), originalSpecializationTopics: deepClone(saved) }));
      }
      setData(prev => ({ ...prev, isSaving: false, hasChanges: false }));
      toast({ title: 'Сохранено', description: 'Настройки успешно применены' });
    } catch {
      toast({ title: 'Ошибка сохранения', variant: 'destructive' });
      setData(prev => ({ ...prev, isSaving: false }));
    }
  }, [data, setData, toast]);

  const handleResetAll = useCallback(async () => {
    setData(prev => ({ ...prev, isSaving: true }));
    try {
      const [newWeights, prefData] = await Promise.all([resetWeights(), resetPreferences()]);
      setData({
        weights: { ...newWeights },
        originalWeights: { ...newWeights },
        currentPreset: 'default',
        roleTypeMatrix: deepClone(prefData.role_type_matrix),
        originalRoleTypeMatrix: deepClone(prefData.role_type_matrix),
        topicScores: { ...prefData.topic_scores },
        originalTopicScores: { ...prefData.topic_scores },
        specializationTopics: deepClone(prefData.specialization_topics),
        originalSpecializationTopics: deepClone(prefData.specialization_topics),
        isLoading: false,
        isSaving: false,
        hasChanges: false,
      });
      toast({ title: 'Сброшено', description: 'Все настройки сброшены' });
    } catch {
      toast({ title: 'Ошибка', variant: 'destructive' });
      setData(prev => ({ ...prev, isSaving: false }));
    }
  }, [setData, toast]);

  const handlePresetApply = useCallback(async (preset: WeightPreset) => {
    setData(prev => ({ ...prev, isSaving: true }));
    try {
      const newWeights = await applyPreset(preset);
      setData(prev => ({
        ...prev,
        weights: { ...newWeights },
        originalWeights: { ...newWeights },
        currentPreset: preset,
        isSaving: false,
        hasChanges: false,
      }));
      toast({ title: 'Пресет применён', description: `Пресет "${preset}" активирован` });
    } catch {
      toast({ title: 'Ошибка', variant: 'destructive' });
      setData(prev => ({ ...prev, isSaving: false }));
    }
  }, [setData, toast]);

  return { handleSave, handleResetAll, handlePresetApply };
}
