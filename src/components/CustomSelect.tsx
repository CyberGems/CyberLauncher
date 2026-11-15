import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  id?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  size?: 'sm' | 'md';
  align?: 'left' | 'right';
}

interface MenuCoords {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
  openUpward: boolean;
}

/**
 * Suite-standard custom dropdown (CyberViewer / CyberNotes pattern).
 * Renders its listbox into document.body to prevent modal overflow clipping
 * and avoid native OS <select> popup styling.
 */
export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  disabled = false,
  placeholder = '',
  ariaLabel,
  ariaLabelledBy,
  id,
  className = '',
  triggerClassName = '',
  menuClassName = '',
  size = 'md',
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [coords, setCoords] = useState<MenuCoords | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const typeBufferRef = useRef('');
  const typeTimerRef = useRef<number | null>(null);

  const listboxId = useId();

  const selectedIndex = useMemo(
    () => options.findIndex((opt) => opt.value === value),
    [options, value]
  );
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const findNextEnabled = useCallback(
    (start: number, step: 1 | -1): number => {
      if (options.length === 0) return -1;
      for (let offset = 0; offset < options.length; offset += 1) {
        const idx = (start + step * offset + options.length) % options.length;
        if (!options[idx]?.disabled) return idx;
      }
      return -1;
    },
    [options]
  );

  const findFirstEnabled = useCallback(
    () => options.findIndex((opt) => !opt.disabled),
    [options]
  );

  const findLastEnabled = useCallback(() => {
    for (let i = options.length - 1; i >= 0; i -= 1) {
      if (!options[i]?.disabled) return i;
    }
    return -1;
  }, [options]);

  const closeMenu = useCallback((restoreFocus = false) => {
    setIsOpen(false);
    setActiveIndex(-1);
    if (restoreFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }, []);

  const openMenu = useCallback(
    (initialFocusMode: 'selected' | 'first' | 'last' = 'selected') => {
      if (disabled || options.length === 0) return;
      let targetIdx =
        initialFocusMode === 'first'
          ? findFirstEnabled()
          : initialFocusMode === 'last'
          ? findLastEnabled()
          : selectedIndex >= 0 && !options[selectedIndex]?.disabled
          ? selectedIndex
          : findFirstEnabled();

      if (targetIdx < 0) {
        targetIdx = findFirstEnabled();
      }
      setActiveIndex(targetIdx);
      setIsOpen(true);
    },
    [disabled, options, selectedIndex, findFirstEnabled, findLastEnabled]
  );

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const gap = 6;
    const viewportMargin = 8;
    const maxListCap = 240;

    const spaceBelow = window.innerHeight - rect.bottom - gap - viewportMargin;
    const spaceAbove = rect.top - gap - viewportMargin;
    const openUpward = spaceBelow < 150 && spaceAbove > spaceBelow;
    const availableSpace = Math.max(96, openUpward ? spaceAbove : spaceBelow);
    const maxHeight = Math.min(maxListCap, availableSpace);

    const width = Math.max(rect.width, 110);
    const preferredLeft = align === 'right' ? rect.right - width : rect.left;
    const left = Math.max(
      viewportMargin,
      Math.min(preferredLeft, window.innerWidth - width - viewportMargin)
    );

    if (openUpward) {
      setCoords({
        bottom: window.innerHeight - rect.top + gap,
        left,
        width,
        maxHeight,
        openUpward: true,
      });
    } else {
      setCoords({
        top: rect.bottom + gap,
        left,
        width,
        maxHeight,
        openUpward: false,
      });
    }
  }, [align]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();
  }, [isOpen, options.length, updateMenuPosition]);

  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;
    const activeEl = optionRefs.current[activeIndex];
    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, activeIndex]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      closeMenu(false);
    };

    const handleScrollOrResize = (event: Event) => {
      if (event.type === 'scroll' && menuRef.current?.contains(event.target as Node | null)) {
        return;
      }
      updateMenuPosition();
    };

    const handleEscapeCapture = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeMenu(true);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('keydown', handleEscapeCapture, true);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('keydown', handleEscapeCapture, true);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, closeMenu, updateMenuPosition]);

  useEffect(() => {
    return () => {
      if (typeTimerRef.current !== null) {
        window.clearTimeout(typeTimerRef.current);
      }
    };
  }, []);

  const commitOption = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option || option.disabled) return;
      if (option.value !== value) {
        onChange(option.value);
      }
      closeMenu(true);
    },
    [options, value, onChange, closeMenu]
  );

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openMenu(event.key === 'ArrowDown' ? 'selected' : 'selected');
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        openMenu('last');
        return;
      }
    } else {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const start = activeIndex >= 0 ? activeIndex + 1 : 0;
        setActiveIndex(findNextEnabled(start, 1));
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        const start = activeIndex >= 0 ? activeIndex - 1 : options.length - 1;
        setActiveIndex(findNextEnabled(start, -1));
        return;
      }
      if (event.key === 'Home') {
        event.preventDefault();
        setActiveIndex(findFirstEnabled());
        return;
      }
      if (event.key === 'End') {
        event.preventDefault();
        setActiveIndex(findLastEnabled());
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (activeIndex >= 0) {
          commitOption(activeIndex);
        } else {
          closeMenu(true);
        }
        return;
      }
      if (event.key === 'Tab') {
        closeMenu(false);
        return;
      }
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      typeBufferRef.current += event.key.toLowerCase();
      if (typeTimerRef.current !== null) {
        window.clearTimeout(typeTimerRef.current);
      }
      typeTimerRef.current = window.setTimeout(() => {
        typeBufferRef.current = '';
      }, 650);

      const query = typeBufferRef.current;
      const startIdx = isOpen && activeIndex >= 0 ? activeIndex + 1 : 0;
      for (let offset = 0; offset < options.length; offset += 1) {
        const idx = (startIdx + offset) % options.length;
        const candidate = options[idx];
        if (candidate && !candidate.disabled && candidate.label.toLowerCase().startsWith(query)) {
          if (isOpen) {
            setActiveIndex(idx);
          } else {
            onChange(candidate.value);
          }
          break;
        }
      }
    }
  };

  const sizeStyles =
    size === 'sm' ? 'px-3 py-1.5 text-xs rounded-lg' : 'px-3.5 py-2 text-sm rounded-xl';

  const activeDescendantId =
    isOpen && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined;

  return (
    <div className={`relative w-full ${className}`} data-no-hide>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={activeDescendantId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        onClick={() => (isOpen ? closeMenu(true) : openMenu('selected'))}
        onKeyDown={handleTriggerKeyDown}
        className={`w-full flex items-center justify-between gap-2 text-left bg-[#080d1a]/80 border ${sizeStyles} transition-[border-color,box-shadow,background-color,opacity] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 disabled:opacity-40 disabled:cursor-not-allowed ${
          isOpen
            ? 'border-cyan-400/75 bg-[#0b1324] text-white shadow-[0_0_0_2px_rgba(34,211,238,0.16),0_0_16px_rgba(34,211,238,0.16)]'
            : 'border-white/10 hover:border-cyan-500/40 text-slate-100'
        } ${triggerClassName}`}
      >
        <span className={`truncate ${selectedOption ? '' : 'text-slate-400'}`}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-cyan-400' : 'text-slate-400'
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            data-no-hide
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            style={{
              position: 'fixed',
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: `${coords.maxHeight}px`,
            }}
            className={`z-[200] overflow-y-auto overflow-x-hidden rounded-xl bg-[#0a101d]/95 backdrop-blur-2xl border border-cyan-500/35 p-1 shadow-[0_14px_38px_rgba(0,0,0,0.72),0_0_20px_rgba(34,211,238,0.14)] cyber-select-listbox ${menuClassName}`}
          >
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isActive = idx === activeIndex;
              return (
                <button
                  key={opt.value}
                  ref={(el) => {
                    optionRefs.current[idx] = el;
                  }}
                  id={`${listboxId}-opt-${idx}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  onMouseEnter={() => {
                    if (!opt.disabled) setActiveIndex(idx);
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() => commitOption(idx)}
                  className={`w-full flex items-center justify-between gap-2 text-left rounded-lg px-2.5 ${
                    size === 'sm' ? 'py-1.5 text-xs' : 'py-2 text-sm'
                  } transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isSelected
                      ? 'bg-cyan-500/18 text-cyan-200 font-semibold border border-cyan-400/25 shadow-[inset_0_0_12px_rgba(34,211,238,0.08)]'
                      : isActive
                      ? 'bg-white/[0.07] text-white border border-transparent'
                      : 'text-slate-300 border border-transparent hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
};

export default CustomSelect;
