import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSearch } from '@/hooks/use-search';
import { useUsers } from '@/hooks/use-users';
import { useFilters, convertFiltersToSearchParams } from '@/hooks/use-filters';
import SearchHeader from '@/components/search/search-header';
import SearchHero from '@/components/search/search-hero';
import SearchContent from '@/components/search/search-content';
import { SearchNav } from '@/components/search/search-nav';
import { SearchFooter } from '@/components/search/search-footer';
import FilterPanel from '@/components/filter-panel';
import { MobileFilterSheet } from '@/components/filters';
import type { DocumentResult } from '@/lib/types';

export default function Search() {
  const { toast } = useToast();
  const [enablePersonalization, setEnablePersonalization] = useState(true);

  const {
    query, results, isLoading, hasSearched, totalResults,
    page, totalPages, isPersonalized, userProfile,
    setQuery, search, handleDocumentClick, goToPage,
  } = useSearch();

  const { selectedUser, selectedUserId, selectUser } = useUsers();
  const { filters, setFilters } = useFilters();
  const prevDepsRef = useRef<string | null>(null);

  const depsKey = JSON.stringify({ selectedUserId, enablePersonalization, filters });

  useEffect(() => {
    if (prevDepsRef.current === null) {
      prevDepsRef.current = depsKey;
      return;
    }
    if (prevDepsRef.current === depsKey) return;
    prevDepsRef.current = depsKey;

    if (hasSearched && query.trim()) {
      search(selectedUserId ?? undefined, enablePersonalization, convertFiltersToSearchParams(filters));
    }
  }, [depsKey, hasSearched, query, search, selectedUserId, enablePersonalization, filters]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      toast({ title: 'Введите поисковый запрос', description: 'Поле поиска не может быть пустым', variant: 'destructive' });
      return;
    }
    await search(selectedUserId ?? undefined, enablePersonalization, convertFiltersToSearchParams(filters));
  }, [query, search, selectedUserId, enablePersonalization, filters, toast]);

  const onDocumentClick = useCallback((doc: DocumentResult) => {
    handleDocumentClick(doc, selectedUserId ?? undefined);
  }, [handleDocumentClick, selectedUserId]);

  return (
    <div className="min-h-screen bg-notion-bg">
      <SearchHeader rightContent={<SearchNav selectedUserId={selectedUserId} onUserChange={selectUser} />} />

      <SearchHero
        query={query}
        onQueryChange={setQuery}
        onSearch={handleSearch}
        isLoading={isLoading}
        enablePersonalization={enablePersonalization}
        onPersonalizationChange={setEnablePersonalization}
        selectedUser={selectedUser}
      />

      <div className="container mx-auto px-4 py-6 lg:py-8">
        {hasSearched && (
          <div className="mb-4 lg:hidden">
            <MobileFilterSheet filters={filters} onFiltersChange={setFilters} />
          </div>
        )}
        <div className="flex gap-6 lg:gap-8">
          {hasSearched && <FilterPanel filters={filters} onFiltersChange={setFilters} />}
          <div className="flex-1 min-w-0">
            <SearchContent
              results={results}
              isLoading={isLoading}
              hasSearched={hasSearched}
              totalResults={totalResults}
              page={page}
              totalPages={totalPages}
              isPersonalized={isPersonalized}
              userProfile={userProfile}
              query={query}
              userId={selectedUserId}
              onDocumentClick={onDocumentClick}
              onPageChange={goToPage}
            />
          </div>
        </div>
      </div>

      <SearchFooter />
    </div>
  );
}
