import { Info, Wand2, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { HEADER_CHIP, HEADER_CHIP_PRIMARY } from '@/components/layout/header-chip';
import type { RankingWeights, WeightPreset } from '@/lib/types';
import { WEIGHT_CONFIG, PRESET_LABELS, WEIGHT_TOOLTIPS } from './constants';
import { SectionResetButton } from './section-reset-button';
import { normalizeAlphas } from '@/hooks/settings/changes';
import type { CustomPresetInfo } from '@/hooks/settings/types';
import { CustomPresetInput } from './custom-preset-input';

interface WeightsSectionProps {
  weights: RankingWeights;
  currentPreset: WeightPreset | string | null;
  presetMap?: Record<string, RankingWeights>;
  customPresets?: CustomPresetInfo[];
  isSaving: boolean;
  onWeightChange: (key: keyof RankingWeights, value: number) => void;
  onPresetApply: (preset: WeightPreset | string) => void;
  onSaveCustomPreset?: (name: string) => Promise<void> | void;
  onDeleteCustomPreset?: (name: string) => Promise<void> | void;
  onResetSection?: () => void;
  hasSectionChanges?: boolean;
  isWeightChanged?: (key: keyof RankingWeights) => boolean;
}

export function WeightsSection({
  weights,
  currentPreset,
  presetMap,
  customPresets = [],
  isSaving,
  onWeightChange,
  onPresetApply,
  onSaveCustomPreset,
  onDeleteCustomPreset,
  onResetSection,
  hasSectionChanges = false,
  isWeightChanged,
}: WeightsSectionProps) {
  const alphaSum = weights.alpha_type + weights.alpha_topic;
  const alphaSumOk = Math.abs(alphaSum - 1) < 0.011;

  const handleNormalizeAlphas = () => {
    const { alpha_type, alpha_topic } = normalizeAlphas(weights.alpha_type, weights.alpha_topic);
    onWeightChange('alpha_type', alpha_type);
    onWeightChange('alpha_topic', alpha_topic);
  };

  const presetTooltip = (preset: WeightPreset | string): string | undefined => {
    if (!presetMap || !presetMap[preset]) return undefined;
    const target = presetMap[preset];
    const lines: string[] = [];
    for (const k of Object.keys(target) as (keyof RankingWeights)[]) {
      const cur = weights[k];
      const tgt = target[k];
      if (Math.abs(cur - tgt) > 0.001) {
        const delta = tgt - cur;
        const sign = delta > 0 ? '+' : '−';
        lines.push(`${k}: ${cur.toFixed(2)} → ${tgt.toFixed(2)} (${sign}${Math.abs(delta).toFixed(2)})`);
      }
    }
    return lines.length === 0 ? 'Совпадает с текущими' : `Изменится:\n${lines.join('\n')}`;
  };

  return (
    <section
      id="section-weights"
      className="scroll-mt-20 rounded-notion border border-notion-border bg-notion-bg p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-notion-text">
          Веса формулы ранжирования
        </h2>
        {onResetSection && (
          <SectionResetButton
            disabled={isSaving}
            hasChanges={hasSectionChanges}
            onConfirm={onResetSection}
            sectionName="Веса"
          />
        )}
      </div>
      <p className="mt-1 text-sm text-notion-text-secondary">
        score = log(1+BM25) + w<sub>user</sub> × f(U,D) + β × log(1+CTR)
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {(Object.keys(PRESET_LABELS) as WeightPreset[]).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onPresetApply(preset)}
            disabled={isSaving}
            title={presetTooltip(preset)}
            className={currentPreset === preset ? HEADER_CHIP_PRIMARY : HEADER_CHIP}
          >
            {PRESET_LABELS[preset]}
          </button>
        ))}
        {customPresets.length > 0 && (
          <span className="mx-1 h-4 w-px bg-notion-border" aria-hidden />
        )}
        {customPresets.map(({ name }) => {
          const active = currentPreset === name;
          return (
            <span
              key={name}
              className={`inline-flex items-center gap-1 ${
                active ? HEADER_CHIP_PRIMARY : HEADER_CHIP
              }`}
            >
              <button
                type="button"
                onClick={() => onPresetApply(name)}
                disabled={isSaving}
                title={presetTooltip(name)}
                className="bg-transparent"
              >
                {name}
              </button>
              {onDeleteCustomPreset && (
                <button
                  type="button"
                  onClick={() => onDeleteCustomPreset(name)}
                  disabled={isSaving}
                  className={`rounded-notion p-0.5 transition-opacity hover:opacity-100 ${
                    active ? 'opacity-70' : 'opacity-50'
                  }`}
                  aria-label={`Удалить пресет «${name}»`}
                  title="Удалить пресет"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          );
        })}
        {onSaveCustomPreset && (
          <CustomPresetInput
            disabled={isSaving}
            existingNames={[
              ...(Object.keys(PRESET_LABELS) as string[]),
              ...customPresets.map((p) => p.name),
            ]}
            onSave={onSaveCustomPreset}
          />
        )}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {WEIGHT_CONFIG.map((config) => {
          const changed = isWeightChanged ? isWeightChanged(config.key) : false;
          return (
          <div
            key={config.key}
            className={`rounded-notion border bg-notion-bg-secondary p-4 transition-colors ${
              changed
                ? 'border-l-2 border-l-notion-accent border-notion-border'
                : 'border-notion-border'
            }`}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <label className="flex items-center gap-1 text-sm font-medium text-notion-text">
                  {config.label}
                  {WEIGHT_TOOLTIPS[config.key] && (
                    <span
                      className="cursor-help text-notion-text-tertiary"
                      title={WEIGHT_TOOLTIPS[config.key]}
                      aria-label={WEIGHT_TOOLTIPS[config.key]}
                    >
                      <Info className="h-3.5 w-3.5" />
                    </span>
                  )}
                </label>
                <p className="mt-0.5 text-xs text-notion-text-tertiary">
                  {config.description}
                </p>
              </div>
              <span className="shrink-0 tabular-nums text-sm font-medium text-notion-text">
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
          );
        })}
      </div>

      <div
        data-testid="alpha-sum-indicator"
        className={`mt-4 flex items-center justify-between gap-3 rounded-notion border p-3 text-xs ${
          alphaSumOk
            ? 'border-notion-border bg-notion-bg-secondary text-notion-text-secondary'
            : 'border-amber-200 bg-amber-50 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 opacity-70" />
          <span>
            α₁ + α₂ ={' '}
            <span data-testid="alpha-sum-value" className="tabular-nums font-medium">
              {alphaSum.toFixed(2)}
            </span>
            {alphaSumOk
              ? ' – корректно (линейная комбинация f_type и f_topic).'
              : ' – рекомендуется = 1.00, чтобы веса f_type и f_topic складывались в 100%.'}
          </span>
        </div>
        {!alphaSumOk && (
          <button
            type="button"
            onClick={handleNormalizeAlphas}
            disabled={isSaving}
            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-notion border border-amber-300 bg-amber-100/60 px-2 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-100 disabled:opacity-50"
            title="Привести α₁ + α₂ к 1.00 пропорционально"
          >
            <Wand2 className="h-3 w-3" />
            Нормализовать
          </button>
        )}
      </div>
    </section>
  );
}
