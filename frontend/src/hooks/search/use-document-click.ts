import { useCallback } from 'react';
import { registerClick } from '@/lib/api';
import type { DocumentResult } from '@/lib/types';
import type { SearchAction } from '../search-reducer';

export function useDocumentClickHandler(query: string, dispatch: React.Dispatch<SearchAction>) {
  return useCallback((doc: DocumentResult, userId?: number) => {
    if (doc.url) {
      try {
        const url = new URL(doc.url);
        if (url.protocol === 'https:' || url.protocol === 'http:') {
          window.open(doc.url, '_blank', 'noopener,noreferrer');
        }
      } catch {
        if (import.meta.env.DEV) {
          console.warn('Invalid URL:', doc.url);
        }
      }
    }

    if (query) {
      registerClick({
        query,
        user_id: userId ?? null,
        document_id: doc.document_id,
        position: doc.position,
      }).then(result => {
        if (result.success) {
          dispatch({ type: 'INCREMENT_CLICK', payload: doc.document_id });
        }
      });
    }
  }, [query, dispatch]);
}
