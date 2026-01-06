import { Building, Database, Calendar, FolderOpen } from 'lucide-react';

interface DocumentCardMetaProps {
  source: string;
  year: number | null;
  organization: string;
  collection: string;
}

export const DocumentCardMeta = ({ source, year, organization, collection }: DocumentCardMetaProps) => (
  <>
    <div className="flex items-center gap-4 text-sm text-notion-text-secondary">
      {source && <div className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5" /><span>{source}</span></div>}
      {year && <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /><span>{year}</span></div>}
    </div>
    {organization && (
      <div className="flex items-center gap-2 text-sm text-notion-text-tertiary">
        <Building className="h-4 w-4 flex-shrink-0" /><span className="line-clamp-1">{organization}</span>
      </div>
    )}
    {collection && (
      <div className="flex items-center gap-2 text-sm text-notion-text-tertiary">
        <FolderOpen className="h-4 w-4 flex-shrink-0" /><span className="line-clamp-1">Коллекция: {collection}</span>
      </div>
    )}
  </>
);
