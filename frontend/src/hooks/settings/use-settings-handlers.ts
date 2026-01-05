import { useCallback } from 'react';
import type { RankingWeights } from '@/lib/types';
import { type SettingsData, checkHasChanges } from './types';

export function useSettingsHandlers(
  setData: React.Dispatch<React.SetStateAction<SettingsData>>
) {
  const handleWeightChange = useCallback((key: keyof RankingWeights, value: number) => {
    setData(prev => {
      if (!prev.weights) return prev;
      const newWeights = { ...prev.weights, [key]: value };
      const updated = { ...prev, weights: newWeights, currentPreset: null };
      return { ...updated, hasChanges: checkHasChanges(updated) };
    });
  }, [setData]);

  const handleMatrixChange = useCallback((role: string, docType: string, value: number) => {
    setData(prev => {
      if (!prev.roleTypeMatrix) return prev;
      const newMatrix = {
        ...prev.roleTypeMatrix,
        [role]: { ...prev.roleTypeMatrix[role], [docType]: value }
      };
      const updated = { ...prev, roleTypeMatrix: newMatrix };
      return { ...updated, hasChanges: checkHasChanges(updated) };
    });
  }, [setData]);

  const handleTopicScoreChange = useCallback((key: string, value: number) => {
    setData(prev => {
      if (!prev.topicScores) return prev;
      const newScores = { ...prev.topicScores, [key]: value };
      const updated = { ...prev, topicScores: newScores };
      return { ...updated, hasChanges: checkHasChanges(updated) };
    });
  }, [setData]);

  const handleSpecializationTopicsChange = useCallback((specialization: string, keywords: string[]) => {
    setData(prev => {
      if (!prev.specializationTopics) return prev;
      const newTopics = { ...prev.specializationTopics, [specialization]: keywords };
      const updated = { ...prev, specializationTopics: newTopics };
      return { ...updated, hasChanges: checkHasChanges(updated) };
    });
  }, [setData]);

  const handleAddSpecialization = useCallback((name: string) => {
    setData(prev => {
      if (!prev.specializationTopics || prev.specializationTopics[name]) return prev;
      const newTopics = { ...prev.specializationTopics, [name]: [] };
      const updated = { ...prev, specializationTopics: newTopics };
      return { ...updated, hasChanges: checkHasChanges(updated) };
    });
  }, [setData]);

  const handleRemoveSpecialization = useCallback((name: string) => {
    setData(prev => {
      if (!prev.specializationTopics) return prev;
      const { [name]: _, ...rest } = prev.specializationTopics;
      const updated = { ...prev, specializationTopics: rest };
      return { ...updated, hasChanges: checkHasChanges(updated) };
    });
  }, [setData]);

  return {
    handleWeightChange,
    handleMatrixChange,
    handleTopicScoreChange,
    handleSpecializationTopicsChange,
    handleAddSpecialization,
    handleRemoveSpecialization,
  };
}
