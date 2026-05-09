import { useTranslation } from '@/lib/i18n';

interface DocumentCardMetaProps {
  source: string;
  year: number | null;
  organization: string;
  collection: string;
}

export const DocumentCardMeta = ({ source, year, organization, collection }: DocumentCardMetaProps) => {
  const { t } = useTranslation();
  const parts: string[] = [];
  if (year) parts.push(String(year));
  if (source) parts.push(source);
  if (organization) parts.push(organization);
  if (collection) parts.push(t('card.collectionLabel', { value: collection }));

  if (parts.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-notion-text-tertiary">
      {parts.map((part, idx) => (
        <span key={idx} className="inline-flex items-center gap-1.5">
          {idx > 0 && <span aria-hidden="true">·</span>}
          <span className="line-clamp-1">{part}</span>
        </span>
      ))}
    </div>
  );
};
