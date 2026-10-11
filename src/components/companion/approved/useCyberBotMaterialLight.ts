import { useLayoutEffect, type RefObject } from 'react';

// Material lighting is independent of hover and expression. No frames run at rest.
export function useCyberBotMaterialLight(root: RefObject<HTMLDivElement | null>, enabled: boolean) {
  useLayoutEffect(() => {
    const container = root.current;
    if (!container) return;
    const helmet = container.querySelector<SVGRadialGradientElement>('[data-part="materialHelmetLight"]');
    const torso = container.querySelector<SVGRadialGradientElement>('[data-part="materialTorsoLight"]');
    if (!helmet || !torso) return;
    const paint = (x: number, y: number) => {
      helmet.setAttribute('cx', (50 + x * 31).toFixed(2));
      helmet.setAttribute('cy', (23 + y * 8).toFixed(2));
      torso.setAttribute('cx', (50 + x * 24).toFixed(2));
      torso.setAttribute('cy', (71 + y * 13).toFixed(2));
    };
    if (!enabled) return;
    let frame: number | undefined;
    let point: { x: number; y: number } | undefined;
    const update = () => {
      frame = undefined;
      if (!point) return;
      const clamp = (value: number) => Math.max(-1, Math.min(1, value));
      // The whole window represents the virtual light's travel, including distant corners.
      paint(clamp(point.x / Math.max(1, window.innerWidth) * 2 - 1),
        clamp(point.y / Math.max(1, window.innerHeight) * 2 - 1));
    };
    const schedule = () => {
      if (frame === undefined && !document.hidden) frame = requestAnimationFrame(update);
    };
    const move = (event: PointerEvent) => { point = { x: event.clientX, y: event.clientY }; schedule(); };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('resize', schedule);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [root, enabled]);
}
