import { useEffect, useRef, useState } from 'react';
import { createCyberBotContextPresence } from './cyberBotContextPresence';

export function useCyberBotContextPresence(enabled: boolean, open: boolean, busy: boolean, attention: boolean) {
  const [away, setAway] = useState(false);
  const controller = useRef<ReturnType<typeof createCyberBotContextPresence> | null>(null);
  const latest = useRef({ open, busy, attention });
  latest.current = { open, busy, attention };
  useEffect(() => {
    setAway(false);
    if (!enabled) return;
    const next = createCyberBotContextPresence(setAway);
    controller.current = next;
    next.update(latest.current);
    return () => { controller.current = null; next.dispose(); };
  }, [enabled]);
  useEffect(() => { controller.current?.update({ open, busy, attention }); }, [enabled, open, busy, attention]);
  return away;
}
