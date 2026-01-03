
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSearch } from '@/hooks/use-search';
import { useUsers } from '@/hooks/use-users';
import SearchHeader from '@/components/search/SearchHeader';
import SearchHero from '@/components/search/SearchHero';
import SearchContent from '@/components/search/SearchContent';
import UserSelect from '@/components/UserSelect';
import type { DocumentResult } from '@/lib/types';

export default function Search() {
  const { toast } = useToast();
  const [enablePersonalization, setEnablePersonalization] = useState(true);

  const {
    query,
    results,
    isLoading,
    hasSearched,
    totalResults,
    isPersonalized,
    userProfile,
    stats,
    error,
    setQuery,
    search,
    handleDocumentClick,
  } = useSearch();

  const {
    selectedUser,
    selectedUserId,
    selectUser,
  } = useUsers();

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
      search(selectedUserId ?? undefined, enablePersonalization);
    }
  }, [selectedUserId, enablePersonalization, search]);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: 'Введите поисковый запрос',
        description: 'Поле поиска не может быть пустым',
        variant: 'destructive',
      });
      return;
    }

    await search(selectedUserId ?? undefined, enablePersonalization);

    if (error) {
      toast({
        title: 'Ошибка поиска',
        description: error,
        variant: 'destructive',
      });
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
      <SearchHeader
        rightContent={
          <nav className="flex items-center gap-4">
            <Link to="/compare">
              <Button variant="outline" size="sm" className="gap-2 rounded-notion">
                <GitCompare className="h-4 w-4" />
                Сравнение
              </Button>
            </Link>
            <UserSelect
              selectedUserId={selectedUserId}
              onUserChange={selectUser}
            />
          </nav>
        }
      />

      <SearchHero
        query={query}
        onQueryChange={setQuery}
        onSearch={handleSearch}
        isLoading={isLoading}
        enablePersonalization={enablePersonalization}
        onPersonalizationChange={setEnablePersonalization}
        selectedUser={selectedUser}
      />

      <SearchContent
        results={results}
        isLoading={isLoading}
        hasSearched={hasSearched}
        totalResults={totalResults}
        isPersonalized={isPersonalized}
        userProfile={userProfile}
        stats={stats}
        query={query}
        userId={selectedUserId}
        onDocumentClick={onDocumentClick}
      />

      <footer className="border-t border-notion-border bg-notion-bg-secondary py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-notion-text-secondary">
            © 2026 Библиотека • Персонализированная поисковая система
          </p>
        </div>
      </footer>
    </div>
  );
}
