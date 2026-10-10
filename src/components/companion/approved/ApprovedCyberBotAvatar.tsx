import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import artwork from './cyberbot-approved.svg?raw';
import './cyberbot-approved.css';
import type { ApprovedCyberBotFace, CyberBotReviewState } from './CyberBotReviewContext';

interface Props extends CyberBotReviewState {
  isHovered?: boolean;
  marqueeStatusMessages?: readonly string[];
  className?: string;
  size?: number;
}

const faces: readonly ApprovedCyberBotFace[] = [
  'default', 'launcher', 'launcher-top', 'marquee', 'terminal', 'curious', 'flight', 'sleeping', 'alert',
];
const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';

export default function ApprovedCyberBotAvatar({
  face, marqueeMode, speaking, motion: motionEnabled, isHovered = false,
  marqueeStatusMessages, className = '', size = 80,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const prefix = `approved-${useId().replace(/:/g, '')}-`;
  const reducedMotion = useReducedMotion() || !motionEnabled;
  const [marqueeRun, setMarqueeRun] = useState(0);
  const [backFacing, setBackFacing] = useState(false);
  const [turning, setTurning] = useState(false);
  const backFacingRef = useRef(false);

  // Trusted, repository-owned SVG. No text or user input is inserted as HTML.
  // Keep the original HTML attribute semantics and give each instance unique IDs.
  const markup = useMemo(() => artwork
    .replace(/id="([\w-]+)"/g, (_, part: string) => `id="${prefix}${part}" data-part="${part}"`)
    .replace(/url\(#([\w-]+)\)/g, (_, part: string) => `url(#${prefix}${part})`), [prefix]);
  // React compares this prop by identity. A fresh object on every render would
  // reset the SVG after effects apply expressions, motion and marquee content.
  const innerHTML = useMemo(() => ({ __html: markup }), [markup]);

  const message = [`CYBERLAUNCHER v${APP_VERSION}`, marqueeStatusMessages?.[0]]
    .filter(Boolean).join('   ◆   ');

  useLayoutEffect(() => {
    const container = root.current;
    if (!container) return;
    const part = (name: string) => container.querySelector<SVGElement>(`[data-part="${name}"]`);
    for (const expression of faces) {
      const node = part(`face-${expression === 'default' ? 'eyes-default' : expression}`);
      if (node) node.style.display = expression === face ? 'inline' : 'none';
    }
    // Ephemeral halo is hidden at rest, as initialized by setHaloMode in the lab.
    const halo = part('haloGroup');
    halo?.classList.add('halo-hidden');
    part('botAssembly')?.classList.toggle('levitating', !reducedMotion && face !== 'marquee');
    const equalizer = part('equalizerBars');
    equalizer?.classList.toggle('speaking-eq', speaking && face !== 'sleeping');
    equalizer?.classList.toggle('standby-eq', !speaking || face === 'sleeping');
    equalizer?.querySelectorAll('rect').forEach(rect => rect.setAttribute('fill', face === 'alert' ? '#f59e0b' : '#00f0ff'));
  }, [face, speaking, reducedMotion, markup]);

  useLayoutEffect(() => {
    const group = root.current?.querySelector('[data-part="face-marquee-content"]');
    if (!group) return;
    // Recreate only the scrolling content when Chromium resumes from the tray.
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const attrs = {
      class: 'marquee-text-node', x: '78', y: '43', fill: '#00f0ff',
      'font-family': "'JetBrains Mono', 'Segoe UI Emoji', monospace",
      'font-size': '17', 'font-weight': '800', 'letter-spacing': '0.04em',
      filter: `url(#${prefix}neonGlow)`, 'data-cyberbot-marquee': message,
    };
    Object.entries(attrs).forEach(([key, value]) => text.setAttribute(key, value));
    text.textContent = message;
    const end = 20 - Math.max(60, Math.round(message.length * 10.6));
    const duration = Math.max(6.5, Math.round(((78 - end) / 26) * 10) / 10);
    const animation = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    Object.entries({ attributeName: 'x', from: '78', to: String(end), dur: `${duration}s`, calcMode: 'linear', repeatCount: 'indefinite' })
      .forEach(([key, value]) => animation.setAttribute(key, value));
    text.append(animation);
    group.replaceChildren(text);
  }, [message, prefix, marqueeRun]);

  useEffect(() => {
    const restart = () => { if (!document.hidden) setMarqueeRun(run => run + 1); };
    const unsubscribe = window.electronAPI?.onLauncherShown?.(restart);
    document.addEventListener('visibilitychange', restart);
    window.addEventListener('focus', restart);
    return () => {
      unsubscribe?.();
      document.removeEventListener('visibilitychange', restart);
      window.removeEventListener('focus', restart);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || face === 'marquee') {
      backFacingRef.current = false;
      setBackFacing(false);
      setTurning(false);
      return;
    }
    if (isHovered === backFacingRef.current) {
      setTurning(false);
      return;
    }
    const turntable = root.current?.querySelector('[data-part="headTurntable"]');
    turntable?.classList.remove('head-spinning');
    turntable?.getBoundingClientRect();
    turntable?.classList.add('head-spinning');
    setTurning(true);
    const halfway = window.setTimeout(() => {
      backFacingRef.current = isHovered;
      setBackFacing(isHovered);
    }, 140);
    const finish = window.setTimeout(() => {
      turntable?.classList.remove('head-spinning');
      setTurning(false);
    }, 280);
    return () => {
      window.clearTimeout(halfway);
      window.clearTimeout(finish);
      turntable?.classList.remove('head-spinning');
    };
  }, [isHovered, reducedMotion, face]);

  useEffect(() => {
    if (reducedMotion || !['default', 'launcher', 'launcher-top', 'curious', 'flight'].includes(face)) return;
    let timer: number;
    let reset: number;
    const visor = root.current?.querySelector('[data-part="visorFaceContent"]');
    const schedule = () => {
      timer = window.setTimeout(() => {
        visor?.classList.add('visor-blinking');
        reset = window.setTimeout(() => { visor?.classList.remove('visor-blinking'); schedule(); }, 170);
      }, 2200 + Math.random() * 1600);
    };
    schedule();
    return () => { window.clearTimeout(timer); window.clearTimeout(reset); visor?.classList.remove('visor-blinking'); };
  }, [face, reducedMotion]);

  const classes = ['cyberbot-approved-avatar', className,
    face === 'marquee' && 'marquee-active',
    face === 'marquee' && marqueeMode === 'screen' && 'compact-screen-active',
    speaking && 'speaking-active', backFacing && 'head-facing-back', turning && 'head-spinning-active',
    reducedMotion && 'reduced-motion',
  ].filter(Boolean).join(' ');

  return <div ref={root} aria-hidden="true" data-cyberbot-design="approved"
    data-cyberbot-face={face} data-cyberbot-speaking={speaking}
    className={classes} style={{ width: size, height: size * 1.15,
      '--eq-glow-color': face === 'alert' ? '#f59e0b' : '#00f0ff',
      '--eq-peak-glow': face === 'alert' ? '#fef3c7' : '#cffafe',
    } as React.CSSProperties}
    dangerouslySetInnerHTML={innerHTML} />;
}
