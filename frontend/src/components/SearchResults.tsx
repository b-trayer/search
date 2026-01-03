
import { DocumentCard } from '@/components/results';
import type { DocumentResult, UserProfile } from '@/lib/types';

interface SearchResultsProps {
  documents: DocumentResult[];
  query: string;
  userId?: number | null;
  userProfile?: UserProfile | null;
  onDocumentClick?: (doc: DocumentResult) => void;
}

export default function SearchResults({
  documents,
  query,
  userId,
  userProfile,
  onDocumentClick,
}: SearchResultsProps) {
  if (documents.length === 0) return null;

  return (
    <div className="space-y-4">
      {documents.map((doc, index) => (
        <DocumentCard
          key={doc.document_id}
          doc={doc}
          position={index + 1}
          query={query}
          userId={userId}
          userProfile={userProfile}
          onDocumentClick={onDocumentClick}
        />
      ))}
    </div>
  );
}
