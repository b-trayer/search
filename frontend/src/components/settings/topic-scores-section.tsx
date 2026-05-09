import { AlertTriangle } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import type { TopicScores } from '@/lib/api';
import { TOPIC_SCORE_LABEL_KEYS } from './constants';
import { SectionResetButton } from './section-reset-button';
import { useTranslation } from '@/lib/i18n';

interface TopicScoresSectionProps {
  scores: TopicScores;
  isSaving: boolean;
  onScoreChange: (key: string, value: number) => void;
  onResetSection?: () => void;
  hasSectionChanges?: boolean;
  isScoreChanged?: (key: string) => boolean;
}

export function TopicScoresSection({
  scores,
  isSaving,
  onScoreChange,
  onResetSection,
  hasSectionChanges = false,
  isScoreChanged,
}: TopicScoresSectionProps) {
  const { t } = useTranslation();
  const direct = scores.direct_match ?? 0;
  const keyword = scores.keyword_match ?? 0;
  const monotonic = direct >= keyword;

  return (
    <section
      id="section-topics"
      className="scroll-mt-20 rounded-notion border border-notion-border bg-notion-bg p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-notion-text">
          {t('topicScores.title')}
        </h2>
        {onResetSection && (
          <SectionResetButton
            disabled={isSaving}
            hasChanges={hasSectionChanges}
            onConfirm={onResetSection}
            sectionName={t('settings.section.topics')}
          />
        )}
      </div>
      <p className="mt-1 text-sm text-notion-text-secondary">
        {t('topicScores.desc')}
      </p>

      <div className="mt-5 space-y-3">
        {Object.entries(TOPIC_SCORE_LABEL_KEYS).map(([key, labelKey]) => {
          const changed = isScoreChanged ? isScoreChanged(key) : false;
          return (
          <div
            key={key}
            className={`rounded-notion border bg-notion-bg-secondary p-4 ${
              changed
                ? 'border-l-2 border-l-notion-accent border-notion-border'
                : 'border-notion-border'
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-sm font-medium text-notion-text">{t(labelKey)}</label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[scores[key] ?? 0]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={([value]) => onScoreChange(key, value)}
                  disabled={isSaving}
                  className="w-full sm:w-40"
                />
                <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums text-notion-text">
                  {(scores[key] ?? 0).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {!monotonic && (
        <div className="mt-3 flex items-start gap-2 rounded-notion border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {t('topicScores.warn', { direct: direct.toFixed(1), keyword: keyword.toFixed(1) })}
          </span>
        </div>
      )}
    </section>
  );
}
