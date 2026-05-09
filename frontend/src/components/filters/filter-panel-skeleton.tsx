import { useTranslation } from '@/lib/i18n';

export function FilterPanelSkeleton() {
  const { t } = useTranslation();
  return (
    <aside className="w-72 shrink-0 hidden lg:block">
      <div className="sticky top-20 rounded-notion bg-notion-bg border border-notion-border shadow-notion-sm p-4">
        <div className="text-notion-text-secondary text-sm">{t('filters.skeleton')}</div>
      </div>
    </aside>
  );
}
