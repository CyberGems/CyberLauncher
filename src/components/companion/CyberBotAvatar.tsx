import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import type { CyberBotEmotion } from './companionTypes';

interface CyberBotAvatarProps {
  emotion?: CyberBotEmotion;
  isHovered?: boolean;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const CyberBotAvatar: React.FC<CyberBotAvatarProps> = ({
  emotion = 'idle',
  isHovered = false,
  size = 76,
  className = '',
  onClick,
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [hoverReactionIndex, setHoverReactionIndex] = useState(0);

  // Cycle hover reactions every 1400ms while cursor is over CyberBot
  useEffect(() => {
    if (!isHovered) {
      setHoverReactionIndex(0);
      return;
    }
    const interval = window.setInterval(() => {
      setHoverReactionIndex(prev => (prev + 1) % 4);
    }, 1400);
    return () => window.clearInterval(interval);
  }, [isHovered]);

  // Natural blinking effect every 3.5 to 6 seconds
  useEffect(() => {
    let blinkTimer: number;
    let endBlinkTimer: number;

    const scheduleNextBlink = () => {
      const delay = Math.random() * 2500 + 3500;
      blinkTimer = window.setTimeout(() => {
        setIsBlinking(true);
        endBlinkTimer = window.setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 380);
      }, delay);
    };

    scheduleNextBlink();
    return () => {
      window.clearTimeout(blinkTimer);
      window.clearTimeout(endBlinkTimer);
    };
  }, []);

  // Face expression terminal characters
  const renderFaceContent = () => {
    // Continuous lively reactions while hovered (if not in alert mode)
    if (isHovered && emotion !== 'alert') {
      switch (hoverReactionIndex) {
        case 0: // Delighted blush smile
          return (
            <g className="select-none font-mono text-[14px] font-black" fill="#22d3ee">
              <circle cx="28" cy="54" r="3" fill="#f43f5e" fillOpacity="0.75" />
              <circle cx="72" cy="54" r="3" fill="#f43f5e" fillOpacity="0.75" />
              <text x="32" y="47" textAnchor="middle">^</text>
              <text x="50" y="49" textAnchor="middle" fontSize="11" fill="#38bdf8">‿</text>
              <text x="68" y="47" textAnchor="middle">^</text>
            </g>
          );
        case 1: // Starry sparkle eyes
          return (
            <g className="select-none font-mono text-[13px] font-black" fill="#38bdf8">
              <text x="32" y="47" textAnchor="middle" fill="#38bdf8">✦</text>
              <text x="50" y="49" textAnchor="middle" fontSize="11" fill="#22d3ee">‿</text>
              <text x="68" y="47" textAnchor="middle" fill="#38bdf8">✦</text>
            </g>
          );
        case 2: // Playful wink
          return (
            <g className="select-none font-mono text-[14px] font-black" fill="#22d3ee">
              <circle cx="28" cy="54" r="2.5" fill="#f43f5e" fillOpacity="0.6" />
              <text x="32" y="47" textAnchor="middle">^</text>
              <text x="50" y="49" textAnchor="middle" fontSize="11" fill="#38bdf8">‿</text>
              <text x="68" y="47" textAnchor="middle">~</text>
            </g>
          );
        case 3: // Loving heart eyes
          return (
            <g className="select-none font-mono text-[13px] font-black" fill="#f43f5e">
              <text x="32" y="47" textAnchor="middle" fill="#f43f5e">♥</text>
              <text x="50" y="49" textAnchor="middle" fontSize="11" fill="#38bdf8">‿</text>
              <text x="68" y="47" textAnchor="middle" fill="#f43f5e">♥</text>
            </g>
          );
      }
    }

    // If blinking and not sleeping or scared, show closed eyes
    if (isBlinking && emotion !== 'sleeping' && emotion !== 'scared') {
      return (
        <g className="select-none font-mono text-[14px] font-black" fill="#22d3ee">
          <text x="33" y="47" textAnchor="middle">-</text>
          <text x="50" y="49" textAnchor="middle" fontSize="11" fill="#38bdf8">‿</text>
          <text x="67" y="47" textAnchor="middle">-</text>
        </g>
      );
    }

    switch (emotion) {
      case 'happy':
        return (
          <g className="select-none font-mono text-[14px] font-black" fill="#22d3ee">
            <text x="32" y="47" textAnchor="middle">^</text>
            <text x="50" y="49" textAnchor="middle" fontSize="11" fill="#38bdf8">‿</text>
            <text x="68" y="47" textAnchor="middle">^</text>
          </g>
        );
      case 'alert':
        return (
          <g className="select-none font-mono text-[15px] font-black" fill="#f59e0b">
            <text x="33" y="48" textAnchor="middle">!</text>
            <text x="50" y="48" textAnchor="middle" fontSize="12" fill="#fbbf24">▱</text>
            <text x="67" y="48" textAnchor="middle">!</text>
          </g>
        );
      case 'scared':
        return (
          <g className="select-none font-mono text-[14px] font-black" fill="#38bdf8">
            <text x="33" y="47" textAnchor="middle">&gt;</text>
            <text x="50" y="50" textAnchor="middle" fontSize="12" fill="#a5f3fc">o</text>
            <text x="67" y="47" textAnchor="middle">&lt;</text>
          </g>
        );
      case 'wink':
        return (
          <g className="select-none font-mono text-[14px] font-black" fill="#22d3ee">
            <text x="33" y="47" textAnchor="middle">^</text>
            <text x="50" y="49" textAnchor="middle" fontSize="11" fill="#38bdf8">‿</text>
            <text x="67" y="47" textAnchor="middle">~</text>
          </g>
        );
      case 'sleeping':
        return (
          <g className="select-none font-mono text-[13px] font-black" fill="#64748b">
            <text x="33" y="47" textAnchor="middle">-</text>
            <text x="50" y="48" textAnchor="middle" fontSize="10" fill="#94a3b8">‿</text>
            <text x="67" y="47" textAnchor="middle">-</text>
          </g>
        );
      case 'success':
        return (
          <g className="select-none font-mono text-[14px] font-black" fill="#10b981">
            <text x="33" y="48" textAnchor="middle">✓</text>
            <text x="50" y="49" textAnchor="middle" fontSize="11" fill="#34d399">‿</text>
            <text x="67" y="48" textAnchor="middle">✓</text>
          </g>
        );
      case 'speaking':
        return (
          <g className="select-none font-mono text-[14px] font-black" fill="#22d3ee">
            <text x="33" y="47" textAnchor="middle">•</text>
            <text x="50" y="49" textAnchor="middle" fontSize="11" fill="#38bdf8">‿</text>
            <text x="67" y="47" textAnchor="middle">•</text>
          </g>
        );
      case 'idle':
      default:
        return (
          <g className="select-none font-mono text-[15px] font-black tracking-widest" fill="#22d3ee">
            <text x="40" y="48" textAnchor="middle">&gt;</text>
            <text x="60" y="48" textAnchor="middle" className="animate-pulse" fill="#38bdf8">_</text>
          </g>
        );
    }
  };

  const isAlert = emotion === 'alert';
  const glowColor = isAlert ? 'rgba(245, 158, 11, 0.45)' : 'rgba(34, 211, 238, 0.45)';

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
      className={`relative inline-flex flex-col items-center justify-center cursor-pointer select-none group ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Bot SVG Avatar with Smooth Framer Motion Floating */}
      <motion.div
        animate={
          isHovered
            ? {
                y: [-2, -8, -2],
                rotate: [-2, 2.5, -1.5, 2, 0],
                scale: [1.06, 1.09, 1.06],
              }
            : {
                y: [0, -6, 0],
                rotate: [0, 0.75, 0],
                scale: 1,
              }
        }
        transition={{
          duration: isHovered ? 1.5 : 3.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        whileTap={{ scale: 0.95 }}
        className="w-full h-full flex flex-col items-center justify-center"
      >
        <svg
          viewBox="0 0 100 105"
          width={size}
          height={size}
          className={`w-full h-full drop-shadow-[0_4px_16px_${glowColor}]`}
        >
          <defs>
            {/* Main Blue Body Gradient */}
            <linearGradient id="cyberBotBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="35%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>

            {/* Screen Glass Gradient */}
            <linearGradient id="cyberBotScreenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#050b1a" />
              <stop offset="100%" stopColor="#0a192f" />
            </linearGradient>

            {/* Highlight Gradient */}
            <linearGradient id="cyberBotHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Eye Glow Filter */}
            <filter id="cyberGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* --- LEGS / FEET --- */}
          <g id="legs">
            {/* Left Foot */}
            <rect
              x="33"
              y="88"
              width="12"
              height="11"
              rx="5"
              fill="#1e3a8a"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            {/* Right Foot */}
            <rect
              x="55"
              y="88"
              width="12"
              height="11"
              rx="5"
              fill="#1e3a8a"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
          </g>

          {/* --- TORSO & ARMS --- */}
          <g id="body">
            {/* Torso */}
            <rect
              x="31"
              y="66"
              width="38"
              height="26"
              rx="8"
              fill="url(#cyberBotBodyGrad)"
              stroke="#38bdf8"
              strokeWidth="1.8"
            />
            {/* Torso Detail Panel */}
            <rect
              x="38"
              y="72"
              width="24"
              height="12"
              rx="4"
              fill="#0b172e"
              stroke="#38bdf8"
              strokeWidth="1"
            />
            <circle cx="44" cy="78" r="2" fill="#22d3ee" className="animate-pulse" />
            <line x1="50" y1="78" x2="57" y2="78" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />

            {/* Left Arm */}
            <rect
              x="18"
              y="69"
              width="11"
              height="16"
              rx="5"
              fill="#2563eb"
              stroke="#38bdf8"
              strokeWidth="1.5"
              transform={
                isHovered
                  ? 'rotate(-32 23 77)'
                  : emotion === 'happy' || emotion === 'wink'
                  ? 'rotate(-25 23 77)'
                  : 'rotate(8 23 77)'
              }
              className="transition-transform duration-300"
            />
            {/* Right Arm */}
            <rect
              x="71"
              y="69"
              width="11"
              height="16"
              rx="5"
              fill="#2563eb"
              stroke="#38bdf8"
              strokeWidth="1.5"
              transform={
                isHovered
                  ? 'rotate(32 76 77)'
                  : emotion === 'happy' || emotion === 'wink'
                  ? 'rotate(25 76 77)'
                  : 'rotate(-8 76 77)'
              }
              className="transition-transform duration-300"
            />
          </g>

          {/* --- HEAD & EARS --- */}
          <g id="head">
            {/* Left Ear Antenna */}
            <path
              d="M 17 38 C 11 38 11 50 17 50 Z"
              fill="#1e3a8a"
              stroke="#38bdf8"
              strokeWidth="1.8"
            />
            <circle cx="14" cy="44" r="2" fill={isAlert ? '#f59e0b' : '#22d3ee'} />

            {/* Right Ear Antenna */}
            <path
              d="M 83 38 C 89 38 89 50 83 50 Z"
              fill="#1e3a8a"
              stroke="#38bdf8"
              strokeWidth="1.8"
            />
            <circle cx="86" cy="44" r="2" fill={isAlert ? '#f59e0b' : '#22d3ee'} />

            {/* Top Mini Crown Antenna */}
            <path
              d="M 46 16 C 46 11 54 11 54 16 L 52 20 L 48 20 Z"
              fill="#38bdf8"
            />
            <circle
              cx="50"
              cy="11"
              r={isHovered ? 4 : 3}
              fill={isHovered ? '#38bdf8' : isAlert ? '#ef4444' : '#22d3ee'}
              className="animate-pulse"
            />

            {/* Outer Head (Cloud-like rounded capsule) */}
            <path
              d="M 28 20 
                 C 35 15, 45 16, 50 16 
                 C 55 16, 65 15, 72 20 
                 C 85 24, 88 35, 87 45 
                 C 88 56, 84 66, 70 69 
                 C 62 71, 38 71, 30 69 
                 C 16 66, 12 56, 13 45 
                 C 12 35, 15 24, 28 20 Z"
              fill="url(#cyberBotBodyGrad)"
              stroke="#38bdf8"
              strokeWidth="2.2"
            />

            {/* Subtle Head Gloss Highlight */}
            <path
              d="M 30 22 C 40 18, 60 18, 70 22 C 60 25, 40 25, 30 22 Z"
              fill="url(#cyberBotHighlight)"
            />

            {/* OLED Screen Face (Visor) */}
            <rect
              x="22"
              y="27"
              width="56"
              height="35"
              rx="12"
              fill="url(#cyberBotScreenGrad)"
              stroke={isAlert ? '#f59e0b' : '#22d3ee'}
              strokeWidth="1.8"
              strokeOpacity="0.8"
            />

            {/* Screen Inner Glare / Reflection */}
            <path
              d="M 24 30 L 44 30 L 26 58 L 24 58 Z"
              fill="#ffffff"
              fillOpacity="0.05"
            />

            {/* Terminal Face Content */}
            <g filter="url(#cyberGlowFilter)">
              {renderFaceContent()}
            </g>
          </g>
        </svg>

        {/* Dynamic Floating Shadow */}
        <motion.div
          animate={{
            scale: isHovered ? [1.1, 0.7, 1.1] : [1, 0.75, 1],
            opacity: isHovered ? [0.45, 0.2, 0.45] : [0.35, 0.15, 0.35],
          }}
          transition={{
            duration: isHovered ? 1.5 : 3.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-10 h-2 bg-cyan-500/25 rounded-full blur-[2px] mt-1"
        />
      </motion.div>
    </div>
  );
};
