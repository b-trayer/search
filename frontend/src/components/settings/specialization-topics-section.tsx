import { useState, KeyboardEvent } from 'react';
import { Trash2, Plus, X } from 'lucide-react';
import { HEADER_CHIP, HEADER_CHIP_PRIMARY } from '@/components/layout/header-chip';
import type { SpecializationTopics } from '@/lib/api';
import { SectionResetButton } from './section-reset-button';
import { useTranslation } from '@/lib/i18n';

interface SpecializationTopicsSectionProps {
  topics: SpecializationTopics;
  isSaving: boolean;
  onTopicsChange: (specialization: string, keywords: string[]) => void;
  onAddSpecialization: (name: string) => void;
  onRemoveSpecialization: (name: string) => void;
  onResetSection?: () => void;
  hasSectionChanges?: boolean;
  isSpecChanged?: (specialization: string) => boolean;
}

const INPUT_CLASS =
  'h-9 flex-1 rounded-notion border border-notion-border bg-notion-bg px-3 text-sm text-notion-text placeholder:text-notion-text-tertiary outline-none transition-colors hover:bg-notion-bg-hover focus:border-notion-accent focus:bg-notion-bg focus:ring-2 focus:ring-notion-accent/20';

function KeywordsChipsInput({
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
  const [draft, setDraft] = useState('');
  const { t } = useTranslation();

  const dedupAdd = (raw: string) => {
    const tokens = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (tokens.length === 0) return;
    const lower = new Set(keywords.map((k) => k.toLowerCase()));
    const next = [...keywords];
    for (const tok of tokens) {
      if (!lower.has(tok.toLowerCase())) {
        next.push(tok);
        lower.add(tok.toLowerCase());
      }
    }
    if (next.length !== keywords.length) {
      onKeywordsChange(specialization, next);
    }
    setDraft('');
  };

  const removeAt = (idx: number) => {
    const next = keywords.filter((_, i) => i !== idx);
    onKeywordsChange(specialization, next);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (draft.trim()) dedupAdd(draft);
    } else if (e.key === 'Backspace' && draft.length === 0 && keywords.length > 0) {
      removeAt(keywords.length - 1);
    }
  };

  const handleBlur = () => {
    if (draft.trim()) dedupAdd(draft);
  };

  return (
    <div
      className={`flex min-h-[2.25rem] flex-wrap items-center gap-1.5 rounded-notion border border-notion-border bg-notion-bg p-1.5 text-sm transition-colors focus-within:border-notion-accent focus-within:ring-2 focus-within:ring-notion-accent/20 ${
        isSaving ? 'opacity-60' : ''
      }`}
    >
      {keywords.map((kw, idx) => (
        <span
          key={`${kw}-${idx}`}
          className="inline-flex items-center gap-1 rounded-notion bg-notion-bg-secondary px-2 py-0.5 text-xs text-notion-text"
        >
          {kw}
          <button
            type="button"
            onClick={() => removeAt(idx)}
            disabled={isSaving}
            aria-label={t('specs.removeAria', { name: kw })}
            className="text-notion-text-tertiary transition-colors hover:text-red-600 disabled:opacity-50"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKey}
        onBlur={handleBlur}
        disabled={isSaving}
        placeholder={keywords.length === 0 ? t('specs.keywordsPlaceholder') : '+'}
        className="min-w-[8rem] flex-1 bg-transparent px-1.5 py-0.5 text-sm text-notion-text outline-none placeholder:text-notion-text-tertiary"
      />
    </div>
  );
}

export function SpecializationTopicsSection({
  topics,
  isSaving,
  onTopicsChange,
  onAddSpecialization,
  onRemoveSpecialization,
  onResetSection,
  hasSectionChanges = false,
  isSpecChanged,
}: SpecializationTopicsSectionProps) {
  const [newSpecName, setNewSpecName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { t, plural, language } = useTranslation();

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

  const sortLocale = language === 'ru' ? 'ru' : 'en';

  return (
    <section
      id="section-specializations"
      className="scroll-mt-20 rounded-notion border border-notion-border bg-notion-bg p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-notion-text">
          {t('specs.title')}
        </h2>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onResetSection && (
            <SectionResetButton
              disabled={isSaving}
              hasChanges={hasSectionChanges}
              onConfirm={onResetSection}
              sectionName={t('settings.section.specializations')}
            />
          )}
          {!isAdding && (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              disabled={isSaving}
              className={HEADER_CHIP}
            >
              <Plus className="h-4 w-4" />
              {t('specs.add')}
            </button>
          )}
        </div>
      </div>
      <p className="mt-1 text-sm text-notion-text-secondary">
        {t('specs.desc')}
      </p>

      {isAdding && (
        <div className="mt-5 rounded-notion border border-notion-border bg-notion-bg-secondary p-4">
          <label className="mb-2 block text-sm font-medium text-notion-text">
            {t('specs.newName')}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={newSpecName}
              onChange={(e) => setNewSpecName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('specs.placeholder')}
              autoFocus
              className={INPUT_CLASS}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddClick}
                disabled={!newSpecName.trim()}
                className={HEADER_CHIP_PRIMARY}
              >
                {t('specs.add')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewSpecName('');
                }}
                className={HEADER_CHIP}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {Object.entries(topics)
          .sort(([a], [b]) => a.localeCompare(b, sortLocale))
          .map(([specialization, keywords]) => {
            const changed = isSpecChanged ? isSpecChanged(specialization) : false;
            return (
            <div
              key={specialization}
              className={`rounded-notion border bg-notion-bg-secondary p-4 ${
                changed
                  ? 'border-l-2 border-l-notion-accent border-notion-border'
                  : 'border-notion-border'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-notion-text">
                  {specialization}
                </label>
                <button
                  type="button"
                  onClick={() => onRemoveSpecialization(specialization)}
                  disabled={isSaving}
                  aria-label={t('specs.removeAria', { name: specialization })}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-notion text-notion-text-tertiary transition-colors hover:bg-notion-bg-hover hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <KeywordsChipsInput
                specialization={specialization}
                keywords={keywords}
                isSaving={isSaving}
                onKeywordsChange={onTopicsChange}
              />
              <p className="mt-1 text-xs text-notion-text-tertiary">
                {keywords.length} {plural('specs.keywords', keywords.length)}
              </p>
            </div>
            );
          })}
      </div>

      {Object.keys(topics).length === 0 && (
        <div className="py-8 text-center text-sm text-notion-text-secondary">
          {t('specs.empty')}
        </div>
      )}
    </section>
  );
}
