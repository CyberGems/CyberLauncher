import { DESKTOP_CYBERBOT_LAYOUT, type DesktopCyberBotPlacement } from '../shared/desktopCyberBot';

const { avatarSize, avatarPadding, bubbleWidth, bubbleHeight, gap, sidePadding, topPadding, bottomPadding } = DESKTOP_CYBERBOT_LAYOUT;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function constrainDesktopAvatar(avatar: Electron.Point, area: Electron.Rectangle): Electron.Point {
  return {
    x: clamp(avatar.x, area.x + avatarPadding, area.x + area.width - avatarSize - avatarPadding),
    y: clamp(avatar.y, area.y + avatarPadding, area.y + area.height - avatarSize - avatarPadding),
  };
}

export function desktopCyberBotLayout(
  avatar: Electron.Point, area: Electron.Rectangle, expanded: boolean, measuredBubbleHeight: number,
): { bounds: Electron.Rectangle; placement: DesktopCyberBotPlacement } {
  if (!expanded) {
    return {
      bounds: {
        x: avatar.x - avatarPadding,
        y: avatar.y - avatarPadding,
        width: avatarSize + avatarPadding * 2,
        height: avatarSize + avatarPadding * 2,
      },
      placement: { avatarLeft: avatarPadding, avatarTop: avatarPadding, bubble: null },
    };
  }

  const spaceAbove = avatar.y - area.y - gap - topPadding;
  const spaceBelow = area.y + area.height - (avatar.y + avatarSize) - gap - bottomPadding;
  const above = spaceAbove >= bubbleHeight || spaceAbove >= spaceBelow;
  const maxHeight = Math.max(1, Math.min(bubbleHeight, above ? spaceAbove : spaceBelow));
  const height = Math.min(measuredBubbleHeight, maxHeight);
  const width = Math.min(bubbleWidth + sidePadding * 2, area.width);
  const center = avatar.x + avatarSize / 2;
  // Keep the bubble's right edge near the avatar when there's room to its left.
  const x = clamp(center - width + sidePadding + avatarSize / 2 + 5, area.x, area.x + area.width - width);
  const y = above ? avatar.y - gap - height - topPadding : avatar.y - avatarPadding;
  const contentWidth = width - sidePadding * 2;

  return {
    bounds: {
      x, y, width,
      height: height + gap + avatarSize + avatarPadding + (above ? topPadding : bottomPadding),
    },
    placement: {
      avatarLeft: avatar.x - x,
      avatarTop: avatar.y - y,
      bubble: {
        left: sidePadding,
        top: above ? topPadding : avatarPadding + avatarSize + gap,
        width: contentWidth,
        maxHeight,
        tailLeft: clamp(center - x - sidePadding, 18, contentWidth - 18),
        side: above ? 'above' : 'below',
      },
    },
  };
}
