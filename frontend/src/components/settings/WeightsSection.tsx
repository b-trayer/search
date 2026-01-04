import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import type { RankingWeights, WeightPreset } from '@/lib/types';
import { WEIGHT_CONFIG, PRESET_LABELS } from './constants';

interface WeightsSectionProps {
  weights: RankingWeights;
  currentPreset: WeightPreset | null;
  isSaving: boolean;
  onWeightChange: (key: keyof RankingWeights, value: number) => void;
  onPresetApply: (preset: WeightPreset) => void;
}

export function WeightsSection({
  weights,
  currentPreset,
  isSaving,
  onWeightChange,
  onPresetApply,
}: WeightsSectionProps) {
  return (
    <section>
      <h1 className="text-2xl font-bold text-notion-text mb-2">Веса формулы ранжирования</h1>
      <p className="text-notion-text-secondary text-sm mb-4">
        score = log(1+BM25) + w<sub>user</sub> × f(U,D) + β × log(1+CTR)
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(PRESET_LABELS) as WeightPreset[]).map((preset) => (
          <Button
            key={preset}
            variant={currentPreset === preset ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPresetApply(preset)}
            disabled={isSaving}
          >
            {PRESET_LABELS[preset]}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {WEIGHT_CONFIG.map((config) => (
          <div key={config.key} className="p-4 bg-notion-bg-secondary rounded-notion">
            <div className="flex justify-between items-center mb-2">
              <div>
                <label className="font-medium text-notion-text text-sm">{config.label}</label>
                <p className="text-xs text-notion-text-tertiary">{config.description}</p>
              </div>
              <span className="font-mono text-notion-accent">
                {weights[config.key].toFixed(config.step < 1 ? 2 : 0)}
              </span>
            </div>
            <Slider
              value={[weights[config.key]]}
              min={config.min}
              max={config.max}
              step={config.step}
              onValueChange={([value]) => onWeightChange(config.key, value)}
              disabled={isSaving}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
