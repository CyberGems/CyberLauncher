import { useLayoutEffect, type RefObject } from 'react';

// Only a short settling sequence runs after pointer input; there is no idle loop.
export function useCyberBotMaterialLight(root: RefObject<HTMLDivElement | null>, enabled: boolean) {
  useLayoutEffect(() => {
    const container = root.current;
    if (!container || !enabled) return;
    const helmet = container.querySelector<SVGRadialGradientElement>('[data-part="materialHelmetLight"]');
    const torso = container.querySelector<SVGRadialGradientElement>('[data-part="materialTorsoLight"]');
    if (!helmet || !torso) return;
    const current = [helmet, torso].flatMap(node => ['cx', 'cy'].map(name => Number(node.getAttribute(name))));
    const written = current.map(value => value.toFixed(2));
    let target = [...current];
    let point: { x: number; y: number } | undefined;
    let frame: number | undefined;
    let previousTime: number | undefined;
    const update = (time: number) => {
      frame = undefined;
      if (document.hidden) { previousTime = undefined; return; }
      const elapsed = previousTime === undefined ? 16 : Math.min(64, time - previousTime);
      previousTime = time;
      const blend = 1 - Math.exp(-elapsed / 45);
      const settled = current.every((value, i) => Math.abs(target[i] - value) < 0.02);
      for (let i = 0; i < current.length; i++) {
        current[i] = settled ? target[i] : current[i] + (target[i] - current[i]) * blend;
        const value = current[i].toFixed(2);
        if (written[i] !== value) {
          (i < 2 ? helmet : torso).setAttribute(i % 2 === 0 ? 'cx' : 'cy', value);
          written[i] = value;
        }
      }
      if (settled) previousTime = undefined;
      else frame = requestAnimationFrame(update);
    };
    const schedule = () => {
      if (frame === undefined && !document.hidden) frame = requestAnimationFrame(update);
    };
    const aim = () => {
      if (!point) return;
      const clamp = (value: number) => Math.max(-1, Math.min(1, value));
      const x = clamp(point.x / Math.max(1, window.innerWidth) * 2 - 1);
      const y = clamp(point.y / Math.max(1, window.innerHeight) * 2 - 1);
      target = [50 + x * 31, 23 + y * 8, 50 + x * 24, 71 + y * 13];
      schedule();
    };
    const move = (event: PointerEvent) => { point = { x: event.clientX, y: event.clientY }; aim(); };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('resize', aim);
    document.addEventListener('visibilitychange', schedule);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('resize', aim);
      document.removeEventListener('visibilitychange', schedule);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [root, enabled]);
}
