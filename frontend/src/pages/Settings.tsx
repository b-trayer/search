import { useEffect, useMemo, useState } from 'react';
import { useSettingsData } from '@/hooks/use-settings-data';
import {
  SettingsHeader,
  WeightsSection,
  RoleTypeMatrixSection,
  TopicScoresSection,
  SpecializationTopicsSection,
  FormulaPreview,
  SectionNav,
  TestPreview,
  DiffDialog,
  ImportPreviewDialog,
  HistorySection,
  PreviewFab,
} from '@/components/settings';
import type { SectionNavItem } from '@/components/settings';
import {
  buildDiffEntries,
  isMatrixCellChanged,
  isMatrixRowChanged,
  isSpecializationChanged,
  isTopicScoreChanged,
  isWeightChanged,
} from '@/hooks/settings/changes';
import { useTranslation } from '@/lib/i18n';

export default function Settings() {
  const { t } = useTranslation();
  const NAV_ITEMS: SectionNavItem[] = [
    { id: 'section-formula', label: t('settings.section.formula') },
    { id: 'section-weights', label: t('settings.section.weights') },
    { id: 'section-matrix', label: t('settings.section.matrix') },
    { id: 'section-topics', label: t('settings.section.topics') },
    { id: 'section-specializations', label: t('settings.section.specializations') },
    { id: 'section-preview', label: t('settings.section.preview') },
    { id: 'section-history', label: t('settings.section.history') },
  ];
  const data = useSettingsData();
  const {
    weights,
    originalWeights,
    currentPreset,
    presetMap,
    customPresets,
    roleTypeMatrix,
    topicScores,
    specializationTopics,
    isLoading,
    isSaving,
    hasChanges,
    pendingChanges,
    handleWeightChange,
    handleMatrixChange,
    handleTopicScoreChange,
    handleSpecializationTopicsChange,
    handleAddSpecialization,
    handleRemoveSpecialization,
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
  } = data;

  const [diffOpen, setDiffOpen] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

  const diffEntries = useMemo(() => buildDiffEntries(data), [data]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isSave = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's';
      if (!isSave) return;
      e.preventDefault();
      if (!isSaving && hasChanges) {
        handleSave().then(() => setHistoryKey((k) => k + 1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave, isSaving, hasChanges]);

  const onSaveAndBumpHistory = async () => {
    await handleSave();
    setHistoryKey((k) => k + 1);
  };

  if (isLoading || !weights || !roleTypeMatrix || !topicScores || !specializationTopics) {
    return (
      <div className="min-h-screen bg-notion-bg-secondary flex items-center justify-center">
        <div className="text-notion-text-secondary">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-notion-bg-secondary">
      <SettingsHeader
        isSaving={isSaving}
        hasChanges={hasChanges}
        pendingChanges={pendingChanges}
        onSave={onSaveAndBumpHistory}
        onReset={handleResetAll}
        onExport={handleExport}
        onImport={handleImport}
        onShowDiff={() => setDiffOpen(true)}
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[200px,1fr]">
          <SectionNav items={NAV_ITEMS} />

          <div className="min-w-0 space-y-6">
            <div id="section-formula" className="scroll-mt-20">
              <FormulaPreview weights={weights} />
            </div>

            <WeightsSection
              weights={weights}
              currentPreset={currentPreset}
              presetMap={presetMap}
              customPresets={customPresets}
              isSaving={isSaving}
              onWeightChange={handleWeightChange}
              onPresetApply={handlePresetApply}
              onSaveCustomPreset={handleSaveCustomPreset}
              onDeleteCustomPreset={handleDeleteCustomPreset}
              onResetSection={() => handleResetSection('weights')}
              hasSectionChanges={
                JSON.stringify(weights) !== JSON.stringify(originalWeights)
              }
              isWeightChanged={(key) => isWeightChanged(data, key)}
            />

            <RoleTypeMatrixSection
              matrix={roleTypeMatrix}
              isSaving={isSaving}
              onMatrixChange={handleMatrixChange}
              onResetSection={() => handleResetSection('matrix')}
              hasSectionChanges={Object.keys(roleTypeMatrix).some((role) =>
                isMatrixRowChanged(data, role),
              )}
              isCellChanged={(role, dt) => isMatrixCellChanged(data, role, dt)}
            />

            <TopicScoresSection
              scores={topicScores}
              isSaving={isSaving}
              onScoreChange={handleTopicScoreChange}
              onResetSection={() => handleResetSection('topics')}
              hasSectionChanges={Object.keys(topicScores).some((k) =>
                isTopicScoreChanged(data, k),
              )}
              isScoreChanged={(k) => isTopicScoreChanged(data, k)}
            />

            <SpecializationTopicsSection
              topics={specializationTopics}
              isSaving={isSaving}
              onTopicsChange={handleSpecializationTopicsChange}
              onAddSpecialization={handleAddSpecialization}
              onRemoveSpecialization={handleRemoveSpecialization}
              onResetSection={() => handleResetSection('specializations')}
              hasSectionChanges={Object.keys(specializationTopics).some((k) =>
                isSpecializationChanged(data, k),
              )}
              isSpecChanged={(k) => isSpecializationChanged(data, k)}
            />

            <TestPreview
              currentWeights={weights}
              baselineWeights={originalWeights}
            />

            <HistorySection refreshKey={historyKey} onRestore={restoreFromSnapshot} />
          </div>
        </div>
      </main>

      <DiffDialog
        open={diffOpen}
        onOpenChange={setDiffOpen}
        entries={diffEntries}
        onSave={onSaveAndBumpHistory}
        isSaving={isSaving}
      />

      <ImportPreviewDialog
        open={pendingImport !== null}
        payload={pendingImport}
        onCancel={cancelImport}
        onApply={applyImport}
      />

      <PreviewFab />
    </div>
  );
}
