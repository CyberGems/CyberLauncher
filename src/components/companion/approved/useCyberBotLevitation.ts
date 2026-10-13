import { useLayoutEffect, type RefObject } from 'react';

// SVG motion repaints the curves at their current position instead of sliding a cached bitmap.
export function useCyberBotLevitation(root: RefObject<HTMLDivElement | null>, enabled: boolean) {
  useLayoutEffect(() => {
    const assembly = root.current?.querySelector<SVGGElement>('[data-part="botAssembly"]');
    const motion = assembly?.querySelector<SVGAnimateTransformElement>('[data-part="vectorLevitation"]');
    if (!assembly || !motion) return;
    let running = false;
    const sync = () => {
      const next = enabled && assembly.classList.contains('levitating') && !assembly.classList.contains('drop-settling');
      if (next === running) return;
      if (next) motion.beginElement();
      else motion.endElement();
      running = next;
    };
    const observer = new MutationObserver(sync);
    observer.observe(assembly, { attributes: true, attributeFilter: ['class'] });
    sync();
    return () => {
      observer.disconnect();
      if (running && motion.isConnected) motion.endElement();
    };
  }, [root, enabled]);
}
