import type { CyberBotMessage } from './companionTypes';
import { cyberBotSpeechLifetime } from './cyberBotTyping';

export const CYBERBOT_FAREWELL_EXIT_MS = 1000;
export const CYBERBOT_FAREWELL_CONFIRM_MS = 3000;
export interface CyberBotFarewellState {
  message: CyberBotMessage | null;
  departing: boolean;
  confirmation: boolean;
}
export const emptyCyberBotFarewell: CyberBotFarewellState = { message: null, departing: false, confirmation: false };

export function createCyberBotFarewell(notify: (state: CyberBotFarewellState) => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  let speaking = false;
  const clear = () => { if (timer !== undefined) clearTimeout(timer); timer = undefined; };
  const finish = () => { clear(); speaking = false; notify(emptyCyberBotFarewell); };
  const depart = () => {
    if (disposed || !speaking) return;
    clear(); speaking = false;
    notify({ message: null, departing: true, confirmation: false });
    // The approved portal hides its body at 580 ms and finishes its halo at 980 ms.
    timer = setTimeout(finish, CYBERBOT_FAREWELL_EXIT_MS);
  };
  return {
    start(text: string, visible: boolean) {
      if (disposed) return;
      clear(); speaking = visible;
      if (!visible) {
        notify({ message: null, departing: false, confirmation: true });
        timer = setTimeout(finish, CYBERBOT_FAREWELL_CONFIRM_MS);
        return;
      }
      const timestamp = Date.now();
      notify({ message: { id: 'bot_farewell_' + timestamp, text, emotion: 'launcher', timestamp,
        priority: 'normal', durationMs: 0 }, departing: false, confirmation: false });
      timer = setTimeout(depart, cyberBotSpeechLifetime(1000, text));
    },
    depart,
    cancel() { if (!disposed) finish(); },
    dispose() { disposed = true; clear(); speaking = false; },
  };
}
