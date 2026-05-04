import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, RotateCcw, Save, SlidersHorizontal, Upload } from 'lucide-react';
import { useRef } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { HEADER_CHIP, HEADER_CHIP_PRIMARY } from '@/components/layout/header-chip';

interface SettingsHeaderProps {
  isSaving: boolean;
  hasChanges: boolean;
  pendingChanges?: number;
  onSave: () => void;
  onReset: () => void;
  onExport?: () => void;
  onImport?: (file: File) => void;
  onShowDiff?: () => void;
}

export function SettingsHeader({
  isSaving,
  hasChanges,
  pendingChanges = 0,
  onSave,
  onReset,
  onExport,
  onImport,
  onShowDiff,
}: SettingsHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="sticky top-0 z-50 border-b border-notion-border bg-notion-bg/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <SlidersHorizontal className="h-5 w-5 shrink-0 text-notion-text-tertiary" />
            <h1 className="text-sm font-medium text-notion-text leading-none truncate">
              Настройки ранжирования
            </h1>
            {hasChanges && pendingChanges > 0 && (
              onShowDiff ? (
                <button
                  type="button"
                  onClick={onShowDiff}
                  className="inline-flex h-5 items-center rounded-notion bg-notion-accent-light px-2 text-[11px] tabular-nums text-notion-accent transition-colors hover:bg-notion-accent/20"
                  title="Показать список изменений"
                >
                  {pendingChanges} {pendingChangesWord(pendingChanges)}
                </button>
              ) : (
                <span className="inline-flex h-5 items-center rounded-notion bg-notion-accent-light px-2 text-[11px] tabular-nums text-notion-accent">
                  {pendingChanges} {pendingChangesWord(pendingChanges)}
                </span>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link to="/" className={HEADER_CHIP}>
              <ArrowLeft className="h-4 w-4 text-notion-text-secondary" />
              <span className="hidden sm:inline">Назад к поиску</span>
            </Link>

            {onExport && (
              <button
                type="button"
                onClick={onExport}
                disabled={isSaving}
                className={HEADER_CHIP}
                title="Экспортировать настройки в JSON"
              >
                <Download className="h-4 w-4 text-notion-text-secondary" />
                <span className="hidden md:inline">Экспорт</span>
              </button>
            )}

            {onImport && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onImport(f);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                  className={HEADER_CHIP}
                  title="Загрузить настройки из JSON"
                >
                  <Upload className="h-4 w-4 text-notion-text-secondary" />
                  <span className="hidden md:inline">Импорт</span>
                </button>
              </>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  disabled={isSaving}
                  className={HEADER_CHIP}
                >
                  <RotateCcw className="h-4 w-4 text-notion-text-secondary" />
                  <span className="hidden sm:inline">Сбросить все</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Сбросить все настройки?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Веса, матрица f_type, скоры f_topic и ключевые слова специализаций
                    будут возвращены к значениям по умолчанию. Это действие нельзя отменить.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onReset}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    Сбросить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <button
              type="button"
              onClick={onSave}
              disabled={isSaving || !hasChanges}
              className={HEADER_CHIP_PRIMARY}
              title="Сохранить"
              aria-label="Сохранить"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Сохранить</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function pendingChangesWord(count: number): string {
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  if (lastTwo >= 11 && lastTwo <= 19) return 'изменений';
  if (lastDigit === 1) return 'изменение';
  if (lastDigit >= 2 && lastDigit <= 4) return 'изменения';
  return 'изменений';
}
