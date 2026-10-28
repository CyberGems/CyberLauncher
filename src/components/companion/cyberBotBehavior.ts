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
// Idle rotates slowly through composed faces. Visibly cheerful gestures remain rare.
export const cyberBotNeutralIdleExpressions = ['default', 'launcher', 'flight', 'curious', 'terminal'] as const;
const coreIdleExpressions = ['default', 'launcher', 'flight'] as const;
function idleExpressionRound(round: number): CyberBotEmotion[] {
  return [
    ...coreIdleExpressions,
    ...(round % 2 === 0 ? ['terminal' as const] : []),
    ...(round % 3 === 0 ? ['curious' as const] : []),
  ];
}
const weightedNeutralIdleExpressions = Array.from({ length: 6 }, (_, index) => idleExpressionRound(index + 1)).flat();
export const cyberBotExpressiveIdleExpressions = ['happy', 'wink', 'delighted', 'affectionate', 'sparkle'] as const;
export const CYBERBOT_IDLE_EXPRESSIVE_CHANCE = 0.02;
export const CYBERBOT_IDLE_MARQUEE_CHANCE = 0.05;
export const CYBERBOT_IDLE_MARQUEE_MIN_INTERVAL_MS = 120_000;
export const CYBERBOT_IDLE_NEUTRAL_MIN_MS = 5_500;
export const CYBERBOT_IDLE_NEUTRAL_MAX_MS = 8_500;
export const CYBERBOT_IDLE_EXPRESSIVE_MIN_MS = 3_200;
export const CYBERBOT_IDLE_EXPRESSIVE_MAX_MS = 4_800;
export const CYBERBOT_IDLE_MARQUEE_MIN_MS = 11_000;
export const CYBERBOT_IDLE_MARQUEE_MAX_MS = 14_000;

export const cyberBotDefaultIdleMarqueeStatuses: readonly string[] = [];

type MarqueeStatusKey = 'cyberbot_marquee_apps' | 'cyberbot_marquee_favorites'
  | 'cyberbot_marquee_launches_today' | 'cyberbot_marquee_shortcut' | 'cyberbot_marquee_bot_shortcut' | 'cyberbot_marquee_scheduled_tasks';

export function getCyberBotMarqueeStatusMessages({
  apps, favoriteIds, dailyLaunchCount, scheduledTasks, activationShortcut, cyberBotShortcut,
}: {
  apps: readonly { id: number }[];
  favoriteIds: readonly number[];
  dailyLaunchCount: number;
  scheduledTasks: readonly { remainingSeconds: number }[];
  activationShortcut: string;
  cyberBotShortcut?: string;
}, t: (key: MarqueeStatusKey, values: Record<string, string>) => string): string[] {
  const favorites = apps.filter(app => favoriteIds.includes(app.id)).length;
  const pending = scheduledTasks.filter(task => task.remainingSeconds > 0).length;
  return [
    t('cyberbot_marquee_apps', { count: String(apps.length) }),
    t('cyberbot_marquee_launches_today', { count: String(dailyLaunchCount) }),
    ...(activationShortcut.trim() ? [t('cyberbot_marquee_shortcut', { shortcut: activationShortcut })] : []),
    ...(cyberBotShortcut?.trim() ? [t('cyberbot_marquee_bot_shortcut', { shortcut: cyberBotShortcut })] : []),
    ...(favorites ? [t('cyberbot_marquee_favorites', { count: String(favorites) })] : []),
    ...(pending ? [t('cyberbot_marquee_scheduled_tasks', { count: String(pending) })] : []),
  ];
}

export function getCyberBotIdleMarqueeMessages(
  appVersion: string,
  statuses: readonly string[] = cyberBotDefaultIdleMarqueeStatuses,
): string[] {
  return [
    `CYBERLAUNCHER v${appVersion}`,
    ...statuses,
  ];
}

export function nextCyberBotIdleMarqueeMessage(
  previous: string | null,
  messages: readonly string[],
  random = Math.random,
): string {
  const choices = messages.filter(message => message !== previous);
  return choices.length ? choices[Math.floor(random() * choices.length)] : (messages[0] ?? '');
}

export function nextCyberBotIdleExpression(
  previous: CyberBotEmotion,
  random = Math.random,
  marqueeAllowed = true,
  neutralChoices: readonly CyberBotEmotion[] = weightedNeutralIdleExpressions,
): CyberBotEmotion {
  const roll = random();
  if (
    roll >= CYBERBOT_IDLE_EXPRESSIVE_CHANCE
    && roll < CYBERBOT_IDLE_EXPRESSIVE_CHANCE + CYBERBOT_IDLE_MARQUEE_CHANCE
    && previous !== 'marquee'
    && marqueeAllowed
  ) {
    return 'marquee';
  }

  const pool = roll < CYBERBOT_IDLE_EXPRESSIVE_CHANCE
    ? cyberBotExpressiveIdleExpressions
    : neutralChoices;
  const choices = pool.filter(emotion => emotion !== previous);
  return choices[Math.floor(random() * choices.length)];
}

// Exhaust each composed-face round; Terminal joins every second, curiosity every third.
// The occasional status screen keeps its independent guard across interruptions.
export function createCyberBotIdleExpressionPicker(random = Math.random, now = Date.now) {
  let marqueeEligibleAt = now() + CYBERBOT_IDLE_MARQUEE_MIN_INTERVAL_MS;
  let round = 0;
  let remaining: CyberBotEmotion[] = [];
  return {
    next(previous: CyberBotEmotion): CyberBotEmotion {
      if (!remaining.some(face => face !== previous)) {
        round += 1;
        remaining = idleExpressionRound(round);
      }
      const next = nextCyberBotIdleExpression(previous, random, now() >= marqueeEligibleAt, remaining);
      const index = remaining.indexOf(next);
      if (index !== -1) remaining.splice(index, 1);
      if (next === 'marquee') marqueeEligibleAt = now() + CYBERBOT_IDLE_MARQUEE_MIN_INTERVAL_MS;
      return next;
    },
    postponeMarquee() {
      marqueeEligibleAt = now() + CYBERBOT_IDLE_MARQUEE_MIN_INTERVAL_MS;
    },
  };
}

export function getCyberBotIdleExpressionDuration(expression: CyberBotEmotion, random = Math.random): number {
  if (expression === 'marquee') {
    return randomDelay(CYBERBOT_IDLE_MARQUEE_MIN_MS, CYBERBOT_IDLE_MARQUEE_MAX_MS, random);
  }

  const isNeutral = cyberBotNeutralIdleExpressions.includes(expression as typeof cyberBotNeutralIdleExpressions[number]);
  return isNeutral
    ? randomDelay(CYBERBOT_IDLE_NEUTRAL_MIN_MS, CYBERBOT_IDLE_NEUTRAL_MAX_MS, random)
    : randomDelay(CYBERBOT_IDLE_EXPRESSIVE_MIN_MS, CYBERBOT_IDLE_EXPRESSIVE_MAX_MS, random);
}

export function shouldCyberBotBlink(emotion: CyberBotEmotion): boolean {
  return !['launcher', 'terminal', 'marquee', 'sleeping', 'scared', 'alert', 'storage'].includes(emotion);
}

export interface CyberBotIdleCycleOptions {
  allowVanish?: boolean;
}

// One idle cycle chooses a gesture instead of running overlapping sleep and
// vanish timers. By default, CyberBot stays visible on the main panel and
// routine idle gestures transition to sleeping without vanishing.
export function createCyberBotIdleCycle(
  onChange: (state: CyberBotIdleState, style: CyberBotVanishStyle) => void,
  random = Math.random,
  options: CyberBotIdleCycleOptions = {},
) {
  const { allowVanish = false } = options;
  let lastActivity = Date.now();
  let state: CyberBotIdleState = 'awake';
  let paused = false;
  let reading = false;
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
    if (!allowVanish) {
      nextGesture = 'sleep';
      idleDelay = randomDelay(CYBERBOT_SLEEP_MIN_IDLE_MS, CYBERBOT_SLEEP_MAX_IDLE_MS, random);
      return;
    }
    nextGesture = consecutiveVanish >= 2 || random() >= CYBERBOT_VANISH_CHANCE ? 'sleep' : 'vanish';
    idleDelay = nextGesture === 'vanish'
      ? randomDelay(CYBERBOT_VANISH_MIN_IDLE_MS, CYBERBOT_VANISH_MAX_IDLE_MS, random)
      : randomDelay(CYBERBOT_SLEEP_MIN_IDLE_MS, CYBERBOT_SLEEP_MAX_IDLE_MS, random);
  }
  function scheduleCheck(delay = idleDelay) {
    if (disposed || paused || reading) return;
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
    // Reading defers the gesture without resetting elapsed idle time.
    setReading(value: boolean) {
      if (disposed || reading === value) return;
      reading = value;
      if (state !== 'awake') return;
      clearTimer();
      if (!reading) scheduleCheck(Math.max(0, idleDelay - (Date.now() - lastActivity)));
    },
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
