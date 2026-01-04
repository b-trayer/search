import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSearch } from '@/hooks/use-search';
import { useUsers } from '@/hooks/use-users';
import { useFilters, convertFiltersToSearchParams } from '@/hooks/use-filters';
import SearchHeader from '@/components/search/SearchHeader';
import SearchHero from '@/components/search/SearchHero';
import SearchContent from '@/components/search/SearchContent';
import { SearchNav } from '@/components/search/SearchNav';
import { SearchFooter } from '@/components/search/SearchFooter';
import FilterPanel from '@/components/FilterPanel';
import type { DocumentResult } from '@/lib/types';

export default function Search() {
  const { toast } = useToast();
  const [enablePersonalization, setEnablePersonalization] = useState(true);

  const {
    query, results, isLoading, hasSearched, totalResults,
    page, totalPages, isPersonalized, userProfile, error,
    setQuery, search, handleDocumentClick, goToPage,
  } = useSearch();

  const { selectedUser, selectedUserId, selectUser } = useUsers();
  const { filters, setFilters } = useFilters();

  const isInitialMount = useRef(true);
  const hasSearchedRef = useRef(hasSearched);
  const queryRef = useRef(query);

  hasSearchedRef.current = hasSearched;
  queryRef.current = query;

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (hasSearchedRef.current && queryRef.current.trim()) {
      search(selectedUserId ?? undefined, enablePersonalization, convertFiltersToSearchParams(filters));
    }
  }, [selectedUserId, enablePersonalization, filters, search]);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({ title: 'Введите поисковый запрос', description: 'Поле поиска не может быть пустым', variant: 'destructive' });
      return;
    }

    await search(selectedUserId ?? undefined, enablePersonalization, convertFiltersToSearchParams(filters));

    if (error) {
      toast({ title: 'Ошибка поиска', description: error, variant: 'destructive' });
    } else {
      toast({
        title: isPersonalized ? '🎯 Персонализированный поиск' : 'Поиск завершён',
        description: `Найдено ${totalResults} документов`,
      });
    }
  };

  const onDocumentClick = (doc: DocumentResult) => {
    handleDocumentClick(doc, selectedUserId ?? undefined);
  };

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

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <FilterPanel filters={filters} onFiltersChange={setFilters} />
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
