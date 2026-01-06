
import { BookOpen, SearchX } from 'lucide-react';
import SearchResults from '@/components/search-results';
import SearchResultsSkeleton from '@/components/search-results-skeleton';
import Pagination from '@/components/Pagination';
import type { DocumentResult, UserProfile } from '@/lib/types';

interface SearchContentProps {
  results: DocumentResult[];
  isLoading: boolean;
  hasSearched: boolean;
  totalResults: number;
  page: number;
  totalPages: number;
  isPersonalized: boolean;
  userProfile: UserProfile | null;
  query: string;
  userId: number | null;
  onDocumentClick: (doc: DocumentResult) => void;
  onPageChange: (page: number) => void;
}

export default function SearchContent({
  results,
  isLoading,
  hasSearched,
  totalResults,
  page,
  totalPages,
  isPersonalized,
  userProfile,
  query,
  userId,
  onDocumentClick,
  onPageChange,
}: SearchContentProps) {
  return (
    <main>
      {isLoading && <SearchResultsSkeleton />}

      {!isLoading && !hasSearched && <EmptyState />}

      {!isLoading && hasSearched && results.length === 0 && <NoResults />}

      {!isLoading && hasSearched && results.length > 0 && (
        <div className="space-y-6">
          <ResultsHeader
            totalResults={totalResults}
            page={page}
            totalPages={totalPages}
            isPersonalized={isPersonalized}
          />

          <SearchResults
            documents={results}
            query={query}
            userId={userId}
            userProfile={userProfile}
            onDocumentClick={onDocumentClick}
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
          />
        </div>
      )}
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
            Добро пожаловать в библиотеку
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
  page,
  totalPages,
  isPersonalized,
}: {
  totalResults: number;
  page: number;
  totalPages: number;
  isPersonalized: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-notion-text-secondary">
        Найдено:{' '}
        <span className="font-medium text-notion-text">{totalResults}</span>{' '}
        документов
        {totalPages > 1 && (
          <span className="ml-2">
            (страница {page} из {totalPages})
          </span>
        )}
        {isPersonalized && (
          <span className="ml-2 text-notion-accent">✨ с персонализацией</span>
        )}
      </p>
    </div>
  );
}
