import { useSettingsData } from '@/hooks/use-settings-data';
import {
  SettingsHeader,
  WeightsSection,
  RoleTypeMatrixSection,
  TopicScoresSection,
  SpecializationTopicsSection,
} from '@/components/settings';

export default function Settings() {
  const {
    weights,
    currentPreset,
    roleTypeMatrix,
    topicScores,
    specializationTopics,
    isLoading,
    isSaving,
    hasChanges,
    handleWeightChange,
    handleMatrixChange,
    handleTopicScoreChange,
    handleSpecializationTopicsChange,
    handleAddSpecialization,
    handleRemoveSpecialization,
    handleSave,
    handleResetAll,
    handlePresetApply,
  } = useSettingsData();

  if (isLoading || !weights || !roleTypeMatrix || !topicScores || !specializationTopics) {
    return (
      <div className="min-h-screen bg-notion-bg flex items-center justify-center">
        <div className="text-notion-text-secondary">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-notion-bg">
      <SettingsHeader
        isSaving={isSaving}
        hasChanges={hasChanges}
        onSave={handleSave}
        onReset={handleResetAll}
      />

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-10">
        <WeightsSection
          weights={weights}
          currentPreset={currentPreset}
          isSaving={isSaving}
          onWeightChange={handleWeightChange}
          onPresetApply={handlePresetApply}
        />

        <RoleTypeMatrixSection
          matrix={roleTypeMatrix}
          isSaving={isSaving}
          onMatrixChange={handleMatrixChange}
        />

        <TopicScoresSection
          scores={topicScores}
          isSaving={isSaving}
          onScoreChange={handleTopicScoreChange}
        />

        <SpecializationTopicsSection
          topics={specializationTopics}
          isSaving={isSaving}
          onTopicsChange={handleSpecializationTopicsChange}
          onAddSpecialization={handleAddSpecialization}
          onRemoveSpecialization={handleRemoveSpecialization}
        />
      </main>
    </div>
  );
}
