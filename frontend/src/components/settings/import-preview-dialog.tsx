import { useEffect, useState } from 'react';
import { FileJson } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { SettingsExport } from '@/hooks/settings/io';
import type { ImportApplyOptions } from '@/hooks/settings/use-settings-actions';
import { useTranslation } from '@/lib/i18n';

interface ImportPreviewDialogProps {
  open: boolean;
  payload: SettingsExport | null;
  onCancel: () => void;
  onApply: (options: ImportApplyOptions) => void;
}

export function ImportPreviewDialog({
  open,
  payload,
  onCancel,
  onApply,
}: ImportPreviewDialogProps) {
  const { t, language } = useTranslation();
  const [opts, setOpts] = useState<ImportApplyOptions>({
    weights: true,
    matrix: true,
    topics: true,
    specializations: true,
  });

  useEffect(() => {
    if (open) {
      setOpts({ weights: true, matrix: true, topics: true, specializations: true });
    }
  }, [open]);

  const totals = payload
    ? {
        weights: Object.keys(payload.weights).length,
        matrix: Object.values(payload.role_type_matrix).reduce(
          (acc, row) => acc + Object.keys(row).length,
          0,
        ),
        topics: Object.keys(payload.topic_scores).length,
        specializations: Object.keys(payload.specialization_topics).length,
      }
    : null;

  const anySelected = Object.values(opts).some(Boolean);
  const dateLocale = language === 'ru' ? 'ru-RU' : 'en-US';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <span className="inline-flex items-center gap-2">
              <FileJson className="h-4 w-4 text-notion-text-tertiary" />
              {t('import.title')}
            </span>
          </DialogTitle>
          <DialogDescription>
            {t('import.desc')}
          </DialogDescription>
        </DialogHeader>

        {totals && (
          <ul className="space-y-2 text-sm">
            <CheckRow
              label={t('import.weights')}
              count={totals.weights}
              countLabel={t('import.weightsCount')}
              checked={opts.weights}
              onChange={(v) => setOpts((s) => ({ ...s, weights: v }))}
            />
            <CheckRow
              label={t('import.matrix')}
              count={totals.matrix}
              countLabel={t('import.matrixCount')}
              checked={opts.matrix}
              onChange={(v) => setOpts((s) => ({ ...s, matrix: v }))}
            />
            <CheckRow
              label={t('import.topics')}
              count={totals.topics}
              countLabel={t('import.topicsCount')}
              checked={opts.topics}
              onChange={(v) => setOpts((s) => ({ ...s, topics: v }))}
            />
            <CheckRow
              label={t('import.specs')}
              count={totals.specializations}
              countLabel={t('import.specsCount')}
              checked={opts.specializations}
              onChange={(v) => setOpts((s) => ({ ...s, specializations: v }))}
            />
          </ul>
        )}

        {payload?.exported_at && (
          <p className="text-xs text-notion-text-tertiary">
            {t('import.exportedAt', { date: new Date(payload.exported_at).toLocaleString(dateLocale) })}
          </p>
        )}

        <DialogFooter>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 items-center rounded-notion border border-notion-border bg-notion-bg px-3 text-sm text-notion-text transition-colors hover:bg-notion-bg-hover"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => onApply(opts)}
            disabled={!anySelected}
            className="inline-flex h-9 items-center rounded-notion bg-notion-accent px-3 text-sm font-medium text-white transition-colors hover:bg-notion-accent-hover disabled:opacity-50"
          >
            {t('common.apply')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CheckRow({
  label,
  count,
  countLabel,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  countLabel: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <li className="flex items-center justify-between rounded-notion border border-notion-border bg-notion-bg-secondary px-3 py-2">
      <label className="flex items-center gap-2 text-sm text-notion-text">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-notion-border accent-notion-accent"
        />
        <span>{label}</span>
      </label>
      <span className="text-xs tabular-nums text-notion-text-tertiary">
        {count} {countLabel}
      </span>
    </li>
  );
}
