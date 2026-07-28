import type { Display } from 'electron';

/**
 * Pick the display whose bounds are closest to a point.
 * Used when Electron display IDs reshuffle after a Windows reboot.
 */
export function displayNearestPoint(
  displays: Display[],
  primary: Display,
  x: number,
  y: number
): Display {
  let best = primary;
  let bestDist = Infinity;
  for (const d of displays) {
    const b = d.bounds;
    const cx = Math.min(Math.max(x, b.x), b.x + b.width);
    const cy = Math.min(Math.max(y, b.y), b.y + b.height);
    const dist = (x - cx) * (x - cx) + (y - cy) * (y - cy);
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  return best;
}

export type MonitorHint = {
  preferredId?: string | null;
  savedMonitorId?: string | null;
  /** Last known workArea or window bounds — survives display.id changes */
  boundsHint?: { x: number; y: number; width?: number; height?: number } | null;
};

/**
 * Resolve which monitor CyberLauncher should occupy.
 * Priority: preferred ID → saved ID → nearest to saved bounds → primary.
 */
export function resolveTargetDisplay(
  displays: Display[],
  primary: Display,
  hint: MonitorHint
): Display {
  if (!displays.length) return primary;

  if (hint.preferredId) {
    const found = displays.find((d) => d.id.toString() === String(hint.preferredId));
    if (found) return found;
  }

  if (hint.savedMonitorId) {
    const found = displays.find((d) => d.id.toString() === String(hint.savedMonitorId));
    if (found) return found;
  }

  const b = hint.boundsHint;
  if (b && typeof b.x === 'number' && typeof b.y === 'number') {
    const cx = Math.round(b.x + (Number(b.width) || 0) / 2);
    const cy = Math.round(b.y + (Number(b.height) || 0) / 2);
    return displayNearestPoint(displays, primary, cx, cy);
  }

  return primary;
}
