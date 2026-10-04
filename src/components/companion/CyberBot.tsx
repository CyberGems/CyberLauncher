import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
}

export const CyberBot: React.FC<CyberBotProps> = ({
  enabled,
  activeMessage,
  onDismissMessage,
  onClickBot,
  position = 'bottom-right',
  onPositionChange,
  dodgeEnabled = true,
}) => {
  const [currentPos, setCurrentPos] = useState<CyberBotPosition>(position);
  const [temporaryEmotion, setTemporaryEmotion] = useState<CyberBotEmotion | null>(null);
  const [isDodgeCooldown, setIsDodgeCooldown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dodgeTimerRef = useRef<number | null>(null);
  const dodgeExecutionTimerRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    setCurrentPos(position);
  }, [position]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (dodgeTimerRef.current) window.clearTimeout(dodgeTimerRef.current);
      if (dodgeExecutionTimerRef.current) window.clearTimeout(dodgeExecutionTimerRef.current);
    };
  }, []);

  // Determine current emotion
  const currentEmotion: CyberBotEmotion =
    temporaryEmotion || activeMessage?.emotion || 'idle';

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

    // User clicked CyberBot directly
    setTemporaryEmotion('wink');
    onClickBot?.();
    window.setTimeout(() => {
      setTemporaryEmotion(null);
    }, 1500);
  };

  if (!enabled) return null;

  // Coordinate classes based on currentPos
  const positionClasses =
    currentPos === 'bottom-left'
      ? 'bottom-10 left-20'
      : currentPos === 'top-right'
      ? 'top-20 right-8'
      : 'bottom-10 right-8';

  return (
    <motion.aside
      aria-label="CyberBot"
      drag
      dragMomentum={false}
      dragElastic={0.06}
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
      }}
      layout={!isDragging}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className={`fixed ${positionClasses} z-[180] w-[94px] h-[94px] pointer-events-none select-none`}
    >
      {/* Speech Bubble Area (Anchored directly above CyberBot without shifting layout) */}
      <div
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
            />
          )}
        </AnimatePresence>
      </div>

      {/* Interactive Avatar Area with Dodge Hitbox and Drag */}
      <div
        onMouseEnter={handleMouseEnter}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        className="pointer-events-auto w-[94px] h-[94px] flex items-center justify-center rounded-full cursor-grab active:cursor-grabbing"
      >
        <CyberBotAvatar
          emotion={currentEmotion}
          size={78}
        />
      </div>
    </motion.aside>
  );
};
