import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Lock, LogOut, Moon, Power, RotateCcw, Trash2, X } from 'lucide-react';
import type { TranslationKey } from '../locales';
import type { CategoryRecord } from '../../shared/categories';
import Tooltip from '../Tooltip';
import { Checkbox } from './Checkbox';
import { EnterKeyBadge, EscKeyBadge } from '../KeyBadge';
import {
  MODAL_SHADOW_AMBER,
  MODAL_SHADOW_CYAN,
  MODAL_SHADOW_NEUTRAL,
  MODAL_SHADOW_PURPLE,
  MODAL_SHADOW_ROSE,
  MODAL_SHADOW_SKY,
} from './modalTheme';

export type PowerConfirmAction = 'shutdown' | 'restart' | 'sleep' | 'lock' | 'signout';

export interface ConfirmAppTarget {
  id: number;
  name: string;
}

export interface ConfirmBackupTarget {
  file: string;
}

interface ConfirmDialogFrameProps {
  zIndexClass: string;
  backdropClass?: string;
  maxWidthClass?: string;
  borderClass: string;
  shadowClass: string;
  headerBgClass: string;
  titleColorClass: string;
  icon: React.ReactNode;
  title: string;
  closeLabel: string;
  cancelLabel: string;
  confirmLabel: React.ReactNode;
  confirmButtonClass: string;
  confirmBadgeVariant?: 'primary' | 'danger';
  showConfirmEnterBadge?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
}

const ConfirmDialogFrame: React.FC<ConfirmDialogFrameProps> = ({
  zIndexClass,
  backdropClass = 'bg-black/60 backdrop-blur-sm',
  maxWidthClass = 'max-w-sm',
  borderClass,
  shadowClass,
  headerBgClass,
  titleColorClass,
  icon,
  title,
  closeLabel,
  cancelLabel,
  confirmLabel,
  confirmButtonClass,
  confirmBadgeVariant = 'primary',
  showConfirmEnterBadge = true,
  onCancel,
  onConfirm,
  children,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={(e) => {
      e.stopPropagation();
      onCancel();
    }}
    className={`fixed inset-0 ${zIndexClass} flex items-center justify-center p-4 ${backdropClass}`}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0, y: 20 }}
      onClick={(e) => e.stopPropagation()}
      data-cyberbot-obstacle="center"
      className={`w-full ${maxWidthClass} bg-[#0d131f]/95 backdrop-blur-2xl border ${borderClass} rounded-2xl ${shadowClass} overflow-hidden`}
    >
      <div className={`px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 ${headerBgClass}`}>
        <h2 className={`text-base font-semibold flex items-center gap-2 ${titleColorClass}`}>
          {icon}
          {title}
        </h2>
        <Tooltip label={closeLabel} placement="bottom">
          <button
            type="button"
            onClick={onCancel}
            aria-label={closeLabel}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white focus:outline-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </Tooltip>
      </div>

      <div className="p-6 space-y-4">
        {children}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-medium text-sm border border-white/10 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <span>{cancelLabel}</span>
            <EscKeyBadge />
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl font-cyber font-bold text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 ${confirmButtonClass}`}
          >
            {confirmLabel}
            {showConfirmEnterBadge && <EnterKeyBadge variant={confirmBadgeVariant} />}
          </button>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

const POWER_ACTION_STYLES: Record<
  PowerConfirmAction,
  {
    frameClass: string;
    iconBoxClass: string;
    buttonClass: string;
    badgeVariant: 'primary' | 'danger';
    titleKey: TranslationKey;
    confirmKey: TranslationKey;
    icon: React.ReactNode;
  }
> = {
  shutdown: {
    frameClass: `border-rose-500/35 ${MODAL_SHADOW_ROSE}`,
    iconBoxClass: 'bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.14)]',
    buttonClass: 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.1)]',
    badgeVariant: 'danger',
    titleKey: 'power_confirm_shutdown_title',
    confirmKey: 'power_confirm_shutdown_now',
    icon: <Power className="w-8 h-8" />,
  },
  restart: {
    frameClass: `border-amber-500/35 ${MODAL_SHADOW_AMBER}`,
    iconBoxClass: 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.14)]',
    buttonClass: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.1)]',
    badgeVariant: 'primary',
    titleKey: 'power_confirm_restart_title',
    confirmKey: 'power_confirm_restart_now',
    icon: <RotateCcw className="w-8 h-8" />,
  },
  sleep: {
    frameClass: `border-sky-500/35 ${MODAL_SHADOW_SKY}`,
    iconBoxClass: 'bg-sky-500/15 border-sky-500/30 text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.14)]',
    buttonClass: 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 shadow-[0_0_8px_rgba(56,189,248,0.1)]',
    badgeVariant: 'primary',
    titleKey: 'power_confirm_sleep_title',
    confirmKey: 'power_confirm_sleep_now',
    icon: <Moon className="w-8 h-8" />,
  },
  signout: {
    frameClass: `border-purple-500/35 ${MODAL_SHADOW_PURPLE}`,
    iconBoxClass: 'bg-purple-500/15 border-purple-500/30 text-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.14)]',
    buttonClass: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 shadow-[0_0_8px_rgba(192,132,252,0.1)]',
    badgeVariant: 'primary',
    titleKey: 'power_confirm_signout_title',
    confirmKey: 'power_confirm_signout_now',
    icon: <LogOut className="w-8 h-8" />,
  },
  lock: {
    frameClass: `border-cyan-500/35 ${MODAL_SHADOW_CYAN}`,
    iconBoxClass: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.14)]',
    buttonClass: 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(34,211,238,0.1)]',
    badgeVariant: 'primary',
    titleKey: 'power_confirm_lock_title',
    confirmKey: 'power_confirm_lock_now',
    icon: <Lock className="w-8 h-8" />,
  },
};

export interface AppConfirmModalsProps {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  getCategoryDisplayName: (cat: Pick<CategoryRecord, 'id' | 'name'>) => string;

  appToDelete: ConfirmAppTarget | null;
  dontAskAgainOnAppDelete: boolean;
  onChangeDontAskAgainOnAppDelete: (val: boolean) => void;
  onCancelDeleteApp: () => void;
  onConfirmDeleteApp: () => void;

  categoryToDelete: CategoryRecord | null;
  onCancelDeleteCategory: () => void;
  onConfirmDeleteCategory: (cat: CategoryRecord) => void;

  confirmResetType: 'most-used' | 'recent' | null;
  onCancelReset: () => void;
  onConfirmReset: (type: 'most-used' | 'recent') => void;

  backupToRestore: ConfirmBackupTarget | null;
  onCancelRestoreBackup: () => void;
  onConfirmRestoreBackup: (target: ConfirmBackupTarget) => void;

  backupToDelete: ConfirmBackupTarget | null;
  onCancelDeleteBackup: () => void;
  onConfirmDeleteBackup: (target: ConfirmBackupTarget) => void;

  isFactoryResetOpen: boolean;
  factoryResetIncludeApps: boolean;
  onChangeFactoryResetIncludeApps: (val: boolean) => void;
  onCancelFactoryReset: () => void;
  onConfirmFactoryReset: (includeApps: boolean) => void;

  powerConfirmAction: PowerConfirmAction | null;
  powerScheduleChoice: 'now' | 5 | 10 | 15 | 30 | 'custom';
  powerScheduleCustomMinutes: string;
  onChangePowerScheduleChoice: (val: 'now' | 5 | 10 | 15 | 30 | 'custom') => void;
  onChangePowerScheduleCustomMinutes: (val: string) => void;
  powerForceClose: boolean;
  onChangePowerForceClose: (val: boolean) => void;
  onCancelPowerAction: () => void;
  onExecutePowerAction: (action: PowerConfirmAction, forceClose: boolean) => void;
}

/**
 * Coordinates the launcher confirmation and system-power modals outside App.tsx
 * with unified subdued shadows and suite controls.
 */
export const AppConfirmModals: React.FC<AppConfirmModalsProps> = ({
  t,
  getCategoryDisplayName,
  appToDelete,
  dontAskAgainOnAppDelete,
  onChangeDontAskAgainOnAppDelete,
  onCancelDeleteApp,
  onConfirmDeleteApp,
  categoryToDelete,
  onCancelDeleteCategory,
  onConfirmDeleteCategory,
  confirmResetType,
  onCancelReset,
  onConfirmReset,
  backupToRestore,
  onCancelRestoreBackup,
  onConfirmRestoreBackup,
  backupToDelete,
  onCancelDeleteBackup,
  onConfirmDeleteBackup,
  isFactoryResetOpen,
  factoryResetIncludeApps,
  onChangeFactoryResetIncludeApps,
  onCancelFactoryReset,
  onConfirmFactoryReset,
  powerConfirmAction,
  powerScheduleChoice,
  powerScheduleCustomMinutes,
  onChangePowerScheduleChoice,
  onChangePowerScheduleCustomMinutes,
  powerForceClose,
  onChangePowerForceClose,
  onCancelPowerAction,
  onExecutePowerAction,
}) => {
  const powerStyle = powerConfirmAction ? POWER_ACTION_STYLES[powerConfirmAction] : null;
  const customMinutesRef = React.useRef<HTMLInputElement | null>(null);
  const customMinutes = parseInt(powerScheduleCustomMinutes, 10);
  const customMinutesInvalid = powerScheduleChoice === 'custom'
    && (!Number.isFinite(customMinutes) || customMinutes < 1 || customMinutes > 1440);

  return (
    <>
      <AnimatePresence>
        {appToDelete && (
          <ConfirmDialogFrame
            zIndexClass="z-[120]"
            borderClass="border-red-500/30"
            shadowClass={MODAL_SHADOW_NEUTRAL}
            headerBgClass="bg-red-500/10"
            titleColorClass="text-red-300"
            icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
            title={t('confirm_delete_app_title')}
            closeLabel={t('confirm_reset_btn_cancel')}
            cancelLabel={t('confirm_reset_btn_cancel')}
            confirmLabel={<span>{t('ctx_delete_app')}</span>}
            confirmButtonClass="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.08)]"
            confirmBadgeVariant="danger"
            onCancel={onCancelDeleteApp}
            onConfirm={onConfirmDeleteApp}
          >
            <p className="text-sm text-slate-300 leading-relaxed">
              {t('confirm_delete_app_desc', { name: appToDelete.name })}
            </p>
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 hover:text-white select-none py-1">
              <Checkbox
                checked={dontAskAgainOnAppDelete}
                onChange={onChangeDontAskAgainOnAppDelete}
              />
              <span>{t('confirm_delete_app_dont_ask')}</span>
            </label>
          </ConfirmDialogFrame>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {categoryToDelete && (
          <ConfirmDialogFrame
            zIndexClass="z-[120]"
            borderClass="border-red-500/30"
            shadowClass={MODAL_SHADOW_NEUTRAL}
            headerBgClass="bg-red-500/10"
            titleColorClass="text-red-400"
            icon={<Trash2 className="w-5 h-5 text-red-400" />}
            title={t('confirm_delete_category_title')}
            closeLabel={t('confirm_reset_btn_cancel')}
            cancelLabel={t('confirm_delete_category_btn_cancel')}
            confirmLabel={<span>{t('confirm_delete_category_btn_confirm')}</span>}
            confirmButtonClass="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.08)]"
            confirmBadgeVariant="danger"
            onCancel={onCancelDeleteCategory}
            onConfirm={() => onConfirmDeleteCategory(categoryToDelete)}
          >
            <p className="text-sm text-slate-300 leading-relaxed">
              {t('confirm_delete_category_desc', { name: getCategoryDisplayName(categoryToDelete) })}
            </p>
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: categoryToDelete.color,
                  boxShadow: `0 0 6px ${categoryToDelete.color}`,
                }}
              />
              <span className="text-sm font-semibold text-white truncate">
                {getCategoryDisplayName(categoryToDelete)}
              </span>
            </div>
          </ConfirmDialogFrame>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmResetType && (
          <ConfirmDialogFrame
            zIndexClass="z-[120]"
            borderClass="border-cyan-500/25"
            shadowClass={MODAL_SHADOW_CYAN}
            headerBgClass="bg-cyan-500/10"
            titleColorClass="text-cyan-300"
            icon={<RotateCcw className="w-5 h-5 text-cyan-400" />}
            title={
              confirmResetType === 'most-used'
                ? t('confirm_reset_most_used_title')
                : t('confirm_reset_recents_title')
            }
            closeLabel={t('confirm_reset_btn_cancel')}
            cancelLabel={t('confirm_reset_btn_cancel')}
            confirmLabel={<span>{t('confirm_reset_btn_confirm')}</span>}
            confirmButtonClass="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/35 shadow-[0_0_8px_rgba(34,211,238,0.08)]"
            onCancel={onCancelReset}
            onConfirm={() => onConfirmReset(confirmResetType)}
          >
            <p className="text-sm text-slate-300 leading-relaxed">
              {confirmResetType === 'most-used'
                ? t('confirm_reset_most_used_desc')
                : t('confirm_reset_recents_desc')}
            </p>
          </ConfirmDialogFrame>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {backupToRestore && (
          <ConfirmDialogFrame
            zIndexClass="z-[150]"
            backdropClass="bg-black/80 backdrop-blur-md"
            borderClass="border-cyan-500/25"
            shadowClass={MODAL_SHADOW_CYAN}
            headerBgClass="bg-cyan-500/10"
            titleColorClass="text-cyan-300"
            icon={<RotateCcw className="w-5 h-5 text-cyan-400" />}
            title={t('backup_auto_confirm_restore_title')}
            closeLabel={t('confirm_reset_btn_cancel')}
            cancelLabel={t('confirm_reset_btn_cancel')}
            confirmLabel={<span>{t('backup_auto_btn_restore')}</span>}
            confirmButtonClass="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/35 shadow-[0_0_8px_rgba(34,211,238,0.08)]"
            onCancel={onCancelRestoreBackup}
            onConfirm={() => onConfirmRestoreBackup(backupToRestore)}
          >
            <p className="text-sm text-slate-300 leading-relaxed">
              {t('backup_auto_confirm_restore_desc', { file: backupToRestore.file })}
            </p>
          </ConfirmDialogFrame>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {backupToDelete && (
          <ConfirmDialogFrame
            zIndexClass="z-[150]"
            backdropClass="bg-black/80 backdrop-blur-md"
            borderClass="border-red-500/30"
            shadowClass={MODAL_SHADOW_NEUTRAL}
            headerBgClass="bg-red-500/10"
            titleColorClass="text-red-300"
            icon={<Trash2 className="w-5 h-5 text-red-400" />}
            title={t('backup_auto_confirm_delete_title')}
            closeLabel={t('confirm_reset_btn_cancel')}
            cancelLabel={t('confirm_reset_btn_cancel')}
            confirmLabel={<span>{t('backup_auto_btn_delete')}</span>}
            confirmButtonClass="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/35 shadow-[0_0_8px_rgba(239,68,68,0.08)]"
            confirmBadgeVariant="danger"
            onCancel={onCancelDeleteBackup}
            onConfirm={() => onConfirmDeleteBackup(backupToDelete)}
          >
            <p className="text-sm text-slate-300 leading-relaxed">
              {t('backup_auto_confirm_delete_desc', { file: backupToDelete.file })}
            </p>
          </ConfirmDialogFrame>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFactoryResetOpen && (
          <ConfirmDialogFrame
            zIndexClass="z-[155]"
            backdropClass="bg-black/80 backdrop-blur-md"
            maxWidthClass="max-w-lg"
            borderClass="border-amber-500/30"
            shadowClass={MODAL_SHADOW_AMBER}
            headerBgClass="bg-amber-500/10"
            titleColorClass="text-amber-300"
            icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
            title={t('factory_reset_modal_title')}
            closeLabel={t('confirm_reset_btn_cancel')}
            cancelLabel={t('factory_reset_btn_cancel')}
            confirmLabel={
              <>
                <RotateCcw className="w-4 h-4" />
                <span>{t('factory_reset_btn_confirm')}</span>
              </>
            }
            confirmButtonClass="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.09)]"
            showConfirmEnterBadge={false}
            onCancel={onCancelFactoryReset}
            onConfirm={() => onConfirmFactoryReset(factoryResetIncludeApps)}
          >
            <p className="text-sm text-slate-200 leading-relaxed">{t('factory_reset_modal_intro')}</p>

            <ul className="space-y-2 text-xs text-slate-300 leading-relaxed bg-black/30 border border-white/10 rounded-xl p-3.5 list-disc pl-7">
              <li>{t('factory_reset_item_general')}</li>
              <li>{t('factory_reset_item_appearance')}</li>
              <li>{t('factory_reset_item_system')}</li>
              <li>{t('factory_reset_item_cyberbot')}</li>
            </ul>

            <p className="text-[11px] text-cyan-300/85 bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-3.5 py-2.5 leading-relaxed">
              {t('factory_reset_preserve_note')}
            </p>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-black/30 border border-white/10 hover:border-amber-500/30 transition-colors cursor-pointer select-none">
              <Checkbox
                tone="amber"
                checked={factoryResetIncludeApps}
                onChange={onChangeFactoryResetIncludeApps}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-200 leading-snug">
                  {t('factory_reset_include_apps_label')}
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  {t('factory_reset_include_apps_desc')}
                </div>
              </div>
            </label>
          </ConfirmDialogFrame>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {powerConfirmAction && powerStyle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-no-hide
            className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={onCancelPowerAction}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              data-no-hide
              data-cyberbot-obstacle="center"
              className={`relative w-full max-w-md bg-[#070b13]/95 border rounded-2xl p-6 space-y-5 text-center ${powerStyle.frameClass}`}
            >
              <Tooltip label={t('power_confirm_cancel')} placement="left">
                <button
                  type="button"
                  onClick={onCancelPowerAction}
                  aria-label={t('power_confirm_cancel')}
                  className="absolute top-3.5 right-3.5 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-500 hover:text-white focus:outline-none cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </Tooltip>
              <div className="flex flex-col items-center justify-center pt-2">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 border shadow-inner ${powerStyle.iconBoxClass}`}
                >
                  {powerStyle.icon}
                </div>

                <h3 className="text-lg font-cyber font-bold text-white tracking-wider">
                  {t(powerStyle.titleKey)}
                </h3>

                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  {t('power_confirm_desc')}
                </p>
              </div>

              <div className="space-y-2 px-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left">
                  {t('power_schedule_when')}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['now', 5, 10, 15, 30] as const).map((choice) => (
                    <button
                      key={String(choice)}
                      type="button"
                      onClick={() => onChangePowerScheduleChoice(choice)}
                      className={`px-2 py-2 rounded-xl text-xs font-cyber font-bold transition-all cursor-pointer border ${
                        powerScheduleChoice === choice
                          ? powerStyle.buttonClass
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                      }`}
                    >
                      {choice === 'now' ? t('power_schedule_now') : `${choice} min`}
                    </button>
                  ))}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { onChangePowerScheduleChoice('custom'); customMinutesRef.current?.focus(); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); customMinutesRef.current?.focus(); } }}
                    className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-cyber font-bold transition-all border cursor-text ${
                      powerScheduleChoice === 'custom'
                        ? powerStyle.buttonClass
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                    }`}
                  >
                    <input
                      ref={customMinutesRef}
                      inputMode="numeric"
                      value={powerScheduleCustomMinutes}
                      onChange={(e) => onChangePowerScheduleCustomMinutes(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                      onFocus={() => onChangePowerScheduleChoice('custom')}
                      placeholder="60"
                      aria-label={t('power_schedule_custom')}
                      className="w-8 bg-transparent text-center outline-none placeholder:text-slate-500 text-inherit p-0 border-0 cursor-text"
                    />
                    <span className="opacity-70 pointer-events-none">min</span>
                  </div>
                </div>
              </div>

              {(powerConfirmAction === 'shutdown' ||
                powerConfirmAction === 'restart' ||
                powerConfirmAction === 'signout') && (
                <label className="flex items-center justify-center gap-2.5 cursor-pointer text-xs text-slate-300 hover:text-white select-none py-1">
                  <Checkbox checked={powerForceClose} onChange={onChangePowerForceClose} />
                  <span>{t('power_confirm_force')}</span>
                </label>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCancelPowerAction}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-medium text-sm border border-white/10 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <span>{t('power_confirm_cancel')}</span>
                  <EscKeyBadge />
                </button>
                <button
                  type="button"
                  onClick={() => onExecutePowerAction(powerConfirmAction, powerForceClose)}
                  disabled={customMinutesInvalid}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-cyber font-bold text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${powerStyle.buttonClass}`}
                >
                  <span>
                    {powerScheduleChoice === 'now'
                      ? t(powerStyle.confirmKey)
                      : t('power_schedule_in', {
                        minutes: powerScheduleChoice === 'custom'
                          ? (Number.isFinite(customMinutes) ? String(customMinutes) : '…')
                          : String(powerScheduleChoice),
                      })}
                  </span>
                  <EnterKeyBadge variant={powerStyle.badgeVariant} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AppConfirmModals;

