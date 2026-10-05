import { useEffect, useRef, useState } from 'react';
import { createCyberBotSleepTimer, createCyberBotVanishTimer, type CyberBotVanishStyle } from './cyberBotBehavior';

export function useCyberBotPresence(enabled: boolean, busy: boolean, messageId?: string, systemAttention = false) {
  const [sleeping, setSleeping] = useState(false);
  const [vanished, setVanished] = useState(false);
  const [vanishStyle, setVanishStyle] = useState<CyberBotVanishStyle>('phase');
  const [documentVisible, setDocumentVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  const controllers = useRef<{
    sleep: ReturnType<typeof createCyberBotSleepTimer>;
    vanish: ReturnType<typeof createCyberBotVanishTimer>;
  } | null>(null);

  useEffect(() => {
    setSleeping(false);
    setVanished(false);
    if (!enabled) return;

    const sleep = createCyberBotSleepTimer(setSleeping);
    const vanish = createCyberBotVanishTimer((hidden, style) => {
      setVanished(hidden);
      setVanishStyle(style);
    });
    controllers.current = { sleep, vanish };
    const wake = () => {
      sleep.wake();
      vanish.wake();
    };
    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'focus'] as const;
    const onVisibility = () => {
      setDocumentVisible(!document.hidden);
      if (!document.hidden) wake();
    };
    for (const event of events) window.addEventListener(event, wake, { passive: true, capture: true });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      controllers.current = null;
      sleep.dispose();
      vanish.dispose();
      for (const event of events) window.removeEventListener(event, wake, true);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled]);

  useEffect(() => {
    const current = controllers.current;
    if (!current) return;
    if (messageId || systemAttention) {
      current.sleep.wake();
      current.vanish.wake();
    }
    if (busy || !documentVisible) current.vanish.pause();
    else current.vanish.resume();
  }, [busy, documentVisible, messageId, systemAttention, enabled]);

  return { sleeping, vanished, vanishStyle };
}
