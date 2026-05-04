import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useSearch } from '@/hooks/use-search';
import { useUsers } from '@/hooks/use-users';
import { useFilters, convertFiltersToSearchParams, EMPTY_FILTERS, hasActiveFilters } from '@/hooks/use-filters';
import { parseSearchParams, buildSearchParams } from '@/hooks/filters/url-state';
import SearchHeader from '@/components/search/search-header';
import SearchHero from '@/components/search/search-hero';
import SearchContent from '@/components/search/search-content';
import { SearchNav } from '@/components/search/search-nav';
import { SearchFooter } from '@/components/search/search-footer';
import FilterPanel from '@/components/filter-panel';
import { MobileFilterToggle, ActiveFilterChips } from '@/components/filters';
import type { DocumentResult, SearchField, SortBy } from '@/lib/types';

export default function Search() {
  const { toast } = useToast();
  const [urlParams, setUrlParams] = useSearchParams();

  const initialState = useRef(parseSearchParams(urlParams)).current;

  const [enablePersonalization, setEnablePersonalization] = useState(initialState.enablePersonalization);
  const [searchField, setSearchField] = useState<SearchField>(initialState.searchField);
  const [sortBy, setSortBy] = useState<SortBy>(initialState.sortBy);

  const {
    query, results, isLoading, hasSearched, totalResults,
    page, totalPages, isPersonalized, userProfile,
    setQuery, search, handleDocumentClick, goToPage,
  } = useSearch();

  const { selectedUser, selectedUserId, selectUser } = useUsers();
  const { filters, setFilters } = useFilters(initialState.filters);
  const prevDepsRef = useRef<string | null>(null);
  const initRanRef = useRef(false);

  useEffect(() => {
    if (initRanRef.current) return;
    initRanRef.current = true;

    if (initialState.userId !== null) selectUser(initialState.userId);
    if (initialState.query.trim()) {
      setQuery(initialState.query);
      search(
        initialState.userId ?? undefined,
        initialState.enablePersonalization,
        convertFiltersToSearchParams(initialState.filters),
        1,
        initialState.searchField,
        initialState.sortBy,
      );
    }
  }, [initialState, selectUser, setQuery, search]);

  useEffect(() => {
    if (!hasSearched && !query.trim()) return;
    const next = buildSearchParams({
      query,
      filters,
      searchField,
      sortBy,
      enablePersonalization,
      userId: selectedUserId,
    });
    setUrlParams(next, { replace: true });
  }, [query, filters, searchField, sortBy, enablePersonalization, selectedUserId, hasSearched, setUrlParams]);

  const depsKey = JSON.stringify({ selectedUserId, enablePersonalization, filters, searchField, sortBy });

  useEffect(() => {
    if (prevDepsRef.current === null) {
      prevDepsRef.current = depsKey;
      return;
    }
    if (prevDepsRef.current === depsKey) return;
    prevDepsRef.current = depsKey;

    if (hasSearched && query.trim()) {
      search(selectedUserId ?? undefined, enablePersonalization, convertFiltersToSearchParams(filters), 1, searchField, sortBy);
    }
  }, [depsKey, hasSearched, query, search, selectedUserId, enablePersonalization, filters, searchField, sortBy]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      toast({ title: 'Введите поисковый запрос', description: 'Поле поиска не может быть пустым', variant: 'destructive' });
      return;
    }
    await search(selectedUserId ?? undefined, enablePersonalization, convertFiltersToSearchParams(filters), 1, searchField, sortBy);
  }, [query, search, selectedUserId, enablePersonalization, filters, searchField, sortBy, toast]);

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
        searchField={searchField}
        onSearchFieldChange={setSearchField}
      />

      <div className="container mx-auto px-4 py-6 lg:py-8">
        {hasSearched && (
          <div className="mb-4 lg:hidden">
            <MobileFilterToggle
              filters={filters}
              onFiltersChange={setFilters}
              query={query}
              searchField={searchField}
            />
          </div>
        )}
        <div className="flex gap-6 lg:gap-8">
          {hasSearched && (
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              query={query}
              searchField={searchField}
            />
          )}
          <div className="flex-1 min-w-0 space-y-4">
            {hasSearched && (
              <ActiveFilterChips
                filters={filters}
                onFiltersChange={setFilters}
                onReset={() => setFilters(EMPTY_FILTERS)}
              />
            )}
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
              sortBy={sortBy}
              hasActiveFilters={hasActiveFilters(filters)}
              onSortChange={setSortBy}
              onDocumentClick={onDocumentClick}
              onPageChange={goToPage}
              onResetFilters={() => setFilters(EMPTY_FILTERS)}
            />
          </div>
        </div>
      </div>

      <SearchFooter />
    </div>
  );
}
