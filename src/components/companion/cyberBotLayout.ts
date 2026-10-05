export interface CyberBotRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface CyberBotLayout {
  left: number;
  top: number;
  bubbleWidth: number;
  bubbleVisible: boolean;
  hidden: boolean;
  align: 'left' | 'right';
}

export const CYBERBOT_SIZE = 94;
const MARGIN = 12;
const BUBBLE_GAP = 12;

function subtractObstacle(region: CyberBotRect, obstacle: CyberBotRect): CyberBotRect[] {
  const left = Math.max(region.left, obstacle.left - MARGIN);
  const right = Math.min(region.right, obstacle.right + MARGIN);
  const top = Math.max(region.top, obstacle.top - MARGIN);
  const bottom = Math.min(region.bottom, obstacle.bottom + MARGIN);
  if (left >= right || top >= bottom) return [region];
  return [
    { ...region, bottom: top },
    { ...region, top: bottom },
    { left: region.left, right: left, top, bottom },
    { left: right, right: region.right, top, bottom },
  ].filter(rect => rect.right > rect.left && rect.bottom > rect.top);
}

export function getCyberBotLayout({
  width, height, preferred, align, bubbleHeight, obstacles,
}: {
  width: number;
  height: number;
  preferred: { left: number; top: number };
  align: 'left' | 'right';
  bubbleHeight: number;
  obstacles: CyberBotRect[];
}): CyberBotLayout {
  let regions: CyberBotRect[] = [{ left: MARGIN, top: MARGIN, right: width - MARGIN, bottom: height - MARGIN }];
  for (const obstacle of obstacles) regions = regions.flatMap(region => subtractObstacle(region, obstacle));

  // Try the complete companion first. When only the avatar fits, preserve room for panel controls.
  for (const withBubble of bubbleHeight > 0 ? [true, false] : [false]) {
    let best: { score: number; layout: CyberBotLayout } | undefined;
    for (const region of regions) {
      const availableWidth = region.right - region.left;
      if (availableWidth < (withBubble ? 180 : CYBERBOT_SIZE)) continue;
      const bubbleWidth = Math.min(300, availableWidth);
      const footprintWidth = withBubble ? bubbleWidth : CYBERBOT_SIZE;
      const footprintHeight = CYBERBOT_SIZE + (withBubble ? bubbleHeight + BUBBLE_GAP : 0);
      if (region.bottom - region.top < footprintHeight) continue;

      for (const candidateAlign of [align, align === 'left' ? 'right' : 'left'] as const) {
        const offset = candidateAlign === 'right' ? footprintWidth - CYBERBOT_SIZE : 0;
        const left = Math.max(region.left, Math.min(preferred.left - offset, region.right - footprintWidth)) + offset;
        const top = Math.max(region.top + footprintHeight - CYBERBOT_SIZE, Math.min(preferred.top, region.bottom - CYBERBOT_SIZE));
        const score = (left - preferred.left) ** 2 + (top - preferred.top) ** 2 + (candidateAlign === align ? 0 : 1);
        if (!best || score < best.score) best = {
          score,
          layout: { left, top, align: candidateAlign, bubbleWidth, bubbleVisible: withBubble, hidden: false },
        };
      }
    }
    if (best) return best.layout;
  }
  return { ...preferred, align, bubbleWidth: 300, bubbleVisible: false, hidden: true };
}
