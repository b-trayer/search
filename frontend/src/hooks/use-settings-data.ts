import { useState, useEffect, useCallback } from 'react';
import {
  getWeights,
  setWeights,
  resetWeights,
  getPresets,
  applyPreset,
  getRoleTypeMatrix,
  setRoleTypeMatrix,
  getTopicScores,
  setTopicScores,
  getSpecializationTopics,
  setSpecializationTopics,
  resetPreferences,
  type RoleTypeMatrix,
  type TopicScores,
  type SpecializationTopics,
} from '@/lib/api';
import type { RankingWeights, WeightPreset } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface SettingsData {
  weights: RankingWeights | null;
  originalWeights: RankingWeights | null;
  currentPreset: WeightPreset | null;
  roleTypeMatrix: RoleTypeMatrix | null;
  originalRoleTypeMatrix: RoleTypeMatrix | null;
  topicScores: TopicScores | null;
  originalTopicScores: TopicScores | null;
  specializationTopics: SpecializationTopics | null;
  originalSpecializationTopics: SpecializationTopics | null;
  isLoading: boolean;
  isSaving: boolean;
  hasChanges: boolean;
}

export function useSettingsData() {
  const { toast } = useToast();
  const [data, setData] = useState<SettingsData>({
    weights: null,
    originalWeights: null,
    currentPreset: null,
    roleTypeMatrix: null,
    originalRoleTypeMatrix: null,
    topicScores: null,
    originalTopicScores: null,
    specializationTopics: null,
    originalSpecializationTopics: null,
    isLoading: true,
    isSaving: false,
    hasChanges: false,
  });

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
        roleTypeMatrix: JSON.parse(JSON.stringify(matrixData)),
        originalRoleTypeMatrix: JSON.parse(JSON.stringify(matrixData)),
        topicScores: { ...scoresData },
        originalTopicScores: { ...scoresData },
        specializationTopics: JSON.parse(JSON.stringify(topicsData)),
        originalSpecializationTopics: JSON.parse(JSON.stringify(topicsData)),
        isLoading: false,
        isSaving: false,
        hasChanges: false,
      });
    } catch {
      toast({ title: 'Ошибка загрузки', variant: 'destructive' });
      setData(prev => ({ ...prev, isLoading: false }));
    }
  }, [toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const updateHasChanges = useCallback((newData: Partial<SettingsData>) => {
    const merged = { ...data, ...newData };
    const weightsChanged = merged.weights && merged.originalWeights &&
      JSON.stringify(merged.weights) !== JSON.stringify(merged.originalWeights);
    const matrixChanged = merged.roleTypeMatrix && merged.originalRoleTypeMatrix &&
      JSON.stringify(merged.roleTypeMatrix) !== JSON.stringify(merged.originalRoleTypeMatrix);
    const scoresChanged = merged.topicScores && merged.originalTopicScores &&
      JSON.stringify(merged.topicScores) !== JSON.stringify(merged.originalTopicScores);
    const topicsChanged = merged.specializationTopics && merged.originalSpecializationTopics &&
      JSON.stringify(merged.specializationTopics) !== JSON.stringify(merged.originalSpecializationTopics);
    return !!(weightsChanged || matrixChanged || scoresChanged || topicsChanged);
  }, [data]);

  const handleWeightChange = useCallback((key: keyof RankingWeights, value: number) => {
    setData(prev => {
      if (!prev.weights) return prev;
      const newWeights = { ...prev.weights, [key]: value };
      const hasChanges = JSON.stringify(newWeights) !== JSON.stringify(prev.originalWeights) ||
        JSON.stringify(prev.roleTypeMatrix) !== JSON.stringify(prev.originalRoleTypeMatrix) ||
        JSON.stringify(prev.topicScores) !== JSON.stringify(prev.originalTopicScores) ||
        JSON.stringify(prev.specializationTopics) !== JSON.stringify(prev.originalSpecializationTopics);
      return { ...prev, weights: newWeights, currentPreset: null, hasChanges };
    });
  }, []);

  const handleMatrixChange = useCallback((role: string, docType: string, value: number) => {
    setData(prev => {
      if (!prev.roleTypeMatrix) return prev;
      const newMatrix = {
        ...prev.roleTypeMatrix,
        [role]: { ...prev.roleTypeMatrix[role], [docType]: value }
      };
      const hasChanges = JSON.stringify(prev.weights) !== JSON.stringify(prev.originalWeights) ||
        JSON.stringify(newMatrix) !== JSON.stringify(prev.originalRoleTypeMatrix) ||
        JSON.stringify(prev.topicScores) !== JSON.stringify(prev.originalTopicScores) ||
        JSON.stringify(prev.specializationTopics) !== JSON.stringify(prev.originalSpecializationTopics);
      return { ...prev, roleTypeMatrix: newMatrix, hasChanges };
    });
  }, []);

  const handleTopicScoreChange = useCallback((key: string, value: number) => {
    setData(prev => {
      if (!prev.topicScores) return prev;
      const newScores = { ...prev.topicScores, [key]: value };
      const hasChanges = JSON.stringify(prev.weights) !== JSON.stringify(prev.originalWeights) ||
        JSON.stringify(prev.roleTypeMatrix) !== JSON.stringify(prev.originalRoleTypeMatrix) ||
        JSON.stringify(newScores) !== JSON.stringify(prev.originalTopicScores) ||
        JSON.stringify(prev.specializationTopics) !== JSON.stringify(prev.originalSpecializationTopics);
      return { ...prev, topicScores: newScores, hasChanges };
    });
  }, []);

  const handleSpecializationTopicsChange = useCallback((specialization: string, keywords: string[]) => {
    setData(prev => {
      if (!prev.specializationTopics) return prev;
      const newTopics = { ...prev.specializationTopics, [specialization]: keywords };
      const hasChanges = JSON.stringify(prev.weights) !== JSON.stringify(prev.originalWeights) ||
        JSON.stringify(prev.roleTypeMatrix) !== JSON.stringify(prev.originalRoleTypeMatrix) ||
        JSON.stringify(prev.topicScores) !== JSON.stringify(prev.originalTopicScores) ||
        JSON.stringify(newTopics) !== JSON.stringify(prev.originalSpecializationTopics);
      return { ...prev, specializationTopics: newTopics, hasChanges };
    });
  }, []);

  const handleAddSpecialization = useCallback((name: string) => {
    setData(prev => {
      if (!prev.specializationTopics) return prev;
      if (prev.specializationTopics[name]) return prev;
      const newTopics = { ...prev.specializationTopics, [name]: [] };
      const hasChanges = JSON.stringify(prev.weights) !== JSON.stringify(prev.originalWeights) ||
        JSON.stringify(prev.roleTypeMatrix) !== JSON.stringify(prev.originalRoleTypeMatrix) ||
        JSON.stringify(prev.topicScores) !== JSON.stringify(prev.originalTopicScores) ||
        JSON.stringify(newTopics) !== JSON.stringify(prev.originalSpecializationTopics);
      return { ...prev, specializationTopics: newTopics, hasChanges };
    });
  }, []);

  const handleRemoveSpecialization = useCallback((name: string) => {
    setData(prev => {
      if (!prev.specializationTopics) return prev;
      const { [name]: _, ...rest } = prev.specializationTopics;
      const hasChanges = JSON.stringify(prev.weights) !== JSON.stringify(prev.originalWeights) ||
        JSON.stringify(prev.roleTypeMatrix) !== JSON.stringify(prev.originalRoleTypeMatrix) ||
        JSON.stringify(prev.topicScores) !== JSON.stringify(prev.originalTopicScores) ||
        JSON.stringify(rest) !== JSON.stringify(prev.originalSpecializationTopics);
      return { ...prev, specializationTopics: rest, hasChanges };
    });
  }, []);

  const handleSave = useCallback(async () => {
    setData(prev => ({ ...prev, isSaving: true }));
    try {
      const {
        weights, originalWeights,
        roleTypeMatrix, originalRoleTypeMatrix,
        topicScores, originalTopicScores,
        specializationTopics, originalSpecializationTopics
      } = data;

      if (weights && JSON.stringify(weights) !== JSON.stringify(originalWeights)) {
        const saved = await setWeights(weights);
        setData(prev => ({ ...prev, weights: { ...saved }, originalWeights: { ...saved } }));
      }
      if (roleTypeMatrix && JSON.stringify(roleTypeMatrix) !== JSON.stringify(originalRoleTypeMatrix)) {
        const saved = await setRoleTypeMatrix(roleTypeMatrix);
        setData(prev => ({
          ...prev,
          roleTypeMatrix: JSON.parse(JSON.stringify(saved)),
          originalRoleTypeMatrix: JSON.parse(JSON.stringify(saved))
        }));
      }
      if (topicScores && JSON.stringify(topicScores) !== JSON.stringify(originalTopicScores)) {
        const saved = await setTopicScores(topicScores);
        setData(prev => ({ ...prev, topicScores: { ...saved }, originalTopicScores: { ...saved } }));
      }
      if (specializationTopics && JSON.stringify(specializationTopics) !== JSON.stringify(originalSpecializationTopics)) {
        const saved = await setSpecializationTopics(specializationTopics);
        setData(prev => ({
          ...prev,
          specializationTopics: JSON.parse(JSON.stringify(saved)),
          originalSpecializationTopics: JSON.parse(JSON.stringify(saved))
        }));
      }
      setData(prev => ({ ...prev, isSaving: false, hasChanges: false }));
      toast({ title: 'Сохранено', description: 'Настройки успешно применены' });
    } catch {
      toast({ title: 'Ошибка сохранения', variant: 'destructive' });
      setData(prev => ({ ...prev, isSaving: false }));
    }
  }, [data, toast]);

  const handleResetAll = useCallback(async () => {
    setData(prev => ({ ...prev, isSaving: true }));
    try {
      const [newWeights, prefData] = await Promise.all([
        resetWeights(),
        resetPreferences(),
      ]);
      setData({
        weights: { ...newWeights },
        originalWeights: { ...newWeights },
        currentPreset: 'default',
        roleTypeMatrix: JSON.parse(JSON.stringify(prefData.role_type_matrix)),
        originalRoleTypeMatrix: JSON.parse(JSON.stringify(prefData.role_type_matrix)),
        topicScores: { ...prefData.topic_scores },
        originalTopicScores: { ...prefData.topic_scores },
        specializationTopics: JSON.parse(JSON.stringify(prefData.specialization_topics)),
        originalSpecializationTopics: JSON.parse(JSON.stringify(prefData.specialization_topics)),
        isLoading: false,
        isSaving: false,
        hasChanges: false,
      });
      toast({ title: 'Сброшено', description: 'Все настройки сброшены' });
    } catch {
      toast({ title: 'Ошибка', variant: 'destructive' });
      setData(prev => ({ ...prev, isSaving: false }));
    }
  }, [toast]);

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
        hasChanges: updateHasChanges({ weights: newWeights, originalWeights: newWeights }),
      }));
      toast({ title: 'Пресет применён', description: `Пресет "${preset}" активирован` });
    } catch {
      toast({ title: 'Ошибка', variant: 'destructive' });
      setData(prev => ({ ...prev, isSaving: false }));
    }
  }, [toast, updateHasChanges]);

  return {
    ...data,
    handleWeightChange,
    handleMatrixChange,
    handleTopicScoreChange,
    handleSpecializationTopicsChange,
    handleAddSpecialization,
    handleRemoveSpecialization,
    handleSave,
    handleResetAll,
    handlePresetApply,
  };
}
