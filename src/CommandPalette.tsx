import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { EscKeyBadge } from './KeyBadge';

export interface CommandPaletteItem {
  id: string;
  group: string;
  label: string;
  description?: string;
  keywords?: string;
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  disabledReason?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandPaletteItem[];
  label: string;
  placeholder: string;
  noResults: string;
  navigateHint?: string;
  executeHint?: string;
  closeHint?: string;
}

export function CommandPalette({
  isOpen,
  onClose,
  commands,
  label,
  placeholder,
  noResults,
  navigateHint = 'Navegar',
  executeHint = 'Ejecutar',
  closeHint = 'Cerrar',
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Filter commands by query (label, description, keywords, group, shortcut)
  const rows = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return commands;
    return commands.filter(cmd => {
      const haystack = [
        cmd.label,
        cmd.description,
        cmd.keywords,
        cmd.group,
        cmd.shortcut,
      ].filter(Boolean).join(' ').toLocaleLowerCase();
      return haystack.includes(needle);
    });
  }, [commands, query]);

  const selectableIndices = useMemo(
    () => rows.flatMap((cmd, index) => (cmd.disabled ? [] : [index])),
    [rows]
  );
  const firstSelectableIndex = selectableIndices[0] ?? -1;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(firstSelectableIndex);
  }, [query, firstSelectableIndex]);

  useEffect(() => {
    if (activeIndex < 0) return;
    listRef.current
      ?.querySelector(`[data-command-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const moveActive = (direction: -1 | 1) => {
    if (selectableIndices.length === 0) {
      setActiveIndex(-1);
      return;
    }
    const currentPos = selectableIndices.indexOf(activeIndex);
    const nextPos =
      currentPos < 0
        ? direction === 1
          ? 0
          : selectableIndices.length - 1
        : (currentPos + direction + selectableIndices.length) % selectableIndices.length;
    setActiveIndex(selectableIndices[nextPos]);
  };

  const run = (cmd: CommandPaletteItem) => {
    if (cmd.disabled) return;
    onClose();
    cmd.onSelect();
  };

  const handleDialogKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          data-no-hide
          className="fixed inset-0 z-[140] flex items-start justify-center bg-black/75 backdrop-blur-md px-4 pt-[10vh]"
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            data-cyberbot-obstacle="top"
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ scale: 0.96, opacity: 0, y: -16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: -16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleDialogKeyDown}
            data-no-hide
            className="flex max-h-[72vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#090e17]/95 shadow-[0_0_50px_rgba(0,0,0,0.85),0_0_20px_rgba(34,211,238,0.12)] backdrop-blur-2xl select-none"
          >
            {/* Top Search Bar */}
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 bg-white/[0.02]">
              <Search aria-hidden="true" className="w-5 h-5 flex-shrink-0 text-cyan-400" />
              <input
                ref={inputRef}
                type="search"
                autoComplete="off"
                spellCheck={false}
                value={query}
                placeholder={placeholder}
                aria-label={placeholder}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    moveActive(1);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    moveActive(-1);
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const command = rows[activeIndex];
                    if (command) run(command);
                  }
                }}
                className="h-10 min-w-0 flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Clear query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
                <EscKeyBadge />
              </div>
            </div>

            {/* Commands List */}
            <div
              ref={listRef}
              role="listbox"
              aria-label={label}
              className="min-h-0 overflow-y-auto p-2 space-y-0.5 custom-scrollbar"
            >
              {rows.length === 0 ? (
                <div role="status" className="px-4 py-12 text-center text-sm text-slate-500">
                  {noResults}
                </div>
              ) : (
                rows.map((cmd, index) => {
                  const startsGroup = index === 0 || rows[index - 1].group !== cmd.group;
                  const selected = index === activeIndex;

                  return (
                    <div key={cmd.id} role="presentation">
                      {startsGroup && (
                        <div
                          role="presentation"
                          className="px-3 pb-1.5 pt-3 text-[10px] font-cyber font-bold uppercase tracking-wider text-cyan-400/80 flex items-center gap-2 first:pt-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 shadow-[0_0_6px_#22d3ee]" />
                          <span>{cmd.group}</span>
                        </div>
                      )}
                      <button
                        id={`command-palette-option-${index}`}
                        data-command-index={index}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        aria-disabled={cmd.disabled || undefined}
                        disabled={cmd.disabled}
                        onMouseEnter={() => {
                          if (!cmd.disabled) setActiveIndex(index);
                        }}
                        onClick={() => run(cmd)}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-all cursor-pointer border ${
                          cmd.disabled
                            ? 'cursor-not-allowed text-slate-600 border-transparent opacity-50'
                            : selected
                            ? 'bg-cyan-500/15 border-cyan-400/40 text-white shadow-[0_0_12px_rgba(34,211,238,0.15)]'
                            : 'text-slate-300 border-transparent hover:bg-white/[0.04] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {cmd.icon && (
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-transform ${
                                selected
                                  ? 'bg-cyan-500/25 border-cyan-400/50 text-cyan-300 scale-105 shadow-[0_0_8px_rgba(34,211,238,0.3)]'
                                  : 'bg-white/5 border-white/10 text-slate-400'
                              }`}
                            >
                              {cmd.icon}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold truncate leading-tight">
                              {cmd.label}
                            </div>
                            {(cmd.disabledReason || cmd.description) && (
                              <div
                                className={`text-[10px] truncate mt-0.5 leading-tight ${
                                  cmd.disabled ? 'text-slate-600' : 'text-slate-400'
                                }`}
                              >
                                {cmd.disabledReason || cmd.description}
                              </div>
                            )}
                          </div>
                        </div>

                        {cmd.shortcut && !cmd.disabled && (
                          <kbd className="keyboard-hint shrink-0 text-[10px]">
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Keyboard Nav Hints */}
            <div className="border-t border-white/10 px-4 py-2 bg-white/[0.01] flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-slate-400 font-mono">↑↓</kbd>
                  <span>{navigateHint}</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-slate-400 font-mono">↵</kbd>
                  <span>{executeHint}</span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-slate-400 font-mono">Esc</kbd>
                <span>{closeHint}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;
