
import { Link } from 'react-router-dom';
import { ArrowLeft, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CompareHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-notion-border bg-notion-bg/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-notion-text-secondary hover:text-notion-text"
              >
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-notion-accent" />
              <h1 className="text-base sm:text-lg font-medium text-notion-text">
                <span className="hidden sm:inline">Режим сравнения</span>
                <span className="sm:hidden">Сравнение</span>
              </h1>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
