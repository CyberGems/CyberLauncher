import type { CyberBotEmotion } from './companionTypes';

export const CYBERBOT_SLEEP_MIN_IDLE_MS = 45_000;
export const CYBERBOT_SLEEP_MAX_IDLE_MS = 60_000;
export const CYBERBOT_SLEEP_MIN_REST_MS = 15_000;
export const CYBERBOT_SLEEP_MAX_REST_MS = 30_000;
export const CYBERBOT_VANISH_MIN_IDLE_MS = 15_000;
export const CYBERBOT_VANISH_MAX_IDLE_MS = 30_000;
export const CYBERBOT_VANISH_MIN_AWAY_MS = 18_000;
export const CYBERBOT_VANISH_MAX_AWAY_MS = 42_000;
export const CYBERBOT_VANISH_CHANCE = 0.75;
export type CyberBotVanishStyle = 'phase' | 'ascend';
export type CyberBotIdleState = 'awake' | 'sleeping' | 'hidden';
export const CYBERBOT_HOVER_DWELL_MS = 2_000;
export const CYBERBOT_HOVER_MOVE_COOLDOWN_MS = 30_000;
// The logo face is the resting expression; these appear briefly between resting pauses.
export const cyberBotIdleExpressions = ['happy', 'wink', 'curious', 'delighted', 'affectionate', 'sparkle', 'terminal'] as const;

export function nextCyberBotIdleExpression(previous: CyberBotEmotion, random = Math.random): CyberBotEmotion {
  const choices = cyberBotIdleExpressions.filter(emotion => emotion !== previous);
  return choices[Math.floor(random() * choices.length)];
}

// One idle cycle chooses a gesture instead of running overlapping sleep and
// vanish timers. Two consecutive departures guarantee a sleep next time.
export function createCyberBotIdleCycle(
  onChange: (state: CyberBotIdleState, style: CyberBotVanishStyle) => void,
  random = Math.random,
) {
  let lastActivity = Date.now();
  let state: CyberBotIdleState = 'awake';
  let paused = false;
  let disposed = false;
  let style: CyberBotVanishStyle = 'phase';
  let consecutiveVanish = 0;
  let nextGesture: 'vanish' | 'sleep';
  let idleDelay: number;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function clearTimer() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }
  function chooseNextGesture() {
    nextGesture = consecutiveVanish >= 2 || random() >= CYBERBOT_VANISH_CHANCE ? 'sleep' : 'vanish';
    idleDelay = nextGesture === 'vanish'
      ? randomDelay(CYBERBOT_VANISH_MIN_IDLE_MS, CYBERBOT_VANISH_MAX_IDLE_MS, random)
      : randomDelay(CYBERBOT_SLEEP_MIN_IDLE_MS, CYBERBOT_SLEEP_MAX_IDLE_MS, random);
  }
  function scheduleCheck(delay = idleDelay) {
    if (disposed || paused) return;
    timer = setTimeout(check, delay);
  }
  function finishGesture() {
    timer = null;
    if (disposed || paused || state === 'awake') return;
    state = 'awake';
    onChange(state, style);
    lastActivity = Date.now();
    chooseNextGesture();
    scheduleCheck();
  }
  function check() {
    timer = null;
    if (disposed || paused) return;
    const remaining = idleDelay - (Date.now() - lastActivity);
    if (remaining > 0) {
      scheduleCheck(remaining);
      return;
    }
    if (nextGesture === 'vanish') {
      state = 'hidden';
      consecutiveVanish += 1;
      style = random() < 0.5 ? 'phase' : 'ascend';
      onChange(state, style);
      timer = setTimeout(finishGesture, randomDelay(CYBERBOT_VANISH_MIN_AWAY_MS, CYBERBOT_VANISH_MAX_AWAY_MS, random));
    } else {
      state = 'sleeping';
      consecutiveVanish = 0;
      onChange(state, style);
      timer = setTimeout(finishGesture, randomDelay(CYBERBOT_SLEEP_MIN_REST_MS, CYBERBOT_SLEEP_MAX_REST_MS, random));
    }
  }
  chooseNextGesture();
  scheduleCheck();

  return {
    wake() {
      if (disposed) return;
      lastActivity = Date.now();
      if (state === 'awake') return;
      state = 'awake';
      clearTimer();
      onChange(state, style);
      chooseNextGesture();
      scheduleCheck();
    },
    pause() {
      if (disposed || paused) return;
      paused = true;
      clearTimer();
      if (state !== 'awake') {
        state = 'awake';
        onChange(state, style);
      }
    },
    resume() {
      if (disposed || !paused) return;
      paused = false;
      lastActivity = Date.now();
      chooseNextGesture();
      scheduleCheck();
    },
    dispose() {
      disposed = true;
      clearTimer();
    },
  };
}

function randomDelay(min: number, max: number, random: () => number): number {
  return min + Math.floor(Math.max(0, Math.min(0.999999, random())) * (max - min + 1));
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
