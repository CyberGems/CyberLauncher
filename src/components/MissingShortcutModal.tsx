import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, FolderSearch, Trash2, X } from 'lucide-react';
import Tooltip from '../Tooltip';
import type { TranslationKey } from '../locales';

export interface MissingShortcutModalProps {
  isOpen: boolean;
  appName: string;
  savedPath: string;
  isRelinking: boolean;
  t: (key: TranslationKey, variables?: Record<string, string>) => string;
  onClose: () => void;
  onDelete: () => void;
  onLocate: () => void;
}

/** Recovery dialog shown when a shortcut target no longer exists at its saved path. */
export const MissingShortcutModal: React.FC<MissingShortcutModalProps> = ({
  isOpen,
  appName,
  savedPath,
  isRelinking,
  t,
  onClose,
  onDelete,
  onLocate,
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        data-no-hide
        className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        onClick={() => { if (!isRelinking) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 12 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="missing-shortcut-title"
          onClick={(e) => e.stopPropagation()}
          data-no-hide
          data-cyberbot-obstacle="center"
          className="w-full max-w-md overflow-hidden rounded-2xl border border-amber-500/30 bg-[#070b13]/95 shadow-[0_16px_36px_rgba(0,0,0,0.75),0_0_12px_rgba(245,158,11,0.06)] backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500/[0.07] px-5 py-4">
            <h2 id="missing-shortcut-title" className="flex items-center gap-2.5 text-base font-semibold text-amber-300">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              {t('missing_shortcut_title')}
            </h2>
            <Tooltip label={t('confirm_reset_btn_cancel')} placement="bottom">
              <button
                type="button"
                aria-label={t('confirm_reset_btn_cancel')}
                disabled={isRelinking}
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>

          <div className="space-y-4 p-5">
            <p className="text-sm leading-relaxed text-slate-300">
              {t('missing_shortcut_message', { name: appName })}
            </p>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {t('missing_shortcut_path')}
              </span>
              <div className="break-all rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-xs text-slate-300">
                {savedPath}
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-500">
              {t('missing_shortcut_hint')}
            </p>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                disabled={isRelinking}
                onClick={onDelete}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/35 bg-rose-500/15 px-4 py-2.5 text-sm font-medium text-rose-200 transition-colors hover:bg-rose-500/25 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                {t('missing_shortcut_delete')}
              </button>
              <button
                type="button"
                disabled={isRelinking}
                onClick={onLocate}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-4 py-2.5 text-sm font-semibold text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.1)] transition-colors hover:bg-cyan-500/25 disabled:cursor-wait disabled:opacity-60 cursor-pointer"
              >
                <FolderSearch className="h-4 w-4" />
                {isRelinking ? t('missing_shortcut_locating') : t('missing_shortcut_locate')}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

