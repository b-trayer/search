
import { GraduationCap, Sparkles } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import SearchBar from '@/components/search-bar';
import type { User, SearchField } from '@/lib/types';

const SEARCH_FIELD_OPTIONS: { value: SearchField; label: string }[] = [
  { value: 'all', label: 'Везде' },
  { value: 'title', label: 'В названии' },
  { value: 'authors', label: 'В авторах' },
  { value: 'subjects', label: 'В темах' },
  { value: 'collection', label: 'В коллекции' },
];

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
  return (
    <section className="py-8 sm:py-12 bg-notion-bg-secondary">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-notion-accent-light text-notion-accent text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">341 427 документов в каталоге</span>
            <span className="sm:hidden">341 427 документов</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-notion-text mb-3 sm:mb-4">
            Найдите нужную литературу
          </h2>

          <p className="text-notion-text-secondary text-sm sm:text-base mb-6 sm:mb-8 max-w-xl mx-auto px-2">
            {selectedUser
              ? `Результаты адаптированы для: ${selectedUser.specialization || selectedUser.role}`
              : 'Выберите пользователя для персонализации'}
          </p>

          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <SearchBar
              query={query}
              onQueryChange={onQueryChange}
              onSearch={onSearch}
              isLoading={isLoading}
            />

            <RadioGroup
              value={searchField}
              onValueChange={(value) => onSearchFieldChange(value as SearchField)}
              className="flex flex-wrap justify-center gap-2 sm:gap-4"
            >
              {SEARCH_FIELD_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center">
                  <RadioGroupItem
                    value={option.value}
                    id={`search-field-${option.value}`}
                    className="sr-only peer"
                  />
                  <Label
                    htmlFor={`search-field-${option.value}`}
                    className="px-3 py-1.5 text-xs sm:text-sm rounded-notion cursor-pointer transition-colors
                      bg-notion-bg border border-notion-border text-notion-text-secondary
                      peer-data-[state=checked]:bg-notion-accent peer-data-[state=checked]:text-white peer-data-[state=checked]:border-notion-accent
                      hover:bg-notion-bg-hover"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex items-center gap-2 sm:gap-3">
              <Switch
                id="personalization"
                checked={enablePersonalization}
                onCheckedChange={onPersonalizationChange}
                disabled={!selectedUser}
              />
              <Label
                htmlFor="personalization"
                className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-notion-text-secondary"
              >
                <Sparkles
                  className={`h-4 w-4 ${
                    enablePersonalization ? 'text-notion-accent' : 'text-notion-text-tertiary'
                  }`}
                />
                <span className="hidden sm:inline">
                  Персонализация {enablePersonalization ? 'включена' : 'выключена'}
                </span>
                <span className="sm:hidden">
                  {enablePersonalization ? 'Вкл' : 'Выкл'}
                </span>
              </Label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
