export const CYBERBOT_CONTEXT_RETIRE_MS = 3000;
export const CYBERBOT_CONTEXT_RETURN_MS = 1500;

interface ContextPresence {
  open: boolean;
  busy: boolean;
  attention: boolean;
}

// Context retirement is separate from idle sleep. Activity inside a dialog must
// not repeatedly wake the bot or restart its return delay.
export function createCyberBotContextPresence(onChange: (away: boolean) => void) {
  let current: ContextPresence = { open: false, busy: false, attention: false };
  let away = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: 'retire' | 'return' | null = null;
  let disposed = false;
  const cancel = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    pending = null;
  };
  const setAway = (next: boolean) => {
    if (away === next) return;
    away = next;
    onChange(away);
  };
  const schedule = (kind: 'retire' | 'return') => {
    if (pending === kind) return;
    cancel();
    pending = kind;
    timer = setTimeout(() => {
      timer = null;
      pending = null;
      if (disposed) return;
      if (kind === 'retire' && current.open && !current.busy && !current.attention) setAway(true);
      if (kind === 'return' && !current.open) setAway(false);
    }, kind === 'retire' ? CYBERBOT_CONTEXT_RETIRE_MS : CYBERBOT_CONTEXT_RETURN_MS);
  };
  return {
    update(next: ContextPresence) {
      if (disposed) return;
      current = next;
      if (next.attention) {
        cancel();
        setAway(false);
      } else if (next.open) {
        if (away || next.busy) cancel();
        else schedule('retire');
      } else if (away) {
        schedule('return');
      } else {
        cancel();
      }
    },
    dispose() {
      disposed = true;
      cancel();
    },
  };
}
