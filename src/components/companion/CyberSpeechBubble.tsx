import { useCyberBotReducedMotion } from './useCyberBotReducedMotion';
import React from 'react';
import { motion } from 'motion/react';
import { X, AlertTriangle, Bot, CircleCheck, ArrowRight } from 'lucide-react';
import { useCyberBotTyping } from './useCyberBotTyping';
import { CyberBotTypingText } from './CyberBotTypingText';
import type { CyberBotMessage } from './companionTypes';
import Tooltip from '../../Tooltip';
import { CYBERBOT_NAME_MAX_LENGTH, normalizeCyberBotName } from './cyberBotName';
import {
  CYBERBOT_BUBBLE_SURFACE,
  CYBERBOT_BUBBLE_TAIL_SURFACE,
  CYBERBOT_BUBBLE_TONES,
} from './cyberBotBubbleTheme';

interface CyberSpeechBubbleProps {
  message: CyberBotMessage;
  wide?: boolean;
  onClose: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right';
  closeLabel: string;
  onTypingChange?: (key: string, typing: boolean) => void;
}

export const CyberSpeechBubble: React.FC<CyberSpeechBubbleProps> = ({
  message,
  wide = false,
  onClose,
  position = 'bottom-right',
  closeLabel,
  onTypingChange,
}) => {
  const reducedMotion = useCyberBotReducedMotion();
  const [nameDraft, setNameDraft] = React.useState('');
  const nameInputId = React.useId();
  React.useEffect(() => { setNameDraft(''); }, [message.id]);
  const normalizedName = normalizeCyberBotName(nameDraft);
  const typing = useCyberBotTyping(message.id, message.text, message.detail);
  React.useLayoutEffect(() => { onTypingChange?.(message.id, typing.isTyping); }, [message.id, typing.isTyping, onTypingChange]);
  React.useLayoutEffect(() => () => onTypingChange?.(message.id, false), [message.id, onTypingChange]);
  const isAlert = message.emotion === 'alert';
  const isSuccess = message.emotion === 'success';
  const bubbleTone = isAlert
    ? CYBERBOT_BUBBLE_TONES.alert
    : isSuccess
    ? CYBERBOT_BUBBLE_TONES.success
    : CYBERBOT_BUBBLE_TONES.default;
  const borderColor = bubbleTone.frame;

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
      aria-atomic="true"
      data-no-hide
      onPointerDown={(event) => event.stopPropagation()}
      className={`relative ${wide ? 'w-full' : 'w-fit min-w-[min(200px,100%)]'} max-w-full rounded-2xl ${CYBERBOT_BUBBLE_SURFACE} border ${borderColor} p-3 text-slate-200 select-none z-50`}
    >
      <Tooltip label={closeLabel} placement="top">
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
      </Tooltip>

      <div className={`grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2.5 ${wide ? '' : 'pr-6'}`}>
        <Bot aria-hidden="true" className="w-[18px] h-[18px] mt-0.5 text-cyan-400" />
        {message.tag && (
          <div className={`col-start-2 inline-flex items-center justify-self-start gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-cyber font-bold tracking-widest uppercase ${wide ? 'mb-1.5 mr-7' : 'mb-1'} ${tagBg}`}>
            {statusIcon}
            <span>{message.tag}</span>
          </div>
        )}
        <div className={`${wide && message.tag ? 'col-span-2' : 'col-start-2'} ${wide && !message.tag ? 'pr-7' : ''} text-xs font-cyber font-bold tracking-wide text-white leading-relaxed break-words`}>
          <CyberBotTypingText text={message.text} visible={typing.text} caret={typing.part === 'text'} typing={typing.isTyping} />
        </div>
        {message.detail && (
          <p className="col-span-2 mt-1 text-[11px] font-medium leading-snug text-cyan-100/70 whitespace-pre-wrap break-words">
            <CyberBotTypingText text={message.detail} visible={typing.detail} caret={typing.part === 'detail'} typing={typing.isTyping} />
          </p>
        )}
      </div>

      {message.nameEntry && (
        <form
          className="mt-3 flex flex-wrap items-center gap-2"
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === 'Escape') {
              event.preventDefault();
              message.onDismiss?.();
              onClose();
            }
          }}
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!normalizedName) return;
            // Close the invitation before its callback opens the confirmation.
            onClose();
            message.nameEntry?.onSubmit(normalizedName);
          }}
        >
          <label htmlFor={nameInputId} className="sr-only">{message.nameEntry.label}</label>
          <input
            id={nameInputId}
            type="text"
            value={nameDraft}
            placeholder={message.nameEntry.placeholder}
            autoComplete="nickname"
            onChange={(event) => setNameDraft(Array.from(event.target.value).slice(0, CYBERBOT_NAME_MAX_LENGTH).join(''))}
            className="min-w-0 flex-1 basis-32 rounded-lg border border-cyan-500/40 bg-slate-950/70 px-2.5 py-1.5 text-xs text-white select-text outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40"
          />
          <button
            type="submit"
            disabled={!normalizedName}
            className="rounded-lg border border-cyan-500/40 bg-cyan-500/20 px-2.5 py-1.5 text-[11px] font-cyber font-bold text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-40 disabled:cursor-default cursor-pointer"
          >
            {message.nameEntry.submitLabel}
          </button>
        </form>
      )}

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
            <ArrowRight aria-hidden="true" className="w-3 h-3 shrink-0" />
          </button>}
        </div>
      )}

      {/* Speech Bubble Tail Pointing Down */}
      <div
        className={`absolute -bottom-[7px] ${tailPositionClass} w-3.5 h-3.5 ${CYBERBOT_BUBBLE_TAIL_SURFACE} border-r border-b ${bubbleTone.tailBorder} transform rotate-45`}
      />
    </motion.div>
  );
};
