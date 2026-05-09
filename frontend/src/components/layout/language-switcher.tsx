import { Languages } from 'lucide-react';
import { LANGUAGES, useTranslation, type Language } from '@/lib/i18n';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'desktop' | 'compact';
}

export function LanguageSwitcher({ className = '', variant = 'desktop' }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useTranslation();

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        {LANGUAGES.map((lang) => {
          const isActive = lang === language;
          return (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              aria-pressed={isActive}
              className={`inline-flex h-7 w-9 items-center justify-center rounded-notion text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                isActive
                  ? 'bg-notion-text text-white'
                  : 'text-notion-text-secondary hover:bg-notion-bg-hover hover:text-notion-text'
              }`}
            >
              {t(`lang.${lang}`)}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex h-9 items-center gap-1 rounded-notion border border-notion-border bg-notion-bg p-0.5 ${className}`}
      role="group"
      aria-label={t('lang.title')}
    >
      <Languages className="ml-1.5 h-3.5 w-3.5 text-notion-text-tertiary" aria-hidden />
      {LANGUAGES.map((lang: Language) => {
        const isActive = lang === language;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => setLanguage(lang)}
            aria-pressed={isActive}
            title={t('lang.toggle')}
            className={`inline-flex h-7 min-w-[2rem] items-center justify-center rounded-notion px-2 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
              isActive
                ? 'bg-notion-text text-white'
                : 'text-notion-text-secondary hover:bg-notion-bg-hover hover:text-notion-text'
            }`}
          >
            {t(`lang.${lang}`)}
          </button>
        );
      })}
    </div>
  );
}
