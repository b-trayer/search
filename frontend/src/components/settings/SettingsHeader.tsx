import { Link } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SettingsHeaderProps {
  isSaving: boolean;
  hasChanges: boolean;
  onSave: () => void;
  onReset: () => void;
}

export function SettingsHeader({
  isSaving,
  hasChanges,
  onSave,
  onReset,
}: SettingsHeaderProps) {
  return (
    <header className="border-b border-notion-border bg-notion-bg sticky top-0 z-10">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-notion-text hover:text-notion-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Назад к поиску</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onReset} disabled={isSaving} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Сбросить всё
          </Button>
          <Button size="sm" onClick={onSave} disabled={isSaving || !hasChanges} className="gap-2">
            <Save className="h-4 w-4" />
            Сохранить
          </Button>
        </div>
      </div>
    </header>
  );
}
