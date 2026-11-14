import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ClipboardPaste, Copy, CheckSquare, Redo2, Scissors, Trash2, Undo2 } from 'lucide-react';
import type { TranslationKey } from '../locales';

const EDITABLE_INPUT_TYPES = new Set([
  '',
  'text',
  'search',
  'password',
  'url',
  'email',
  'tel',
  'number',
  'date',
  'datetime-local',
  'time',
  'month',
  'week',
]);

type EditableElement = HTMLInputElement | HTMLTextAreaElement | HTMLElement;

interface MenuState {
  x: number;
  y: number;
  target: EditableElement;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  hasText: boolean;
  readOnly: boolean;
  canPaste: boolean;
  clipboardText: string;
}

interface TextFieldContextMenuProps {
  t: (key: TranslationKey) => string;
}

function getEditableTarget(rawTarget: EventTarget | null): EditableElement | null {
  if (!(rawTarget instanceof HTMLElement)) return null;
  if (rawTarget instanceof HTMLTextAreaElement) {
    return rawTarget.disabled ? null : rawTarget;
  }
  if (rawTarget instanceof HTMLInputElement) {
    const type = (rawTarget.type || 'text').toLowerCase();
    if (!EDITABLE_INPUT_TYPES.has(type) || rawTarget.disabled) return null;
    return rawTarget;
  }
  const editableRoot = rawTarget.closest('[contenteditable]') as HTMLElement | null;
  if (editableRoot && editableRoot.isContentEditable) {
    return editableRoot;
  }
  return null;
}

function getSelectionInfo(target: EditableElement): { hasSelection: boolean; hasText: boolean; selectedText: string } {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    const value = target.value ?? '';
    let start: number | null = null;
    let end: number | null = null;
    try {
      start = target.selectionStart;
      end = target.selectionEnd;
    } catch {
      // number/date/time inputs do not expose selectionStart/selectionEnd in Chromium
    }
    if (start !== null && end !== null) {
      return {
        hasSelection: start !== end,
        hasText: value.length > 0,
        selectedText: value.slice(start, end),
      };
    }
    const docSel = window.getSelection()?.toString() || '';
    return {
      hasSelection: docSel.length > 0,
      hasText: value.length > 0,
      selectedText: docSel,
    };
  }
  const sel = window.getSelection();
  const selectedText = sel ? sel.toString() : '';
  const textContent = target.innerText || target.textContent || '';
  return {
    hasSelection: selectedText.length > 0 && target.contains(sel?.anchorNode || null),
    hasText: textContent.trim().length > 0 || textContent.length > 0,
    selectedText,
  };
}

function isTargetReadOnly(target: EditableElement): boolean {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return target.readOnly || target.disabled;
  }
  return target.getAttribute('aria-readonly') === 'true';
}

function setNativeInputValue(target: HTMLInputElement | HTMLTextAreaElement, nextValue: string) {
  const proto = target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
  if (descriptor?.set) {
    descriptor.set.call(target, nextValue);
  } else {
    target.value = nextValue;
  }
  target.dispatchEvent(new Event('input', { bubbles: true }));
}

function writeClipboardText(text: string) {
  if (!text) return;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {
      try {
        document.execCommand('copy');
      } catch {
        // ignore clipboard fallback failures
      }
    });
    return;
  }
  try {
    document.execCommand('copy');
  } catch {
    // ignore clipboard fallback failures
  }
}

/**
 * Shared styled context menu for every editable text field across the app.
 */
export const TextFieldContextMenu: React.FC<TextFieldContextMenuProps> = ({ t }) => {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [coords, setCoords] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const menuRef = useRef<HTMLDivElement | null>(null);
  const openSeqRef = useRef(0);

  const closeMenu = useCallback(() => {
    setMenu(null);
  }, []);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = getEditableTarget(e.target);
      if (!target) {
        setMenu(null);
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (document.activeElement !== target) {
        target.focus({ preventScroll: true });
      }

      const readOnly = isTargetReadOnly(target);
      const { hasSelection, hasText } = getSelectionInfo(target);
      let canUndo = false;
      let canRedo = false;
      if (!readOnly) {
        try {
          canUndo = document.queryCommandEnabled('undo');
          canRedo = document.queryCommandEnabled('redo');
        } catch {
          canUndo = false;
          canRedo = false;
        }
      }

      const seq = ++openSeqRef.current;
      setCoords({ left: e.clientX, top: e.clientY });
      setMenu({
        x: e.clientX,
        y: e.clientY,
        target,
        canUndo,
        canRedo,
        hasSelection,
        hasText,
        readOnly,
        canPaste: false,
        clipboardText: '',
      });

      if (!readOnly && navigator.clipboard?.readText) {
        navigator.clipboard
          .readText()
          .then((clip) => {
            if (openSeqRef.current !== seq) return;
            setMenu((prev) =>
              prev && prev.target === target
                ? { ...prev, canPaste: clip.length > 0, clipboardText: clip }
                : prev
            );
          })
          .catch(() => {
            if (openSeqRef.current !== seq) return;
            setMenu((prev) =>
              prev && prev.target === target
                ? { ...prev, canPaste: false, clipboardText: '' }
                : prev
            );
          });
      }
    };

    document.addEventListener('contextmenu', handleContextMenu, true);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, []);

  useLayoutEffect(() => {
    if (!menu || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const pad = 8;
    const left = Math.max(pad, Math.min(menu.x, window.innerWidth - rect.width - pad));
    const top = Math.max(pad, Math.min(menu.y, window.innerHeight - rect.height - pad));
    setCoords({ left, top });
  }, [menu?.x, menu?.y, menu?.canPaste]);

  useEffect(() => {
    if (!menu) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      closeMenu();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        const target = menu.target;
        closeMenu();
        target.focus({ preventScroll: true });
      }
    };
    window.addEventListener('mousedown', handlePointerDown, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu);
    window.addEventListener('blur', closeMenu);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('scroll', closeMenu, true);
      window.removeEventListener('resize', closeMenu);
      window.removeEventListener('blur', closeMenu);
    };
  }, [menu, closeMenu]);

  const runAction = useCallback(
    (action: 'undo' | 'redo' | 'cut' | 'copy' | 'paste' | 'selectAll' | 'delete') => {
      if (!menu) return;
      const { target, clipboardText } = menu;
      closeMenu();
      target.focus({ preventScroll: true });

      if (action === 'undo') {
        try {
          document.execCommand('undo');
        } catch {
          // ignore
        }
        return;
      }

      if (action === 'redo') {
        try {
          document.execCommand('redo');
        } catch {
          // ignore
        }
        return;
      }

      if (action === 'selectAll') {
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
          try {
            target.select();
            return;
          } catch {
            // fallback below
          }
        }
        try {
          document.execCommand('selectAll');
        } catch {
          // ignore
        }
        return;
      }

      if (action === 'copy') {
        const { selectedText } = getSelectionInfo(target);
        writeClipboardText(selectedText);
        return;
      }

      if (action === 'cut') {
        const { selectedText } = getSelectionInfo(target);
        writeClipboardText(selectedText);
        let ok = false;
        try {
          ok = document.execCommand('delete');
        } catch {
          ok = false;
        }
        if (!ok && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
          try {
            const start = target.selectionStart ?? 0;
            const end = target.selectionEnd ?? start;
            const next = target.value.slice(0, start) + target.value.slice(end);
            setNativeInputValue(target, next);
            target.setSelectionRange(start, start);
          } catch {
            // ignore
          }
        }
        return;
      }

      if (action === 'delete') {
        let ok = false;
        try {
          ok = document.execCommand('delete');
        } catch {
          ok = false;
        }
        if (!ok && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
          try {
            const start = target.selectionStart ?? 0;
            const end = target.selectionEnd ?? start;
            const next = target.value.slice(0, start) + target.value.slice(end);
            setNativeInputValue(target, next);
            target.setSelectionRange(start, start);
          } catch {
            // ignore
          }
        }
        return;
      }

      if (action === 'paste' && clipboardText) {
        let ok = false;
        try {
          ok = document.execCommand('insertText', false, clipboardText);
        } catch {
          ok = false;
        }
        if (!ok && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
          try {
            const start = target.selectionStart ?? target.value.length;
            const end = target.selectionEnd ?? start;
            const next = target.value.slice(0, start) + clipboardText + target.value.slice(end);
            setNativeInputValue(target, next);
            const caret = start + clipboardText.length;
            target.setSelectionRange(caret, caret);
          } catch {
            setNativeInputValue(target, clipboardText);
          }
        }
      }
    },
    [menu, closeMenu]
  );

  if (!menu || typeof document === 'undefined') return null;

  const items: Array<
    | { type: 'separator'; id: string }
    | {
        type: 'action';
        id: 'undo' | 'redo' | 'cut' | 'copy' | 'paste' | 'selectAll' | 'delete';
        label: string;
        shortcut?: string;
        disabled: boolean;
        icon: React.ReactNode;
        danger?: boolean;
      }
  > = [
    {
      type: 'action',
      id: 'undo',
      label: t('text_menu_undo'),
      shortcut: 'Ctrl+Z',
      disabled: menu.readOnly || !menu.canUndo,
      icon: <Undo2 className="w-3.5 h-3.5 text-slate-400" />,
    },
    {
      type: 'action',
      id: 'redo',
      label: t('text_menu_redo'),
      shortcut: 'Ctrl+Y',
      disabled: menu.readOnly || !menu.canRedo,
      icon: <Redo2 className="w-3.5 h-3.5 text-slate-400" />,
    },
    { type: 'separator', id: 'sep-1' },
    {
      type: 'action',
      id: 'cut',
      label: t('text_menu_cut'),
      shortcut: 'Ctrl+X',
      disabled: menu.readOnly || !menu.hasSelection,
      icon: <Scissors className="w-3.5 h-3.5 text-slate-400" />,
    },
    {
      type: 'action',
      id: 'copy',
      label: t('text_menu_copy'),
      shortcut: 'Ctrl+C',
      disabled: !menu.hasSelection,
      icon: <Copy className="w-3.5 h-3.5 text-slate-400" />,
    },
    {
      type: 'action',
      id: 'paste',
      label: t('text_menu_paste'),
      shortcut: 'Ctrl+V',
      disabled: menu.readOnly || !menu.canPaste,
      icon: <ClipboardPaste className="w-3.5 h-3.5 text-slate-400" />,
    },
    { type: 'separator', id: 'sep-2' },
    {
      type: 'action',
      id: 'selectAll',
      label: t('text_menu_select_all'),
      shortcut: 'Ctrl+A',
      disabled: !menu.hasText,
      icon: <CheckSquare className="w-3.5 h-3.5 text-slate-400" />,
    },
    {
      type: 'action',
      id: 'delete',
      label: t('text_menu_delete'),
      disabled: menu.readOnly || !menu.hasSelection,
      icon: <Trash2 className="w-3.5 h-3.5 text-rose-400" />,
      danger: true,
    },
  ];

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={t('text_menu_aria')}
      data-no-hide
      style={{ top: coords.top, left: coords.left }}
      className="fixed z-[300] min-w-[208px] rounded-xl bg-[#0d131f]/95 backdrop-blur-2xl border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.8)] p-1.5 select-none animate-in fade-in zoom-in-95 duration-100"
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item) => {
        if (item.type === 'separator') {
          return <div key={item.id} className="my-1 h-px bg-white/10" />;
        }
        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runAction(item.id)}
            className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between gap-4 transition-colors ${
              item.disabled
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : item.danger
                ? 'text-rose-300 hover:bg-rose-500/15 hover:text-rose-200 cursor-pointer'
                : 'text-slate-200 hover:bg-white/10 hover:text-white cursor-pointer'
            }`}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <span className={item.disabled ? 'opacity-60' : ''}>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </span>
            {item.shortcut && (
              <span className="text-[10px] font-mono text-slate-500 shrink-0">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>,
    document.body
  );
};
