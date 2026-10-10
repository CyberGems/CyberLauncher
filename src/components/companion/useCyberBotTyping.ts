import { useLayoutEffect, useRef, useState } from 'react';
import { createCyberBotTypewriter, initialCyberBotTyping } from './cyberBotTyping';
import { useCyberBotReducedMotion } from './useCyberBotReducedMotion';

export function useCyberBotTyping(key: string, text: string, detail = '') {
  const reducedMotion = useCyberBotReducedMotion();
  const [state, setState] = useState(() => initialCyberBotTyping(key, text, detail, !reducedMotion));
  const controller = useRef<ReturnType<typeof createCyberBotTypewriter> | null>(null);
  useLayoutEffect(() => {
    controller.current = createCyberBotTypewriter(setState);
    return () => { controller.current?.dispose(); controller.current = null; };
  }, []);
  useLayoutEffect(() => { controller.current?.update(key, text, detail, !reducedMotion); },
    [key, text, detail, reducedMotion]);
  return state.key === key ? state : initialCyberBotTyping(key, text, detail, !reducedMotion);
}
