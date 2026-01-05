import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus } from 'lucide-react';
import type { SpecializationTopics } from '@/lib/api';

interface SpecializationTopicsSectionProps {
  topics: SpecializationTopics;
  isSaving: boolean;
  onTopicsChange: (specialization: string, keywords: string[]) => void;
  onAddSpecialization: (name: string) => void;
  onRemoveSpecialization: (name: string) => void;
}

function KeywordsTextarea({
  specialization,
  keywords,
  isSaving,
  onKeywordsChange,
}: {
  specialization: string;
  keywords: string[];
  isSaving: boolean;
  onKeywordsChange: (specialization: string, keywords: string[]) => void;
}) {
  const [localValue, setLocalValue] = useState(keywords.join(', '));

  useEffect(() => {
    setLocalValue(keywords.join(', '));
  }, [keywords]);

  const handleBlur = () => {
    const parsed = localValue
      .split(',')
      .map(kw => kw.trim())
      .filter(kw => kw.length > 0);
    onKeywordsChange(specialization, parsed);
  };

  return (
    <Textarea
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      disabled={isSaving}
      placeholder="Введите ключевые слова через запятую"
      rows={2}
      className="text-sm resize-none"
    />
  );
}

export function SpecializationTopicsSection({
  topics,
  isSaving,
  onTopicsChange,
  onAddSpecialization,
  onRemoveSpecialization,
}: SpecializationTopicsSectionProps) {
  const [newSpecName, setNewSpecName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddClick = () => {
    if (newSpecName.trim()) {
      onAddSpecialization(newSpecName.trim());
      setNewSpecName('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddClick();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewSpecName('');
    }
  };

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <h2 className="text-lg sm:text-xl font-bold text-notion-text">Ключевые слова специализаций</h2>
        {!isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            disabled={isSaving}
            className="gap-1 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Добавить
          </Button>
        )}
      </div>
      <p className="text-notion-text-secondary text-xs sm:text-sm mb-4">
        Ключевые слова для определения релевантности документов по специализации пользователя (f_topic)
      </p>

      {isAdding && (
        <div className="mb-4 p-3 sm:p-4 bg-notion-bg-secondary rounded-notion border border-notion-accent/30">
          <label className="block text-sm font-medium text-notion-text mb-2">
            Название новой специализации
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={newSpecName}
              onChange={e => setNewSpecName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Например: Психология"
              autoFocus
              className="flex-1"
            />
            <div className="flex gap-2">
              <Button onClick={handleAddClick} disabled={!newSpecName.trim()} className="flex-1 sm:flex-none">
                Добавить
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAdding(false);
                  setNewSpecName('');
                }}
                className="flex-1 sm:flex-none"
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4">
        {Object.entries(topics)
          .sort(([a], [b]) => a.localeCompare(b, 'ru'))
          .map(([specialization, keywords]) => (
            <div
              key={specialization}
              className="p-3 sm:p-4 bg-notion-bg-secondary rounded-notion"
            >
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium text-notion-text text-sm sm:text-base">
                  {specialization}
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveSpecialization(specialization)}
                  disabled={isSaving}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <KeywordsTextarea
                specialization={specialization}
                keywords={keywords}
                isSaving={isSaving}
                onKeywordsChange={onTopicsChange}
              />
              <p className="text-xs text-notion-text-tertiary mt-1">
                {keywords.length} {getKeywordsWord(keywords.length)}
              </p>
            </div>
          ))}
      </div>

      {Object.keys(topics).length === 0 && (
        <div className="text-center py-8 text-notion-text-secondary">
          Нет специализаций. Нажмите «Добавить» чтобы создать первую.
        </div>
      )}
    </section>
  );
}

function getKeywordsWord(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return 'ключевых слов';
  }
  if (lastDigit === 1) {
    return 'ключевое слово';
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'ключевых слова';
  }
  return 'ключевых слов';
}
