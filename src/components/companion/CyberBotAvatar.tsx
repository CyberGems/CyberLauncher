import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { CyberBotEmotion } from './companionTypes';
import { nextCyberBotIdleExpression } from './cyberBotBehavior';

interface CyberBotAvatarProps {
  emotion?: CyberBotEmotion;
  isHovered?: boolean;
  size?: number;
  className?: string;
}

export const CyberBotAvatar: React.FC<CyberBotAvatarProps> = ({
  emotion = 'idle',
  isHovered = false,
  size = 76,
  className = '',
}) => {
  const reducedMotion = useReducedMotion();
  const [isBlinking, setIsBlinking] = useState(false);
  const [idleExpression, setIdleExpression] = useState<CyberBotEmotion>('launcher');
  const lastExpressionRef = useRef<CyberBotEmotion>('launcher');

  // Brief expressions separated by irregular resting pauses, with or without hover.
  // Reduced motion keeps these static face changes, but disables animated transforms and blinking.
  useEffect(() => {
    setIdleExpression('launcher');
    if (emotion !== 'idle') return;
    let timer: number;
    const rest = () => {
      setIdleExpression('launcher');
      const pause = reducedMotion ? 7000 : isHovered ? 1600 : 3200;
      timer = window.setTimeout(express, pause + Math.random() * 2600);
    };
    const express = () => {
      const next = nextCyberBotIdleExpression(lastExpressionRef.current);
      lastExpressionRef.current = next;
      setIdleExpression(next);
      timer = window.setTimeout(rest, 1800 + Math.random() * 1400);
    };
    rest();
    return () => window.clearTimeout(timer);
  }, [isHovered, emotion, reducedMotion]);

  // Natural blinking effect every 3.5 to 6 seconds
  useEffect(() => {
    if (reducedMotion || emotion === 'sleeping') {
      setIsBlinking(false);
      return;
    }
    let blinkTimer: number;
    let endBlinkTimer: number;

    const scheduleNextBlink = () => {
      const delay = Math.random() * 2500 + 3500;
      blinkTimer = window.setTimeout(() => {
        setIsBlinking(true);
        endBlinkTimer = window.setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 160);
      }, delay);
    };

    scheduleNextBlink();
    return () => {
      window.clearTimeout(blinkTimer);
      window.clearTimeout(endBlinkTimer);
    };
  }, [reducedMotion, emotion === 'sleeping']);

  const faceEmotion = emotion === 'idle' ? idleExpression : emotion;

  // Face expression terminal characters
  const renderFaceContent = () => {
    // Keep the signature logo face crisp; only the other relaxed expressions blink.
    if (isBlinking && faceEmotion !== 'sleeping' && faceEmotion !== 'scared' && faceEmotion !== 'alert' && faceEmotion !== 'launcher') {
      return (
        <g className="select-none font-mono text-[14px] font-black" fill="#22d3ee">
          <text x="33" y="47" textAnchor="middle">-</text>
          <text x="50" y="49" textAnchor="middle" fontSize="11" fill="#38bdf8">‿</text>
          <text x="67" y="47" textAnchor="middle">-</text>
        </g>
      );
    }

    switch (faceEmotion) {
      case 'launcher':
        return (
          <g fill="#22d3ee">
            <rect x="27" y="37" width="14" height="14" rx="5" />
            <path d="M 64 36 H 69 V 41 H 74 V 47 H 69 V 52 H 64 V 47 H 58 V 41 H 64 Z" />
          </g>
        );
      case 'curious':
        return (
          <g fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round">
            <path d="M 27 35 Q 32 31 37 35" />
            <ellipse cx="33" cy="43" rx="3.5" ry="4.5" fill="#22d3ee" stroke="none" />
            <circle cx="66" cy="43" r="2.5" fill="#22d3ee" stroke="none" />
            <path d="M 46 51 Q 50 53 55 49" />
          </g>
        );
      case 'delighted':
        return (
          <g fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round">
            <path d="M 28 43 Q 33 35 38 43 M 62 43 Q 67 35 72 43" />
            <path d="M 44 48 Q 50 61 56 48 Z" fill="#38bdf8" stroke="none" />
            <ellipse cx="29" cy="51" rx="4" ry="2" fill="#f43f5e" fillOpacity="0.65" stroke="none" />
            <ellipse cx="71" cy="51" rx="4" ry="2" fill="#f43f5e" fillOpacity="0.65" stroke="none" />
          </g>
        );
      case 'sparkle':
        return (
          <g className="font-mono text-[13px] font-black" fill="#38bdf8" textAnchor="middle">
            <text x="32" y="47">✦</text>
            <text x="50" y="49" fontSize="11" fill="#22d3ee">‿</text>
            <text x="68" y="47">✦</text>
          </g>
        );
      case 'affectionate':
        return (
          <g className="font-mono text-[13px] font-black" fill="#f43f5e" textAnchor="middle">
            <text x="32" y="47">♥</text>
            <text x="50" y="49" fontSize="11" fill="#38bdf8">‿</text>
            <text x="68" y="47">♥</text>
          </g>
        );
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
          <g fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
            <path d="M 28 44 Q 33 48 38 44 M 62 44 Q 67 48 72 44" />
            <ellipse cx="50" cy="53" rx="2" ry="1.5" fill="#94a3b8" stroke="none" />
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
      case 'terminal':
      default:
        return (
          <g className="select-none font-mono text-[15px] font-black tracking-widest" fill="#22d3ee">
            <text x="40" y="48" textAnchor="middle">&gt;</text>
            <text x="60" y="48" textAnchor="middle" className="motion-safe:animate-pulse" fill="#38bdf8">_</text>
          </g>
        );
    }
  };

  const isAlert = emotion === 'alert';
  const isSleeping = emotion === 'sleeping';
  const glowColor = isAlert ? 'rgba(245, 158, 11, 0.45)' : isSleeping ? 'rgba(34, 211, 238, 0.12)' : 'rgba(34, 211, 238, 0.45)';

  return (
    <div
      aria-hidden="true"
      data-cyberbot-face={faceEmotion}
      className={`relative inline-flex flex-col items-center justify-center select-none group ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer Interaction Layer: Handles Hover Elevation & Scale via Spring Physics */}
      <motion.div
        animate={{
          y: isHovered && !isSleeping && !reducedMotion ? -5 : 0,
          scale: isHovered && !isSleeping && !reducedMotion ? 1.08 : 1,
        }}
        transition={reducedMotion ? { duration: 0 } : {
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
        whileTap={reducedMotion ? undefined : { scale: 0.95 }}
        className="w-full h-full flex flex-col items-center justify-center"
      >
        {/* Inner Ambient Layer: Handles Continuous Smooth Sinusoidal Floating */}
        <motion.div
          animate={reducedMotion ? { y: 0, rotate: 0 } : {
            y: isSleeping ? [0, -1.5, 0] : [0, -5, 0],
            rotate: isSleeping ? 0 : isHovered ? [-1.5, 1.5, -1.5] : [0, 0.75, 0],
          }}
          transition={reducedMotion ? { duration: 0 } : {
            duration: isSleeping ? 5 : isHovered ? 1.4 : 3.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-full h-full flex flex-col items-center justify-center"
        >
        <svg
          viewBox="0 0 100 105"
          width={size}
          height={size}
          className="w-full h-full"
          style={{ filter: `drop-shadow(0 4px 16px ${glowColor})` }}
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
            <circle cx="44" cy="78" r="2" fill={isSleeping ? '#64748b' : '#22d3ee'} className={isSleeping ? '' : 'motion-safe:animate-pulse'} />
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
                isHovered && !isSleeping
                  ? 'rotate(-32 23 77)'
                  : faceEmotion === 'happy' || faceEmotion === 'wink' || faceEmotion === 'delighted'
                  ? 'rotate(-25 23 77)'
                  : 'rotate(8 23 77)'
              }
              className="motion-safe:transition-transform motion-safe:duration-300"
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
                isHovered && !isSleeping
                  ? 'rotate(32 76 77)'
                  : faceEmotion === 'happy' || faceEmotion === 'wink' || faceEmotion === 'delighted'
                  ? 'rotate(25 76 77)'
                  : 'rotate(-8 76 77)'
              }
              className="motion-safe:transition-transform motion-safe:duration-300"
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
              r={isHovered && !isSleeping ? 4 : 3}
              fill={isSleeping ? '#64748b' : isHovered ? '#38bdf8' : isAlert ? '#ef4444' : '#22d3ee'}
              className={isSleeping ? '' : 'motion-safe:animate-pulse'}
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
            <g filter={faceEmotion === 'launcher' ? undefined : 'url(#cyberGlowFilter)'}>
              {renderFaceContent()}
            </g>
          </g>
          {isSleeping && (
            <g fill="#94a3b8" className="font-mono font-bold" aria-hidden="true">
              <text x="77" y="19" fontSize="8">z</text>
              <text x="86" y="11" fontSize="10">z</text>
            </g>
          )}
        </svg>

        {/* Dynamic Floating Shadow */}
        <motion.div
          animate={reducedMotion || isSleeping ? { scale: 1, opacity: isSleeping ? 0.15 : 0.3 } : {
            scale: isHovered ? [0.95, 0.75, 0.95] : [1, 0.8, 1],
            opacity: isHovered ? [0.4, 0.2, 0.4] : [0.3, 0.15, 0.3],
          }}
          transition={reducedMotion || isSleeping ? { duration: reducedMotion ? 0 : 0.4 } : {
            duration: isHovered ? 1.4 : 3.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-10 h-2 bg-cyan-500/25 rounded-full blur-[2px] mt-1"
        />
        </motion.div>
      </motion.div>
    </div>
  );
};
