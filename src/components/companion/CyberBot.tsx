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
}

export const CyberBot: React.FC<CyberBotProps> = ({
  enabled,
  activeMessage,
  onDismissMessage,
  onClickBot,
  position = 'bottom-right',
  onPositionChange,
}) => {
  const [currentPos, setCurrentPos] = useState<CyberBotPosition>(position);
  const [temporaryEmotion, setTemporaryEmotion] = useState<CyberBotEmotion | null>(null);
  const [isDodgeCooldown, setIsDodgeCooldown] = useState(false);
  const dodgeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setCurrentPos(position);
  }, [position]);

  // Determine current emotion
  const currentEmotion: CyberBotEmotion =
    temporaryEmotion || activeMessage?.emotion || 'idle';

  // Handle evasive dodge when mouse approaches
  const handleMouseEnter = () => {
    if (isDodgeCooldown) return;

    // Trigger scared face and dodge to opposite side
    setTemporaryEmotion('scared');
    setIsDodgeCooldown(true);

    const nextPos: CyberBotPosition =
      currentPos === 'bottom-right' ? 'bottom-left' : 'bottom-right';

    setCurrentPos(nextPos);
    onPositionChange?.(nextPos);

    if (dodgeTimerRef.current) {
      window.clearTimeout(dodgeTimerRef.current);
    }

    // Reset scared emotion after dodge
    dodgeTimerRef.current = window.setTimeout(() => {
      setTemporaryEmotion(null);
      setIsDodgeCooldown(false);
    }, 700);
  };

  const handleClick = () => {
    // If not dodging, user clicked CyberBot directly
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
      layout
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className={`fixed ${positionClasses} z-[180] flex flex-col items-center pointer-events-none select-none`}
    >
      {/* Speech Bubble Area */}
      <div className="mb-2 pointer-events-auto">
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

      {/* Interactive Avatar Area with Dodge Hitbox */}
      <div
        onMouseEnter={handleMouseEnter}
        className="pointer-events-auto p-2 rounded-full cursor-pointer transition-transform active:scale-95"
      >
        <CyberBotAvatar
          emotion={currentEmotion}
          onClick={handleClick}
          size={78}
        />
      </div>
    </motion.aside>
  );
};
