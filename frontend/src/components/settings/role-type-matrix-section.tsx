import type { RoleTypeMatrix } from '@/lib/api';
import { ROLE_LABELS, DOC_TYPE_LABELS } from './constants';

interface RoleTypeMatrixSectionProps {
  matrix: RoleTypeMatrix;
  isSaving: boolean;
  onMatrixChange: (role: string, docType: string, value: number) => void;
}

export function RoleTypeMatrixSection({
  matrix,
  isSaving,
  onMatrixChange,
}: RoleTypeMatrixSectionProps) {
  const roles = Object.keys(matrix);
  const docTypes = Object.keys(matrix[roles[0]] || {});

  return (
    <section>
      <h2 className="text-xl font-bold text-notion-text mb-2">Матрица f_type (роль → тип документа)</h2>
      <p className="text-notion-text-secondary text-sm mb-4">
        Вероятность предпочтения типа документа для каждой роли пользователя
      </p>

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-notion-border">
              <th className="text-left py-2 px-2 text-notion-text-secondary font-medium whitespace-nowrap">Роль \ Тип</th>
              {docTypes.map((dt) => (
                <th key={dt} className="text-center py-2 px-1 sm:px-2 text-notion-text-secondary font-medium whitespace-nowrap text-xs sm:text-sm">
                  {DOC_TYPE_LABELS[dt] || dt}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role} className="border-b border-notion-border/50">
                <td className="py-2 px-2 font-medium text-notion-text whitespace-nowrap text-xs sm:text-sm">{ROLE_LABELS[role] || role}</td>
                {docTypes.map((dt) => (
                  <td key={dt} className="py-2 px-1 sm:px-2">
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      value={matrix[role]?.[dt] ?? 0}
                      onChange={(e) => onMatrixChange(role, dt, parseFloat(e.target.value) || 0)}
                      className="w-16 sm:w-20 h-8 text-center text-xs sm:text-sm border border-notion-border rounded-md bg-notion-bg focus:outline-none focus:ring-1 focus:ring-notion-accent"
                      disabled={isSaving}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-notion-text-tertiary mt-2 sm:hidden">
        Прокрутите таблицу вправо для просмотра всех типов
      </p>
    </section>
  );
}
