import { useLayoutEffect, useState, type RefObject } from 'react';
import { getCyberBotLayout, getCyberBotAnchor, type CyberBotRect, type CyberBotLayout } from './cyberBotLayout';
import type { CyberBotPosition } from './companionTypes';

const OBSTACLE = '[data-cyberbot-obstacle]';
const FLOOR = '[data-cyberbot-floor]';

export function useCyberBotLayout({ enabled, position, offset, messageId, bubbleRef }: {
  enabled: boolean;
  position: CyberBotPosition;
  offset: { x: number; y: number };
  messageId?: string;
  bubbleRef: RefObject<HTMLDivElement | null>;
}) {
  const [layout, setLayout] = useState<CyberBotLayout & { hasObstacles: boolean; anchorLeft: number; anchorTop: number }>({
    left: 0, top: 0, bubbleWidth: 300, bubbleVisible: false, hidden: true, align: 'right', hasObstacles: false, anchorLeft: 0, anchorTop: 0,
  });

  useLayoutEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const observed = new Set<HTMLElement>();
    const measure = () => {
      frame = 0;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const elements = [...document.querySelectorAll<HTMLElement>(OBSTACLE)];
      const floor = document.querySelector<HTMLElement>(FLOOR);
      const measurable = floor ? [...elements, floor] : elements;
      const anchor = getCyberBotAnchor(width, height, position, offset, floor?.getBoundingClientRect().top);
      const obstacles: CyberBotRect[] = elements.map(element => {
        const w = element.offsetWidth;
        const h = element.offsetHeight;
        switch (element.dataset.cyberbotObstacle) {
          // Use the final destination while the panel is still sliding in.
          case 'right': return { left: width - w, top: 0, right: width, bottom: height };
          case 'center': return { left: (width - w) / 2, top: (height - h) / 2, right: (width + w) / 2, bottom: (height + h) / 2 };
          case 'top': return { left: (width - w) / 2, top: height * 0.1, right: (width + w) / 2, bottom: height * 0.1 + h };
          default: return element.getBoundingClientRect();
        }
      }).filter(rect => rect.right > rect.left && rect.bottom > rect.top);
      for (const element of observed) {
        if (!measurable.includes(element)) {
          resizeObserver.unobserve(element);
          observed.delete(element);
        }
      }
      for (const element of measurable) {
        if (!observed.has(element)) {
          observed.add(element);
          resizeObserver.observe(element);
        }
      }
      const next = {
        ...getCyberBotLayout({
          width, height,
          preferred: anchor,
          align: position === 'bottom-left' ? 'left' : 'right',
          bubbleHeight: messageId ? (bubbleRef.current?.offsetHeight || 140) : 0,
          obstacles,
        }),
        hasObstacles: obstacles.length > 0,
        anchorLeft: anchor.left, anchorTop: anchor.top,
      };
      setLayout(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    const resizeObserver = new ResizeObserver(schedule);
    if (bubbleRef.current) resizeObserver.observe(bubbleRef.current);
    const containsObstacle = (node: Node) => node instanceof Element && (node.matches(OBSTACLE + ', ' + FLOOR) || node.querySelector(OBSTACLE + ', ' + FLOOR));
    const observer = new MutationObserver(records => {
      if (records.some(record => record.type === 'attributes' || [...record.addedNodes, ...record.removedNodes].some(containsObstacle))) schedule();
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-cyberbot-obstacle', 'data-cyberbot-floor'] });
    window.addEventListener('resize', schedule);
    measure();
    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      observer.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [enabled, position, offset.x, offset.y, messageId, bubbleRef]);

  return layout;
}
