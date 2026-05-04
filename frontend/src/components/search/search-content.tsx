
import { BookOpen, SearchX } from 'lucide-react';
import SearchResults from '@/components/search-results';
import SearchResultsSkeleton from '@/components/search-results-skeleton';
import Pagination from '@/components/Pagination';
import { SortMenu } from '@/components/search/sort-menu';
import type { DocumentResult, UserProfile, SortBy } from '@/lib/types';

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
  sortBy: SortBy;
  hasActiveFilters?: boolean;
  onSortChange: (next: SortBy) => void;
  onDocumentClick: (doc: DocumentResult) => void;
  onPageChange: (page: number) => void;
  onResetFilters?: () => void;
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
  sortBy,
  hasActiveFilters = false,
  onSortChange,
  onDocumentClick,
  onPageChange,
  onResetFilters,
}: SearchContentProps) {
  return (
    <main>
      {isLoading && <SearchResultsSkeleton />}

      {!isLoading && !hasSearched && <EmptyState />}

      {!isLoading && hasSearched && results.length === 0 && (
        <NoResults
          hasActiveFilters={hasActiveFilters}
          onResetFilters={onResetFilters}
        />
      )}

      {!isLoading && hasSearched && results.length > 0 && (
        <div className="space-y-6">
          <ResultsHeader
            totalResults={totalResults}
            page={page}
            totalPages={totalPages}
            isPersonalized={isPersonalized}
            sortBy={sortBy}
            onSortChange={onSortChange}
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
          <h3 className="text-2xl font-semibold tracking-tight text-notion-text mb-2">
            Готово к работе
          </h3>
          <p className="text-sm text-notion-text-secondary">
            Введите запрос и система подберет подходящую литературу. Выбор
            пользователя наверху адаптирует выдачу под его профиль.
          </p>
        </div>
      </div>
    </div>
  );
}

function NoResults({
  hasActiveFilters,
  onResetFilters,
}: {
  hasActiveFilters: boolean;
  onResetFilters?: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <SearchX className="h-16 w-16 text-notion-text-tertiary" />
        <div>
          <h3 className="text-xl font-medium text-notion-text mb-2">
            Ничего не найдено
          </h3>
          <p className="text-notion-text-secondary">
            {hasActiveFilters
              ? 'Возможно, фильтры слишком строгие. Попробуйте сбросить их или изменить поисковый запрос.'
              : 'Попробуйте изменить поисковый запрос.'}
          </p>
        </div>
        {hasActiveFilters && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex h-8 items-center gap-1.5 rounded-notion border border-notion-border bg-notion-bg px-3 text-sm text-notion-text transition-colors hover:bg-notion-bg-hover"
          >
            Сбросить фильтры
          </button>
        )}
      </div>
    </div>
  );
}

function ResultsHeader({
  totalResults,
  page,
  totalPages,
  isPersonalized,
  sortBy,
  onSortChange,
}: {
  totalResults: number;
  page: number;
  totalPages: number;
  isPersonalized: boolean;
  sortBy: SortBy;
  onSortChange: (next: SortBy) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-notion-text-secondary">
        Найдено:{' '}
        <span className="font-medium text-notion-text tabular-nums">
          {totalResults.toLocaleString('ru-RU')}
        </span>{' '}
        документов
        {totalPages > 1 && (
          <span className="ml-2">
            (страница {page.toLocaleString('ru-RU')} из {totalPages.toLocaleString('ru-RU')})
          </span>
        )}
        {isPersonalized && (
          <span className="ml-2 text-notion-accent">✨ с персонализацией</span>
        )}
      </p>
      <SortMenu value={sortBy} onChange={onSortChange} />
    </div>
  );
}
