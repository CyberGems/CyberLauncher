import { useEffect, useState } from 'react';
import { createCyberBotSleepTimer } from './cyberBotBehavior';

export function useCyberBotSleep(enabled: boolean) {
  const [sleeping, setSleeping] = useState(false);
  useEffect(() => {
    setSleeping(false);
    if (!enabled) return;
    const timer = createCyberBotSleepTimer(setSleeping);
    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'focus'] as const;
    const onVisibility = () => {
      if (!document.hidden) timer.wake();
    };
    for (const event of events) window.addEventListener(event, timer.wake, { passive: true, capture: true });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      timer.dispose();
      for (const event of events) window.removeEventListener(event, timer.wake, true);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled]);
  return sleeping;
}
