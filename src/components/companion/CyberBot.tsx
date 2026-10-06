import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useReducedMotion } from 'motion/react';
import { CyberBotAvatar } from './CyberBotAvatar';
import { CyberSpeechBubble } from './CyberSpeechBubble';
import type { CyberBotPosition, CyberBotMessage, CyberBotEmotion, CyberBotChatterLevel, CyberBotQuietHoursConfig } from './companionTypes';
import { createCyberBotHoverAssist } from './cyberBotBehavior';
import { isInQuietHours } from './useCyberBot';
import { useCyberBotPresence } from './useCyberBotPresence';
import { useCyberBotLayout } from './useCyberBotLayout';

interface CyberBotProps {
  enabled: boolean;
  activeMessage: CyberBotMessage | null;
  onDismissMessage: () => void;
  onClickBot?: () => void;
  position?: CyberBotPosition;
  dodgeEnabled?: boolean;
  hoverAssistEnabled?: boolean;
  chatterLevel?: CyberBotChatterLevel;
  quietHours?: CyberBotQuietHoursConfig;
  dragBoundsRef: React.RefObject<HTMLDivElement | null>;
  interactLabel: string;
  closeLabel: string;
  hoverAssistText: (count: number) => string;
  marqueeStatusMessages?: readonly string[];
  priorityEmotion?: CyberBotEmotion;
  systemAttention?: boolean;
  onSpeechVisibilityChange?: (visible: boolean) => void;
}

export const CyberBot: React.FC<CyberBotProps> = ({
  enabled,
  activeMessage,
  onDismissMessage,
  onClickBot,
  position = 'bottom-right',
  dodgeEnabled = false,
  hoverAssistEnabled = true,
  chatterLevel = 'full',
  quietHours,
  dragBoundsRef,
  interactLabel,
  closeLabel,
  hoverAssistText,
  marqueeStatusMessages,
  priorityEmotion,
  systemAttention = false,
  onSpeechVisibilityChange,
}) => {
  const reducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [currentPos, setCurrentPos] = useState<CyberBotPosition>(position);
  const [manualOffset, setManualOffset] = useState({ x: 0, y: 0 });
  const [temporaryEmotion, setTemporaryEmotion] = useState<CyberBotEmotion | null>(null);
  const [isDodgeCooldown, setIsDodgeCooldown] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const [hoverCountdown, setHoverCountdown] = useState<number | null>(null);
  const dodgeTimerRef = useRef<number | null>(null);
  const dodgeExecutionTimerRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragEndTimerRef = useRef<number | null>(null);
  const dragCommitFrameRef = useRef<number | null>(null);
  const moveForHoverRef = useRef<() => void>(() => {});
  const hoverAssistRef = useRef<ReturnType<typeof createCyberBotHoverAssist> | null>(null);
  const hoverMessage: CyberBotMessage | null = hoverCountdown === null ? null : {
    id: 'bot_hover_assist',
    text: hoverAssistText(hoverCountdown),
    emotion: 'curious',
    timestamp: 0,
    priority: 'low',
  };
  const displayedMessage = activeMessage || hoverMessage;
  const placement = useCyberBotLayout({ enabled, position: currentPos, offset: manualOffset, messageId: displayedMessage?.id, bubbleRef });
  const { sleeping, vanished, vanishStyle } = useCyberBotPresence(
    enabled,
    !!displayedMessage || systemAttention || isHovered || isDragging || placement.hasObstacles || placement.hidden,
    activeMessage?.id,
    systemAttention,
  );
  const idleAway = vanished && !displayedMessage && !systemAttention;
  const canHoverAssist = hoverAssistEnabled && !dodgeEnabled && chatterLevel === 'full'
    && (!quietHours?.enabled || !isInQuietHours(quietHours.from, quietHours.to));

  moveForHoverRef.current = () => {
    if (!canHoverAssist || activeMessage || placement.hasObstacles || placement.hidden || isDraggingRef.current) return;
    const nextPos: CyberBotPosition = currentPos === 'bottom-right' ? 'bottom-left' : 'bottom-right';
    setTemporaryEmotion('happy');
    setManualOffset({ x: 0, y: 0 });
    setCurrentPos(nextPos);
    // The assistance is temporary; it must not overwrite the user's saved corner.
    dodgeTimerRef.current = window.setTimeout(() => setTemporaryEmotion(null), 700);
  };

  useEffect(() => {
    hoverAssistRef.current = createCyberBotHoverAssist(setHoverCountdown, () => moveForHoverRef.current());
    return () => {
      hoverAssistRef.current?.dispose();
      hoverAssistRef.current = null;
    };
  }, []);

  useEffect(() => {
    x.set(0);
    y.set(0);
    setCurrentPos(position);
    setManualOffset({ x: 0, y: 0 });
  }, [position, x, y]);

  useEffect(() => {
    // An idle disappearance can reverse immediately, so it must not reroute
    // system speech away from CyberBot as an actually obstructed layout would.
    onSpeechVisibilityChange?.(enabled && !placement.hidden && (!displayedMessage || placement.bubbleVisible));
  }, [enabled, placement.hidden, placement.bubbleVisible, !!displayedMessage, onSpeechVisibilityChange]);

  useEffect(() => {
    if (placement.hidden || layoutReady) return;
    const frame = window.requestAnimationFrame(() => setLayoutReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, [placement.hidden, layoutReady]);

  useEffect(() => {
    if (!placement.hasObstacles) return;
    if (dodgeExecutionTimerRef.current) window.clearTimeout(dodgeExecutionTimerRef.current);
    hoverAssistRef.current?.leave();
    setTemporaryEmotion(null);
  }, [placement.hasObstacles]);

  useEffect(() => {
    if (!enabled || !canHoverAssist || placement.hidden || activeMessage || isDragging) {
      hoverAssistRef.current?.leave();
    }
  }, [enabled, canHoverAssist, placement.hidden, activeMessage, isDragging]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (dodgeTimerRef.current) window.clearTimeout(dodgeTimerRef.current);
      if (dodgeExecutionTimerRef.current) window.clearTimeout(dodgeExecutionTimerRef.current);
      if (dragEndTimerRef.current) window.clearTimeout(dragEndTimerRef.current);
      if (dragCommitFrameRef.current) window.cancelAnimationFrame(dragCommitFrameRef.current);
    };
  }, []);

  // A contextual priority can intentionally own the face, such as Terminal mode.
  const currentEmotion: CyberBotEmotion =
    priorityEmotion || displayedMessage?.emotion || temporaryEmotion || (sleeping ? 'sleeping' : 'idle');

  // Handle evasive dodge when mouse approaches (if dodgeEnabled is true)
  const handleMouseEnter = () => {
    if (!dodgeEnabled || placement.hasObstacles || isDodgeCooldown || isDraggingRef.current) return;

    // Show surprised/scared reaction first
    setTemporaryEmotion('scared');

    // Friendly reaction delay (280ms) before physically leaping:
    // Allows deliberate clicks, prevents accidental frantic jumping, and feels organic
    dodgeExecutionTimerRef.current = window.setTimeout(() => {
      setIsDodgeCooldown(true);

      const nextPos: CyberBotPosition =
        currentPos === 'bottom-right' ? 'bottom-left' : 'bottom-right';

      x.set(0);
      y.set(0);
      setManualOffset({ x: 0, y: 0 });
      setCurrentPos(nextPos);

      // Reset emotion after dodge finishes
      dodgeTimerRef.current = window.setTimeout(() => {
        setTemporaryEmotion(null);
        setIsDodgeCooldown(false);
      }, 700);
    }, 280);
  };

  const handlePointerDown = () => {
    // If the user actively clicks or grabs the bot, cancel the dodge leap!
    hoverAssistRef.current?.cancel();
    setTemporaryEmotion(null);
    if (dodgeExecutionTimerRef.current) {
      window.clearTimeout(dodgeExecutionTimerRef.current);
      dodgeExecutionTimerRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDraggingRef.current) return;

    // Let the selected phrase choose the expression.
    setTemporaryEmotion(null);
    onClickBot?.();
  };

  if (!enabled) return null;

  return (
    <motion.aside
      aria-label="CyberBot"
      aria-hidden={placement.hidden || idleAway || undefined}
      data-cyberbot-control
      drag
      // Numeric bounds avoid Motion's ref-resize handler retaining a second offset
      // after the layout hook has already repositioned the companion.
      dragConstraints={{
        left: 12 - placement.left,
        top: 12 - placement.top,
        right: (dragBoundsRef.current?.clientWidth ?? placement.left + 106) - placement.left - 106,
        bottom: (dragBoundsRef.current?.clientHeight ?? placement.top + 106) - placement.top - 106,
      }}
      dragMomentum={false}
      dragElastic={0.06}
      style={{
        x,
        y,
        left: placement.left,
        top: placement.top,
        visibility: placement.hidden ? 'hidden' : 'visible',
        transition: isDragging || reducedMotion || placement.hidden || !layoutReady
          ? 'none'
          : 'left 360ms cubic-bezier(0.22, 1, 0.36, 1), top 360ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      onDragStart={() => {
        isDraggingRef.current = true;
        setIsDragging(true);
        setIsDodgeCooldown(true);
        setTemporaryEmotion(null);
        hoverAssistRef.current?.cancel();
        if (dodgeTimerRef.current) window.clearTimeout(dodgeTimerRef.current);
        if (dragEndTimerRef.current) window.clearTimeout(dragEndTimerRef.current);
        if (dragCommitFrameRef.current) window.cancelAnimationFrame(dragCommitFrameRef.current);
        if (dodgeExecutionTimerRef.current) {
          window.clearTimeout(dodgeExecutionTimerRef.current);
          dodgeExecutionTimerRef.current = null;
        }
      }}
      onDragEnd={(_event, info) => {
        const dist = Math.hypot(info.offset.x, info.offset.y);
        const finishDrag = () => {
          dragEndTimerRef.current = window.setTimeout(() => {
            isDraggingRef.current = false;
            setIsDragging(false);
          }, dist > 5 ? 120 : 0);
        };
        if (!placement.hasObstacles) {
          const droppedLeft = placement.left + x.get();
          const droppedTop = placement.top + y.get();
          // Let Motion finish its pointer-up bookkeeping before changing the
          // anchor, then clear the drag transform in the same frame.
          dragCommitFrameRef.current = window.requestAnimationFrame(() => {
            dragCommitFrameRef.current = null;
            flushSync(() => {
              setManualOffset({
                x: droppedLeft - (currentPos === 'bottom-left' ? 80 : window.innerWidth - 126),
                y: droppedTop - (currentPos === 'top-right' ? 80 : window.innerHeight - 150),
              });
            });
            x.set(0);
            y.set(0);
            finishDrag();
          });
        } else {
          x.set(0);
          y.set(0);
          finishDrag();
        }
        // Re-entering the hitbox at drop time must not turn a deliberate drag into a dodge.
        dodgeTimerRef.current = window.setTimeout(() => setIsDodgeCooldown(false), 700);
      }}
      className="fixed z-[180] w-[94px] h-[94px] pointer-events-none select-none"
    >
      {/* Speech Bubble Area (Anchored directly above CyberBot without shifting layout) */}
      <div
        ref={bubbleRef}
        data-no-hide
        aria-hidden={!placement.bubbleVisible || undefined}
        style={{ width: placement.bubbleWidth, visibility: placement.bubbleVisible && !placement.hidden ? 'visible' : 'hidden' }}
        className={`absolute bottom-full mb-3 pointer-events-auto ${
          placement.align === 'left' ? 'left-0' : 'right-0'
        }`}
      >
        <AnimatePresence mode="wait">
          {displayedMessage && (
            <CyberSpeechBubble
              key={displayedMessage.id}
              message={displayedMessage}
              onClose={activeMessage ? onDismissMessage : () => hoverAssistRef.current?.cancel()}
              position={placement.align === 'left' ? 'bottom-left' : 'bottom-right'}
              closeLabel={closeLabel}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Interactive Avatar Area with Dodge Hitbox and Drag */}
      <AnimatePresence>
        {idleAway && !reducedMotion && vanishStyle === 'ascend' && (
          <motion.span
            key={vanishStyle}
            aria-hidden="true"
            initial={{ opacity: 0.7, scale: 0.65, y: 0 }}
            animate={{ opacity: 0, scale: 0.8, y: -55 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.68, ease: 'easeOut' }}
            className="absolute inset-[14px] rounded-full border border-cyan-300/70 shadow-[0_0_24px_rgba(34,211,238,0.55)] pointer-events-none"
          />
        )}
      </AnimatePresence>
      <motion.div
        initial={false}
        animate={idleAway
          ? vanishStyle === 'portal'
            ? { opacity: 1, scale: 1, y: 0, rotate: 0, filter: 'blur(0px)' }
            : { opacity: 0, scale: 0.52, y: -48, rotate: 12, filter: 'blur(2px)' }
          : { opacity: 1, scale: 1, y: 0, rotate: 0, filter: 'blur(0px)' }}
        transition={reducedMotion ? { duration: 0 } : { duration: idleAway && vanishStyle === 'ascend' ? 0.62 : 0.28, ease: 'easeInOut' }}
        className="relative w-[94px] h-[94px]"
        style={{ pointerEvents: idleAway ? 'none' : 'auto' }}
      >
        <button
          type="button"
          disabled={idleAway}
          aria-label={interactLabel}
          onMouseEnter={() => {
            setIsHovered(true);
            handleMouseEnter();
            if (canHoverAssist && !placement.hasObstacles && !placement.hidden && !activeMessage
              && !isDodgeCooldown && !isDraggingRef.current) {
              hoverAssistRef.current?.enter();
            }
          }}
          onMouseLeave={() => {
            setIsHovered(false);
            hoverAssistRef.current?.leave();
            if (dodgeExecutionTimerRef.current) {
              window.clearTimeout(dodgeExecutionTimerRef.current);
              dodgeExecutionTimerRef.current = null;
            }
            if (!isDodgeCooldown) {
              setTemporaryEmotion(null);
            }
          }}
          onPointerDown={handlePointerDown}
          onClick={handleClick}
          className="pointer-events-auto w-[94px] h-[94px] flex items-center justify-center rounded-full cursor-grab active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
        >
          <CyberBotAvatar
            emotion={currentEmotion}
            isHovered={isHovered}
            marqueeStatusMessages={marqueeStatusMessages}
            speechKey={displayedMessage && placement.bubbleVisible && !placement.hidden
              ? `${displayedMessage.id}:${displayedMessage.timestamp}` : undefined}
            speechDurationMs={displayedMessage
              ? Math.min(5200, Math.max(2200, displayedMessage.text.length * 55))
              : undefined}
            vanished={idleAway}
            vanishStyle={vanishStyle}
            size={78}
          />
        </button>
      </motion.div>
    </motion.aside>
  );
};
