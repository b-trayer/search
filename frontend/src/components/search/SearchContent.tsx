
import { BookOpen, SearchX } from 'lucide-react';
import SearchResults from '@/components/SearchResults';
import SearchResultsSkeleton from '@/components/SearchResultsSkeleton';
import StatsPanel from '@/components/StatsPanel';
import type { DocumentResult, UserProfile, SearchStats } from '@/lib/types';

interface SearchContentProps {
  results: DocumentResult[];
  isLoading: boolean;
  hasSearched: boolean;
  totalResults: number;
  isPersonalized: boolean;
  userProfile: UserProfile | null;
  stats: SearchStats;
  query: string;
  userId: number | null;
  onDocumentClick: (doc: DocumentResult) => void;
}

export default function SearchContent({
  results,
  isLoading,
  hasSearched,
  totalResults,
  isPersonalized,
  userProfile,
  stats,
  query,
  userId,
  onDocumentClick,
}: SearchContentProps) {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {isLoading && <SearchResultsSkeleton />}

        {!isLoading && !hasSearched && <EmptyState />}

        {!isLoading && hasSearched && results.length === 0 && <NoResults />}

        {!isLoading && hasSearched && results.length > 0 && (
          <div className="space-y-6">
            <StatsPanel
              totalResults={stats.totalResults}
              avgCTR={stats.avgCTR}
              impressions={stats.impressions}
              isVisible={true}
            />

            <ResultsHeader
              totalResults={totalResults}
              isPersonalized={isPersonalized}
            />

            <SearchResults
              documents={results}
              query={query}
              userId={userId}
              userProfile={userProfile}
              onDocumentClick={onDocumentClick}
            />
          </div>
        )}
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <BookOpen className="h-20 w-20 text-notion-text-tertiary" />
        <div>
          <h3 className="text-2xl font-medium text-notion-text mb-2">
            Добро пожаловать в библиотеку НГУ
          </h3>
          <p className="text-notion-text-secondary">
            Введите поисковый запрос. Выберите пользователя для персонализированных результатов.
          </p>
        </div>
      </div>
    </div>
  );
}

function NoResults() {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <SearchX className="h-16 w-16 text-notion-text-tertiary" />
        <div>
          <h3 className="text-xl font-medium text-notion-text mb-2">
            Ничего не найдено
          </h3>
          <p className="text-notion-text-secondary">
            Попробуйте изменить поисковый запрос
          </p>
        </div>
      </div>
    </div>
  );
}

function ResultsHeader({
  totalResults,
  isPersonalized,
}: {
  totalResults: number;
  isPersonalized: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-notion-text-secondary">
        Найдено:{' '}
        <span className="font-medium text-notion-text">{totalResults}</span>{' '}
        документов
        {isPersonalized && (
          <span className="ml-2 text-notion-accent">✨ с персонализацией</span>
        )}
      </p>
    </div>
  );
}
