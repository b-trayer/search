
import {
  FileText,
  User,
  ExternalLink,
  Flame,
  Target,
  BookOpen,
  GraduationCap,
  Building,
  Globe,
  Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { registerClick } from '@/lib/api';
import { highlightText, getCollectionColor } from '@/lib/highlight';
import ScoreBreakdown from './ScoreBreakdown';
import type { DocumentResult, UserProfile } from '@/lib/types';

interface DocumentCardProps {
  doc: DocumentResult;
  position: number;
  query: string;
  userId?: number | null;
  userProfile?: UserProfile | null;
  onDocumentClick?: (doc: DocumentResult) => void;
}

export default function DocumentCard({
  doc,
  position,
  query,
  userId,
  userProfile,
  onDocumentClick,
}: DocumentCardProps) {
  const handleClick = async () => {
    if (userId) {
      await registerClick({
        query,
        user_id: userId,
        document_id: doc.document_id,
        position,
      });
    }
    onDocumentClick?.(doc);
  };

  const authors = doc.authors || '';
  const collection = doc.collection || '';
  const subject = doc.subject_area || '';
  const organization = doc.organization || '';
  const publication = doc.publication_info || '';
  const language = doc.language || '';

  const isRelevant =
    userProfile &&
    (subject.toLowerCase().includes(userProfile.specialization?.toLowerCase() || '') ||
      collection.toLowerCase().includes(userProfile.specialization?.toLowerCase() || '') ||
      userProfile.interests?.some(
        (i: string) =>
          doc.title.toLowerCase().includes(i.toLowerCase()) ||
          subject.toLowerCase().includes(i.toLowerCase())
      ));

  return (
    <article
      onClick={handleClick}
      className={`group relative rounded-notion bg-notion-bg p-5 shadow-notion-sm border cursor-pointer
        transition-all duration-200 hover:shadow-notion-md hover:-translate-y-0.5
        ${isRelevant ? 'border-notion-accent/30 bg-notion-accent-light' : 'border-notion-border hover:border-notion-border-strong'}`}
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div
            className={`w-10 h-10 rounded-notion flex items-center justify-center font-bold text-lg
            ${isRelevant ? 'bg-notion-accent text-white' : 'bg-notion-bg-secondary text-notion-text-secondary group-hover:bg-notion-bg-hover'}`}
          >
            {position}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <h3 className="font-medium text-lg text-notion-text line-clamp-2 group-hover:text-notion-accent transition-colors">
            {highlightText(doc.title, query)}
          </h3>

          {authors && (
            <div className="flex items-start gap-2 text-sm text-notion-text-secondary">
              <User className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">{highlightText(authors, query)}</span>
            </div>
          )}

          {organization && (
            <div className="flex items-center gap-2 text-sm text-notion-text-tertiary">
              <Building className="h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1">{organization}</span>
            </div>
          )}

          {publication && (
            <div className="flex items-center gap-2 text-sm text-notion-text-tertiary">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1">{publication}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {collection && (
              <Badge variant="outline" className={`text-xs ${getCollectionColor(collection)}`}>
                <FileText className="h-3 w-3 mr-1" />
                {collection}
              </Badge>
            )}

            {subject && (
              <Badge
                variant="outline"
                className="text-xs bg-notion-bg-secondary text-notion-text-secondary border-notion-border"
              >
                <BookOpen className="h-3 w-3 mr-1" />
                {subject.length > 40 ? subject.slice(0, 40) + '...' : subject}
              </Badge>
            )}

            {language && (
              <Badge
                variant="outline"
                className="text-xs bg-notion-bg-secondary text-notion-text-tertiary border-notion-border"
              >
                <Globe className="h-3 w-3 mr-1" />
                {language}
              </Badge>
            )}

            {doc.ctr_boost > 1.2 && (
              <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                <Flame className="h-3 w-3 mr-1" />
                Популярно
              </Badge>
            )}

            {isRelevant && (
              <Badge className="bg-notion-accent-light text-notion-accent border-notion-accent/20">
                <Target className="h-3 w-3 mr-1" />
                Для вас
              </Badge>
            )}

            {collection.toLowerCase().includes('учебн') && (
              <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                <GraduationCap className="h-3 w-3 mr-1" />
                Учебник
              </Badge>
            )}
          </div>

          <ScoreBreakdown doc={doc} userProfile={userProfile} />
        </div>

        {doc.url && (
          <div className="flex-shrink-0 self-start opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="h-5 w-5 text-notion-accent" />
          </div>
        )}
      </div>
    </article>
  );
}
