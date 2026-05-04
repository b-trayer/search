import { Link } from 'react-router-dom';
import { ArrowLeft, GitCompareArrows } from 'lucide-react';
import { HEADER_CHIP } from '@/components/layout/header-chip';

export default function CompareHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-notion-border bg-notion-bg/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-notion-text-secondary" />
            <h1 className="text-sm font-medium text-notion-text leading-none">
              Режим сравнения
            </h1>
          </div>

          <Link to="/" className={HEADER_CHIP}>
            <ArrowLeft className="h-4 w-4 text-notion-text-secondary" />
            Назад к поиску
          </Link>
        </div>
      </div>
    </header>
  );
}
