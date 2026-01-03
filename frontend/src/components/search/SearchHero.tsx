
import { GraduationCap, Sparkles } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import SearchBar from '@/components/SearchBar';
import type { User } from '@/lib/types';

interface SearchHeroProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  enablePersonalization: boolean;
  onPersonalizationChange: (enabled: boolean) => void;
  selectedUser: User | null;
}

export default function SearchHero({
  query,
  onQueryChange,
  onSearch,
  isLoading,
  enablePersonalization,
  onPersonalizationChange,
  selectedUser,
}: SearchHeroProps) {
  return (
    <section className="py-12 bg-notion-bg-secondary">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-notion-accent-light text-notion-accent text-sm font-medium mb-4">
            <GraduationCap className="h-4 w-4" />
            7,531 документов в каталоге
          </div>

          {}
          <h2 className="text-3xl md:text-4xl font-medium text-notion-text mb-4">
            Найдите нужную литературу
          </h2>

          {}
          <p className="text-notion-text-secondary mb-8 max-w-xl mx-auto">
            {selectedUser
              ? `Результаты адаптированы для специализации: ${selectedUser.specialization || selectedUser.role}`
              : 'Выберите пользователя для персонализированного поиска'}
          </p>

          {}
          <div className="flex flex-col items-center gap-4">
            <SearchBar
              query={query}
              onQueryChange={onQueryChange}
              onSearch={onSearch}
              isLoading={isLoading}
            />

            {}
            <div className="flex items-center gap-3">
              <Switch
                id="personalization"
                checked={enablePersonalization}
                onCheckedChange={onPersonalizationChange}
              />
              <Label
                htmlFor="personalization"
                className="flex items-center gap-2 cursor-pointer text-sm text-notion-text-secondary"
              >
                <Sparkles
                  className={`h-4 w-4 ${
                    enablePersonalization ? 'text-notion-accent' : 'text-notion-text-tertiary'
                  }`}
                />
                Персонализация {enablePersonalization ? 'включена' : 'выключена'}
              </Label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
