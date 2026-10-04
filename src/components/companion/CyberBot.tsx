import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useReducedMotion } from 'motion/react';
import { CyberBotAvatar } from './CyberBotAvatar';
import { CyberSpeechBubble } from './CyberSpeechBubble';
import type { CyberBotPosition, CyberBotMessage, CyberBotEmotion } from './companionTypes';

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
}

export function getCyberBotViewportAdjustment(
  bot: Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom'>,
  bubble: Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom'>,
  viewportWidth: number,
  viewportHeight: number
) {
  const margin = 12;
  const desiredX = Math.max(margin - bubble.left, 0) - Math.max(bubble.right - viewportWidth + margin, 0);
  const desiredY = Math.max(margin - bubble.top, 0) - Math.max(bubble.bottom - viewportHeight + margin, 0);
  return {
    x: Math.min(viewportWidth - margin - bot.right, Math.max(margin - bot.left, desiredX)),
    y: Math.min(viewportHeight - margin - bot.bottom, Math.max(margin - bot.top, desiredY)),
  };
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
}) => {
  const reducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const botRef = useRef<HTMLElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [currentPos, setCurrentPos] = useState<CyberBotPosition>(position);
  const [temporaryEmotion, setTemporaryEmotion] = useState<CyberBotEmotion | null>(null);
  const [isDodgeCooldown, setIsDodgeCooldown] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dodgeTimerRef = useRef<number | null>(null);
  const dodgeExecutionTimerRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    x.set(0);
    y.set(0);
    setCurrentPos(position);
  }, [position, x, y]);

  const keepBubbleVisible = useCallback(() => {
    const bot = botRef.current?.getBoundingClientRect();
    const bubble = bubbleRef.current?.getBoundingClientRect();
    if (!bot || !bubble || !bubble.width || !bubble.height) return;
    const adjustment = getCyberBotViewportAdjustment(bot, bubble, window.innerWidth, window.innerHeight);
    x.set(x.get() + adjustment.x);
    y.set(y.get() + adjustment.y);
  }, [x, y]);

  useEffect(() => {
    if (!activeMessage) return;
    const frame = window.requestAnimationFrame(keepBubbleVisible);
    window.addEventListener('resize', keepBubbleVisible);
    const observer = new ResizeObserver(keepBubbleVisible);
    if (bubbleRef.current) observer.observe(bubbleRef.current);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', keepBubbleVisible);
      observer.disconnect();
    };
  }, [activeMessage?.id, currentPos, keepBubbleVisible]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (dodgeTimerRef.current) window.clearTimeout(dodgeTimerRef.current);
      if (dodgeExecutionTimerRef.current) window.clearTimeout(dodgeExecutionTimerRef.current);
    };
  }, []);

  // A visible message owns the expression, especially while showing an alert.
  const currentEmotion: CyberBotEmotion =
    activeMessage?.emotion || temporaryEmotion || 'idle';

  // Handle evasive dodge when mouse approaches (if dodgeEnabled is true)
  const handleMouseEnter = () => {
    if (!dodgeEnabled || isDodgeCooldown || isDraggingRef.current) return;

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

  // Coordinate classes based on currentPos
  const positionClasses =
    currentPos === 'bottom-left'
      ? 'bottom-14 left-20'
      : currentPos === 'top-right'
      ? 'top-20 right-8'
      : 'bottom-14 right-8';

  return (
    <motion.aside
      ref={botRef}
      aria-label="CyberBot"
      data-cyberbot-control
      drag
      dragConstraints={dragBoundsRef}
      dragMomentum={false}
      dragElastic={0.06}
      style={{ x, y }}
      onDragStart={() => {
        isDraggingRef.current = true;
        setIsDragging(true);
        if (dodgeExecutionTimerRef.current) {
          window.clearTimeout(dodgeExecutionTimerRef.current);
          dodgeExecutionTimerRef.current = null;
        }
      }}
      onDragEnd={(_event, info) => {
        const dist = Math.hypot(info.offset.x, info.offset.y);
        setTimeout(() => {
          isDraggingRef.current = false;
          setIsDragging(false);
        }, dist > 5 ? 120 : 0);
        window.requestAnimationFrame(keepBubbleVisible);
      }}
      layout={!isDragging && !reducedMotion}
      transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 350, damping: 28 }}
      className={`fixed ${positionClasses} z-[180] w-[94px] h-[94px] pointer-events-none select-none`}
    >
      {/* Speech Bubble Area (Anchored directly above CyberBot without shifting layout) */}
      <div
        ref={bubbleRef}
        data-no-hide
        className={`absolute bottom-full mb-3 pointer-events-auto ${
          currentPos === 'bottom-left' ? 'left-0' : 'right-0'
        }`}
      >
        <AnimatePresence mode="wait">
          {activeMessage && (
            <CyberSpeechBubble
              key={activeMessage.id}
              message={activeMessage}
              onClose={onDismissMessage}
              position={currentPos}
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
