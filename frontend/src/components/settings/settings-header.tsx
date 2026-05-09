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
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { useTranslation } from '@/lib/i18n';

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
  const { t, plural } = useTranslation();

  const changesLabel = `${pendingChanges} ${plural('settings.changes', pendingChanges)}`;

  return (
    <header className="sticky top-0 z-50 border-b border-notion-border bg-notion-bg/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <SlidersHorizontal className="h-5 w-5 shrink-0 text-notion-text-tertiary" />
            <h1 className="text-sm font-medium text-notion-text leading-none truncate">
              {t('settings.title')}
            </h1>
            {hasChanges && pendingChanges > 0 && (
              onShowDiff ? (
                <button
                  type="button"
                  onClick={onShowDiff}
                  className="inline-flex h-5 items-center rounded-notion bg-notion-accent-light px-2 text-[11px] tabular-nums text-notion-accent transition-colors hover:bg-notion-accent/20"
                  title={t('settings.showDiff')}
                >
                  {changesLabel}
                </button>
              ) : (
                <span className="inline-flex h-5 items-center rounded-notion bg-notion-accent-light px-2 text-[11px] tabular-nums text-notion-accent">
                  {changesLabel}
                </span>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/" className={HEADER_CHIP}>
              <ArrowLeft className="h-4 w-4 text-notion-text-secondary" />
              <span className="hidden sm:inline">{t('common.back')}</span>
            </Link>

            {onExport && (
              <button
                type="button"
                onClick={onExport}
                disabled={isSaving}
                className={HEADER_CHIP}
                title={t('settings.exportTitle')}
              >
                <Download className="h-4 w-4 text-notion-text-secondary" />
                <span className="hidden md:inline">{t('settings.export')}</span>
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
                  title={t('settings.importTitle')}
                >
                  <Upload className="h-4 w-4 text-notion-text-secondary" />
                  <span className="hidden md:inline">{t('settings.import')}</span>
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
                  <span className="hidden sm:inline">{t('settings.resetAll')}</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('settings.resetConfirmTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('settings.resetConfirmDesc')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onReset}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    {t('common.reset')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <button
              type="button"
              onClick={onSave}
              disabled={isSaving || !hasChanges}
              className={HEADER_CHIP_PRIMARY}
              title={t('settings.save')}
              aria-label={t('settings.save')}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{t('settings.save')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
