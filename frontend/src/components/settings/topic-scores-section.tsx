import { Slider } from '@/components/ui/slider';
import type { TopicScores } from '@/lib/api';
import { TOPIC_SCORE_LABELS } from './constants';

interface TopicScoresSectionProps {
  scores: TopicScores;
  isSaving: boolean;
  onScoreChange: (key: string, value: number) => void;
}

export function TopicScoresSection({
  scores,
  isSaving,
  onScoreChange,
}: TopicScoresSectionProps) {
  return (
    <section>
      <h2 className="text-xl font-bold text-notion-text mb-2">Скоры f_topic (совпадение темы)</h2>
      <p className="text-notion-text-secondary text-sm mb-4">
        Значения f_topic в зависимости от типа совпадения
      </p>

      <div className="space-y-3">
        {Object.entries(TOPIC_SCORE_LABELS).map(([key, label]) => (
          <div key={key} className="p-4 bg-notion-bg-secondary rounded-notion">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <label className="font-medium text-notion-text text-sm sm:text-base">{label}</label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[scores[key] ?? 0]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={([value]) => onScoreChange(key, value)}
                  disabled={isSaving}
                  className="w-full sm:w-32"
                />
                <span className="font-mono text-notion-accent w-10 text-right shrink-0">
                  {(scores[key] ?? 0).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
