import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import type { CyberBotEmotion } from './companionTypes';
import { CyberBotReviewContext } from './approved/CyberBotReviewContext';
import ApprovedCyberBotAvatar from './approved/ApprovedCyberBotAvatar';
import { approvedCyberBotFace, approvedMarqueeTiming, nextApprovedMarquee } from './approved/approvedCyberBotBehavior';
import { getCyberBotIdleExpressionDuration, getCyberBotIdleMarqueeMessages, nextCyberBotIdleExpression } from './cyberBotBehavior';

interface CyberBotAvatarProps {
  emotion?: CyberBotEmotion;
  isHovered?: boolean;
  isDragging?: boolean;
  dragTilt?: number;
  away?: boolean;
  onMarqueeReadingChange?: (reading: boolean) => void;
  speechKey?: string;
  marqueeStatusMessages?: readonly string[];
  size?: number;
  className?: string;
}
const SPEECH_CUE_MS = 1800;
const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';

export const CyberBotAvatar: React.FC<CyberBotAvatarProps> = ({
  emotion = 'idle', isHovered = false, isDragging = false, dragTilt = 0, away = false,
  speechKey, marqueeStatusMessages, onMarqueeReadingChange, size = 80, className = '',
}) => {
  const review = React.useContext(CyberBotReviewContext);
  const reducedMotion = useReducedMotion();
  const catalogKey = JSON.stringify(marqueeStatusMessages);
  const messages = useMemo(() => getCyberBotIdleMarqueeMessages(APP_VERSION,
    catalogKey ? JSON.parse(catalogKey) : undefined), [catalogKey]);
  const [idleExpression, setIdleExpression] = useState<CyberBotEmotion>('launcher');
  const [marqueeMessage, setMarqueeMessage] = useState(() => nextApprovedMarquee(null, messages));
  const [marqueeRun, setMarqueeRun] = useState(0);
  const [measuredMarquee, setMeasuredMarquee] = useState({ message: '', durationMs: 0 });
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  const [speechActive, setSpeechActive] = useState(!!speechKey && emotion !== 'sleeping' && !reducedMotion);
  const facesSinceMarquee = useRef(1);
  const dragFace = useRef<'curious' | 'flight'>('flight');
  const wasDragging = useRef(false);
  if (isDragging && !wasDragging.current) dragFace.current = Math.random() < 0.5 ? 'curious' : 'flight';
  wasDragging.current = isDragging;

  useEffect(() => {
    if (review || emotion !== 'idle' || isHovered || isDragging || away || !visible) return;
    const duration = idleExpression === 'marquee'
      ? Math.max(getCyberBotIdleExpressionDuration('marquee'),
        measuredMarquee.message === marqueeMessage ? measuredMarquee.durationMs : approvedMarqueeTiming(marqueeMessage).durationMs)
      : getCyberBotIdleExpressionDuration(idleExpression);
    const timer = window.setTimeout(() => {
      const next = nextCyberBotIdleExpression(idleExpression, Math.random, facesSinceMarquee.current);
      if (next === 'marquee') {
        setMarqueeMessage(previous => nextApprovedMarquee(previous, messages));
        facesSinceMarquee.current = 0;
      } else facesSinceMarquee.current += 1;
      setIdleExpression(next);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [review, emotion, isHovered, isDragging, away, visible, idleExpression, marqueeMessage, measuredMarquee, messages, marqueeRun]);

  useEffect(() => {
    setMarqueeMessage(previous => nextApprovedMarquee(previous, messages));
  }, [messages]);

  // Reset the idle deadline together with the SVG timeline after tray return.
  useEffect(() => {
    const restartMarquee = () => {
      if (document.hidden) return;
      setVisible(true);
      setMarqueeRun(run => run + 1);
    };
    const onVisibility = () => { setVisible(!document.hidden); restartMarquee(); };
    const unsubscribe = window.electronAPI?.onLauncherShown?.(restartMarquee);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', restartMarquee);
    return () => {
      unsubscribe?.();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', restartMarquee);
    };
  }, []);

  useEffect(() => {
    if (!speechKey || emotion === 'sleeping' || reducedMotion) { setSpeechActive(false); return; }
    setSpeechActive(true);
    const timer = window.setTimeout(() => setSpeechActive(false), SPEECH_CUE_MS);
    return () => window.clearTimeout(timer);
  }, [speechKey, emotion, reducedMotion]);

  const face = isDragging ? dragFace.current : approvedCyberBotFace(emotion === 'idle' ? idleExpression : emotion);
  useEffect(() => {
    if (review || face !== 'marquee' || away) {
      onMarqueeReadingChange?.(false);
      return;
    }
    onMarqueeReadingChange?.(true);
    const duration = measuredMarquee.message === marqueeMessage
      ? measuredMarquee.durationMs : approvedMarqueeTiming(marqueeMessage).durationMs;
    const timer = window.setTimeout(() => onMarqueeReadingChange?.(false), duration);
    return () => { window.clearTimeout(timer); onMarqueeReadingChange?.(false); };
  }, [review, face, away, marqueeMessage, marqueeRun, measuredMarquee, onMarqueeReadingChange]);

  const speaking = !!speechKey && speechActive && emotion !== 'sleeping' && !reducedMotion;
  return <ApprovedCyberBotAvatar
    face={face} marqueeMode="screen" speaking={speaking} motion={!reducedMotion}
    {...review} isHovered={isHovered} isDragging={isDragging} dragTilt={dragTilt} away={away}
    marqueeMessage={review ? undefined : marqueeMessage} marqueeRun={marqueeRun}
    onMarqueeDuration={(message, durationMs) => setMeasuredMarquee(previous =>
      previous.message === message && previous.durationMs === durationMs ? previous : { message, durationMs })}
    marqueeStatusMessages={marqueeStatusMessages} size={size} className={className} />;
};
