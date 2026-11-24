import { useLayoutEffect, useRef, useState } from 'react';
import { createCyberBotTypewriter, initialCyberBotTyping } from './cyberBotTyping';
import { useCyberBotReducedMotion } from './useCyberBotReducedMotion';

export function useCyberBotTyping(key: string, text: string, detail = '', animate = true) {
  const reducedMotion = useCyberBotReducedMotion();
  const animated = animate && !reducedMotion;
  const [state, setState] = useState(() => initialCyberBotTyping(key, text, detail, animated));
  const controller = useRef<ReturnType<typeof createCyberBotTypewriter> | null>(null);
  useLayoutEffect(() => {
    controller.current = createCyberBotTypewriter(setState);
    return () => { controller.current?.dispose(); controller.current = null; };
  }, []);
  useLayoutEffect(() => { controller.current?.update(key, text, detail, animated); },
    [key, text, detail, animated]);
  return animated && state.key === key ? state : initialCyberBotTyping(key, text, detail, animated);
}
