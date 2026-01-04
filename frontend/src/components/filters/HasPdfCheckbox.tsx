import { FileCheck } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface HasPdfCheckboxProps {
  checked: boolean | null;
  onChange: (value: boolean | null) => void;
  count: number;
}

export function HasPdfCheckbox({ checked, onChange, count }: HasPdfCheckboxProps) {
  return (
    <label
      className={`flex items-center gap-2 px-2 py-2 rounded-notion cursor-pointer transition-colors ${
        checked === true ? 'bg-notion-accent-light' : 'hover:bg-notion-bg-hover'
      }`}
    >
      <Checkbox
        checked={checked === true}
        onCheckedChange={(c) => onChange(c ? true : null)}
        className="data-[state=checked]:bg-notion-accent data-[state=checked]:border-notion-accent"
      />
      <FileCheck className="h-4 w-4 text-teal-600" />
      <span className={`text-sm flex-1 ${checked === true ? 'text-notion-text font-medium' : 'text-notion-text-secondary'}`}>
        Только с PDF
      </span>
      <span className="text-xs text-notion-text-tertiary tabular-nums">
        {count.toLocaleString()}
      </span>
    </label>
  );
}
