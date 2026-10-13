export type CyberBotReturnKind = 'scan' | 'sensors';
export interface CyberBotReturnGesture { id: number; kind: CyberBotReturnKind }
export interface CyberBotReturnTask { id: string; name: string; remainingSeconds: number }
export const CYBERBOT_RETURN_ABSENCE_MS = 10 * 60_000;
export const CYBERBOT_RETURN_GREETING_COOLDOWN_MS = 30 * 60_000;
export const CYBERBOT_RETURN_TASK_SECONDS = 5 * 60;

export function createCyberBotReturnController() {
  let hiddenAt: number | null = null;
  let lastGreetingAt: number | null = null;
  let next: CyberBotReturnKind = 'scan';
  let sequence = 0;
  const announcedTasks = new Set<string>();
  return {
    hidden(now = Date.now()) { if (hiddenAt === null) hiddenAt = now; },
    shown(options: {
      now?: number; enabled: boolean; blocked: boolean; allowSpeech: boolean;
      tasks: readonly CyberBotReturnTask[];
      greet: () => boolean; announceTask: (task: CyberBotReturnTask) => boolean;
    }): CyberBotReturnGesture | null {
      if (hiddenAt === null) return null; // Initial show and duplicate events are not returns.
      const now = options.now ?? Date.now();
      const absence = Math.max(0, now - hiddenAt);
      hiddenAt = null;
      for (const id of announcedTasks) {
        if (!options.tasks.some(task => task.id === id)) announcedTasks.delete(id);
      }
      if (!options.enabled || options.blocked) return null;
      if (options.allowSpeech) {
        const task = options.tasks.filter(task => Number.isFinite(task.remainingSeconds)
          && task.remainingSeconds > 10 && task.remainingSeconds <= CYBERBOT_RETURN_TASK_SECONDS
          && !announcedTasks.has(task.id)).sort((a, b) => a.remainingSeconds - b.remainingSeconds)[0];
        if (task) {
          if (options.announceTask(task)) announcedTasks.add(task.id);
          return null;
        }
        if (absence >= CYBERBOT_RETURN_ABSENCE_MS
          && (lastGreetingAt === null || now - lastGreetingAt >= CYBERBOT_RETURN_GREETING_COOLDOWN_MS)) {
          if (options.greet()) lastGreetingAt = now;
          return null;
        }
      }
      const gesture = { id: ++sequence, kind: next };
      next = next === 'scan' ? 'sensors' : 'scan';
      return gesture;
    },
  };
}

// Track a notice instance, not its text: a genuinely new alert can have the same wording.
export function createCyberBotNoticeLedger() {
  const delivered = new WeakSet<object>();
  const ids = new WeakMap<object, string>();
  let sequence = 0;
  return {
    has(notice: object) { return delivered.has(notice); },
    mark(notice: object) { delivered.add(notice); },
    id(notice: object) {
      if (!ids.has(notice)) ids.set(notice, 'notice_' + ++sequence);
      return ids.get(notice)!;
    },
  };
}
