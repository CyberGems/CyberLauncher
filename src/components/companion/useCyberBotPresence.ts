import { useEffect, useRef, useState } from 'react';
import { createCyberBotIdleCycle, type CyberBotIdleState, type CyberBotVanishStyle } from './cyberBotBehavior';

export function useCyberBotPresence(enabled: boolean, busy: boolean, messageId?: string, systemAttention = false) {
  const [idleState, setIdleState] = useState<CyberBotIdleState>('awake');
  const [vanishStyle, setVanishStyle] = useState<CyberBotVanishStyle>('portal');
  const [documentVisible, setDocumentVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  const cycleRef = useRef<ReturnType<typeof createCyberBotIdleCycle> | null>(null);

  useEffect(() => {
    setIdleState('awake');
    if (!enabled) return;

    const cycle = createCyberBotIdleCycle((state, style) => {
      setIdleState(state);
      setVanishStyle(style);
    });
    cycleRef.current = cycle;
    const wake = () => cycle.wake();
    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'focus'] as const;
    const onVisibility = () => {
      setDocumentVisible(!document.hidden);
      if (!document.hidden) wake();
    };
    for (const event of events) window.addEventListener(event, wake, { passive: true, capture: true });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cycleRef.current = null;
      cycle.dispose();
      for (const event of events) window.removeEventListener(event, wake, true);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled]);

  useEffect(() => {
    const current = cycleRef.current;
    if (!current) return;
    if (messageId || systemAttention) current.wake();
    if (busy || !documentVisible) current.pause();
    else current.resume();
  }, [busy, documentVisible, messageId, systemAttention, enabled]);

  return { sleeping: idleState === 'sleeping', vanished: idleState === 'hidden', vanishStyle };
}
