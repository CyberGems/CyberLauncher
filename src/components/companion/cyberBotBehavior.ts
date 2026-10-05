import type { CyberBotEmotion } from './companionTypes';

export const CYBERBOT_SLEEP_DELAY_MS = 90_000;
export const CYBERBOT_HOVER_DWELL_MS = 2_000;
export const CYBERBOT_HOVER_MOVE_COOLDOWN_MS = 30_000;
// The logo face is the resting expression; these appear briefly between resting pauses.
export const cyberBotIdleExpressions = ['happy', 'wink', 'curious', 'delighted', 'affectionate', 'sparkle', 'terminal'] as const;

export function nextCyberBotIdleExpression(previous: CyberBotEmotion, random = Math.random): CyberBotEmotion {
  const choices = cyberBotIdleExpressions.filter(emotion => emotion !== previous);
  return choices[Math.floor(random() * choices.length)];
}

// Activity only updates a timestamp while awake, rather than allocating a timer on every mouse move.
export function createCyberBotSleepTimer(onSleep: (sleeping: boolean) => void, delay = CYBERBOT_SLEEP_DELAY_MS) {
  let lastActivity = Date.now();
  let sleeping = false;
  let disposed = false;
  let timer: ReturnType<typeof setTimeout>;
  const check = () => {
    if (disposed) return;
    const remaining = delay - (Date.now() - lastActivity);
    if (remaining > 0) timer = setTimeout(check, remaining);
    else {
      sleeping = true;
      onSleep(true);
    }
  };
  timer = setTimeout(check, delay);
  return {
    wake() {
      if (disposed) return;
      lastActivity = Date.now();
      if (sleeping) {
        sleeping = false;
        onSleep(false);
        timer = setTimeout(check, delay);
      }
    },
    dispose() {
      disposed = true;
      clearTimeout(timer);
    },
  };
}

export function createCyberBotHoverAssist(onCountdown: (remaining: number | null) => void, onMove: () => void) {
  let dwellTimer: ReturnType<typeof setTimeout> | null = null;
  let countdownTimer: ReturnType<typeof setTimeout> | null = null;
  let remaining: number | null = null;
  let armed = true;
  let cooldownUntil = 0;
  let disposed = false;

  const clearTimers = () => {
    if (dwellTimer !== null) clearTimeout(dwellTimer);
    if (countdownTimer !== null) clearTimeout(countdownTimer);
    dwellTimer = null;
    countdownTimer = null;
  };
  const stop = (rearm: boolean) => {
    clearTimers();
    if (remaining !== null) {
      remaining = null;
      onCountdown(null);
    }
    armed = rearm;
  };
  const tick = () => {
    if (disposed || remaining === null) return;
    remaining -= 1;
    if (remaining > 0) {
      onCountdown(remaining);
      countdownTimer = setTimeout(tick, 1_000);
      return;
    }
    stop(false);
    cooldownUntil = Date.now() + CYBERBOT_HOVER_MOVE_COOLDOWN_MS;
    onMove();
  };

  return {
    enter() {
      if (disposed || !armed || Date.now() < cooldownUntil) return;
      armed = false;
      dwellTimer = setTimeout(() => {
        dwellTimer = null;
        remaining = 3;
        onCountdown(remaining);
        countdownTimer = setTimeout(tick, 1_000);
      }, CYBERBOT_HOVER_DWELL_MS);
    },
    leave() { if (!disposed) stop(true); },
    cancel() { if (!disposed) stop(false); },
    dispose() {
      disposed = true;
      clearTimers();
    },
  };
}
