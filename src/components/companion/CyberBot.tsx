import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useReducedMotion } from 'motion/react';
import { CyberBotAvatar } from './CyberBotAvatar';
import { CyberSpeechBubble } from './CyberSpeechBubble';
import type { CyberBotPosition, CyberBotMessage, CyberBotEmotion } from './companionTypes';
import { useCyberBotSleep } from './useCyberBotSleep';
import { useCyberBotLayout } from './useCyberBotLayout';

interface CyberBotProps {
  enabled: boolean;
  activeMessage: CyberBotMessage | null;
  onDismissMessage: () => void;
  onClickBot?: () => void;
  position?: CyberBotPosition;
  onPositionChange?: (newPosition: CyberBotPosition) => void;
  dodgeEnabled?: boolean;
  dragBoundsRef: React.RefObject<HTMLDivElement | null>;
  interactLabel: string;
  closeLabel: string;
  onSpeechVisibilityChange?: (visible: boolean) => void;
}

export const CyberBot: React.FC<CyberBotProps> = ({
  enabled,
  activeMessage,
  onDismissMessage,
  onClickBot,
  position = 'bottom-right',
  onPositionChange,
  dodgeEnabled = true,
  dragBoundsRef,
  interactLabel,
  closeLabel,
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
  const dodgeTimerRef = useRef<number | null>(null);
  const dodgeExecutionTimerRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragEndTimerRef = useRef<number | null>(null);
  const dragCommitFrameRef = useRef<number | null>(null);
  const sleeping = useCyberBotSleep(enabled);
  const placement = useCyberBotLayout({ enabled, position: currentPos, offset: manualOffset, messageId: activeMessage?.id, bubbleRef });

  useEffect(() => {
    x.set(0);
    y.set(0);
    setCurrentPos(position);
    setManualOffset({ x: 0, y: 0 });
  }, [position, x, y]);

  useEffect(() => {
    onSpeechVisibilityChange?.(enabled && !placement.hidden && (!activeMessage || placement.bubbleVisible));
  }, [enabled, placement.hidden, placement.bubbleVisible, !!activeMessage, onSpeechVisibilityChange]);

  useEffect(() => {
    if (placement.hidden || layoutReady) return;
    const frame = window.requestAnimationFrame(() => setLayoutReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, [placement.hidden, layoutReady]);

  useEffect(() => {
    if (!placement.hasObstacles) return;
    if (dodgeExecutionTimerRef.current) window.clearTimeout(dodgeExecutionTimerRef.current);
    setTemporaryEmotion(null);
  }, [placement.hasObstacles]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (dodgeTimerRef.current) window.clearTimeout(dodgeTimerRef.current);
      if (dodgeExecutionTimerRef.current) window.clearTimeout(dodgeExecutionTimerRef.current);
      if (dragEndTimerRef.current) window.clearTimeout(dragEndTimerRef.current);
      if (dragCommitFrameRef.current) window.cancelAnimationFrame(dragCommitFrameRef.current);
    };
  }, []);

  // A visible message owns the expression, especially while showing an alert.
  const currentEmotion: CyberBotEmotion =
    activeMessage?.emotion || temporaryEmotion || (sleeping ? 'sleeping' : 'idle');

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
      onPositionChange?.(nextPos);

      // Reset emotion after dodge finishes
      dodgeTimerRef.current = window.setTimeout(() => {
        setTemporaryEmotion(null);
        setIsDodgeCooldown(false);
      }, 700);
    }, 280);
  };

  const handlePointerDown = () => {
    // If the user actively clicks or grabs the bot, cancel the dodge leap!
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
      aria-hidden={placement.hidden || undefined}
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
          {activeMessage && (
            <CyberSpeechBubble
              key={activeMessage.id}
              message={activeMessage}
              onClose={onDismissMessage}
              position={placement.align === 'left' ? 'bottom-left' : 'bottom-right'}
              closeLabel={closeLabel}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Interactive Avatar Area with Dodge Hitbox and Drag */}
      <button
        type="button"
        aria-label={interactLabel}
        onMouseEnter={() => {
          setIsHovered(true);
          handleMouseEnter();
        }}
        onMouseLeave={() => {
          setIsHovered(false);
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
          size={78}
        />
      </button>
    </motion.aside>
  );
};
