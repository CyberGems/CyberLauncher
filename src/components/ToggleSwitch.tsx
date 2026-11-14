import React from 'react';

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  id?: string;
  className?: string;
}

/**
 * Suite-standard binary switch matching CyberClock and CyberNotes geometry:
 * 44x24 track (#5e6672 off, glowing #06b6d4 on) and 18x18 thumb (#12161e off, white with check on).
 */
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  ariaLabel,
  ariaLabelledBy,
  id,
  className = '',
}) => {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex items-center w-11 h-6 rounded-full shrink-0 cursor-pointer transition-[background-color,box-shadow,opacity] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b101b] disabled:opacity-35 disabled:cursor-not-allowed ${
        checked
          ? 'bg-[#06b6d4] shadow-[0_0_12px_rgba(6,182,212,0.45)]'
          : 'bg-[#5e6672] hover:bg-[#6a7380]'
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.35)] transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          checked ? 'translate-x-[20px] bg-white' : 'translate-x-0 bg-[#12161e]'
        }`}
      >
        <svg
          viewBox="0 0 16 16"
          className={`w-3 h-3 transition-opacity duration-150 ${checked ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden="true"
        >
          <path
            d="M3.2 8.35 6.45 11.45 12.8 4.7"
            fill="none"
            stroke="#12161e"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
};

