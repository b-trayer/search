
import { ReactNode } from 'react';

interface SearchHeaderProps {
  rightContent?: ReactNode;
}

export default function SearchHeader({ rightContent }: SearchHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-notion-border bg-notion-bg/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {}
          <div className="flex items-center gap-3">
            <span className="text-3xl">📚</span>
            <div>
              <h1 className="text-lg font-medium text-notion-text">
                Библиотека
              </h1>
              <p className="text-xs text-notion-text-tertiary">
                Персонализированный поиск
              </p>
            </div>
          </div>

          {}
          {rightContent}
        </div>
      </div>
    </header>
  );
}
