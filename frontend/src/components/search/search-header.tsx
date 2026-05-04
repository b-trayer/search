
import { ReactNode } from 'react';

interface SearchHeaderProps {
  rightContent?: ReactNode;
}

export default function SearchHeader({ rightContent }: SearchHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-notion-border bg-notion-bg/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl leading-none">📚</span>
            <h1 className="text-sm font-medium text-notion-text leading-none">
              Персонализированный поиск
            </h1>
          </div>

          {rightContent}
        </div>
      </div>
    </header>
  );
}
