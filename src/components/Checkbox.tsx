import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  tone?: 'cyan' | 'amber';
  ariaLabel?: string;
  ariaLabelledBy?: string;
  className?: string;
}

/**
 * Suite-standard custom checkbox preserving native <input type="checkbox"> keyboard and label semantics.
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  checked,
  onChange,
  disabled = false,
  tone = 'cyan',
  ariaLabel,
  ariaLabelledBy,
  className = '',
}) => {
  const checkedStyle =
    tone === 'amber'
      ? 'bg-amber-500 border-amber-400 text-[#140d02] shadow-[0_0_10px_rgba(245,158,11,0.4)]'
      : 'bg-[#06b6d4] border-cyan-400 text-[#051018] shadow-[0_0_10px_rgba(6,182,212,0.45)]';

  const uncheckedHover =
    tone === 'amber'
      ? 'bg-[#090e1a] border-slate-500/70 peer-hover:border-amber-400/75'
      : 'bg-[#090e1a] border-slate-500/70 peer-hover:border-cyan-400/75';

  const focusRing =
    tone === 'amber'
      ? 'peer-focus-visible:ring-amber-400'
      : 'peer-focus-visible:ring-cyan-400';

  return (
    <span className={`relative inline-flex items-center justify-center shrink-0 w-4 h-4 ${className}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`w-4 h-4 rounded-[5px] border flex items-center justify-center transition-[background-color,border-color,box-shadow] duration-150 ${
          checked ? checkedStyle : uncheckedHover
        } ${focusRing} peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#0b101b] peer-disabled:opacity-40`}
      >
        <Check
          strokeWidth={3}
          className={`w-3 h-3 transition-[opacity,transform] duration-150 ${
            checked ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
        />
      </span>
    </span>
  );
};

export default Checkbox;

