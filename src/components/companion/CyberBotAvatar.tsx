import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { CyberBotEmotion } from './companionTypes';
import {
  getCyberBotIdleExpressionDuration,
  getCyberBotIdleMarqueeMessages,
  nextCyberBotIdleExpression,
  nextCyberBotIdleMarqueeMessage,
  shouldCyberBotBlink,
  type CyberBotVanishStyle,
} from './cyberBotBehavior';

interface CyberBotAvatarProps {
  emotion?: CyberBotEmotion;
  isHovered?: boolean;
  speechKey?: string;
  speechDurationMs?: number;
  marqueeStatusMessages?: readonly string[];
  size?: number;
  className?: string;
  vanished?: boolean;
  vanishStyle?: CyberBotVanishStyle;
}

const DEFAULT_SPEECH_CUE_MS = 2400;
const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';

const SPEECH_BAR_ENVELOPES = [
  [0.42, 1, 0.72, 1, 0.64, 0.92, 0.5],
  [0.16, 0.9, 0.46, 1, 0.32, 0.8, 0.16],
  [0.1, 0.2, 0.82, 0.4, 1, 0.24, 0.1],
  [0.07, 0.1, 0.28, 0.88, 0.22, 0.58, 0.07],
  [0.05, 0.07, 0.12, 0.44, 0.94, 0.1, 0.05],
] as const;

const CHEST_LIGHT_BARS = [
  { y: 84, width: 10 },
  { y: 80, width: 12 },
  { y: 76, width: 14 },
  { y: 72, width: 12 },
  { y: 68, width: 9 },
] as const;

export const CyberBotAvatar: React.FC<CyberBotAvatarProps> = ({
  emotion = 'idle',
  isHovered = false,
  speechKey,
  speechDurationMs = DEFAULT_SPEECH_CUE_MS,
  marqueeStatusMessages,
  size = 76,
  className = '',
  vanished = false,
  vanishStyle = 'portal',
}) => {
  const reducedMotion = useReducedMotion();
  const marqueeMessages = getCyberBotIdleMarqueeMessages(APP_VERSION, marqueeStatusMessages);
  const isSleeping = emotion === 'sleeping';
  const [isBlinking, setIsBlinking] = useState(false);
  const [idleExpression, setIdleExpression] = useState<CyberBotEmotion>('launcher');
  const [marqueeMessage, setMarqueeMessage] = useState(() => marqueeMessages[0]);
  const [marqueeAnimationRun, setMarqueeAnimationRun] = useState(0);
  const [speechActive, setSpeechActive] = useState(!!speechKey && !isSleeping);
  const lastExpressionRef = useRef<CyberBotEmotion>('launcher');
  const lastMarqueeMessageRef = useRef<string | null>(null);
  const marqueeMessagesRef = useRef(marqueeMessages);
  const facesSinceMarqueeRef = useRef(1);
  marqueeMessagesRef.current = marqueeMessages;

  // Cycle directly between slow, random expressions instead of returning to one
  // resting face between every change. Cheerful gestures remain occasional.
  // Reduced motion keeps these static face changes, but disables animated transforms and blinking.
  useEffect(() => {
    if (emotion !== 'idle') return;
    let timer: number;
    const showNext = () => {
      const next = nextCyberBotIdleExpression(
        lastExpressionRef.current,
        Math.random,
        facesSinceMarqueeRef.current,
      );
      if (next === 'marquee') {
        const message = nextCyberBotIdleMarqueeMessage(
          lastMarqueeMessageRef.current,
          marqueeMessagesRef.current,
        );
        lastMarqueeMessageRef.current = message;
        setMarqueeMessage(message);
        facesSinceMarqueeRef.current = 0;
      } else {
        facesSinceMarqueeRef.current += 1;
      }
      lastExpressionRef.current = next;
      setIdleExpression(next);
      timer = window.setTimeout(showNext, getCyberBotIdleExpressionDuration(next));
    };
    showNext();
    return () => window.clearTimeout(timer);
  }, [emotion]);

  // Chromium can leave an SVG timeline suspended after the BrowserWindow was
  // hidden to the tray. Recreate only the marquee animation when it returns.
  useEffect(() => {
    let restartFrame: number | null = null;
    const restartMarquee = () => {
      if (document.hidden) return;
      if (restartFrame !== null) window.cancelAnimationFrame(restartFrame);
      restartFrame = window.requestAnimationFrame(() => {
        restartFrame = null;
        setMarqueeAnimationRun(run => run + 1);
      });
    };
    const handleVisibility = () => {
      if (!document.hidden) restartMarquee();
    };
    const unsubscribeLauncherShown = window.electronAPI?.onLauncherShown?.(restartMarquee);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', restartMarquee);
    return () => {
      if (restartFrame !== null) window.cancelAnimationFrame(restartFrame);
      unsubscribeLauncherShown?.();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', restartMarquee);
    };
  }, []);

  // Natural blinking effect every 3.5 to 6 seconds
  useEffect(() => {
    if (reducedMotion || !shouldCyberBotBlink(emotion as CyberBotEmotion)) {
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
  }, [reducedMotion, emotion]);

  useEffect(() => {
    if (!speechKey || isSleeping) {
      setSpeechActive(false);
      return;
    }
    setSpeechActive(true);
    const timer = window.setTimeout(() => setSpeechActive(false), speechDurationMs);
    return () => window.clearTimeout(timer);
  }, [speechKey, speechDurationMs, isSleeping]);

  const faceEmotion = emotion === 'idle' ? idleExpression : emotion;
  const speaking = speechActive && !!speechKey && !isSleeping;
  const marqueeTextWidth = Math.max(54, marqueeMessage.length * 6.3);
  const marqueeEndX = 20 - marqueeTextWidth;
  const marqueeDurationSeconds = (56 + marqueeTextWidth) / 16;
  const isAlert = emotion === 'alert' || emotion === 'storage';
  const activeLightColor = isAlert ? '#fbbf24' : '#67e8f9';
  const portalHidden = vanished && vanishStyle === 'portal';

  // Face expression terminal characters
  const renderFaceContent = () => {
    // Speech belongs to the chest equalizer. The visor stays calm and readable.
    if (speaking) {
      return (
        <g
          data-cyberbot-speaking-eyes="true"
          fill={activeLightColor}
          style={{ filter: `drop-shadow(0 0 2px ${isAlert ? 'rgba(251, 191, 36, 0.65)' : 'rgba(103, 232, 249, 0.65)'})` }}
        >
          <rect x="29" y="40" width="11" height="4" rx="2" />
          <rect x="60" y="40" width="11" height="4" rx="2" />
        </g>
      );
    }

    // Keep the signature and terminal faces stable; only organic expressions blink.
    if (isBlinking && shouldCyberBotBlink(faceEmotion)) {
      return (
        <g fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round">
          <path d="M 29 43 H 37 M 63 43 H 71" />
          {!speaking && <path d="M 46 51 Q 51 53 56 51" stroke="#38bdf8" strokeWidth="1.6" />}
        </g>
      );
    }

    switch (faceEmotion) {
      case 'launcher':
        return (
          <g fill="#22d3ee" fillOpacity="0.88" style={{ filter: 'drop-shadow(0 0 1px rgba(34, 211, 238, 0.4))' }}>
            <rect x="29" y="39" width="10" height="10" rx="3.5" />
            <path d="M 64 38 H 68 V 42 H 72 V 46 H 68 V 50 H 64 V 46 H 60 V 42 H 64 Z" />
          </g>
        );
      case 'curious':
        return (
          <g fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round">
            <path d="M 27 35 Q 32 31 37 35" />
            <ellipse cx="33" cy="43" rx="3.5" ry="4.5" fill="#22d3ee" stroke="none" />
            <circle cx="66" cy="43" r="2.5" fill="#22d3ee" stroke="none" />
            {!speaking && <path d="M 46 51 H 55" />}
          </g>
        );
      case 'delighted':
        return (
          <g fill="none" stroke="#22d3ee" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 28 42 Q 33 39 38 41 M 62 41 Q 67 39 72 42" strokeWidth="2.2" />
            {!speaking && <path d="M 44 51 Q 51 55 58 49" stroke="#38bdf8" strokeWidth="1.8" />}
            {!speaking && <path d="M 58 49 L 60 47" stroke="#38bdf8" strokeWidth="1.4" />}
          </g>
        );
      case 'sparkle':
        return (
          <g fill="none" stroke="#38bdf8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 33 38 L 34.5 42 L 38 43.5 L 34.5 45 L 33 49 L 31.5 45 L 28 43.5 L 31.5 42 Z" fill="#22d3ee" stroke="none" />
            <path d="M 63 42 Q 68 40 72 42" strokeWidth="2" />
            {!speaking && <path d="M 45 51 Q 51 54 57 50" stroke="#22d3ee" strokeWidth="1.7" />}
          </g>
        );
      case 'affectionate':
        return (
          <g fill="#22d3ee">
            <rect x="29" y="40" width="7" height="5" rx="2.5" />
            <rect x="64" y="40" width="7" height="5" rx="2.5" />
            {!speaking && <path d="M 45 51 Q 51 54 57 50" fill="none" stroke="#38bdf8" strokeWidth="1.7" strokeLinecap="round" />}
          </g>
        );
      case 'happy':
        return (
          <g fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round">
            <path d="M 28 43 Q 33 39 38 43 M 62 43 Q 67 39 72 43" />
            {!speaking && <path d="M 45 51 Q 51 54 57 50" stroke="#38bdf8" strokeWidth="1.7" />}
          </g>
        );
      case 'alert':
        return (
          <g fill="#f59e0b">
            <path d="M 31 37 H 35 L 34 44 H 32 Z M 32 46 H 34 V 49 H 32 Z" />
            {!speaking && <rect data-cyberbot-mouth="alert" x="45" y="42" width="10" height="5" rx="1.5" fill="none" stroke="#fbbf24" strokeWidth="1.5" />}
            <path d="M 65 37 H 69 L 68 44 H 66 Z M 66 46 H 68 V 49 H 66 Z" />
          </g>
        );
      case 'storage':
        return (
          <g fill="#f59e0b">
            <rect x="28" y="39" width="12" height="9" rx="2.5" />
            <rect x="60" y="39" width="12" height="9" rx="2.5" />
            {!speaking && (
              <g data-cyberbot-mouth="storage" fill="none" stroke="#fbbf24" strokeWidth="1.4">
                <rect x="43" y="51" width="14" height="6" rx="2" />
                <circle cx="46" cy="54" r="1" fill="#fbbf24" stroke="none" />
                <path d="M 50 54 H 54" strokeLinecap="round" />
              </g>
            )}
          </g>
        );
      case 'scared':
        return (
          <g className="select-none font-mono text-[14px] font-black" fill="#38bdf8">
            <text x="33" y="47" textAnchor="middle">&gt;</text>
            {!speaking && <text x="50" y="50" textAnchor="middle" fontSize="12" fill="#a5f3fc">o</text>}
            <text x="67" y="47" textAnchor="middle">&lt;</text>
          </g>
        );
      case 'wink':
        return (
          <g fill="none" stroke="#22d3ee" strokeLinecap="round">
            <rect x="30" y="40" width="7" height="6" rx="3" fill="#22d3ee" stroke="none" />
            <path d="M 63 43 Q 67 41 71 43" strokeWidth="2" />
            {!speaking && <path d="M 45 51 Q 52 55 58 49" stroke="#38bdf8" strokeWidth="1.7" />}
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
            {!speaking && <text x="50" y="49" textAnchor="middle" fontSize="11" fill="#34d399">‿</text>}
            <text x="67" y="48" textAnchor="middle">✓</text>
          </g>
        );
      case 'speaking':
        return (
          <g className="select-none font-mono text-[14px] font-black" fill="#22d3ee">
            <text x="33" y="47" textAnchor="middle">•</text>
            {!speaking && <text x="50" y="49" textAnchor="middle" fontSize="11" fill="#38bdf8">‿</text>}
            <text x="67" y="47" textAnchor="middle">•</text>
          </g>
        );
      case 'marquee':
        // Scrolling is the content of this face, so it remains active while
        // reduced-motion mode continues to suppress CyberBot's ambient motion.
        return (
          <g clipPath="url(#cyberBotFaceClip)">
            <text
              key={`${marqueeMessage}:${marqueeAnimationRun}`}
              data-cyberbot-marquee={marqueeMessage}
              data-cyberbot-marquee-run={marqueeAnimationRun}
              x="76"
              y="49"
              fontFamily="'JetBrains Mono', 'Segoe UI Symbol', monospace"
              fontSize="10.5"
              fontWeight="800"
              letterSpacing="0.2"
              fill="#67e8f9"
            >
              {marqueeMessage}
              <animate
                attributeName="x"
                from="76"
                to={String(marqueeEndX)}
                dur={`${marqueeDurationSeconds}s`}
                calcMode="linear"
                repeatCount="indefinite"
              />
            </text>
          </g>
        );
      case 'terminal':
      default:
        return (
          <g className="select-none font-mono text-[15px] font-black tracking-widest" fill="#22d3ee">
            <text x="40" y="48" textAnchor="middle">&gt;</text>
            {!speaking && <text x="60" y="48" textAnchor="middle" className="motion-safe:animate-pulse" fill="#38bdf8">_</text>}
          </g>
        );
    }
  };

  const glowColor = isAlert ? 'rgba(245, 158, 11, 0.45)' : isSleeping ? 'rgba(34, 211, 238, 0.12)' : 'rgba(34, 211, 238, 0.45)';

  return (
    <div
      aria-hidden="true"
      data-cyberbot-face={faceEmotion}
      data-cyberbot-speaking={speaking ? 'true' : 'false'}
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
        <svg
          viewBox="0 0 100 108"
          width={size}
          height={size}
          className="w-full h-full"
          style={{ filter: `drop-shadow(0 4px 16px ${glowColor})` }}
        >
          <defs>
            <linearGradient id="cyberBotBodyGrad" x1="12%" y1="0%" x2="88%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="38%" stopColor="#273449" />
              <stop offset="100%" stopColor="#0b1120" />
            </linearGradient>
            <linearGradient id="cyberBotCobaltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="55%" stopColor="#172554" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="cyberBotScreenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#020617" />
              <stop offset="55%" stopColor="#050b18" />
              <stop offset="100%" stopColor="#0b1730" />
            </linearGradient>
            <linearGradient id="cyberBotHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <filter id="cyberGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="cyberHaloGlow" x="-60%" y="-300%" width="220%" height="700%">
              <feGaussianBlur stdDeviation="2.4" />
            </filter>
            <clipPath id="cyberBotFaceClip">
              <rect x="23" y="22" width="54" height="33" rx="9" />
            </clipPath>
          </defs>

          {/* The hover field stays floor-anchored while the chassis floats above it. */}
          <motion.ellipse
            data-cyberbot-halo-glow="true"
            cx="50" cy="99" rx="27" ry="4.5"
            fill={isAlert ? '#f59e0b' : '#22d3ee'}
            filter="url(#cyberHaloGlow)"
            animate={reducedMotion
              ? { opacity: portalHidden ? 0 : isSleeping ? 0.08 : 0.18, scaleX: portalHidden ? 1.7 : 1, scaleY: 1 }
              : portalHidden
                ? { opacity: [0.2, 0.48, 0], scaleX: [1, 1.55, 1.8], scaleY: [1, 1.18, 0.45] }
                : {
                    opacity: isSleeping ? [0.08, 0.12, 0.08] : [0.2, 0.1, 0.2],
                    scaleX: isSleeping ? [0.98, 0.94, 0.98] : [1, 0.88, 1],
                    scaleY: 1,
                  }}
            transition={reducedMotion
              ? { duration: 0 }
              : portalHidden
                ? { duration: 0.68, times: [0, 0.55, 1], ease: 'easeIn' }
                : { duration: isSleeping ? 5 : 3.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '50px 99px' }}
          />
          <motion.ellipse
            data-cyberbot-halo="true"
            cx="50" cy="98" rx="25" ry="4.5"
            fill="none"
            stroke={isSleeping ? '#475569' : isAlert ? '#fbbf24' : '#38bdf8'}
            strokeWidth="2.1"
            animate={reducedMotion
              ? { opacity: portalHidden ? 0 : isSleeping ? 0.34 : 0.78, scaleX: portalHidden ? 1.7 : 1, scaleY: 1 }
              : portalHidden
                ? { opacity: [0.82, 1, 0], scaleX: [1, 1.48, 1.72], scaleY: [1, 1.22, 0.4] }
                : {
                    opacity: isSleeping ? [0.28, 0.4, 0.28] : [0.82, 0.5, 0.82],
                    scaleX: isSleeping ? [0.98, 0.94, 0.98] : [1, 0.88, 1],
                    scaleY: 1,
                  }}
            transition={reducedMotion
              ? { duration: 0 }
              : portalHidden
                ? { duration: 0.68, times: [0, 0.55, 1], ease: 'easeIn' }
                : { duration: isSleeping ? 5 : 3.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '50px 98px', filter: `drop-shadow(0 0 3px ${isAlert ? '#f59e0b' : '#22d3ee'})` }}
          />

          <motion.g
            id="cyberBotOrbiter"
            data-cyberbot-orbiter="true"
            animate={reducedMotion
              ? { y: portalHidden ? 38 : 0, rotate: 0, scaleX: portalHidden ? 0.46 : 1, scaleY: portalHidden ? 0.08 : 1, opacity: portalHidden ? 0 : 1 }
              : portalHidden
                ? { y: [0, 12, 38], rotate: [0, -1.5, 0], scaleX: [1, 0.88, 0.46], scaleY: [1, 0.82, 0.08], opacity: [1, 1, 0] }
                : { y: 0, rotate: 0, scaleX: 1, scaleY: 1, opacity: 1 }}
            transition={reducedMotion
              ? { duration: 0 }
              : portalHidden
                ? { duration: 0.68, times: [0, 0.55, 1], ease: [0.55, 0, 1, 0.45] }
                : { duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: '50px 58px' }}
          >
            <motion.g
              data-cyberbot-hover-float="true"
              animate={reducedMotion ? { y: 0, rotate: 0 } : {
                y: isSleeping ? [0, -1.2, 0] : [0, -3.5, 0],
                rotate: isSleeping ? 0 : isHovered ? [-1.2, 1.2, -1.2] : [0, 0.45, 0],
              }}
              transition={reducedMotion ? { duration: 0 } : {
                duration: isSleeping ? 5 : isHovered ? 1.4 : 3.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ transformOrigin: '50px 58px' }}
            >
            {/* Integrated stabilizer nacelles reinforce the torso instead of reading as arms. */}
            <path
              d="M 28 53 C 19 51 13 59 13 70 C 13 81 18 87 27 86 L 32 79 L 32 59 Z"
              fill="url(#cyberBotCobaltGrad)"
              stroke="#64748b" strokeWidth="1.2"
            />
            <path
              d="M 72 53 C 81 51 87 59 87 70 C 87 81 82 87 73 86 L 68 79 L 68 59 Z"
              fill="url(#cyberBotCobaltGrad)"
              stroke="#64748b" strokeWidth="1.2"
            />
            <path d="M 19 60 Q 16 70 19 80" fill="none" stroke="#38bdf8" strokeWidth="1.15" strokeLinecap="round" opacity={isSleeping ? 0.2 : 0.72} />
            <path d="M 81 60 Q 84 70 81 80" fill="none" stroke="#38bdf8" strokeWidth="1.15" strokeLinecap="round" opacity={isSleeping ? 0.2 : 0.72} />

            {/* Levitation core and broad armored torso. */}
            <path
              d="M 38 81 Q 50 101 62 81 Z"
              fill="#080f1e" stroke="#334155" strokeWidth="1.1"
            />
            <path
              d="M 27 51 Q 50 46 73 51 L 80 65 L 76 80 Q 66 92 50 94 Q 34 92 24 80 L 20 65 Z"
              fill="url(#cyberBotBodyGrad)"
              stroke="#64748b" strokeWidth="1.25"
            />
            <path d="M 27 57 L 40 61 L 36 84 Q 29 80 26 74 Z" fill="#172554" opacity="0.95" />
            <path d="M 73 57 L 60 61 L 64 84 Q 71 80 74 74 Z" fill="#172554" opacity="0.95" />
            <path d="M 28 53 Q 50 48 72 53 L 66 60 Q 50 56 34 60 Z" fill="#334155" opacity="0.9" />
            <path d="M 31 55 Q 50 60 69 55" fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity={isSleeping ? 0.18 : 0.65} />
            <path d="M 29 82 Q 50 94 71 82" fill="none" stroke="#1e3a8a" strokeWidth="1.1" opacity="0.82" />

            {/* Recessed voice panel: bottom-to-top light intensity. */}
            <path
              d="M 40 59 Q 50 61 60 59 L 62 84 Q 50 89 38 84 Z"
              fill="#050b18" stroke="#475569" strokeWidth="1"
            />
            <motion.g
              key={speaking ? `chest-${speechKey}` : 'chest-idle'}
              data-cyberbot-chest="true"
              data-cyberbot-speech-equalizer={speaking ? 'true' : undefined}
            >
              {CHEST_LIGHT_BARS.map((bar, index) => {
                const envelope = SPEECH_BAR_ENVELOPES[index];
                const restingOpacity = isSleeping ? 0.08 : index === 0 ? 0.38 : 0.13;
                const animate = speaking
                  ? reducedMotion
                    ? { opacity: index < 3 ? 0.88 : 0.16, scaleX: 1 }
                    : { opacity: envelope, scaleX: envelope.map(value => 0.76 + value * 0.24) }
                  : { opacity: restingOpacity, scaleX: 1 };
                return (
                  <motion.rect
                    key={bar.y}
                    data-cyberbot-speech-bar={index + 1}
                    x={50 - bar.width / 2} y={bar.y}
                    width={bar.width} height="2.5" rx="1.25"
                    fill={isSleeping ? '#64748b' : activeLightColor}
                    initial={false}
                    animate={animate}
                    transition={speaking && !reducedMotion
                      ? {
                          duration: 0.82 + index * 0.075,
                          times: [0, 0.12, 0.3, 0.47, 0.65, 0.82, 1],
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }
                      : { duration: reducedMotion ? 0 : 0.25 }}
                    style={{ transformOrigin: `50px ${bar.y + 1.25}px`, filter: speaking ? `drop-shadow(0 0 2px ${activeLightColor})` : undefined }}
                  />
                );
              })}
            </motion.g>

            {/* Low visor and flush crown sensor avoid the old toy-like antenna. */}
            <path
              d="M 28 14 C 37 11 63 11 72 14 C 80 17 84 24 84 34 C 84 44 78 51 68 54 C 58 56 42 56 32 54 C 22 51 16 44 16 34 C 16 24 20 17 28 14 Z"
              fill="url(#cyberBotBodyGrad)"
              stroke="#94a3b8" strokeWidth="1.25" strokeOpacity="0.72"
            />
            <path d="M 35 14 Q 50 8 65 14 L 61 19 H 39 Z" fill="url(#cyberBotCobaltGrad)" stroke="#475569" strokeWidth="0.8" />
            <path d="M 45 14 H 55" fill="none" stroke="#67e8f9" strokeWidth="1.4" strokeLinecap="round" opacity={isSleeping ? 0.18 : 0.85} />
            <rect
              x="21" y="20" width="58" height="35" rx="11"
              fill="url(#cyberBotScreenGrad)"
              stroke={isAlert ? '#f59e0b' : '#475569'}
              strokeWidth="1.3" strokeOpacity="0.92"
            />
            <path d="M 24 23 H 43 L 27 52 H 24 Z" fill="url(#cyberBotHighlight)" opacity="0.14" />
            <path d="M 32 55 Q 50 59 68 55" fill="none" stroke="#22d3ee" strokeWidth="0.75" opacity={isSleeping ? 0.12 : 0.52} />

            <AnimatePresence initial={false}>
              <motion.g
                key={speaking ? `speaking-${speechKey}` : faceEmotion}
                initial={reducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reducedMotion ? undefined : { opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeInOut' }}
                filter={faceEmotion === 'launcher' || faceEmotion === 'marquee' || speaking ? undefined : 'url(#cyberGlowFilter)'}
              >
                {renderFaceContent()}
              </motion.g>
            </AnimatePresence>

            {isSleeping && (
              <g fill="#94a3b8" className="font-mono font-bold" aria-hidden="true">
                <motion.g
                  animate={reducedMotion ? { opacity: 0.65, x: 0, y: 0 } : { opacity: [0, 0.8, 0], x: [0, 2, 4], y: [4, -2, -9] }}
                  transition={reducedMotion ? { duration: 0 } : { duration: 2.8, repeat: Infinity, ease: 'easeOut' }}
                >
                  <text x="77" y="19" fontSize="8">z</text>
                </motion.g>
                <motion.g
                  animate={reducedMotion ? { opacity: 0.55, x: 0, y: 0 } : { opacity: [0, 0.7, 0], x: [0, 2, 4], y: [4, -2, -9] }}
                  transition={reducedMotion ? { duration: 0 } : { duration: 2.8, delay: 1.2, repeat: Infinity, ease: 'easeOut' }}
                >
                  <text x="86" y="11" fontSize="10">z</text>
                </motion.g>
              </g>
            )}
            </motion.g>
          </motion.g>
        </svg>
      </motion.div>
    </div>
  );
};
