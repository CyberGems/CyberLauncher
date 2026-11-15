import React, { useEffect, useMemo, useState } from 'react';

export interface CyberAnalogClockProps {
  /** Pauses the 1s tick interval when the window is hidden. */
  visible?: boolean;
  /** Optional fixed date for deterministic testing. */
  timeOverride?: Date;
}

interface ClockTick {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isQuarter: boolean;
  isHour: boolean;
}

/**
 * Sober CyberLauncher-themed analog clock featuring the app icon etched subtly
 * into the dark dial behind clean, non-neon geometric hands and digital readout.
 */
export const CyberAnalogClock: React.FC<CyberAnalogClockProps> = ({
  visible = true,
  timeOverride,
}) => {
  const [now, setNow] = useState(() => timeOverride ?? new Date());
  const [documentVisible, setDocumentVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden',
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibilityChange = () => {
      setDocumentVisible(document.visibilityState !== 'hidden');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (timeOverride || !visible || !documentVisible) return;
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [visible, documentVisible, timeOverride]);

  const activeTime = timeOverride ?? now;
  const hrs = activeTime.getHours();
  const mins = activeTime.getMinutes();
  const secs = activeTime.getSeconds();

  const hrDeg = ((hrs % 12) * 30) + (mins * 0.5);
  const minDeg = (mins * 6) + (secs * 0.1);
  const secDeg = secs * 6;

  const timeStr = activeTime.toLocaleTimeString('en-US', { hour12: false });

  const ticks = useMemo<ClockTick[]>(() => {
    const list: ClockTick[] = [];
    for (let i = 0; i < 60; i++) {
      const angle = (i * 6 * Math.PI) / 180;
      const isQuarter = i % 15 === 0;
      const isHour = i % 5 === 0;
      const rOuter = 81;
      const rInner = isQuarter ? 71 : isHour ? 74 : 77;

      const cos = Math.cos(angle - Math.PI / 2);
      const sin = Math.sin(angle - Math.PI / 2);

      list.push({
        x1: 90 + rInner * cos,
        y1: 90 + rInner * sin,
        x2: 90 + rOuter * cos,
        y2: 90 + rOuter * sin,
        isQuarter,
        isHour,
      });
    }
    return list;
  }, []);

  return (
    <div className="flex flex-col items-center justify-center my-3 relative select-none">
      <div className="relative w-44 h-44 rounded-full p-1 bg-[#060a13] border border-white/10 shadow-[0_12px_28px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.05)] flex items-center justify-center">
        <div className="absolute inset-1 rounded-full border border-cyan-500/15 pointer-events-none" />

        <svg viewBox="0 0 180 180" className="w-full h-full">
          <defs>
            <radialGradient id="cyber-clock-dial-bg" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#0e172a" />
              <stop offset="65%" stopColor="#070b15" />
              <stop offset="100%" stopColor="#03060c" />
            </radialGradient>

            <clipPath id="cyber-clock-logo-clip">
              <circle cx="90" cy="90" r="46" />
            </clipPath>

            <radialGradient id="cyber-clock-logo-fade" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#070c16" stopOpacity="0.18" />
              <stop offset="62%" stopColor="#060a13" stopOpacity="0.48" />
              <stop offset="100%" stopColor="#050912" stopOpacity="0.96" />
            </radialGradient>

            <linearGradient id="cyber-clock-hour-hand" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            <linearGradient id="cyber-clock-min-hand" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#bae6fd" />
            </linearGradient>
          </defs>

          {/* Main Dial Plate */}
          <circle
            cx="90"
            cy="90"
            r="83"
            fill="url(#cyber-clock-dial-bg)"
            stroke="#38bdf8"
            strokeWidth="0.75"
            strokeOpacity="0.16"
          />

          {/* Subtle CyberLauncher Icon Watermark */}
          <image
            href="./icon-256.png"
            x="29"
            y="29"
            width="122"
            height="122"
            opacity="0.18"
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#cyber-clock-logo-clip)"
          />
          <circle cx="90" cy="90" r="47" fill="url(#cyber-clock-logo-fade)" />

          {/* Fine Etched Chapter Ring */}
          <circle cx="90" cy="90" r="65" fill="none" stroke="#94a3b8" strokeWidth="0.5" strokeOpacity="0.12" />
          <circle cx="90" cy="90" r="47" fill="none" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.12" />

          {/* 60 Crisp Graduation Ticks */}
          {ticks.map((tick, idx) => (
            <line
              key={idx}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke={tick.isQuarter ? '#38bdf8' : tick.isHour ? '#64748b' : '#1e293b'}
              strokeOpacity={tick.isQuarter ? 0.78 : tick.isHour ? 0.85 : 0.9}
              strokeWidth={tick.isQuarter ? 1.8 : tick.isHour ? 1.15 : 0.75}
              strokeLinecap="round"
            />
          ))}

          {/* Cardinal Numbers */}
          <text x="90" y="29" textAnchor="middle" fill="#cbd5e1" fontSize="7.5" fontWeight="600" fontFamily="monospace" letterSpacing="0.5">12</text>
          <text x="153" y="92.5" textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontWeight="600" fontFamily="monospace" letterSpacing="0.5">03</text>
          <text x="90" y="156" textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontWeight="600" fontFamily="monospace" letterSpacing="0.5">06</text>
          <text x="27" y="92.5" textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontWeight="600" fontFamily="monospace" letterSpacing="0.5">09</text>

          {/* Subtle Wordmark */}
          <text x="90" y="53" textAnchor="middle" fill="#64748b" fontSize="4.6" fontWeight="700" fontFamily="sans-serif" letterSpacing="2">
            CYBERLAUNCHER
          </text>

          {/* Recessed Digital Time Readout */}
          <g transform="translate(64, 117)">
            <rect
              x="0"
              y="0"
              width="52"
              height="14"
              rx="3.5"
              fill="#030712"
              fillOpacity="0.86"
              stroke="#94a3b8"
              strokeWidth="0.65"
              strokeOpacity="0.22"
            />
            <text x="26" y="9.8" textAnchor="middle" fill="#bae6fd" fontSize="7.5" fontWeight="600" fontFamily="monospace" letterSpacing="0.6">
              {timeStr}
            </text>
          </g>

          {/* Hour Hand */}
          <g transform={`rotate(${hrDeg} 90 90)`}>
            <path
              d="M88.1 90 L88.7 54 L90 48 L91.3 54 L91.9 90 L91 96 L89 96 Z"
              fill="url(#cyber-clock-hour-hand)"
              stroke="#475569"
              strokeWidth="0.45"
            />
            <path d="M89.5 82 L89.5 56 L90.5 56 L90.5 82 Z" fill="#0f172a" fillOpacity="0.45" />
          </g>

          {/* Minute Hand */}
          <g transform={`rotate(${minDeg} 90 90)`}>
            <path
              d="M88.5 90 L89.1 33 L90 25.5 L90.9 33 L91.5 90 L90.8 100 L89.2 100 Z"
              fill="url(#cyber-clock-min-hand)"
              stroke="#0284c7"
              strokeOpacity="0.45"
              strokeWidth="0.5"
            />
            <path d="M89.6 82 L89.6 35 L90.4 35 L90.4 82 Z" fill="#0369a1" fillOpacity="0.35" />
          </g>

          {/* Second Hand */}
          <g transform={`rotate(${secDeg} 90 90)`}>
            <line
              x1="90"
              y1="106"
              x2="90"
              y2="20"
              stroke="#22d3ee"
              strokeOpacity="0.85"
              strokeWidth="0.95"
              strokeLinecap="round"
            />
            <circle cx="90" cy="100" r="2.8" fill="#050912" stroke="#22d3ee" strokeOpacity="0.8" strokeWidth="1" />
          </g>

          {/* Center Pivot Cap */}
          <circle cx="90" cy="90" r="4.6" fill="#0b1220" stroke="#38bdf8" strokeOpacity="0.7" strokeWidth="1.2" />
          <circle cx="90" cy="90" r="1.4" fill="#e2e8f0" />
        </svg>
      </div>
    </div>
  );
};
