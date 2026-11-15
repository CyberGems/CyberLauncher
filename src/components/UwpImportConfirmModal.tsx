import React from 'react';
import { motion } from 'motion/react';
import type { TranslationKey } from '../locales';
import { CustomSelect, type CustomSelectOption } from './CustomSelect';
import { EnterKeyBadge, EscKeyBadge } from '../KeyBadge';
import { MODAL_SHADOW_CYAN } from './modalTheme';

export interface UwpImportAppPreview {
  name: string;
  aumid: string;
  icon: string;
}

export interface UwpImportConfirmModalProps {
  app: UwpImportAppPreview;
  category: string;
  onChangeCategory: (category: string) => void;
  categoryOptions: CustomSelectOption[];
  onCancel: () => void;
  onConfirm: () => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

/**
 * Confirmation dialog when importing a discovered Microsoft Store / UWP app.
 * Highlights the selected app's icon and name while keeping its action header subtle.
 */
export const UwpImportConfirmModal: React.FC<UwpImportConfirmModalProps> = ({
  app,
  category,
  onChangeCategory,
  categoryOptions,
  onCancel,
  onConfirm,
  t,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
      className="absolute inset-0 bg-black/85 backdrop-blur-md rounded-2xl flex items-center justify-center p-4 z-40 border border-cyan-500/15"
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className={`bg-[#0b1220] border border-cyan-500/25 rounded-2xl p-6 max-w-sm w-full space-y-5 ${MODAL_SHADOW_CYAN}`}
      >
        <div className="space-y-3">
          <div className="text-[10px] font-cyber font-bold text-slate-400 tracking-widest uppercase">
            {t('uwp_confirm_title')}
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-black/35 border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
              {app.icon ? (
                <img src={app.icon} alt={app.name} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-cyan-500/10 rounded-lg text-cyan-400 font-cyber font-bold text-[11px]">
                  UWP
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-bold text-white leading-snug break-words font-sans">
                {app.name}
              </h4>
              <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                {app.aumid}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-cyber font-bold text-slate-400 tracking-widest uppercase block">
            {t('uwp_confirm_category')}
          </label>
          <CustomSelect
            size="sm"
            value={category}
            onChange={onChangeCategory}
            ariaLabel={t('uwp_confirm_category')}
            triggerClassName="bg-black/40 rounded-xl px-3 py-2 text-xs text-slate-200"
            options={categoryOptions}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors border border-slate-700 inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{t('uwp_confirm_cancel')}</span>
            <EscKeyBadge />
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-cyan-500/12 hover:bg-cyan-500/20 text-cyan-300 rounded-xl text-xs font-cyber font-bold transition-all border border-cyan-400/35 shadow-[0_0_6px_rgba(34,211,238,0.08)] inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{t('uwp_confirm_ok')}</span>
            <EnterKeyBadge variant="primary" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UwpImportConfirmModal;
