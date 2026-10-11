import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { createCyberBotHoverReaction, type CyberBotHoverReaction } from './approvedCyberBotBehavior';

export function useCyberBotHover(root: RefObject<HTMLDivElement | null>, hovered: boolean, eligible: boolean) {
  const controller = useRef<ReturnType<typeof createCyberBotHoverReaction> | null>(null);
  if (!controller.current) controller.current = createCyberBotHoverReaction();
  const [reaction, setReaction] = useState<CyberBotHoverReaction | null>(null);
  useLayoutEffect(() => { setReaction(controller.current!.update(hovered, eligible)); }, [hovered, eligible]);

  useLayoutEffect(() => {
    const container = root.current;
    if (!container || reaction !== 'focus') return;
    let frame: number | undefined;
    const move = (event: PointerEvent) => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = undefined;
        const bounds = container.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        const clamp = (value: number) => Math.max(-1, Math.min(1, value));
        const x = clamp((event.clientX - bounds.left - bounds.width / 2) / (bounds.width / 2));
        const y = clamp((event.clientY - bounds.top - bounds.height / 2) / (bounds.height / 2));
        container.style.setProperty('--hover-head-x', (x * 0.9).toFixed(2) + 'px');
        container.style.setProperty('--hover-head-tilt', (x * 2.4).toFixed(2) + 'deg');
        container.style.setProperty('--hover-reflection-x', (x * 7).toFixed(2) + 'px');
        container.style.setProperty('--hover-reflection-y', (y * 3).toFixed(2) + 'px');
      });
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      if (frame !== undefined) cancelAnimationFrame(frame);
      for (const name of ['--hover-head-x', '--hover-head-tilt', '--hover-reflection-x', '--hover-reflection-y']) {
        container.style.removeProperty(name);
      }
    };
  }, [reaction, root]);
  return reaction;
}
