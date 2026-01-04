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
  resetPreferences,
  type RoleTypeMatrix,
  type TopicScores,
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
    isLoading: true,
    isSaving: false,
    hasChanges: false,
  });

  const loadAll = useCallback(async () => {
    try {
      const [weightsData, presetsData, matrixData, scoresData] = await Promise.all([
        getWeights(),
        getPresets(),
        getRoleTypeMatrix(),
        getTopicScores(),
      ]);
      setData({
        weights: { ...weightsData },
        originalWeights: { ...weightsData },
        currentPreset: presetsData.current,
        roleTypeMatrix: JSON.parse(JSON.stringify(matrixData)),
        originalRoleTypeMatrix: JSON.parse(JSON.stringify(matrixData)),
        topicScores: { ...scoresData },
        originalTopicScores: { ...scoresData },
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
    return !!(weightsChanged || matrixChanged || scoresChanged);
  }, [data]);

  const handleWeightChange = useCallback((key: keyof RankingWeights, value: number) => {
    setData(prev => {
      if (!prev.weights) return prev;
      const newWeights = { ...prev.weights, [key]: value };
      const hasChanges = JSON.stringify(newWeights) !== JSON.stringify(prev.originalWeights) ||
        JSON.stringify(prev.roleTypeMatrix) !== JSON.stringify(prev.originalRoleTypeMatrix) ||
        JSON.stringify(prev.topicScores) !== JSON.stringify(prev.originalTopicScores);
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
        JSON.stringify(prev.topicScores) !== JSON.stringify(prev.originalTopicScores);
      return { ...prev, roleTypeMatrix: newMatrix, hasChanges };
    });
  }, []);

  const handleTopicScoreChange = useCallback((key: string, value: number) => {
    setData(prev => {
      if (!prev.topicScores) return prev;
      const newScores = { ...prev.topicScores, [key]: value };
      const hasChanges = JSON.stringify(prev.weights) !== JSON.stringify(prev.originalWeights) ||
        JSON.stringify(prev.roleTypeMatrix) !== JSON.stringify(prev.originalRoleTypeMatrix) ||
        JSON.stringify(newScores) !== JSON.stringify(prev.originalTopicScores);
      return { ...prev, topicScores: newScores, hasChanges };
    });
  }, []);

  const handleSave = useCallback(async () => {
    setData(prev => ({ ...prev, isSaving: true }));
    try {
      const { weights, originalWeights, roleTypeMatrix, originalRoleTypeMatrix, topicScores, originalTopicScores } = data;

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
    handleSave,
    handleResetAll,
    handlePresetApply,
  };
}
