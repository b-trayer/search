import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCompare } from '@/hooks/use-compare';
import {
  CompareHeader,
  CompareStats,
  ResultColumn,
  CompareSearchBar,
  DemoScenarioButtons,
  UserComparisonCards,
  DEMO_SCENARIOS,
} from '@/components/compare';
import type { DemoScenario } from '@/components/compare';
import { getUsers } from '@/lib/api';
import type { User } from '@/lib/types';

export default function Compare() {
  const { toast } = useToast();
  const {
    query, setQuery, isLoading, left, right,
    setLeftUserId, setLeftUser, setRightUserId, setRightUser,
    compare, stats,
  } = useCompare();

  const [usersByName, setUsersByName] = useState<Map<string, User>>(new Map());

  useEffect(() => {
    let cancelled = false;
    getUsers(undefined, 200)
      .then((users) => {
        if (cancelled) return;
        const map = new Map<string, User>();
        for (const u of users) map.set(u.username, u);
        setUsersByName(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const bothUsersEmpty = left.userId === null && right.userId === null;

  const handleCompare = async () => {
    if (!query.trim()) {
      toast({ title: 'Введите поисковый запрос', variant: 'destructive' });
      return;
    }
    await compare();
    toast({ title: 'Сравнение готово', description: `Запрос: "${query}"` });
  };

  const runDemoScenario = async (scenario: DemoScenario) => {
    const leftUser = usersByName.get(scenario.leftUsername) ?? null;
    const rightUser = usersByName.get(scenario.rightUsername) ?? null;

    setQuery(scenario.query);
    setLeftUserId(leftUser?.user_id ?? null);
    setRightUserId(rightUser?.user_id ?? null);
    setLeftUser(leftUser);
    setRightUser(rightUser);

    if (!leftUser || !rightUser) {
      toast({
        title: 'Не удалось загрузить пользователей сценария',
        description: !leftUser
          ? `Не найден: ${scenario.leftUsername}`
          : `Не найден: ${scenario.rightUsername}`,
        variant: 'destructive',
      });
    }

    await compare(
      scenario.query,
      leftUser?.user_id ?? null,
      rightUser?.user_id ?? null,
    );

    const personas = [leftUser?.username, rightUser?.username]
      .filter(Boolean)
      .join(' vs ');
    toast({
      title: scenario.title,
      description: personas
        ? `${personas} · запрос: "${scenario.query}"`
        : `Запрос: "${scenario.query}"`,
    });
  };

  return (
    <div className="min-h-screen bg-notion-bg-secondary">
      <CompareHeader />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6 space-y-4 rounded-notion border border-notion-border bg-notion-bg p-4">
          <CompareSearchBar
            query={query}
            onQueryChange={setQuery}
            onCompare={handleCompare}
            isLoading={isLoading}
          />
          <DemoScenarioButtons
            scenarios={DEMO_SCENARIOS}
            onSelect={runDemoScenario}
            disabled={isLoading}
          />
        </div>

        <UserComparisonCards
          leftUserId={left.userId}
          rightUserId={right.userId}
          onLeftUserChange={setLeftUserId}
          onRightUserChange={setRightUserId}
          onLeftUserLoaded={setLeftUser}
          onRightUserLoaded={setRightUser}
        />

        {bothUsersEmpty && (
          <div className="mb-6 flex items-start gap-2 rounded-notion border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Не выбран ни один пользователь — обе колонки покажут одинаковый
              результат без персонализации. Выберите хотя бы одного, чтобы увидеть
              разницу.
            </span>
          </div>
        )}

        {stats && <CompareStats stats={stats} leftUser={left.user} rightUser={right.user} />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <ResultColumn
            user={left.user}
            results={left.results}
            otherResults={right.results}
            fallbackLabel="Колонка 1"
          />
          <ResultColumn
            user={right.user}
            results={right.results}
            otherResults={left.results}
            fallbackLabel="Колонка 2"
          />
        </div>
      </main>
    </div>
  );
}
