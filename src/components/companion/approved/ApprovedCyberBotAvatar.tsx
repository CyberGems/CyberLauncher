import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import artwork from './cyberbot-approved.svg?raw';
import './cyberbot-approved.css';
import './cyberbot-integration.css';
import type { ApprovedCyberBotFace, CyberBotReviewState } from './CyberBotReviewContext';
import { approvedMarqueeTiming, createApprovedMarkup } from './approvedCyberBotBehavior';

interface Props extends CyberBotReviewState {
  isHovered?: boolean;
  isDragging?: boolean;
  dragTilt?: number;
  away?: boolean;
  marqueeMessage?: string;
  marqueeRun?: number;
  onMarqueeDuration?: (message: string, durationMs: number) => void;
  marqueeStatusMessages?: readonly string[];
  className?: string;
  size?: number;
}
const faces: readonly ApprovedCyberBotFace[] = [
  'default', 'launcher', 'launcher-top', 'marquee', 'terminal', 'curious', 'flight', 'sleeping', 'alert',
  'happy', 'delighted', 'affectionate', 'sparkle', 'wink', 'scared', 'storage', 'success', 'speaking',
];
const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';

export default function ApprovedCyberBotAvatar({
  face, marqueeMode, speaking, motion: motionEnabled, isHovered = false,
  isDragging = false, dragTilt = 0, away = false, marqueeMessage, marqueeRun = 0,
  onMarqueeDuration, marqueeStatusMessages, className = '', size = 80,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const prefix = `approved-${useId().replace(/[^\w-]/g, '')}-`;
  const reducedMotion = useReducedMotion() || !motionEnabled;
  const [portalPhase, setPortalPhase] = useState<'awake' | 'sinking' | 'hidden' | 'emerging'>('awake');
  const [backFacing, setBackFacing] = useState(false);
  const [turning, setTurning] = useState(false);
  const backFacingRef = useRef(false);
  const wasAway = useRef(false);
  const wasDragging = useRef(false);
  const message = marqueeMessage ?? [`CYBERLAUNCHER v${APP_VERSION}`, marqueeStatusMessages?.[0]].filter(Boolean).join('   ◆   ');
  const initial = useRef({ face, speaking, message }).current;
  const durationCallback = useRef(onMarqueeDuration);
  durationCallback.current = onMarqueeDuration;
  // Only trusted repository artwork is inserted as HTML. This object's identity
  // remains stable: React must not reset SVG mutations after ordinary rerenders.
  const markup = useMemo(() => createApprovedMarkup(artwork, prefix, initial.face, initial.speaking, initial.message), [prefix, initial]);
  const innerHTML = useMemo(() => ({ __html: markup }), [markup]);
  const canFloat = !reducedMotion && face !== 'marquee' && !isDragging && portalPhase === 'awake';

  useLayoutEffect(() => {
    const container = root.current;
    if (!container) return;
    const part = (name: string) => container.querySelector<SVGElement>(`[data-part="${name}"]`);
    for (const expression of faces) {
      const node = part(`face-${expression === 'default' ? 'eyes-default' : expression}`);
      if (node) node.style.display = expression === face ? 'inline' : 'none';
    }
    const assembly = part('botAssembly');
    assembly?.classList.toggle('levitating', canFloat && !assembly.classList.contains('drop-settling'));
    const equalizer = part('equalizerBars');
    equalizer?.classList.toggle('speaking-eq', speaking && face !== 'sleeping');
    equalizer?.classList.toggle('standby-eq', !speaking || face === 'sleeping');
    equalizer?.querySelectorAll('rect').forEach(rect => rect.setAttribute('fill', face === 'alert' || face === 'storage' ? '#f59e0b' : '#00f0ff'));
  }, [face, speaking, canFloat, markup]);

  useLayoutEffect(() => {
    const assembly = root.current?.querySelector<SVGElement>('[data-part="botAssembly"]');
    const halo = root.current?.querySelector<SVGElement>('[data-part="haloGroup"]');
    if (!assembly || !halo) return;
    const timers: number[] = [];
    const later = (fn: () => void, delay: number) => timers.push(window.setTimeout(fn, delay));
    assembly.classList.remove('portal-sinking', 'portal-hidden', 'portal-emerging');
    halo.classList.remove('portal-flare', 'portal-emerge-close', 'portal-open', 'grounded-active');
    halo.classList.add('halo-hidden');
    if (away) {
      wasAway.current = true;
      assembly.classList.remove('levitating', 'drop-settling', 'dragging-active');
      assembly.style.transform = '';
      if (reducedMotion) {
        assembly.classList.add('portal-hidden');
        setPortalPhase('hidden');
      } else {
        setPortalPhase('sinking');
        assembly.classList.add('portal-sinking');
        halo.classList.remove('halo-hidden');
        halo.classList.add('portal-flare');
        later(() => {
          assembly.classList.remove('portal-sinking');
          assembly.classList.add('portal-hidden');
          setPortalPhase('hidden');
        }, 580);
        later(() => { halo.classList.remove('portal-flare'); halo.classList.add('halo-hidden'); }, 980);
      }
    } else if (wasAway.current && !reducedMotion) {
      setPortalPhase('emerging');
      assembly.classList.remove('levitating');
      assembly.classList.add('portal-emerging');
      halo.classList.remove('halo-hidden');
      halo.classList.add('portal-emerge-close');
      later(() => { halo.classList.remove('portal-emerge-close'); halo.classList.add('halo-hidden'); }, 880);
      later(() => {
        assembly.classList.remove('portal-emerging');
        wasAway.current = false;
        setPortalPhase('awake');
      }, 1220);
    } else {
      wasAway.current = false;
      setPortalPhase('awake');
    }
    return () => timers.forEach(window.clearTimeout);
  }, [away, reducedMotion]);

  useLayoutEffect(() => {
    const assembly = root.current?.querySelector<SVGElement>('[data-part="botAssembly"]');
    if (!assembly) return;
    assembly.classList.toggle('dragging-active', isDragging && !reducedMotion);
    let timer: number | undefined;
    if (isDragging) {
      assembly.classList.remove('drop-settling', 'levitating');
      wasDragging.current = true;
    } else if (wasDragging.current) {
      wasDragging.current = false;
      assembly.style.transform = '';
      if (!reducedMotion && !away) {
        assembly.classList.add('drop-settling');
        timer = window.setTimeout(() => {
          assembly.classList.remove('drop-settling');
          if (face !== 'marquee') assembly.classList.add('levitating');
        }, 520);
      }
    }
    return () => { window.clearTimeout(timer); assembly.classList.remove('drop-settling'); };
  }, [isDragging, reducedMotion, away, face]);

  useLayoutEffect(() => {
    const assembly = root.current?.querySelector<SVGElement>('[data-part="botAssembly"]');
    if (assembly && isDragging && !reducedMotion) assembly.style.transform = `rotate(${Math.max(-14, Math.min(14, dragTilt))}deg)`;
  }, [dragTilt, isDragging, reducedMotion]);

  useLayoutEffect(() => {
    if (face !== 'marquee' || away) return;
    const group = root.current?.querySelector('[data-part="face-marquee-content"]');
    if (!group) return;
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const attrs = {
      class: 'marquee-text-node', x: '78', y: '43', fill: '#00f0ff',
      'font-family': "'JetBrains Mono', 'Segoe UI Emoji', monospace",
      'font-size': '17', 'font-weight': '800', 'letter-spacing': '0.04em',
      filter: `url(#${prefix}neonGlow)`, 'data-cyberbot-marquee': message,
      'data-cyberbot-marquee-run': String(marqueeRun),
    };
    Object.entries(attrs).forEach(([key, value]) => text.setAttribute(key, value));
    text.textContent = message;
    group.replaceChildren(text);
    const animation = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    const timing = approvedMarqueeTiming(message);
    Object.entries({ attributeName: 'x', from: '78', to: String(timing.end), dur: `${timing.seconds}s`,
      calcMode: 'linear', repeatCount: 'indefinite', begin: 'indefinite' })
      .forEach(([key, value]) => animation.setAttribute(key, value));
    text.append(animation);
    let cancelled = false;
    let timer: number;
    // Measure the actual loaded font, including accents/emoji. Start after landing.
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      const end = 20 - Math.max(60, text.getComputedTextLength());
      const seconds = Math.max(6.5, Math.ceil(((78 - end) / 26) * 10) / 10);
      animation.setAttribute('to', String(end));
      animation.setAttribute('dur', `${seconds}s`);
      const delay = marqueeMode === 'screen' && !reducedMotion ? 1050 : 0;
      durationCallback.current?.(message, seconds * 1000 + delay + 150);
      timer = window.setTimeout(() => { if (!cancelled) animation.beginElement(); }, delay);
    });
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [face, away, marqueeMode, reducedMotion, message, prefix, marqueeRun]);

  useEffect(() => {
    if (reducedMotion || face === 'marquee' || face === 'sleeping' || face === 'alert' || face === 'storage' || isDragging || away) {
      backFacingRef.current = false;
      setBackFacing(false);
      setTurning(false);
      return;
    }
    if (isHovered === backFacingRef.current) { setTurning(false); return; }
    const turntable = root.current?.querySelector('[data-part="headTurntable"]');
    turntable?.classList.remove('head-spinning');
    turntable?.getBoundingClientRect();
    turntable?.classList.add('head-spinning');
    setTurning(true);
    const halfway = window.setTimeout(() => { backFacingRef.current = isHovered; setBackFacing(isHovered); }, 140);
    const finish = window.setTimeout(() => { turntable?.classList.remove('head-spinning'); setTurning(false); }, 280);
    return () => { window.clearTimeout(halfway); window.clearTimeout(finish); turntable?.classList.remove('head-spinning'); };
  }, [isHovered, reducedMotion, face, isDragging, away]);

  useEffect(() => {
    if (reducedMotion || away || !['default', 'launcher', 'launcher-top', 'curious', 'flight', 'happy', 'delighted', 'affectionate', 'sparkle', 'speaking'].includes(face)) return;
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
  }, [face, reducedMotion, away]);

  const classes = ['cyberbot-approved-avatar', className,
    face === 'marquee' && 'marquee-active',
    face === 'marquee' && marqueeMode === 'screen' && !away && portalPhase === 'awake' && 'compact-screen-active',
    speaking && 'speaking-active', backFacing && 'head-facing-back', turning && 'head-spinning-active',
    portalPhase !== 'awake' && 'portal-active', reducedMotion && 'reduced-motion',
  ].filter(Boolean).join(' ');
  return <div ref={root} aria-hidden="true" data-cyberbot-design="approved"
    data-cyberbot-face={face} data-cyberbot-speaking={speaking} data-cyberbot-presence={portalPhase}
    className={classes} style={{ width: size, height: size * 1.15,
      '--eq-glow-color': face === 'alert' || face === 'storage' ? '#f59e0b' : '#00f0ff',
      '--eq-peak-glow': face === 'alert' || face === 'storage' ? '#fef3c7' : '#cffafe',
    } as React.CSSProperties} dangerouslySetInnerHTML={innerHTML} />;
}
