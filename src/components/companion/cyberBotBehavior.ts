import type { CyberBotEmotion } from './companionTypes';

export const CYBERBOT_SLEEP_DELAY_MS = 90_000;
export const cyberBotIdleExpressions = ['happy', 'wink', 'curious', 'delighted', 'affectionate', 'sparkle'] as const;

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
