import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { X, AlertTriangle, CircleCheck, ArrowRight } from 'lucide-react';
import type { CyberBotMessage } from './companionTypes';

interface CyberSpeechBubbleProps {
  message: CyberBotMessage;
  onClose: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right';
  closeLabel: string;
}

export const CyberSpeechBubble: React.FC<CyberSpeechBubbleProps> = ({
  message,
  onClose,
  position = 'bottom-right',
  closeLabel,
}) => {
  const reducedMotion = useReducedMotion();
  const isAlert = message.emotion === 'alert';
  const isSuccess = message.emotion === 'success';

  const borderColor = isAlert
    ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
    : isSuccess
    ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
    : 'border-cyan-500/40 shadow-[0_0_25px_rgba(34,211,238,0.2)]';

  const tagBg = isAlert
    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    : isSuccess
    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';

  const statusIcon = isAlert
    ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
    : isSuccess
    ? <CircleCheck className="w-3.5 h-3.5 text-emerald-400" />
    : null;

  const tailPositionClass =
    position === 'bottom-left' ? 'left-[40px]' : 'right-[40px]';

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 10, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0, y: 8, scale: 0.92 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' }}
      role={message.priority === 'high' ? 'alert' : 'status'}
      data-no-hide
      className={`relative w-full min-w-0 rounded-2xl bg-[#070d1d]/95 backdrop-blur-xl border ${borderColor} p-3 text-slate-200 select-none z-50`}
    >
      <button
        type="button"
        aria-label={closeLabel}
        onClick={(e) => {
          e.stopPropagation();
          message.onDismiss?.();
          onClose();
        }}
        className="absolute right-2.5 top-2.5 p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-start gap-2.5 pr-6">
        <img src="/icon-32.png" alt="" aria-hidden="true" className="w-[18px] h-[18px] mt-0.5 shrink-0 object-contain" />
        <div className="min-w-0 flex-1">
          {message.tag && (
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 mb-1 rounded-full border text-[10px] font-cyber font-bold tracking-widest uppercase ${tagBg}`}>
              {statusIcon}
              <span>{message.tag}</span>
            </div>
          )}
          <div className="text-xs font-cyber font-bold tracking-wide text-white leading-relaxed break-words">
            {message.text}
          </div>
          {message.detail && (
            <p className="mt-1 text-[11px] font-medium leading-snug text-cyan-100/70 whitespace-pre-wrap break-words">
              {message.detail}
            </p>
          )}
        </div>
      </div>

      {/* Contextual Action Button */}
      {(message.action || message.secondaryAction || message.tertiaryAction) && (
        <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap justify-end gap-2">
          {message.tertiaryAction && <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              message.tertiaryAction?.onClick();
              onClose();
            }}
            className="inline-flex items-center px-1.5 py-1 text-slate-400 hover:text-slate-200 text-[10px] font-cyber cursor-pointer"
          >
            {message.tertiaryAction.label}
          </button>}
          {message.secondaryAction && <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              message.secondaryAction?.onClick();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-700/40 hover:bg-slate-600/40 text-slate-200 border border-slate-500/40 text-[11px] font-cyber font-bold tracking-wider transition-all duration-200 cursor-pointer"
          >
            {message.secondaryAction.label}
          </button>}
          {message.action && <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              message.action?.onClick();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white border border-cyan-500/40 text-[11px] font-cyber font-bold tracking-wider transition-all duration-200 cursor-pointer active:scale-95"
          >
            <span>{message.action.label}</span>
            <ArrowRight className="w-3 h-3" />
          </button>}
        </div>
      )}

      {/* Speech Bubble Tail Pointing Down */}
      <div
        className={`absolute -bottom-[7px] ${tailPositionClass} w-3.5 h-3.5 bg-[#070d1d] border-r border-b ${
          isAlert ? 'border-amber-500/50' : isSuccess ? 'border-emerald-500/50' : 'border-cyan-500/40'
        } transform rotate-45`}
      />
    </motion.div>
  );
};
