import { Sparkles, Tag, GraduationCap, Lightbulb } from 'lucide-react';
import {
  DEMO_CATEGORY_LABEL_KEY,
  DEMO_CATEGORY_HINT_KEY,
  type DemoScenario,
  type DemoCategory,
} from './constants';
import { useTranslation } from '@/lib/i18n';

interface DemoScenarioButtonsProps {
  scenarios: DemoScenario[];
  onSelect: (scenario: DemoScenario) => void;
  disabled?: boolean;
}

const CATEGORY_ICON: Record<DemoCategory, typeof Tag> = {
  topic: Tag,
  role: GraduationCap,
  interest: Lightbulb,
};

export function DemoScenarioButtons({
  scenarios,
  onSelect,
  disabled,
}: DemoScenarioButtonsProps) {
  const { t } = useTranslation();
  const grouped = scenarios.reduce<Record<DemoCategory, DemoScenario[]>>(
    (acc, scenario) => {
      (acc[scenario.category] ||= []).push(scenario);
      return acc;
    },
    { topic: [], role: [], interest: [] },
  );

  const orderedCategories: DemoCategory[] = ['topic', 'role', 'interest'];

  return (
    <div className="border-t border-notion-border pt-4">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-notion-text-tertiary" />
        <span className="text-sm font-medium text-notion-text">{t('compare.demoTitle')}</span>
      </div>

      <div className="space-y-5">
        {orderedCategories.map((category) => {
          const items = grouped[category];
          if (!items || items.length === 0) return null;
          const Icon = CATEGORY_ICON[category];

          return (
            <div key={category}>
              <div className="mb-1 flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-notion-text-tertiary" />
                <span className="text-xs font-medium uppercase tracking-wide text-notion-text-secondary">
                  {t(DEMO_CATEGORY_LABEL_KEY[category])}
                </span>
              </div>
              <p className="mb-2 text-xs leading-snug text-notion-text-tertiary">
                {t(DEMO_CATEGORY_HINT_KEY[category])}
              </p>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {items.map((scenario) => (
                  <ScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    onSelect={onSelect}
                    disabled={disabled}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ScenarioCardProps {
  scenario: DemoScenario;
  onSelect: (scenario: DemoScenario) => void;
  disabled?: boolean;
}

function ScenarioCard({ scenario, onSelect, disabled }: ScenarioCardProps) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={() => onSelect(scenario)}
      disabled={disabled}
      className="group flex flex-col gap-1.5 rounded-notion border border-notion-border bg-notion-bg p-3 text-left transition-colors hover:bg-notion-bg-hover disabled:opacity-50 disabled:pointer-events-none"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-notion-text">{t(scenario.titleKey)}</span>
        <span className="shrink-0 rounded-notion border border-notion-border bg-notion-bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-notion-text-secondary">
          {scenario.query}
        </span>
      </div>
      <span className="text-xs text-notion-text-tertiary">{t(scenario.descriptionKey)}</span>
      <span className="mt-1 text-xs leading-snug text-notion-text-secondary">
        {t(scenario.expectedDeltaKey)}
      </span>
    </button>
  );
}
