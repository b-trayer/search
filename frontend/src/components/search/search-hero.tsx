import { useEffect, useState } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import SearchBar from '@/components/search-bar';
import { getSearchStats } from '@/lib/api';
import type { User, SearchField } from '@/lib/types';

const SEARCH_FIELD_OPTIONS: { value: SearchField; label: string }[] = [
  { value: 'all', label: 'Везде' },
  { value: 'title', label: 'В названии' },
  { value: 'authors', label: 'В авторах' },
  { value: 'subjects', label: 'В темах' },
  { value: 'collection', label: 'В коллекции' },
];

function pluralizeDocuments(count: number): string {
  const abs = Math.abs(count) % 100;
  const lastDigit = abs % 10;
  if (abs > 10 && abs < 20) return 'документов';
  if (lastDigit === 1) return 'документ';
  if (lastDigit >= 2 && lastDigit <= 4) return 'документа';
  return 'документов';
}

interface SearchHeroProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  enablePersonalization: boolean;
  onPersonalizationChange: (enabled: boolean) => void;
  selectedUser: User | null;
  searchField: SearchField;
  onSearchFieldChange: (field: SearchField) => void;
}

export default function SearchHero({
  query,
  onQueryChange,
  onSearch,
  isLoading,
  enablePersonalization,
  onPersonalizationChange,
  selectedUser,
  searchField,
  onSearchFieldChange,
}: SearchHeroProps) {
  const [totalDocuments, setTotalDocuments] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSearchStats()
      .then((stats) => {
        if (!cancelled && stats.total_documents > 0) {
          setTotalDocuments(stats.total_documents);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-notion-bg-secondary py-10 sm:py-14">
      <div className="container mx-auto px-4">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          {totalDocuments !== null && (
            <span className="inline-flex items-center gap-1.5 rounded-notion border border-notion-border bg-notion-bg px-2.5 py-1 text-xs font-medium text-notion-text-secondary">
              <BookOpen className="h-3.5 w-3.5 text-notion-text-tertiary" />
              {totalDocuments.toLocaleString('ru-RU')} {pluralizeDocuments(totalDocuments)} в каталоге
            </span>
          )}

          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-notion-text sm:mt-5 sm:text-3xl">
            Над чем работаем?
          </h2>

          <p className="mt-2 max-w-xl text-sm text-notion-text-secondary sm:text-base">
            {selectedUser
              ? `Результаты адаптированы для: ${selectedUser.specialization || selectedUser.role}`
              : 'Выберите пользователя, чтобы включить персонализацию'}
          </p>

          <div className="mt-6 flex w-full flex-col items-center gap-4 sm:mt-8">
            <SearchBar
              query={query}
              onQueryChange={onQueryChange}
              onSearch={onSearch}
              isLoading={isLoading}
            />

            <RadioGroup
              value={searchField}
              onValueChange={(value) => onSearchFieldChange(value as SearchField)}
              className="flex flex-wrap justify-center gap-1.5"
            >
              {SEARCH_FIELD_OPTIONS.map((option) => (
                <div key={option.value}>
                  <RadioGroupItem
                    value={option.value}
                    id={`search-field-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`search-field-${option.value}`}
                    className="inline-flex h-8 cursor-pointer select-none items-center rounded-notion border border-notion-border bg-notion-bg px-3 text-xs font-medium text-notion-text-secondary transition-colors hover:bg-notion-bg-hover hover:text-notion-text peer-data-[state=checked]:border-notion-text peer-data-[state=checked]:bg-notion-text peer-data-[state=checked]:text-white"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div
              className={`inline-flex h-8 items-center gap-2 rounded-notion border border-notion-border bg-notion-bg px-3 transition-opacity ${
                selectedUser ? '' : 'opacity-60'
              }`}
            >
              <Sparkles
                className={`h-3.5 w-3.5 ${
                  selectedUser && enablePersonalization
                    ? 'text-notion-accent'
                    : 'text-notion-text-tertiary'
                }`}
              />
              <Label
                htmlFor="personalization"
                className="cursor-pointer text-xs font-medium text-notion-text-secondary"
              >
                Персонализация
              </Label>
              <Switch
                id="personalization"
                checked={enablePersonalization}
                onCheckedChange={onPersonalizationChange}
                disabled={!selectedUser}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
