
import { User as UserIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPositionChange } from '@/hooks/use-compare';
import type { DocumentResult, User } from '@/lib/types';

interface ResultColumnProps {
  user: User | null;
  results: DocumentResult[];
  otherResults: DocumentResult[];
  label: string;
}

export default function ResultColumn({
  user,
  results,
  otherResults,
  label,
}: ResultColumnProps) {
  return (
    <div className="flex-1 min-w-0">
      <Card className="border-notion-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-notion-text">
            <UserIcon className="h-4 w-4" />
            {label}
          </CardTitle>
          {user ? (
            <div className="text-sm text-notion-text-secondary">
              <p className="font-medium">{user.username}</p>
              <p>{user.specialization || user.role}</p>
              {user.interests && user.interests.length > 0 && (
                <p className="text-xs mt-1 text-notion-text-tertiary">
                  {user.interests.slice(0, 2).join(', ')}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-notion-text-tertiary">Без персонализации</p>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {results.length === 0 ? (
            <p className="text-sm text-notion-text-tertiary text-center py-8">
              Нажмите "Сравнить" для поиска
            </p>
          ) : (
            results.map((doc, idx) => {
              const posChange = getPositionChange(doc.document_id, results, otherResults);

              return (
                <div
                  key={doc.document_id}
                  className="p-3 rounded-notion bg-notion-bg-secondary border border-notion-border hover:border-notion-border-strong transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-notion bg-notion-bg-hover flex items-center justify-center text-xs font-bold text-notion-text-secondary">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-notion-text line-clamp-2">
                        {doc.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-notion-text-tertiary">
                          score: {doc.final_score?.toFixed(1)}
                        </span>
                        {posChange !== null && posChange !== 0 && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              posChange > 0
                                ? 'text-green-600 border-green-200'
                                : 'text-red-600 border-red-200'
                            }`}
                          >
                            {posChange > 0 ? (
                              <>
                                <TrendingUp className="h-3 w-3 mr-1" />+{posChange}
                              </>
                            ) : (
                              <>
                                <TrendingDown className="h-3 w-3 mr-1" />
                                {posChange}
                              </>
                            )}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
