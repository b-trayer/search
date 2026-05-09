import { useTranslation } from '@/lib/i18n';

export function SearchFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-notion-border bg-notion-bg-secondary py-8 mt-12">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-notion-text-secondary">
          {t('footer.text')}
        </p>
      </div>
    </footer>
  );
}
