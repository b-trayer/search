import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DemoScenario } from './constants';

interface DemoScenarioButtonsProps {
  scenarios: DemoScenario[];
  onSelect: (scenario: DemoScenario) => void;
  disabled?: boolean;
}

export function DemoScenarioButtons({ scenarios, onSelect, disabled }: DemoScenarioButtonsProps) {
  return (
    <div className="border-t border-notion-border pt-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-medium text-notion-text">Демо-сценарии</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario)}
            disabled={disabled}
            className="group flex flex-col items-start p-3 rounded-notion border border-notion-border bg-notion-bg hover:border-notion-accent hover:bg-notion-accent-light transition-colors text-left"
          >
            <span className="font-medium text-sm text-notion-text group-hover:text-notion-accent">
              {scenario.title}
            </span>
            <span className="text-xs text-notion-text-tertiary mt-0.5">
              {scenario.description}
            </span>
            <Badge variant="outline" className="mt-2 text-xs">
              «{scenario.query}»
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
