import { useCallback, useState } from 'react';
import {
  setWeights, setRoleTypeMatrix, setTopicScores,
  setSpecializationTopics, resetWeights, resetPreferences, applyPreset,
  saveCustomPreset, deleteCustomPreset,
} from '@/lib/api';
import type { RankingWeights, WeightPreset } from '@/lib/types';
import type { RoleTypeMatrix, TopicScores, SpecializationTopics } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { type SettingsData, deepClone } from './types';
import {
  buildExport,
  downloadJson,
  parseImport,
  type SettingsExport,
} from './io';
import { pushHistory } from './history';

export type ResetSection = 'weights' | 'matrix' | 'topics' | 'specializations';

export interface ImportApplyOptions {
  weights: boolean;
  matrix: boolean;
  topics: boolean;
  specializations: boolean;
}

const DEFAULT_APPLY: ImportApplyOptions = {
  weights: true,
  matrix: true,
  topics: true,
  specializations: true,
};

export function useSettingsActions(
  data: SettingsData,
  setData: React.Dispatch<React.SetStateAction<SettingsData>>
) {
  const { toast } = useToast();
  const [pendingImport, setPendingImport] = useState<SettingsExport | null>(null);

  const handleSave = useCallback(async () => {
    setData(prev => ({ ...prev, isSaving: true }));
    try {
      const { weights, originalWeights, roleTypeMatrix, originalRoleTypeMatrix,
        topicScores, originalTopicScores, specializationTopics, originalSpecializationTopics } = data;

      let savedWeights: RankingWeights | null = null;
      let savedMatrix: RoleTypeMatrix | null = null;
      let savedScores: TopicScores | null = null;
      let savedSpecs: SpecializationTopics | null = null;

      if (weights && JSON.stringify(weights) !== JSON.stringify(originalWeights)) {
        savedWeights = await setWeights(weights);
        setData(prev => ({ ...prev, weights: { ...savedWeights! }, originalWeights: { ...savedWeights! } }));
      }
      if (roleTypeMatrix && JSON.stringify(roleTypeMatrix) !== JSON.stringify(originalRoleTypeMatrix)) {
        savedMatrix = await setRoleTypeMatrix(roleTypeMatrix);
        setData(prev => ({ ...prev, roleTypeMatrix: deepClone(savedMatrix!), originalRoleTypeMatrix: deepClone(savedMatrix!) }));
      }
      if (topicScores && JSON.stringify(topicScores) !== JSON.stringify(originalTopicScores)) {
        savedScores = await setTopicScores(topicScores);
        setData(prev => ({ ...prev, topicScores: { ...savedScores! }, originalTopicScores: { ...savedScores! } }));
      }
      if (specializationTopics && JSON.stringify(specializationTopics) !== JSON.stringify(originalSpecializationTopics)) {
        savedSpecs = await setSpecializationTopics(specializationTopics);
        setData(prev => ({ ...prev, specializationTopics: deepClone(savedSpecs!), originalSpecializationTopics: deepClone(savedSpecs!) }));
      }
      setData(prev => ({ ...prev, isSaving: false, hasChanges: false }));

      const finalWeights = savedWeights ?? weights;
      const finalMatrix = savedMatrix ?? roleTypeMatrix;
      const finalScores = savedScores ?? topicScores;
      const finalSpecs = savedSpecs ?? specializationTopics;
      if (finalWeights && finalMatrix && finalScores && finalSpecs) {
        pushHistory({
          weights: finalWeights,
          role_type_matrix: finalMatrix,
          topic_scores: finalScores,
          specialization_topics: finalSpecs,
        });
      }

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

  const handleResetSection = useCallback(
    (section: ResetSection) => {
      setData((prev) => {
        switch (section) {
          case 'weights':
            return prev.originalWeights
              ? { ...prev, weights: { ...prev.originalWeights } }
              : prev;
          case 'matrix':
            return prev.originalRoleTypeMatrix
              ? { ...prev, roleTypeMatrix: deepClone(prev.originalRoleTypeMatrix) }
              : prev;
          case 'topics':
            return prev.originalTopicScores
              ? { ...prev, topicScores: { ...prev.originalTopicScores } }
              : prev;
          case 'specializations':
            return prev.originalSpecializationTopics
              ? {
                  ...prev,
                  specializationTopics: deepClone(prev.originalSpecializationTopics),
                }
              : prev;
          default:
            return prev;
        }
      });
      toast({ title: 'Раздел сброшен', description: 'Изменения отменены' });
    },
    [setData, toast],
  );

  const handlePresetApply = useCallback(async (preset: WeightPreset | string) => {
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
      toast({ title: 'Пресет применен', description: `Пресет "${preset}" активирован` });
    } catch {
      toast({ title: 'Ошибка', variant: 'destructive' });
      setData(prev => ({ ...prev, isSaving: false }));
    }
  }, [setData, toast]);

  const handleSaveCustomPreset = useCallback(
    async (name: string) => {
      if (!data.weights) return;
      try {
        const saved = await saveCustomPreset({ name, weights: data.weights });
        setData((prev) => {
          const others = prev.customPresets.filter((p) => p.name !== name);
          return {
            ...prev,
            customPresets: [...others, { name, weights: saved }],
            presetMap: { ...prev.presetMap, [name]: saved },
            currentPreset: name,
          };
        });
        toast({ title: 'Пресет сохранен', description: `«${name}»` });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Не удалось сохранить пресет';
        toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
      }
    },
    [data.weights, setData, toast],
  );

  const handleDeleteCustomPreset = useCallback(
    async (name: string) => {
      try {
        await deleteCustomPreset(name);
        setData((prev) => {
          const { [name]: _removed, ...rest } = prev.presetMap;
          return {
            ...prev,
            customPresets: prev.customPresets.filter((p) => p.name !== name),
            presetMap: rest,
            currentPreset: prev.currentPreset === name ? null : prev.currentPreset,
          };
        });
        toast({ title: 'Пресет удален', description: `«${name}»` });
      } catch {
        toast({ title: 'Ошибка', variant: 'destructive' });
      }
    },
    [setData, toast],
  );

  const handleExport = useCallback(() => {
    const payload = buildExport(data);
    if (!payload) {
      toast({ title: 'Нет данных для экспорта', variant: 'destructive' });
      return;
    }
    const ts = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    downloadJson(`ranking-settings-${ts}.json`, payload);
    toast({ title: 'Экспортировано', description: 'Файл с настройками сохранен' });
  }, [data, toast]);

  const handleImport = useCallback(
    async (file: File) => {
      const text = await file.text();
      const parsed = parseImport(text);
      if (!parsed.ok || !parsed.payload) {
        toast({ title: 'Не удалось импортировать', description: parsed.error, variant: 'destructive' });
        return;
      }
      setPendingImport(parsed.payload);
    },
    [toast],
  );

  const cancelImport = useCallback(() => {
    setPendingImport(null);
  }, []);

  const applyImport = useCallback(
    (options: ImportApplyOptions = DEFAULT_APPLY) => {
      if (!pendingImport) return;
      setData((prev) => ({
        ...prev,
        weights: options.weights ? { ...pendingImport.weights } : prev.weights,
        roleTypeMatrix: options.matrix
          ? deepClone(pendingImport.role_type_matrix)
          : prev.roleTypeMatrix,
        topicScores: options.topics
          ? { ...pendingImport.topic_scores }
          : prev.topicScores,
        specializationTopics: options.specializations
          ? deepClone(pendingImport.specialization_topics)
          : prev.specializationTopics,
        currentPreset: options.weights ? null : prev.currentPreset,
      }));
      setPendingImport(null);
      toast({
        title: 'Импортировано',
        description: 'Не забудьте нажать «Сохранить» для применения настроек',
      });
    },
    [pendingImport, setData, toast],
  );

  const restoreFromSnapshot = useCallback(
    (snapshot: SettingsExport) => {
      setData((prev) => ({
        ...prev,
        weights: { ...snapshot.weights },
        roleTypeMatrix: deepClone(snapshot.role_type_matrix),
        topicScores: { ...snapshot.topic_scores },
        specializationTopics: deepClone(snapshot.specialization_topics),
        currentPreset: null,
      }));
      toast({
        title: 'Восстановлено',
        description: 'Не забудьте нажать «Сохранить»',
      });
    },
    [setData, toast],
  );

  return {
    handleSave,
    handleResetAll,
    handleResetSection,
    handlePresetApply,
    handleExport,
    handleImport,
    pendingImport,
    cancelImport,
    applyImport,
    restoreFromSnapshot,
    handleSaveCustomPreset,
    handleDeleteCustomPreset,
  };
}
