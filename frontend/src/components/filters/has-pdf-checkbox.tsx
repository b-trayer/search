import { FileDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface HasPdfCheckboxProps {
  checked: boolean | null;
  onChange: (value: boolean | null) => void;
  count: number;
}

export function HasPdfCheckbox({ checked, onChange, count }: HasPdfCheckboxProps) {
  const isOn = checked === true;
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-notion px-2 py-2 transition-colors ${
        isOn ? 'bg-notion-bg-secondary' : 'hover:bg-notion-bg-hover'
      }`}
    >
      <Checkbox
        checked={isOn}
        onCheckedChange={(c) => onChange(c ? true : null)}
        className="h-3.5 w-3.5 rounded-[3px] border-notion-border-strong data-[state=checked]:border-notion-text data-[state=checked]:bg-notion-text"
      />
      <FileDown className="h-4 w-4 text-notion-text-tertiary" />
      <span
        className={`flex-1 text-sm ${
          isOn ? 'font-medium text-notion-text' : 'text-notion-text-secondary'
        }`}
      >
        Доступно онлайн
      </span>
      <span className="shrink-0 text-xs tabular-nums text-notion-text-tertiary">
        {count.toLocaleString('ru-RU')}
      </span>
    </label>
  );
}
