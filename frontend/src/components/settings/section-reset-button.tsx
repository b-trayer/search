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
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={disabled || !hasChanges}
          className="inline-flex h-7 items-center gap-1 rounded-notion border border-notion-border bg-notion-bg px-2 text-xs text-notion-text-secondary transition-colors hover:bg-notion-bg-hover hover:text-notion-text disabled:cursor-not-allowed disabled:opacity-40"
          title={hasChanges ? `Сбросить раздел «${sectionName}»` : 'Нет изменений в разделе'}
        >
          <RotateCcw className="h-3 w-3" />
          Сбросить раздел
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Сбросить раздел «{sectionName}»?</AlertDialogTitle>
          <AlertDialogDescription>
            Изменения в этом разделе будут отменены и заменены на последние сохраненные значения.
            Остальные разделы не пострадают.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Сбросить</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
