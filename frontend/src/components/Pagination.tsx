
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export default function Pagination({ page, totalPages, onPageChange, isLoading }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    if (page <= 3) {
      for (let i = 2; i <= maxVisible - 1; i++) pages.push(i);
      pages.push('...');
    } else if (page >= totalPages - 2) {
      pages.push('...');
      for (let i = totalPages - maxVisible + 2; i <= totalPages - 1; i++) pages.push(i);
    } else {
      pages.push('...');
      for (let i = page - 1; i <= page + 1; i++) pages.push(i);
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1 py-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1 || isLoading}
        className="h-9 w-9 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {getPageNumbers().map((p, idx) => (
        typeof p === 'number' ? (
          <Button
            key={idx}
            variant={p === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(p)}
            disabled={isLoading}
            className="h-9 min-w-9 px-2"
          >
            {p}
          </Button>
        ) : (
          <span key={idx} className="px-1 text-notion-text-tertiary">
            {p}
          </span>
        )
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages || isLoading}
        className="h-9 w-9 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
