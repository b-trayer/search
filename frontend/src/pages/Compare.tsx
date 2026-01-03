
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCompare } from '@/hooks/use-compare';
import { CompareHeader, CompareStats, ResultColumn } from '@/components/compare';
import UserSelect from '@/components/UserSelect';

export default function Compare() {
  const { toast } = useToast();
  const {
    query,
    setQuery,
    isLoading,
    left,
    right,
    setLeftUserId,
    setLeftUser,
    setRightUserId,
    setRightUser,
    compare,
    stats,
  } = useCompare();

  const handleCompare = async () => {
    if (!query.trim()) {
      toast({
        title: 'Введите поисковый запрос',
        variant: 'destructive',
      });
      return;
    }

    await compare();

    toast({
      title: 'Сравнение готово',
      description: `Запрос: "${query}"`,
    });
  };

  return (
    <div className="min-h-screen bg-notion-bg-secondary">
      <CompareHeader />

      <main className="container mx-auto px-4 py-8">
        {}
        <Card className="mb-6 border-notion-border">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-notion-text-tertiary" />
                <Input
                  placeholder="Введите поисковый запрос для сравнения..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
                  className="pl-10 border-notion-border focus:border-notion-accent"
                />
              </div>
              <Button
                onClick={handleCompare}
                disabled={isLoading}
                className="bg-notion-accent hover:bg-notion-accent-hover"
              >
                {isLoading ? 'Загрузка...' : 'Сравнить'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card className="border-notion-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-notion-text-secondary">
                Пользователь 1
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UserSelect
                selectedUserId={left.userId}
                onUserChange={setLeftUserId}
                onUserLoaded={setLeftUser}
              />
            </CardContent>
          </Card>

          <Card className="border-notion-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-notion-text-secondary">
                Пользователь 2
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UserSelect
                selectedUserId={right.userId}
                onUserChange={setRightUserId}
                onUserLoaded={setRightUser}
              />
            </CardContent>
          </Card>
        </div>

        {}
        {stats && (
          <CompareStats stats={stats} leftUser={left.user} rightUser={right.user} />
        )}

        {}
        <div className="grid grid-cols-2 gap-6">
          <ResultColumn
            user={left.user}
            results={left.results}
            otherResults={right.results}
            label="Результаты 1"
          />
          <ResultColumn
            user={right.user}
            results={right.results}
            otherResults={left.results}
            label="Результаты 2"
          />
        </div>
      </main>
    </div>
  );
}
