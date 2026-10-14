import { useEffect, useRef, useState, useCallback } from 'react';
import { createCyberBotFarewell, emptyCyberBotFarewell } from './cyberBotFarewell';

export function useCyberBotFarewell(enabled: boolean) {
  const [state, setState] = useState(emptyCyberBotFarewell);
  const controller = useRef<ReturnType<typeof createCyberBotFarewell> | null>(null);
  useEffect(() => {
    controller.current = createCyberBotFarewell(setState);
    return () => { controller.current?.dispose(); controller.current = null; };
  }, []);
  useEffect(() => { if (enabled) controller.current?.cancel(); }, [enabled]);
  const start = useCallback((text: string, visible: boolean) => controller.current?.start(text, visible), []);
  const depart = useCallback(() => controller.current?.depart(), []);
  const cancel = useCallback(() => controller.current?.cancel(), []);
  const confirm = useCallback(() => controller.current?.start('', false), []);
  return { state, start, depart, cancel, confirm };
}
