import { DESKTOP_CYBERBOT_LAYOUT, type DesktopCyberBotBubblePlacement } from '../shared/desktopCyberBot';

const { avatarSize, avatarPadding, bubbleWidth, bubbleHeight, gap, sidePadding, topPadding } = DESKTOP_CYBERBOT_LAYOUT;
const shadowBottom = 40;
const paddingBesideAvatar = 12;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function constrainDesktopAvatar(avatar: Electron.Point, area: Electron.Rectangle): Electron.Point {
  return {
    x: clamp(avatar.x, area.x + avatarPadding, area.x + area.width - avatarSize - avatarPadding),
    y: clamp(avatar.y, area.y + avatarPadding, area.y + area.height - avatarSize - avatarPadding),
  };
}

export function desktopCyberBotAvatarBounds(avatar: Electron.Point): Electron.Rectangle {
  return {
    x: avatar.x - avatarPadding,
    y: avatar.y - avatarPadding,
    width: avatarSize + avatarPadding * 2,
    height: avatarSize + avatarPadding * 2,
  };
}

export function desktopToastBounds(area: Electron.Rectangle, avoid: Electron.Rectangle[], current?: Electron.Rectangle): Electron.Rectangle {
  const width = Math.min(530, area.width);
  const height = Math.min(180, area.height);
  const insetX = Math.min(12, Math.floor((area.width - width) / 2));
  const insetY = Math.min(12, Math.floor((area.height - height) / 2));
  const left = area.x + insetX;
  const right = area.x + area.width - width - insetX;
  const top = area.y + insetY;
  const bottom = area.y + area.height - height - insetY;
  const candidates = [
    { x: right, y: bottom }, { x: left, y: bottom },
    { x: right, y: top }, { x: left, y: top },
  ];
  const overlap = ({ x, y }: Electron.Point) => avoid.reduce((total, rect) => {
    const horizontal = Math.max(0, Math.min(x + width, rect.x + rect.width) - Math.max(x, rect.x));
    const vertical = Math.max(0, Math.min(y + height, rect.y + rect.height) - Math.max(y, rect.y));
    return total + horizontal * vertical;
  }, 0);
  if (current?.width === width && current.height === height && current.x >= area.x && current.y >= area.y
    && current.x + width <= area.x + area.width && current.y + height <= area.y + area.height && overlap(current) === 0) return current;
  const position = candidates.reduce((best, point) => overlap(point) < overlap(best) ? point : best);
  return { ...position, width, height };
}

export function desktopCyberBotBubbleLayout(
  avatar: Electron.Point, area: Electron.Rectangle, measuredBubbleHeight: number,
): { bounds: Electron.Rectangle; placement: DesktopCyberBotBubblePlacement } {
  const spaceAbove = avatar.y - area.y - gap - topPadding;
  const spaceBelow = area.y + area.height - (avatar.y + avatarSize) - gap - shadowBottom;
  const above = spaceAbove >= bubbleHeight || spaceAbove >= spaceBelow;
  const maxHeight = Math.max(1, Math.min(bubbleHeight, above ? spaceAbove : spaceBelow));
  const height = Math.min(measuredBubbleHeight, maxHeight);
  const width = Math.min(bubbleWidth + sidePadding * 2, area.width);
  const center = avatar.x + avatarSize / 2;
  // Keep the bubble's right edge near the avatar when there's room to its left.
  const x = clamp(center - width + sidePadding + avatarSize / 2 + 5, area.x, area.x + area.width - width);
  const paddingTop = above ? topPadding : paddingBesideAvatar;
  const paddingBottom = above ? paddingBesideAvatar : shadowBottom;
  const y = above ? avatar.y - gap - height - paddingTop : avatar.y + avatarSize + gap - paddingTop;
  const contentWidth = width - sidePadding * 2;
  const areaBottom = area.y + area.height;

  return {
    bounds: {
      x, y, width,
      height: Math.min(height + paddingTop + paddingBottom, areaBottom - y),
    },
    placement: {
      left: sidePadding,
      top: paddingTop,
      width: contentWidth,
      maxHeight,
      tailLeft: clamp(center - x - sidePadding, 18, contentWidth - 18),
      side: above ? 'above' : 'below',
    },
  };
}
