// A 20% lower speed takes 25% longer over the same distance.
export const CYBERBOT_TRAVEL_DURATION_MS = 360 / 0.8;
export function cyberBotMotionTilt(horizontalDelta: number): number {
  return Math.max(-14, Math.min(14, horizontalDelta * 1.4));
}
