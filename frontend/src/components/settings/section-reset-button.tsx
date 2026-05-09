import { RotateCcw } from 'lucide-react';
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
import { useTranslation } from '@/lib/i18n';

interface SectionResetButtonProps {
  disabled?: boolean;
  hasChanges: boolean;
  onConfirm: () => void;
  sectionName: string;
}

export function SectionResetButton({
  disabled,
  hasChanges,
  onConfirm,
  sectionName,
}: SectionResetButtonProps) {
  const { t } = useTranslation();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={disabled || !hasChanges}
          className="inline-flex h-7 items-center gap-1 rounded-notion border border-notion-border bg-notion-bg px-2 text-xs text-notion-text-secondary transition-colors hover:bg-notion-bg-hover hover:text-notion-text disabled:cursor-not-allowed disabled:opacity-40"
          title={hasChanges ? t('sectionReset.title', { name: sectionName }) : t('sectionReset.titleEmpty')}
        >
          <RotateCcw className="h-3 w-3" />
          {t('sectionReset.button')}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('sectionReset.confirmTitle', { name: sectionName })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('sectionReset.confirmDesc')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{t('common.reset')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
