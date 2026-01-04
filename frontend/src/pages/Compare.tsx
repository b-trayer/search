import { Card, CardContent } from '@/components/ui/card';
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
import { getUser } from '@/lib/api';

export default function Compare() {
  const { toast } = useToast();
  const {
    query, setQuery, isLoading, left, right,
    setLeftUserId, setLeftUser, setRightUserId, setRightUser,
    compare, stats,
  } = useCompare();

  const handleCompare = async () => {
    if (!query.trim()) {
      toast({ title: 'Введите поисковый запрос', variant: 'destructive' });
      return;
    }
    await compare();
    toast({ title: 'Сравнение готово', description: `Запрос: "${query}"` });
  };

  const runDemoScenario = async (scenario: DemoScenario) => {
    setQuery(scenario.query);
    setLeftUserId(scenario.leftUserId);
    setRightUserId(scenario.rightUserId);

    const loadUsers = async () => {
      if (scenario.leftUserId) {
        try {
          const user = await getUser(scenario.leftUserId);
          setLeftUser(user);
        } catch {
          setLeftUser(null);
        }
      } else {
        setLeftUser(null);
      }

      if (scenario.rightUserId) {
        try {
          const user = await getUser(scenario.rightUserId);
          setRightUser(user);
        } catch {
          setRightUser(null);
        }
      } else {
        setRightUser(null);
      }
    };

    loadUsers();
    await compare(scenario.query, scenario.leftUserId, scenario.rightUserId);
    toast({ title: 'Демо-сценарий запущен', description: scenario.title });
  };

  return (
    <div className="min-h-screen bg-notion-bg-secondary">
      <CompareHeader />

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6 border-notion-border">
          <CardContent className="pt-6 space-y-4">
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
          </CardContent>
        </Card>

        <UserComparisonCards
          leftUserId={left.userId}
          rightUserId={right.userId}
          onLeftUserChange={setLeftUserId}
          onRightUserChange={setRightUserId}
          onLeftUserLoaded={setLeftUser}
          onRightUserLoaded={setRightUser}
        />

        {stats && <CompareStats stats={stats} leftUser={left.user} rightUser={right.user} />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <ResultColumn user={left.user} results={left.results} otherResults={right.results} label="Результаты 1" />
          <ResultColumn user={right.user} results={right.results} otherResults={left.results} label="Результаты 2" />
        </div>
      </main>
    </div>
  );
}
