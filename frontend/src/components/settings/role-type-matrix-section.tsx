import { Wand2 } from 'lucide-react';
import type { RoleTypeMatrix } from '@/lib/api';
import { ROLE_LABELS, DOC_TYPE_LABELS } from './constants';
import { SectionResetButton } from './section-reset-button';
import { normalizeRow } from '@/hooks/settings/changes';

interface RoleTypeMatrixSectionProps {
  matrix: RoleTypeMatrix;
  isSaving: boolean;
  onMatrixChange: (role: string, docType: string, value: number) => void;
  onResetSection?: () => void;
  hasSectionChanges?: boolean;
  isCellChanged?: (role: string, docType: string) => boolean;
}

function rowSum(row: Record<string, number>): number {
  return Object.values(row).reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);
}

export function RoleTypeMatrixSection({
  matrix,
  isSaving,
  onMatrixChange,
  onResetSection,
  hasSectionChanges = false,
  isCellChanged,
}: RoleTypeMatrixSectionProps) {
  const roles = Object.keys(matrix);
  const docTypes = Object.keys(matrix[roles[0]] || {});

  return (
    <section
      id="section-matrix"
      className="scroll-mt-20 rounded-notion border border-notion-border bg-notion-bg p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-notion-text">
          Матрица f_type (роль → тип документа)
        </h2>
        {onResetSection && (
          <SectionResetButton
            disabled={isSaving}
            hasChanges={hasSectionChanges}
            onConfirm={onResetSection}
            sectionName="Матрица f_type"
          />
        )}
      </div>
      <p className="mt-1 text-sm text-notion-text-secondary">
        Вероятностное распределение P(type | role). Сумма по каждой строке должна быть равна 1.
      </p>

      <div className="-mx-6 mt-5 overflow-x-auto px-6">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-notion-border">
              <th className="whitespace-nowrap py-2 px-2 text-left text-xs font-medium uppercase tracking-wide text-notion-text-tertiary">
                Роль \ Тип
              </th>
              {docTypes.map((dt) => (
                <th
                  key={dt}
                  className="whitespace-nowrap py-2 px-1 text-center text-xs font-medium uppercase tracking-wide text-notion-text-tertiary sm:px-2"
                >
                  {DOC_TYPE_LABELS[dt] || dt}
                </th>
              ))}
              <th className="whitespace-nowrap py-2 px-2 text-center text-xs font-medium uppercase tracking-wide text-notion-text-tertiary">
                ∑
              </th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => {
              const sum = rowSum(matrix[role] || {});
              const ok = Math.abs(sum - 1) < 0.011;
              const handleNormalizeRow = () => {
                const normalized = normalizeRow(matrix[role] || {});
                for (const dt of Object.keys(normalized)) {
                  if (normalized[dt] !== matrix[role]?.[dt]) {
                    onMatrixChange(role, dt, normalized[dt]);
                  }
                }
              };
              return (
                <tr key={role} className="border-b border-notion-border last:border-0">
                  <td className="whitespace-nowrap py-2 px-2 text-sm font-medium text-notion-text">
                    {ROLE_LABELS[role] || role}
                  </td>
                  {docTypes.map((dt) => {
                    const changed = isCellChanged ? isCellChanged(role, dt) : false;
                    return (
                      <td key={dt} className="py-2 px-1 sm:px-2">
                        <input
                          type="number"
                          min={0}
                          max={1}
                          step={0.05}
                          value={matrix[role]?.[dt] ?? 0}
                          onChange={(e) =>
                            onMatrixChange(role, dt, parseFloat(e.target.value) || 0)
                          }
                          className={`h-8 w-16 rounded-notion border bg-notion-bg text-center text-xs tabular-nums text-notion-text outline-none transition-colors hover:bg-notion-bg-hover focus:border-notion-accent focus:bg-notion-bg focus:ring-2 focus:ring-notion-accent/20 disabled:opacity-50 sm:w-20 sm:text-sm ${
                            changed
                              ? 'border-notion-accent bg-notion-accent-light'
                              : 'border-notion-border'
                          }`}
                          disabled={isSaving}
                        />
                      </td>
                    );
                  })}
                  <td className="py-2 px-2 text-center">
                    <span
                      className={`inline-flex h-6 min-w-[2.5rem] items-center justify-center rounded-notion px-1.5 text-xs tabular-nums ${
                        ok
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                      title={ok ? 'Сумма = 1' : 'Рекомендуется сумма = 1'}
                    >
                      {sum.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-2 pl-1 pr-2 text-center">
                    <button
                      type="button"
                      onClick={handleNormalizeRow}
                      disabled={isSaving || sum === 0 || ok}
                      title="Привести строку к сумме = 1"
                      aria-label={`Нормализовать строку «${ROLE_LABELS[role] || role}»`}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-notion text-notion-text-tertiary transition-colors hover:bg-notion-bg-hover hover:text-notion-text disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Wand2 className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-notion-text-tertiary sm:hidden">
        Прокрутите таблицу вправо для просмотра всех типов
      </p>
    </section>
  );
}
