
import { Calculator } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { CompareStats as Stats } from '@/hooks/use-compare';
import type { User } from '@/lib/types';

interface CompareStatsProps {
  stats: Stats;
  leftUser: User | null;
  rightUser: User | null;
}

export default function CompareStats({ stats, leftUser, rightUser }: CompareStatsProps) {
  return (
    <Card className="mb-6 bg-notion-accent-light border-notion-accent/20">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="h-4 w-4 text-notion-accent" />
          <span className="font-medium text-notion-text">Анализ различий</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
          <div>
            <p className="text-notion-accent">Общих документов в топ-10:</p>
            <p className="font-bold text-notion-text">
              {stats.common} из {stats.total} ({((stats.common / stats.total) * 100).toFixed(0)}%)
            </p>
          </div>
          <div>
            <p className="text-notion-accent">
              Персонализация ({leftUser?.specialization || 'без профиля'}):
            </p>
            <p className="font-bold text-notion-text">+{stats.avgPersonalization1}</p>
          </div>
          <div>
            <p className="text-notion-accent">
              Персонализация ({rightUser?.specialization || 'без профиля'}):
            </p>
            <p className="font-bold text-notion-text">+{stats.avgPersonalization2}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
